import { MailerService } from '@nestjs-modules/mailer';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('mail-queue')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  constructor(private mailerService: MailerService) {
    super();
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} with name ${job.name} completed`);
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing job ${job.id} with name ${job.name}`);
    try {
      switch (job.name) {
        case 'sendMemberInvitation':
          this.logger.log('Sending member invitation email');
          await this.mailerService.sendMail({
            to: job.data.to,
            from: job.data.from,
            subject: job.data.subject,
            template: job.data.template,
            context: job.data.context,
          });
          break;
        case 'sendOtpCodeToEmail':
          this.logger.log('Sending OTP code to email');
          await this.mailerService.sendMail({
            to: job.data.to,
            from: job.data.from,
            subject: job.data.subject,
            template: job.data.template,
            context: job.data.context,
          });
          break;
        case 'sendVerificationLink':
          this.logger.log('Sending verification link');
          await this.mailerService.sendMail({
            to: job.data.to,
            subject: job.data.subject,
            template: job.data.template,
            context: job.data.context,
          });
          break;
        case 'sendNotificationEmail':
          this.logger.log(`Sending notification email to ${job.data.to}`);
          await this.mailerService.sendMail({
            to: job.data.to,
            from: job.data.from,
            subject: job.data.subject,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #1a202c;">${job.data.context.title}</h2>
                <p style="font-size: 16px; line-height: 1.5;">${job.data.context.text}</p>
                <br/>
                <p style="font-size: 12px; color: #888;">This is an automated notification from the platform.</p>
              </div>
            `,
          });
          break;
        case 'sendContactMessageEmail':
          this.logger.log(`Sending contact message email to ${job.data.to}`);
          await this.mailerService.sendMail({
            to: job.data.to,
            from: job.data.from,
            subject: job.data.subject,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #2b6cb0;">New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${job.data.context.name}</p>
                <p><strong>Email:</strong> ${job.data.context.email}</p>
                <p><strong>Company Name:</strong> ${job.data.context.companyName}</p>
                <p><strong>Phone Number:</strong> ${job.data.context.phoneNumber}</p>
                <hr style="border: 0.5px solid #e2e8f0; margin: 15px 0;"/>
                <p><strong>Message:</strong></p>
                <p style="background: #f7fafc; padding: 15px; border-radius: 5px; font-size: 15px;">${job.data.context.message}</p>
              </div>
            `,
          });
          break;
        case 'sendAccountCredentialsEmail':
          this.logger.log(
            `Sending account credentials email to ${job.data.to}`,
          );
          await this.mailerService.sendMail({
            to: job.data.to,
            from: job.data.from,
            subject: job.data.subject,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #2b6cb0;">Welcome to Platform!</h2>
                <p>Hello <strong>${job.data.context.name}</strong>,</p>
                <p>An account has been created for you by an administrator. Below are your login credentials:</p>
                <div style="background: #f7fafc; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #3182ce;">
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${job.data.context.email}</p>
                  <p style="margin: 5px 0;"><strong>Password:</strong> ${job.data.context.password}</p>
                </div>
                ${job.data.context.loginUrl ? `<p><a href="${job.data.context.loginUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3182ce; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Login Now</a></p>` : ''}
                <p style="font-size: 13px; color: #718096; margin-top: 20px;">For security, please change your password after logging in for the first time.</p>
              </div>
            `,
          });
          break;

        case 'sendBookingAcceptedEmail':
          this.logger.log(`Sending booking accepted email to ${job.data.to}`);
          await this.mailerService.sendMail({
            to: job.data.to,
            from: job.data.from,
            subject: job.data.subject,
            template: job.data.template,
            context: job.data.context,
          });
          break;

        case 'sendBookingRejectedEmail':
          this.logger.log(`Sending booking rejected email to ${job.data.to}`);
          await this.mailerService.sendMail({
            to: job.data.to,
            from: job.data.from,
            subject: job.data.subject,
            template: job.data.template,
            context: job.data.context,
          });
          break;
        default:
          this.logger.log('Unknown job name');
          return;
      }
    } catch (error) {
      this.logger.error(
        `Error processing job ${job.id} with name ${job.name}`,
        error,
      );
      throw error;
    }
  }
}
