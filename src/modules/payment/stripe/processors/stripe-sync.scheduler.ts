import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class StripeSyncScheduler implements OnModuleInit {
  private readonly logger = new Logger(StripeSyncScheduler.name);

  constructor(
    @InjectQueue('stripe-sync') private readonly stripeSyncQueue: Queue,
  ) {}

  async onModuleInit() {
    // 🚫 Recurring scheduler disabled — Stripe webhooks are the source of truth.
    // Manual reconciliation remains available via:
    //   POST /api/admin/transaction/sync-stripe
    this.logger.log(
      'StripeSyncScheduler disabled — relying on webhooks + manual sync.',
    );

    // Remove any previously-registered repeatable job from Redis so it stops firing.
    try {
      await this.stripeSyncQueue.removeRepeatable(
        'sync-stripe-reconciliation',
        {
          pattern: '*/15 * * * *',
        },
      );
      this.logger.log(
        'Removed old repeatable Stripe sync job from BullMQ (if it existed).',
      );
    } catch (err: any) {
      this.logger.warn(
        `Could not remove old repeatable job (may not exist): ${err?.message}`,
      );
    }
  }
}
