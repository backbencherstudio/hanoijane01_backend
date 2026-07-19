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
    this.logger.log('Initializing recurring Stripe Reconciliation Queue Scheduler (Every 15 mins)...');

    try {
      // Register recurring job in BullMQ Redis queue
      await this.stripeSyncQueue.add(
        'sync-stripe-reconciliation',
        {},
        {
          repeat: {
            pattern: '*/15 * * * *', // Runs every 15 minutes
          },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      );
      this.logger.log('Successfully scheduled recurring Stripe reconciliation job in BullMQ Redis.');
    } catch (error) {
      this.logger.error(`Failed to register recurring Stripe sync job: ${error.message}`);
    }
  }
}
