import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { MailModule } from '../../../mail/mail.module';
import { StripeModule } from '../../payment/stripe/stripe.module';

@Module({
  imports: [PrismaModule, MailModule, StripeModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
