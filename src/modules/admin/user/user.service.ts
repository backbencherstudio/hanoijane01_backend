import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRepository } from '../../../common/repository/user/user.repository';
import appConfig from '../../../config/app.config';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import { DateHelper } from '../../../common/helper/date.helper';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private userRepository: UserRepository,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.userRepository.createUser(createUserDto);
    return {
      success: user.success,
      message: user.message,
    };
  }

  async findAll({
    q,
    type,
    approved,
  }: {
    q?: string;
    type?: string;
    approved?: string;
  }) {
    const where_condition = {};
    if (q) {
      where_condition['OR'] = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where_condition['type'] = type;
    }

    if (approved) {
      where_condition['approvedAt'] =
        approved == 'approved' ? { not: null } : { equals: null };
    }

    const users = await this.prisma.user.findMany({
      where: {
        ...where_condition,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        companyAddress: true,
        type: true,
        approvedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: users,
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

    // add avatar url to user
    if (user.avatar) {
      user['avatar_url'] = SojebStorage.url(
        appConfig().storageUrl.avatar + user.avatar,
      );
    }

    return {
      success: true,
      data: user,
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

  async update(id: string, updateUserDto: UpdateUserDto) {
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
