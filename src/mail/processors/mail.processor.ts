import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MicrosoftGraphMailService } from '../microsoft-graph-mail.service';
import * as ejs from 'ejs';
import { join } from 'path';

@Processor('mail-queue')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  private readonly templatesDir = join(process.cwd(), 'src/mail/templates');

  constructor(private graphMailService: MicrosoftGraphMailService) {
    super();
  }

  // ============================================================
  // Helper: EJS template render
  // ============================================================
  private async renderTemplate(
    templateName: string,
    context: Record<string, any>,
  ): Promise<string> {
    // './' prefix থাকলে সরিয়ে ফেলি (safety)
    const cleanName = templateName.replace(/^\.\//, '');
    const filePath = join(this.templatesDir, `${cleanName}.ejs`);
    return ejs.renderFile(filePath, context, { async: true });
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(
      `Processing job ${job.id} of type ${job.name} with data ${JSON.stringify(
        job.data,
      )}...`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} with name ${job.name} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(
      `Job ${job.id} with name ${job.name} failed: ${err.message}`,
      err.stack,
    );
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing job ${job.id} with name ${job.name}`);

    try {
      switch (job.name) {
        // ============================================================
        // 1. Member Invitation (template)
        // ============================================================
        case 'sendMemberInvitation': {
          this.logger.log('Sending member invitation email');
          const html = await this.renderTemplate(
            job.data.template,
            job.data.context,
          );
          await this.graphMailService.sendMail({
            to: job.data.to,
            subject: job.data.subject,
            html,
          });
          this.logger.log(`Member invitation sent to ${job.data.to}`);
          break;
        }

        // ============================================================
        // 2. OTP Code Email (template)
        // ============================================================
        case 'sendOtpCodeToEmail': {
          this.logger.log(
            `OTP job ${job.id} → to=${job.data.to} template=${job.data.template}`,
          );
          this.logger.log(
            `OTP context keys: ${Object.keys(job.data.context || {}).join(
              ', ',
            )}`,
          );

          try {
            const html = await this.renderTemplate(
              job.data.template,
              job.data.context,
            );
            await this.graphMailService.sendMail({
              to: job.data.to,
              subject: job.data.subject,
              html,
            });
            this.logger.log(`OTP email sent via Graph API to ${job.data.to}`);
          } catch (err: any) {
            this.logger.error(`OTP mailer FAILED: ${err?.message}`);
            this.logger.error(`OTP mailer code: ${err?.code}`);
            this.logger.error(`OTP mailer stack: ${err?.stack}`);
            throw err;
          }
          break;
        }

        // ============================================================
        // 3. Verification Link (template)
        // ============================================================
        case 'sendVerificationLink': {
          this.logger.log(`Sending verification link to ${job.data.to}`);
          const html = await this.renderTemplate(
            job.data.template,
            job.data.context,
          );
          await this.graphMailService.sendMail({
            to: job.data.to,
            subject: job.data.subject,
            html,
          });
          this.logger.log(`Verification link sent to ${job.data.to}`);
          break;
        }

        // ============================================================
        // 4. Reset Password (template)
        // ============================================================
        case 'sendResetPassword': {
          this.logger.log(`Sending reset password email to ${job.data.to}`);
          const html = await this.renderTemplate(
            job.data.template,
            job.data.context,
          );
          await this.graphMailService.sendMail({
            to: job.data.to,
            subject: job.data.subject,
            html,
          });
          this.logger.log(`Reset password email sent to ${job.data.to}`);
          break;
        }

        // ============================================================
        // 5. Notification Email (inline HTML)
        // ============================================================
        case 'sendNotificationEmail': {
          this.logger.log(`Sending notification email to ${job.data.to}`);
          const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #1a202c;">${job.data.context.title}</h2>
              <p style="font-size: 16px; line-height: 1.5;">${job.data.context.text}</p>
              <br/>
              <p style="font-size: 12px; color: #888;">This is an automated notification from the platform.</p>
            </div>
          `;
          await this.graphMailService.sendMail({
            to: job.data.to,
            subject: job.data.subject,
            html,
          });
          this.logger.log(`Notification email sent to ${job.data.to}`);
          break;
        }

        // ============================================================
        // 6. Contact Message Email (inline HTML)
        // ============================================================
        case 'sendContactMessageEmail': {
          this.logger.log(`Sending contact message email to ${job.data.to}`);
          const html = `
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
          `;
          await this.graphMailService.sendMail({
            to: job.data.to,
            subject: job.data.subject,
            html,
          });
          this.logger.log(`Contact message email sent to ${job.data.to}`);
          break;
        }

        // ============================================================
        // 7. Account Credentials Email (inline HTML)
        // ============================================================
        case 'sendAccountCredentialsEmail': {
          this.logger.log(
            `Sending account credentials email to ${job.data.to}`,
          );
          const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #2b6cb0;">Welcome to Platform!</h2>
              <p>Hello <strong>${job.data.context.name}</strong>,</p>
              <p>An account has been created for you by an administrator. Below are your login credentials:</p>
              <div style="background: #f7fafc; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #3182ce;">
                <p style="margin: 5px 0;"><strong>Email:</strong> ${job.data.context.email}</p>
                <p style="margin: 5px 0;"><strong>Password:</strong> ${job.data.context.password}</p>
              </div>
              ${
                job.data.context.loginUrl
                  ? `<p><a href="${job.data.context.loginUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3182ce; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Login Now</a></p>`
                  : ''
              }
              <p style="font-size: 13px; color: #718096; margin-top: 20px;">For security, please change your password after logging in for the first time.</p>
            </div>
          `;
          await this.graphMailService.sendMail({
            to: job.data.to,
            subject: job.data.subject,
            html,
          });
          this.logger.log(`Account credentials email sent to ${job.data.to}`);
          break;
        }

        // ============================================================
        // 8. Booking Accepted (template)
        // ============================================================
        case 'sendBookingAcceptedEmail': {
          this.logger.log(`Sending booking accepted email to ${job.data.to}`);
          const html = await this.renderTemplate(
            job.data.template,
            job.data.context,
          );
          await this.graphMailService.sendMail({
            to: job.data.to,
            subject: job.data.subject,
            html,
          });
          this.logger.log(`Booking accepted email sent to ${job.data.to}`);
          break;
        }

        // ============================================================
        // 9. Booking Rejected (template)
        // ============================================================
        case 'sendBookingRejectedEmail': {
          this.logger.log(`Sending booking rejected email to ${job.data.to}`);
          const html = await this.renderTemplate(
            job.data.template,
            job.data.context,
          );
          await this.graphMailService.sendMail({
            to: job.data.to,
            subject: job.data.subject,
            html,
          });
          this.logger.log(`Booking rejected email sent to ${job.data.to}`);
          break;
        }

        // ============================================================
        // 10. Booking Created (payment pending) — template
        // ============================================================
        case 'sendBookingCreatedEmail': {
          this.logger.log(`Sending booking created email to ${job.data.to}`);
          const html = await this.renderTemplate(
            job.data.template,
            job.data.context,
          );
          await this.graphMailService.sendMail({
            to: job.data.to,
            subject: job.data.subject,
            html,
          });
          this.logger.log(`Booking created email sent to ${job.data.to}`);
          break;
        }

        // ============================================================
        // 11. Admin Booking Notification (paid)
        // ============================================================
        case 'sendAdminBookingNotificationEmail': {
          this.logger.log(
            `Sending admin booking notification to ${job.data.to}`,
          );
          const html = await this.renderTemplate(
            job.data.template,
            job.data.context,
          );
          await this.graphMailService.sendMail({
            to: job.data.to,
            subject: job.data.subject,
            html,
          });
          this.logger.log(`Admin booking notification sent to ${job.data.to}`);
          break;
        }

        // ============================================================
        // Default
        // ============================================================
        default: {
          this.logger.warn(`Unknown job name: ${job.name}`);
          return;
        }
      }
    } catch (error: any) {
      this.logger.error(
        `Error processing job ${job.id} with name ${job.name}: ${error?.message}`,
        error?.stack,
      );
      throw error; // BullMQ কে retry করার সুযোগ দেয়
    }
  }
}
