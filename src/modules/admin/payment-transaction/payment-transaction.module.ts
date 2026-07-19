import { Module } from '@nestjs/common';
import { PaymentTransactionService } from './payment-transaction.service';
import { PaymentTransactionController } from './payment-transaction.controller';
import { StripeModule } from '../../payment/stripe/stripe.module';

@Module({
  imports: [StripeModule],
  controllers: [PaymentTransactionController],
  providers: [PaymentTransactionService],
})
export class PaymentTransactionModule {}
