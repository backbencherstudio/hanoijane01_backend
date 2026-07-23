import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SojebStorage } from '../../common/lib/Disk/SojebStorage';
import appConfig from '../../config/app.config';
import { UserRepository } from '../../common/repository/user/user.repository';
import { Role } from '../../common/guard/role/role.enum';
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
    const where_condition = {};
    const userDetails = await this.userRepository.getUserDetails(user_id);

    if (userDetails.type == Role.ADMIN) {
      where_condition['OR'] = [
        { receiverId: { equals: user_id } },
        { receiverId: { equals: null } },
      ];
    }

    const notifications = await this.prisma.notification.findMany({
      where: {
        ...where_condition,
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        entityId: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        notificationEvent: {
          select: {
            id: true,
            type: true,
            text: true,
          },
        },
      },
    });

    // add url to avatar
    if (notifications.length > 0) {
      for (const notification of notifications) {
        if (notification.sender && notification.sender.avatar) {
          notification.sender['avatar_url'] = SojebStorage.url(
            appConfig().storageUrl.avatar + notification.sender.avatar,
          );
        }

        if (notification.receiver && notification.receiver.avatar) {
          notification.receiver['avatar_url'] = SojebStorage.url(
            appConfig().storageUrl.avatar + notification.receiver.avatar,
          );
        }
      }
    }

    return {
      success: true,
      message: 'Notifications retrieved successfully',
      data: notifications,
    };
  }

  async remove(id: string, user_id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: {
        id: id,
      },
    });

    if (!notification) {
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
    const notifications = await this.prisma.notification.findMany({
      where: {
        OR: [{ receiverId: user_id }, { receiverId: null }],
      },
    });

    if (notifications.length === 0) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.deleteMany({
      where: {
        OR: [{ receiverId: user_id }, { receiverId: null }],
      },
    });

    return {
      success: true,
      message: 'All notifications deleted successfully',
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
