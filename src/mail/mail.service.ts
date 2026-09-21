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

  // ============================================================
  // 1. Member Invitation
  // ============================================================
  async sendMemberInvitation({ user, member, url }) {
    try {
      const subject = `${user.fname} is inviting you to ${appConfig().app.name}`;

      await this.queue.add('sendMemberInvitation', {
        to: member.email,
        subject,
        template: 'member-invitation',
        context: {
          user,
          member,
          url,
        },
      });
    } catch (error) {
      console.error('Error adding sendMemberInvitation to queue:', error);
    }
  }

  // ============================================================
  // 2. OTP Code for Email Verification
  // ============================================================
  async sendOtpCodeToEmail({ name, email, otp }) {
    try {
      const subject = 'Email Verification';

      await this.queue.add('sendOtpCodeToEmail', {
        to: email,
        subject,
        template: 'email-verification', // ✅ leading ./ বাদ
        context: {
          name,
          otp,
          appName: process.env.APP_NAME || 'ITBA Expo',
          year: new Date().getFullYear(),
          expiresIn: '10 minutes',
        },
      });
    } catch (error) {
      console.error('Failed to enqueue OTP email:', error);
    }
  }

  // ============================================================
  // 3. Verification Link (token + type সহ)
  // ============================================================
  async sendVerificationLink(params: {
    email: string;
    name: string;
    token: string;
    type: string;
  }) {
    try {
      const verificationLink = `${appConfig().app.client_app_url}/verify-email?token=${params.token}&email=${params.email}&type=${params.type}`;

      await this.queue.add('sendVerificationLink', {
        to: params.email,
        subject: 'Verify Your Email',
        template: 'verification-link', // ✅ leading ./ বাদ
        context: {
          name: params.name,
          verificationLink,
        },
      });
    } catch (error) {
      console.error('Error adding sendVerificationLink to queue:', error);
    }
  }

  // ============================================================
  // 4. Verification Email (direct URL সহ)
  // ============================================================
  async sendVerificationEmail(email: string, name: string, url: string) {
    try {
      await this.queue.add('sendVerificationLink', {
        to: email,
        subject: 'Verify Your Email',
        template: 'verification-link', // ✅ leading ./ বাদ
        context: {
          name,
          verificationLink: url,
        },
      });
    } catch (error) {
      console.error('Error adding sendVerificationEmail to queue:', error);
    }
  }

  // ============================================================
  // 5. Reset Password Email
  // ============================================================
  async sendResetPasswordEmail(email: string, name: string, url: string) {
    try {
      await this.queue.add('sendResetPassword', {
        to: email,
        subject: 'Reset Your Password',
        template: 'reset-password', // ✅ leading ./ বাদ
        context: {
          name,
          resetLink: url,
        },
      });
    } catch (error) {
      console.error('Error adding sendResetPasswordEmail to queue:', error);
    }
  }

  // ============================================================
  // 6. Notification Email (inline HTML)
  // ============================================================
  async sendNotificationEmail(params: {
    to: string | string[];
    subject: string;
    title: string;
    text: string;
  }) {
    try {
      const recipients = Array.isArray(params.to) ? params.to : [params.to];

      for (const recipient of recipients) {
        if (!recipient) continue;

        await this.queue.add('sendNotificationEmail', {
          to: recipient,
          subject: params.subject,
          context: {
            title: params.title,
            text: params.text,
          },
        });
      }
    } catch (error) {
      console.error('Error adding sendNotificationEmail to queue:', error);
    }
  }

  // ============================================================
  // 7. Contact Message Email (inline HTML)
  // ============================================================
  async sendContactMessageEmail(params: {
    to: string | string[];
    name?: string | null;
    email: string;
    companyName?: string | null;
    phoneNumber?: string | null;
    message: string;
  }) {
    try {
      const recipients = Array.isArray(params.to) ? params.to : [params.to];
      const subject = `New Contact Message from ${params.name || params.email}`;

      for (const recipient of recipients) {
        if (!recipient) continue;

        await this.queue.add('sendContactMessageEmail', {
          to: recipient,
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
      console.error('Error adding sendContactMessageEmail to queue:', error);
    }
  }

  // ============================================================
  // 8. Account Credentials Email (inline HTML)
  // ============================================================
  async sendAccountCredentialsEmail(params: {
    email: string;
    name?: string | null;
    password: string;
  }) {
    try {
      const subject = `Your Account Credentials for ${appConfig().app.name || 'Hanoijane'}`;

      await this.queue.add('sendAccountCredentialsEmail', {
        to: params.email,
        subject,
        context: {
          name: params.name || 'User',
          email: params.email,
          password: params.password,
          loginUrl: appConfig().app.client_app_url || '',
        },
      });
    } catch (error) {
      console.error(
        'Error adding sendAccountCredentialsEmail to queue:',
        error,
      );
    }
  }

  // ============================================================
  // 9. Booking Accepted Email (template)
  // ============================================================
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
      const subject = 'Your Booking Has Been Approved';

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
        subject,
        template: 'booking-accepted', // ✅ leading ./ বাদ
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
      console.error('Error adding sendBookingAcceptedEmail to queue:', error);
    }
  }

  // ============================================================
  // 10. Booking Rejected Email (template)
  // ============================================================
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
      const subject = 'Your Booking Has Been Rejected';

      const rejectedAt = params.rejectedAt
        ? new Date(params.rejectedAt).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : '';

      await this.queue.add('sendBookingRejectedEmail', {
        to: params.email,
        subject,
        template: 'booking-rejected', // ✅ leading ./ বাদ
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
      console.error('Error adding sendBookingRejectedEmail to queue:', error);
    }
  }
}
