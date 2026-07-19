import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request } from 'express';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { CreateBookingCheckoutDto, CreatePaymentIntentDto } from './dto/create-checkout.dto';
import { CheckoutSessionResponse, PaymentIntentResponse } from './dto/payment-response.dto';

@ApiTags('Payment')
@Controller('payment/stripe')
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(private readonly stripeService: StripeService) {}

  @ApiOperation({
    summary: 'Create a Stripe Hosted Checkout Session for stand booking',
    description:
      'Validates that the specified stand is currently available (isAvailable === 1). Throws BadRequestException if the stand is already booked. Generates a Stripe Hosted Checkout Session URL for payment.',
  })
  @ApiBody({ type: CreateBookingCheckoutDto })
  @ApiResponse({
    status: 201,
    type: CheckoutSessionResponse,
    description: 'Checkout session generated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Stand is already booked by another user or invalid parameters',
  })
  @Post('create-checkout-session')
  async createCheckoutSession(
    @Body() dto: CreateBookingCheckoutDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    const result = await this.stripeService.createBookingCheckoutSession(dto, userId);
    return {
      success: true,
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Create a Stripe PaymentIntent for custom frontend UI integration',
    description:
      'Validates stand availability before creating a Stripe PaymentIntent. Returns the paymentIntentId and clientSecret for rendering custom Stripe Elements on the frontend.',
  })
  @ApiBody({ type: CreatePaymentIntentDto })
  @ApiResponse({
    status: 201,
    type: PaymentIntentResponse,
    description: 'PaymentIntent generated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Stand is already booked by another user or invalid parameters',
  })
  @Post('create-payment-intent')
  async createPaymentIntent(
    @Body() dto: CreatePaymentIntentDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    const result = await this.stripeService.createBookingPaymentIntent(dto, userId);
    return {
      success: true,
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Stripe Webhook callback endpoint',
    description:
      'Listens for asynchronous webhook events from Stripe (checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed, charge.refunded) to synchronize booking and transaction states.',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook event processed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid Stripe signature or payload',
  })
  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: Request,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    let event: any;
    try {
      const payload = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
      event = this.stripeService.handleWebhook(payload, signature);
    } catch (err) {
      this.logger.error(`Stripe Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`Received Stripe Webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.stripeService.handleCheckoutSessionCompleted(event.data.object);
          break;

        case 'payment_intent.succeeded':
          await this.stripeService.handlePaymentIntentSucceeded(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await this.stripeService.handlePaymentIntentFailed(event.data.object);
          break;

        case 'payment_intent.canceled':
          await this.stripeService.handlePaymentIntentCanceled(event.data.object);
          break;

        case 'charge.refunded':
          await this.stripeService.handleChargeRefunded(event.data.object);
          break;

        default:
          this.logger.debug(`Unhandled event type ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Error processing webhook event ${event.type}: ${error.message}`, error.stack);
      return { received: true, processed: false, error: error.message };
    }
  }
}
