import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserAdminDto } from './dto/create-user.dto';
import { UpdateUserAdminDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
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
      data: user,
    };
  }

  async findAll(query: QueryUserDto) {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 8;
    const skip = (page - 1) * limit;

    const searchKeyword = query.q || query.search;
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

    if (
      query.status !== undefined &&
      query.status !== null &&
      query.status !== ''
    ) {
      const statusStr = String(query.status).toLowerCase();
      if (statusStr === 'active' || statusStr === '1') {
        where_condition['status'] = 1;
      } else if (statusStr === 'inactive' || statusStr === '0') {
        where_condition['status'] = 0;
      } else if (statusStr === 'banned' || statusStr === '2') {
        where_condition['status'] = 2;
      } else {
        where_condition['status'] = Number(query.status);
      }
    }

    if (query.approved) {
      where_condition['approvedAt'] =
        query.approved === 'approved' ? { not: null } : { equals: null };
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

    const formattedUsers = users.map((user) => {
      const statusVal = user.status ?? 1;
      let statusText = 'Active';
      if (statusVal === 0) statusText = 'Inactive';
      if (statusVal === 2) statusText = 'Banned';

      let avatar_url: string | null = null;
      if (user.avatar) {
        avatar_url = NajimStorage.url(user.avatar);
      }

      return {
        ...user,
        status: statusVal,
        statusText,
        type: user.type ?? 'user',
        avatar_url,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      message: 'Users retrieved successfully',
      data: formattedUsers,
      meta_data: {
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

    const statusVal = user.status ?? 1;
    let statusText = 'Active';
    if (statusVal === 0) statusText = 'Inactive';
    if (statusVal === 2) statusText = 'Banned';

    if (user.avatar) {
      user.avatar = NajimStorage.url(user.avatar);
    }

    return {
      success: true,
      message: 'User details retrieved successfully',
      data: {
        ...user,
        status: statusVal,
        statusText,
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
}
