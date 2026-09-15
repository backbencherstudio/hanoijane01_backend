import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { MailerService } from '@nestjs-modules/mailer';
import appConfig from '../config/app.config';

@Injectable()
export class MailService {
  static instance: MailService;

  constructor(
    @InjectQueue('mail-queue') private queue: Queue,
    private mailerService: MailerService,
  ) {
    MailService.instance = this;
  }

  async sendMemberInvitation({ user, member, url }) {
    try {
      const from = `${process.env.APP_NAME} <${appConfig().mail.from}>`;
      const subject = `${user.fname} is inviting you to ${appConfig().app.name}`;

      // add to queue
      await this.queue.add('sendMemberInvitation', {
        to: member.email,
        from: from,
        subject: subject,
        template: 'member-invitation',
        context: {
          user: user,
          member: member,
          url: url,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  // send otp code for email verification
  async sendOtpCodeToEmail({ name, email, otp }) {
    try {
      const from = `${process.env.APP_NAME || 'ITBA Expo'} <${appConfig().mail.from}>`;
      const subject = 'Email Verification';

      await this.queue.add('sendOtpCodeToEmail', {
        to: email,
        from,
        subject,
        template: './email-verification', // ← add ./ prefix
        context: {
          name,
          otp,
          appName: process.env.APP_NAME || 'ITBA Expo',
          year: new Date().getFullYear(),
          expiresIn: '10 minutes',
        },
      });
    } catch (error) {
      console.log('Failed to enqueue OTP email:', error);
    }
  }

  async sendVerificationLink(params: {
    email: string;
    name: string;
    token: string;
    type: string;
  }) {
    try {
      const verificationLink = `${appConfig().app.client_app_url}/verify-email?token=${params.token}&email=${params.email}&type=${params.type}`;

      // add to queue
      await this.queue.add('sendVerificationLink', {
        to: params.email,
        subject: 'Verify Your Email',
        template: './verification-link',
        context: {
          name: params.name,
          verificationLink,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async sendVerificationEmail(email: string, name: string, url: string) {
    try {
      const from = `${process.env.APP_NAME || 'hanoijane'} <${appConfig().mail.from}>`;
      await this.queue.add('sendVerificationLink', {
        to: email,
        from,
        subject: 'Verify Your Email',
        template: './verification-link',
        context: {
          name,
          verificationLink: url,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async sendResetPasswordEmail(email: string, name: string, url: string) {
    try {
      const from = `${process.env.APP_NAME || 'hanoijane'} <${appConfig().mail.from}>`;
      await this.queue.add('sendResetPassword', {
        to: email,
        from,
        subject: 'Reset Your Password',
        template: './reset-password',
        context: {
          name,
          resetLink: url,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async sendNotificationEmail(params: {
    to: string | string[];
    subject: string;
    title: string;
    text: string;
  }) {
    try {
      const from = `${process.env.APP_NAME || 'hanoijane'} <${appConfig().mail.from}>`;
      const recipients = Array.isArray(params.to) ? params.to : [params.to];
      for (const recipient of recipients) {
        if (!recipient) continue;
        await this.queue.add('sendNotificationEmail', {
          to: recipient,
          from,
          subject: params.subject,
          context: {
            title: params.title,
            text: params.text,
          },
        });
      }
    } catch (error) {
      console.log('Error adding sendNotificationEmail to queue:', error);
    }
  }

  async sendContactMessageEmail(params: {
    to: string | string[];
    name?: string | null;
    email: string;
    companyName?: string | null;
    phoneNumber?: string | null;
    message: string;
  }) {
    try {
      const from = `${process.env.APP_NAME || 'hanoijane'} <${appConfig().mail.from}>`;
      const recipients = Array.isArray(params.to) ? params.to : [params.to];
      const subject = `New Contact Message from ${params.name || params.email}`;
      for (const recipient of recipients) {
        if (!recipient) continue;
        await this.queue.add('sendContactMessageEmail', {
          to: recipient,
          from,
          subject,
          context: {
            name: params.name || 'N/A',
            email: params.email,
            companyName: params.companyName || 'N/A',
            phoneNumber: params.phoneNumber || 'N/A',
            message: params.message,
          },
        });
      }
    } catch (error) {
      console.log('Error adding sendContactMessageEmail to queue:', error);
    }
  }

  async sendAccountCredentialsEmail(params: {
    email: string;
    name?: string | null;
    password: string;
  }) {
    try {
      const from = `${process.env.APP_NAME || 'hanoijane'} <${appConfig().mail.from}>`;
      const subject = `Your Account Credentials for ${appConfig().app.name || 'Hanoijane'}`;
      await this.queue.add('sendAccountCredentialsEmail', {
        to: params.email,
        from,
        subject,
        context: {
          name: params.name || 'User',
          email: params.email,
          password: params.password,
          loginUrl: appConfig().app.client_app_url || '',
        },
      });
    } catch (error) {
      console.log('Error adding sendAccountCredentialsEmail to queue:', error);
    }
  }

  async sendBookingAcceptedEmail(params: {
    email: string;
    name?: string | null;
    bookingId: string;
    standNumber?: string | null;
    hall?: string | null;
    category?: string | null;
    event?: string | null;
    totalAmount?: number | string | null;
    currency?: string | null;
  }) {
    try {
      const from = `${process.env.APP_NAME || 'hanoijane'} <${appConfig().mail.from}>`;
      const subject = 'Your Booking Has Been Approved';

      // crude currency symbol map, extend as needed
      const symbols: Record<string, string> = {
        usd: '$',
        eur: '€',
        gbp: '£',
        inr: '₹',
        bdt: '৳',
      };
      const cur = (params.currency || 'usd').toLowerCase();
      const currencySymbol = symbols[cur] || '';

      await this.queue.add('sendBookingAcceptedEmail', {
        to: params.email,
        from,
        subject,
        template: './booking-accepted',
        context: {
          name: params.name || 'there',
          bookingId: params.bookingId,
          standNumber: params.standNumber || '',
          hall: params.hall || '',
          category: params.category || '',
          event: params.event || '',
          totalAmount: params.totalAmount ?? '',
          currencySymbol,
          appName: process.env.APP_NAME || 'Hanoijane',
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log('Error adding sendBookingAcceptedEmail to queue:', error);
    }
  }

  async sendBookingRejectedEmail(params: {
    email: string;
    name?: string | null;
    bookingId: string;
    standNumber?: string | null;
    hall?: string | null;
    category?: string | null;
    event?: string | null;
    reason?: string | null;
    rejectedAt?: Date | string | null;
  }) {
    try {
      const from = `${process.env.APP_NAME || 'hanoijane'} <${appConfig().mail.from}>`;
      const subject = 'Your Booking Has Been Rejected';

      const rejectedAt = params.rejectedAt
        ? new Date(params.rejectedAt).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : '';

      await this.queue.add('sendBookingRejectedEmail', {
        to: params.email,
        from,
        subject,
        template: './booking-rejected',
        context: {
          name: params.name || 'there',
          bookingId: params.bookingId,
          standNumber: params.standNumber || '',
          hall: params.hall || '',
          category: params.category || '',
          event: params.event || '',
          reason: params.reason || '',
          rejectedAt,
          appName: process.env.APP_NAME || 'Hanoijane',
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log('Error adding sendBookingRejectedEmail to queue:', error);
    }
  }
}
