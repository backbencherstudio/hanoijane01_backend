import { Module } from '@nestjs/common';
import { ExhibitionModule } from './exhibition/exhibition.module';
import { BookingModule } from './booking/booking.module';
import { TransactionModule } from './transaction/transaction.module';
import { ContactModule } from './contact/contact.module';

@Module({
  imports: [ExhibitionModule, BookingModule, TransactionModule, ContactModule],
})
export class ApplicationModule {}
