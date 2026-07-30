import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRepository } from '../../common/repository/user/user.repository';
import { Role } from '../../common/guard/role/role.enum';
import { Prisma } from 'prisma/generated/client';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private userRepository: UserRepository,
  ) {}

  // Database operations
  async findAll(user_id: string) {
    const userDetails = await this.userRepository.getUserDetails(user_id);
    const where_condition: Prisma.NotificationWhereInput = {};

    if (userDetails.type === Role.ADMIN) {
      where_condition.OR = [{ receiverId: user_id }, { receiverId: null }];
    } else {
      where_condition.receiverId = user_id;
    }

    const notifications = await this.prisma.notification.findMany({
      where: where_condition,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        readAt: true,
        createdAt: true,
        notificationEvent: {
          select: {
            id: true,
            type: true,
            text: true,
          },
        },
      },
    });

    const formattedNotifications = notifications.map((notification) => {
      const rawType = notification.notificationEvent?.type || 'system';
      const title = rawType.charAt(0).toUpperCase() + rawType.slice(1);
      const description = notification.notificationEvent?.text || '';

      return {
        id: notification.id,
        title,
        description,
        createdAt: notification.createdAt,
        readAt: notification.readAt,
      };
    });

    return {
      success: true,
      message: 'Notifications retrieved successfully',
      data: formattedNotifications,
    };
  }

  async remove(id: string, user_id: string) {
    const userDetails = await this.userRepository.getUserDetails(user_id);

    const notification = await this.prisma.notification.findUnique({
      where: {
        id: id,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (
      userDetails.type !== Role.ADMIN &&
      notification.receiverId !== user_id
    ) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: {
        id: id,
      },
    });

    return {
      success: true,
      message: 'Notification deleted successfully',
    };
  }

  async removeAll(user_id: string) {
    const userDetails = await this.userRepository.getUserDetails(user_id);
    const deleteWhere: Prisma.NotificationWhereInput = {};

    if (userDetails.type === Role.ADMIN) {
      deleteWhere.OR = [{ receiverId: user_id }, { receiverId: null }];
    } else {
      deleteWhere.receiverId = user_id;
    }

    const notifications = await this.prisma.notification.findMany({
      where: deleteWhere,
    });

    if (notifications.length === 0) {
      throw new NotFoundException('Notifications not found');
    }

    await this.prisma.notification.deleteMany({
      where: deleteWhere,
    });

    return {
      success: true,
      message: 'All notifications deleted successfully',
    };
  }

  async markAsRead(id: string, user_id: string) {
    const userDetails = await this.userRepository.getUserDetails(user_id);

    const notification = await this.prisma.notification.findUnique({
      where: {
        id: id,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (
      userDetails.type !== Role.ADMIN &&
      notification.receiverId !== user_id
    ) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.update({
      where: {
        id: id,
      },
      data: {
        readAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Notification marked as read successfully',
    };
  }

  async markAllAsRead(user_id: string) {
    const userDetails = await this.userRepository.getUserDetails(user_id);
    const updateWhere: Prisma.NotificationWhereInput = {};

    if (userDetails.type === Role.ADMIN) {
      updateWhere.OR = [{ receiverId: user_id }, { receiverId: null }];
    } else {
      updateWhere.receiverId = user_id;
    }

    // Only update notifications that are unread
    updateWhere.readAt = null;

    const notifications = await this.prisma.notification.findMany({
      where: updateWhere,
    });

    if (notifications.length === 0) {
      throw new NotFoundException('No unread notifications found');
    }

    await this.prisma.notification.updateMany({
      where: updateWhere,
      data: {
        readAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'All notifications marked as read successfully',
    };
  }

  // Gateway mockup operations
  create(createNotificationDto: CreateNotificationDto) {
    return 'This action adds a new notification';
  }

  findAllGateway() {
    return `This action returns all notification`;
  }

  findOneGateway(id: number) {
    return `This action returns a #${id} notification`;
  }

  updateGateway(id: number, updateNotificationDto: UpdateNotificationDto) {
    return `This action updates a #${id} notification`;
  }

  removeGateway(id: number) {
    return `This action removes a #${id} notification`;
  }
}
