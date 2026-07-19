import { Module } from '@nestjs/common';
import { PaymentTransactionModule } from './payment-transaction/payment-transaction.module';
import { UserModule } from './user/user.module';
import { BookingModule } from './booking/booking.module';
import { ExhibitionModule } from './exhibition/exhibition.module';

@Module({
  imports: [
    PaymentTransactionModule,
    UserModule,
    BookingModule,
    ExhibitionModule,
  ],
})
export class AdminModule {}
