import { Module } from '@nestjs/common';
import { ExhibitionModule } from './exhibition/exhibition.module';
import { BookingModule } from './booking/booking.module';

@Module({
  imports: [ExhibitionModule, BookingModule],
})
export class ApplicationModule {}
