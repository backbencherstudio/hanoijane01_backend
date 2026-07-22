import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { UserRepository } from '../../../common/repository/user/user.repository';
import { StripeModule } from '../../payment/stripe/stripe.module';

@Module({
  imports: [StripeModule],
  controllers: [TransactionController],
  providers: [TransactionService, UserRepository],
})
export class TransactionModule {}
