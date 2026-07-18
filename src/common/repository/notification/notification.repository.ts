import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a notification
   * @param senderId - The ID of the user who fired the event
   * @param receiverId - The ID of the user to notify
   * @param text - The text of the notification
   * @param type - The type of the notification
   * @param entityId - The ID of the entity related to the notification
   * @returns The created notification
   */
  async createNotification({
    senderId,
    receiverId,
    text,
    type,
    entityId,
  }: {
    senderId?: string;
    receiverId?: string;
    text?: string;
    type?:
      | 'message'
      | 'comment'
      | 'review'
      | 'booking'
      | 'payment_transaction'
      | 'package'
      | 'blog';
    entityId?: string;
  }) {
    const notificationEventData = {};
    if (type) {
      notificationEventData['type'] = type;
    }
    if (text) {
      notificationEventData['text'] = text;
    }
    const notificationEvent = await this.prisma.notificationEvent.create({
      data: {
        type: type,
        text: text,
        ...notificationEventData,
      },
    });

    const notificationData = {};
    if (senderId) {
      notificationData['senderId'] = senderId;
    }
    if (receiverId) {
      notificationData['receiverId'] = receiverId;
    }
    if (entityId) {
      notificationData['entityId'] = entityId;
    }

    const notification = await this.prisma.notification.create({
      data: {
        notificationEventId: notificationEvent.id,
        ...notificationData,
      },
    });

    return notification;
  }
}
