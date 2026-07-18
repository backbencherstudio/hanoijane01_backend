import { Controller, Post, Req, Headers } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request } from 'express';
import { TransactionRepository } from '../../../common/repository/transaction/transaction.repository';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Payment')
@Controller('payment/stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private transactionRepository: TransactionRepository,
  ) {}

  @ApiOperation({ summary: 'Stripe Webhook callback endpoint' })
  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: Request,
  ) {
    try {
      const payload = req.rawBody.toString();
      const event = await this.stripeService.handleWebhook(payload, signature);

      // Handle events
      switch (event.type) {
        case 'customer.created':
          break;
        case 'payment_intent.created':
          break;
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          // Update transaction status in database
          await this.transactionRepository.updateTransaction({
            referenceNumber: paymentIntent.id,
            status: 'succeeded',
            paidAmount: paymentIntent.amount / 100, // amount in dollars
            paidCurrency: paymentIntent.currency,
            rawStatus: paymentIntent.status,
          });
          break;
        case 'payment_intent.payment_failed':
          const failedPaymentIntent = event.data.object;
          // Update transaction status in database
          await this.transactionRepository.updateTransaction({
            referenceNumber: failedPaymentIntent.id,
            status: 'failed',
            rawStatus: failedPaymentIntent.status,
          });
          break;
        case 'payment_intent.canceled':
          const canceledPaymentIntent = event.data.object;
          // Update transaction status in database
          await this.transactionRepository.updateTransaction({
            referenceNumber: canceledPaymentIntent.id,
            status: 'canceled',
            rawStatus: canceledPaymentIntent.status,
          });
          break;
        case 'payment_intent.requires_action':
          const requireActionPaymentIntent = event.data.object;
          // Update transaction status in database
          await this.transactionRepository.updateTransaction({
            referenceNumber: requireActionPaymentIntent.id,
            status: 'requires_action',
            rawStatus: requireActionPaymentIntent.status,
          });
          break;
        case 'payout.paid':
          const paidPayout = event.data.object;
          console.log(paidPayout);
          break;
        case 'payout.failed':
          const failedPayout = event.data.object;
          console.log(failedPayout);
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook error', error);
      return { received: false };
    }
  }
}
