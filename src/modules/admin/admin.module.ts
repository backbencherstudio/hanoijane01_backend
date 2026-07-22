import { Module } from '@nestjs/common';
import { PaymentTransactionModule } from './payment-transaction/payment-transaction.module';
import { UserModule } from './user/user.module';
import { BookingModule } from './booking/booking.module';
import { ExhibitionModule } from './exhibition/exhibition.module';
import { OverviewModule } from './overview/overview.module';

@Module({
  imports: [
    PaymentTransactionModule,
    UserModule,
    BookingModule,
    ExhibitionModule,
    OverviewModule,
  ],
})
export class AdminModule {}
