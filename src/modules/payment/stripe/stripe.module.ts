import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { StripeSyncProcessor } from './processors/stripe-sync.processor';
import { StripeSyncScheduler } from './processors/stripe-sync.scheduler';
import { PrismaModule } from '../../../prisma/prisma.module';
import { TransactionRepository } from '../../../common/repository/transaction/transaction.repository';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'stripe-sync',
    }),
  ],
  controllers: [StripeController],
  providers: [
    StripeService,
    TransactionRepository,
    StripeSyncProcessor,
    StripeSyncScheduler,
  ],
  exports: [StripeService],
})
export class StripeModule {}
