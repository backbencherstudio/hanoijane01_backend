import { Module } from '@nestjs/common';
import { ExhibitionModule } from './exhibition/exhibition.module';
import { BookingModule } from './booking/booking.module';
import { TransactionModule } from './transaction/transaction.module';

@Module({
  imports: [ExhibitionModule, BookingModule, TransactionModule],
})
export class ApplicationModule {}
