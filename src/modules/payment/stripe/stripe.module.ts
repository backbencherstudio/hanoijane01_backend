import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { StripeSyncProcessor } from './processors/stripe-sync.processor';
import { StripeSyncScheduler } from './processors/stripe-sync.scheduler';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'stripe-sync',
    }),
  ],
  controllers: [StripeController],
  providers: [StripeService, StripeSyncProcessor, StripeSyncScheduler],
  exports: [StripeService, BullModule],
})
export class StripeModule {}
