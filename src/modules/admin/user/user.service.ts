import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserAdminDto, UserStatus } from './dto/create-user.dto';
import { UpdateUserAdminDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { QueryUserAttachmentDto } from './dto/query-user-attachment.dto';
import { Prisma } from 'prisma/generated/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRepository } from '../../../common/repository/user/user.repository';
import appConfig from '../../../config/app.config';
import { NajimStorage } from '../../../common/lib/Disk/NajimStorage';
import { DateHelper } from '../../../common/helper/date.helper';
import * as bcrypt from 'bcrypt';

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

  async create(createUserDto: CreateUserAdminDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      appConfig().security.salt,
    );

    const userStatus =
      createUserDto.status !== undefined ? Number(createUserDto.status) : 1;
    const userType = createUserDto.type || 'user';

    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        password: hashedPassword,
        type: userType,
        status: userStatus,
      },
      select: {
        id: true,
        name: true,
        email: true,
        type: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      message: 'User created successfully',
      data: { ...user, status: UserStatus[user.status] },
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

  async approve(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.prisma.user.update({
      where: { id: id },
      data: { approvedAt: DateHelper.now() },
    });
    return {
      success: true,
      message: 'User approved successfully',
    };
  }

  async reject(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.prisma.user.update({
      where: { id: id },
      data: { approvedAt: null },
    });
    return {
      success: true,
      message: 'User rejected successfully',
    };
  }

  async update(id: string, updateUserDto: UpdateUserAdminDto) {
    const user = await this.userRepository.updateUser(id, updateUserDto);
    return {
      success: user.success,
      message: user.message,
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
    const where_condition: Prisma.AttachmentWhereInput = {};

    if (query.userId) {
      where_condition.userId = query.userId;
    }

    if (query.fileType) {
      where_condition.fileType = {
        contains: query.fileType,
        mode: 'insensitive',
      };
    }

    if (searchKeyword) {
      where_condition.OR = [
        { fileName: { contains: searchKeyword, mode: 'insensitive' } },
        { fileType: { contains: searchKeyword, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { name: { contains: searchKeyword, mode: 'insensitive' } },
              { email: { contains: searchKeyword, mode: 'insensitive' } },
              { companyName: { contains: searchKeyword, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [total, attachments] = await Promise.all([
      this.prisma.attachment.count({ where: where_condition }),
      this.prisma.attachment.findMany({
        where: where_condition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      }),
    ]);

    const formattedAttachments = await Promise.all(
      attachments.map(async (item) => {
        let fileUrl: string | null = null;
        if (item.filePath) {
          fileUrl = await NajimStorage.signedUrl(item.filePath, {
            expiresIn: 60 * 60 * 24 * 7,
            signed: true,
          });
        }

        return {
          id: item.id,
          fileName: item.fileName,
          filePath: item.filePath,
          fileUrl,
          fileType: item.fileType,
          mimeType: item.mimeType,
          byteSize: item.byteSize ? Number(item.byteSize) : null,
          createdAt: item.createdAt,
          user: item.user
            ? {
                id: item.user.id,
                name: item.user.name,
                email: item.user.email,
                phoneNumber: item.user.phoneNumber,
              }
            : null,
        };
      }),
    );

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      message: 'User attachments retrieved successfully',
      data: formattedAttachments,
      metaData: {
        totalItems: total,
        itemCount: formattedAttachments.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }
}
