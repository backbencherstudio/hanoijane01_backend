import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { StripeModule } from 'src/modules/payment/stripe/stripe.module';

@Module({
  imports: [StripeModule],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
