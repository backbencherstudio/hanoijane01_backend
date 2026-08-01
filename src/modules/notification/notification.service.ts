import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRepository } from '../../common/repository/user/user.repository';
import { Role } from '../../common/guard/role/role.enum';
import { Prisma } from 'prisma/generated/client';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { NotificationGateway } from './notification.gateway';
import { MailService } from '../../mail/mail.service';

export interface SendNotificationOptions {
  type: string;
  title?: string;
  text: string;
  senderId?: string | null;
  receiverIds?: string | string[] | null; // null or [] targets all admins
  entityId?: string | null;
  sendEmail?: boolean;
  emailSubject?: string;
  contactEmailData?: {
    name?: string | null;
    email: string;
    companyName?: string | null;
    phoneNumber?: string | null;
    message: string;
  };
}

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private userRepository: UserRepository,
    private notificationGateway: NotificationGateway,
    private mailService: MailService,
  ) {}

  /**
   * Universal helper to persist DB notifications, emit targeted real-time socket events, and queue emails.
   */
  async sendNotification(options: SendNotificationOptions) {
    try {
      const {
        type,
        title,
        text,
        senderId = null,
        entityId = null,
        sendEmail = false,
        emailSubject,
        contactEmailData,
      } = options;

      let targetUserIds: string[] = [];
      let targetEmails: string[] = [];

      if (
        !options.receiverIds ||
        (Array.isArray(options.receiverIds) && options.receiverIds.length === 0)
      ) {
        const adminUsers = await this.prisma.user.findMany({
          where: { type: Role.ADMIN, deletedAt: null },
          select: { id: true, email: true },
        });
        targetUserIds = adminUsers.map((u) => u.id);
        targetEmails = adminUsers
          .map((u) => u.email)
          .filter(Boolean) as string[];
      } else {
        targetUserIds = Array.isArray(options.receiverIds)
          ? options.receiverIds
          : [options.receiverIds];

        const targetUsers = await this.prisma.user.findMany({
          where: { id: { in: targetUserIds }, deletedAt: null },
          select: { id: true, email: true },
        });
        targetEmails = targetUsers
          .map((u) => u.email)
          .filter(Boolean) as string[];
      }

      const notificationEvent = await this.prisma.notificationEvent.create({
        data: {
          type,
          text,
          status: 1,
        },
      });

      const notificationTitle =
        title ||
        type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

      for (const receiverId of targetUserIds) {
        const notification = await this.prisma.notification.create({
          data: {
            senderId,
            receiverId,
            notificationEventId: notificationEvent.id,
            entityId,
            status: 1,
          },
        });

        const payload = {
          id: notification.id,
          title: notificationTitle,
          description: text,
          createdAt: notification.createdAt,
          readAt: notification.readAt,
        };

        // Emit targeted Socket event to receiverId room ONLY
        await this.notificationGateway.sendNotificationToUser(
          receiverId,
          payload,
        );
      }

      if (sendEmail && targetEmails.length > 0) {
        if (contactEmailData) {
          await this.mailService.sendContactMessageEmail({
            to: targetEmails,
            ...contactEmailData,
          });
        } else {
          await this.mailService.sendNotificationEmail({
            to: targetEmails,
            subject: emailSubject || notificationTitle,
            title: notificationTitle,
            text,
          });
        }
      }
    } catch (error) {
      console.error('Error in sendNotification:', error);
    }
  }

  // Database operations
  async findAll(user_id: string, query: QueryNotificationDto = {}) {
    const { search, page = 1, limit = 10 } = query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const userDetails = await this.userRepository.getUserDetails(user_id);
    const where_condition: Prisma.NotificationWhereInput = {};

    if (userDetails.type === Role.ADMIN) {
      where_condition.OR = [{ receiverId: user_id }, { receiverId: null }];
    } else {
      where_condition.receiverId = user_id;
    }

    if (search) {
      where_condition.notificationEvent = {
        OR: [
          { type: { contains: search, mode: 'insensitive' } },
          { text: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [totalItems, notifications] = await Promise.all([
      this.prisma.notification.count({ where: where_condition }),
      this.prisma.notification.findMany({
        where: where_condition,
        skip,
        take: limitNum,
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
      }),
    ]);

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

    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    return {
      success: true,
      message: 'Notifications retrieved successfully',
      data: formattedNotifications,
      metaData: {
        totalItems,
        itemCount: formattedNotifications.length,
        itemsPerPage: limitNum,
        totalPages,
        currentPage: pageNum,
      },
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
