import { MailerModule } from '@nestjs-modules/mailer';
import { Global, Module } from '@nestjs/common';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { BullModule } from '@nestjs/bullmq';
import { join } from 'path';
import { MailService } from './mail.service';
import { MailProcessor } from './processors/mail.processor';
import appConfig from '../config/app.config';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => {
        const config = appConfig();
        return {
          transport: {
            host: config.mail.host,
            port: Number(config.mail.port),
            secure: Number(config.mail.port) === 465,
            auth: {
              user: config.mail.user,
              pass: config.mail.password,
            },
          },
          defaults: {
            from: config.mail.from,
          },
          template: {
            dir: join(process.cwd(), 'src/mail/templates'),
            adapter: new EjsAdapter(),
            options: {
              strict: false,
            },
          },
        };
      },
    }),
    BullModule.registerQueue({
      name: 'mail-queue',
    }),
  ],
  providers: [MailService, MailProcessor],
  exports: [MailService],
})
export class MailModule {}