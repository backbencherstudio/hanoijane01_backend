import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { StripeService } from '../stripe.service';

@Processor('stripe-sync')
export class StripeSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(StripeSyncProcessor.name);

  constructor(private readonly stripeService: StripeService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing BullMQ Stripe Sync Job: ${job.name} (ID: ${job.id})`);

    try {
      const result = await this.stripeService.syncAllPendingBookings();
      this.logger.log(
        `Stripe Sync Job ${job.id} completed. Scanned: ${result.totalScanned}, Synced: ${result.syncedCount}, Canceled: ${result.canceledCount}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Error executing Stripe Sync Job ${job.id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
