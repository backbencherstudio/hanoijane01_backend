import { Module } from '@nestjs/common';
import { TransactionModule } from './transaction/transaction.module';
import { UserModule } from './user/user.module';
import { BookingModule } from './booking/booking.module';
import { ExhibitionModule } from './exhibition/exhibition.module';
import { OverviewModule } from './overview/overview.module';

@Module({
  imports: [
    TransactionModule,
    UserModule,
    BookingModule,
    ExhibitionModule,
    OverviewModule,
  ],
})
export class AdminModule {}
