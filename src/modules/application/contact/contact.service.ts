import { Injectable } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserSession } from '../../auth/decorators/session.decorator';

import { NotificationService } from '../../notification/notification.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
  ) {}

  async create(
    createContactDto: CreateContactDto,
    session?: UserSession | null,
  ) {
    const contact = await this.prisma.contact.create({
      data: {
        name: createContactDto.name || null,
        companyName: createContactDto.companyName || null,
        email: createContactDto.email,
        phoneNumber: createContactDto.phoneNumber || null,
        message: createContactDto.message,
        userId: session?.user?.id || null,
      },
    });

    await this.notificationService.sendNotification({
      type: 'new_contact_message',
      title: 'New Contact Form Submission',
      text: `New contact message from ${contact.name || contact.email}: "${contact.message.substring(0, 100)}${contact.message.length > 100 ? '...' : ''}"`,
      senderId: session?.user?.id || null,
      receiverIds: null, // targets all admins
      entityId: contact.id,
      sendEmail: true,
      contactEmailData: {
        name: contact.name,
        email: contact.email,
        companyName: contact.companyName,
        phoneNumber: contact.phoneNumber,
        message: contact.message,
      },
    });

    const adminEmails = (
      process.env.CONTACT_ADMIN_EMAILS || 'admin@itbaexpo.ie'
    )
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    await this.mailService.sendContactMessageEmail({
      to: adminEmails,
      name: contact.name,
      email: contact.email,
      companyName: contact.companyName,
      phoneNumber: contact.phoneNumber,
      message: contact.message,
    });

    return {
      success: true,
      message: 'Contact message submitted successfully',
      data: contact,
    };
  }
}
