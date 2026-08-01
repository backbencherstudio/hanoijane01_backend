import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserAdminDto, UserStatus } from './dto/create-user.dto';
import { UpdateUserAdminDto } from './dto/update-user.dto';
import { QueryUserDto, QueryUserAttachmentDto } from './dto/query-user.dto';
import { Prisma } from 'prisma/generated/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRepository } from '../../../common/repository/user/user.repository';
import { NajimStorage } from '../../../common/lib/Disk/NajimStorage';
import { auth } from '../../auth/auth';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private userRepository: UserRepository,
  ) {}

  async getStats() {
    const [totalUser, activeUser, inactiveUser, bannedUser] = await Promise.all(
      [
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.user.count({ where: { status: 1, deletedAt: null } }),
        this.prisma.user.count({ where: { status: 0, deletedAt: null } }),
        this.prisma.user.count({ where: { status: 2, deletedAt: null } }),
      ],
    );

    return {
      success: true,
      message: 'User stats retrieved successfully',
      data: {
        totalUser,
        activeUser,
        inactiveUser,
        bannedUser,
      },
    };
  }
  async findAll(query: QueryUserDto) {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 8;
    const skip = (page - 1) * limit;

    const searchKeyword = query.search;
    const where_condition: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (searchKeyword) {
      where_condition['OR'] = [
        { name: { contains: searchKeyword, mode: 'insensitive' } },
        { email: { contains: searchKeyword, mode: 'insensitive' } },
      ];
    }

    if (query.type) {
      where_condition['type'] = query.type;
    }

    if (query.status !== undefined && query.status !== null) {
      where_condition.status = query.status;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: where_condition,
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          companyAddress: true,
          type: true,
          status: true,
          avatar: true,
          approvedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where: where_condition }),
    ]);

    const formattedUsers = users.map((user) => ({
      ...user,
      status:
        user.status === 1
          ? 'ACTIVE'
          : user.status === 2
            ? 'BANNED'
            : 'INACTIVE',
      type: user.type ?? 'user',
      avatar: user.avatar ? NajimStorage.url(user.avatar) : null,
    }));

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      message: 'Users retrieved successfully',
      data: formattedUsers,
      metaData: {
        totalItems: total,
        itemCount: formattedUsers.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        type: true,
        status: true,
        phoneNumber: true,
        approvedAt: true,
        createdAt: true,
        updatedAt: true,
        avatar: true,
        billingId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      message: 'User details retrieved successfully',
      data: {
        ...user,
        status: UserStatus[user.status] ?? 'INACTIVE',
        avatar: user.avatar ? NajimStorage.url(user.avatar) : null,
        type: user.type ?? 'user',
      },
    };
  }

  async update(
    id: string,
    updateUserDto: UpdateUserAdminDto,
    reqHeaders?: HeadersInit,
  ) {
    const existingUser = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.password) {
      await auth.api.setUserPassword({
        body: {
          newPassword: updateUserDto.password,
          userId: id,
        },
        headers: reqHeaders,
      });
    }

    const data: Prisma.UserUpdateInput = {};

    if (updateUserDto.name) {
      data.name = updateUserDto.name;
    }

    if (updateUserDto.email) {
      const emailConflict = await this.prisma.user.findFirst({
        where: { email: updateUserDto.email, id: { not: id }, deletedAt: null },
      });

      if (emailConflict) {
        throw new BadRequestException('User with this email already exists');
      }
      data.email = updateUserDto.email;
    }

    if (updateUserDto.type) {
      data.type = updateUserDto.type;
    }

    if (updateUserDto.status !== undefined && updateUserDto.status !== null) {
      const statusNum = Number(updateUserDto.status);
      data.status = statusNum;

      if (statusNum === -1) {
        try {
          await auth.api.banUser({
            body: {
              userId: id,
              banReason: 'Banned by admin',
            },
            headers: reqHeaders,
          });
        } catch (_) {}
        await this.prisma.session.deleteMany({
          where: { userId: id },
        });
      } else if (existingUser.status === -1) {
        try {
          await auth.api.unbanUser({
            body: {
              userId: id,
            },
            headers: reqHeaders,
          });
        } catch (_) {}
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      message: 'User updated successfully',
      data: {
        ...updatedUser,
        status: UserStatus[updatedUser.status] ?? 'INACTIVE',
      },
    };
  }

  async remove(id: string) {
    const user = await this.userRepository.deleteUser(id);
    return user;
  }

  async getAttachments(query: QueryUserAttachmentDto) {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 8;
    const skip = (page - 1) * limit;

    const searchKeyword = query.search;
    const where_condition: Prisma.UserWhereInput = {
      deletedAt: null,
      attachments: {
        some: query.fileType
          ? { fileType: { contains: query.fileType, mode: 'insensitive' } }
          : {},
      },
    };

    if (query.userId) {
      where_condition.id = query.userId;
    }

    if (searchKeyword) {
      where_condition.AND = [
        {
          OR: [
            { name: { contains: searchKeyword, mode: 'insensitive' } },
            { email: { contains: searchKeyword, mode: 'insensitive' } },
            { companyName: { contains: searchKeyword, mode: 'insensitive' } },
            {
              attachments: {
                some: {
                  OR: [
                    {
                      fileName: {
                        contains: searchKeyword,
                        mode: 'insensitive',
                      },
                    },
                    {
                      fileType: {
                        contains: searchKeyword,
                        mode: 'insensitive',
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where: where_condition }),
      this.prisma.user.findMany({
        where: where_condition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          companyName: true,
          avatar: true,
          attachments: {
            where: query.fileType
              ? { fileType: { contains: query.fileType, mode: 'insensitive' } }
              : undefined,
            select: {
              id: true,
              fileName: true,
              filePath: true,
              fileType: true,
              mimeType: true,
              byteSize: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
    ]);

    const formattedUsers = await Promise.all(
      users.map(async (user) => {
        const formattedAttachments = await Promise.all(
          user.attachments.map(async (attachment) => {
            let fileUrl: string | null = null;
            if (attachment.filePath) {
              fileUrl = await NajimStorage.signedUrl(attachment.filePath, {
                expiresIn: 60 * 60 * 24 * 7,
                signed: true,
              });
            }

            return {
              id: attachment.id,
              fileName: attachment.fileName,
              filePath: attachment.filePath,
              fileUrl,
              fileType: attachment.fileType,
              mimeType: attachment.mimeType,
              byteSize: attachment.byteSize
                ? Number(attachment.byteSize)
                : null,
              createdAt: attachment.createdAt,
            };
          }),
        );

        let avatarUrl: string | null = null;
        if (user.avatar) {
          avatarUrl = await NajimStorage.signedUrl(user.avatar, {
            expiresIn: 60 * 60 * 24 * 7,
            signed: true,
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          companyName: user.companyName,
          avatar: avatarUrl,
          attachments: formattedAttachments,
        };
      }),
    );

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      message: 'User attachments retrieved successfully',
      data: formattedUsers,
      metaData: {
        totalItems: total,
        itemCount: formattedUsers.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }
}
