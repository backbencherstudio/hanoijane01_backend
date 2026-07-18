import { Module } from '@nestjs/common';
import { PaymentTransactionModule } from './payment-transaction/payment-transaction.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [PaymentTransactionModule, UserModule],
})
export class AdminModule {}
