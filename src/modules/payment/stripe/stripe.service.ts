import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import stripe from 'stripe';
import { StripePayment } from '../../../common/lib/Payment/stripe/StripePayment';
import { TransactionRepository } from '../../../common/repository/transaction/transaction.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateBookingCheckoutDto,
  CreatePaymentIntentDto,
} from './dto/create-checkout.dto';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Verify and construct raw webhook payload into Stripe Event
   */
  handleWebhook(rawBody: string, sig: string | string[]) {
    return StripePayment.handleWebhook(rawBody, sig);
  }

  /**
   * Pre-validates stand availability via booking record and generates Stripe Hosted Checkout Session
   */
  async createBookingCheckoutSession(
    dto: CreateBookingCheckoutDto,
    userId?: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { stand: { include: { category: true } } },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${dto.bookingId} not found`);
    }

    if (booking.paymentStatus === 'paid') {
      throw new BadRequestException('This booking has already been paid for.');
    }

    const stand = booking.stand;

    // 1. Strict Stand Availability Check
    if (stand && stand.isAvailable === 0) {
      throw new BadRequestException(
        'The stand associated with this booking has already been claimed by another user. Please select an available stand.',
      );
    }

    // Determine amount and currency directly from booking
    const amount =
      dto.amount ||
      Number(booking.totalAmount) ||
      (stand?.category?.price ? Number(stand.category.price) : 0);
    const currency = (dto.currency || booking.currency || 'usd').toLowerCase();

    if (amount <= 0) {
      throw new BadRequestException(
        'Booking pricing is invalid or 0. Cannot create checkout session.',
      );
    }

    const customerEmail = dto.customerEmail || booking.email || undefined;
    const title = stand
      ? `Stand Reservation: ${stand.title || stand.standNumber}`
      : `Booking #${booking.id}`;

    // Create Stripe Checkout Session
    const session = await StripePayment.createBookingCheckoutSession({
      bookingId: booking.id,
      userId: userId || booking.userId || undefined,
      title,
      amount,
      currency,
      customerEmail,
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
    });

    // Update Booking with Checkout Session ID
    await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        stripeCheckoutSessionId: session.id,
        paymentMethod: 'stripe',
      },
    });

    // Create PaymentTransaction audit log
    await this.transactionRepository.createTransaction({
      bookingId: booking.id,
      userId: userId || booking.userId || undefined,
      amount,
      currency,
      provider: 'stripe',
      referenceNumber: session.id,
      status: 'pending',
      stripeCheckoutSessionId: session.id,
    });

    return {
      sessionId: session.id,
      checkoutUrl: session.url || '',
      bookingId: booking.id,
      amount,
      currency,
    };
  }

  /**
   * Pre-validates stand availability via booking record and generates Stripe PaymentIntent
   */
  async createBookingPaymentIntent(
    dto: CreatePaymentIntentDto,
    userId?: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { stand: { include: { category: true } } },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${dto.bookingId} not found`);
    }

    if (booking.paymentStatus === 'paid') {
      throw new BadRequestException('This booking has already been paid for.');
    }

    const stand = booking.stand;

    // Strict Stand Availability Check
    if (stand && stand.isAvailable === 0) {
      throw new BadRequestException(
        'The stand associated with this booking has already been claimed by another user. Please select an available stand.',
      );
    }

    const amount =
      dto.amount ||
      Number(booking.totalAmount) ||
      (stand?.category?.price ? Number(stand.category.price) : 0);
    const currency = (dto.currency || booking.currency || 'usd').toLowerCase();

    const intent = await StripePayment.createPaymentIntent({
      amount,
      currency,
      metadata: {
        bookingId: booking.id,
        userId: userId || booking.userId || '',
      },
    });

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        stripePaymentIntentId: intent.id,
        paymentMethod: 'stripe',
      },
    });

    await this.transactionRepository.createTransaction({
      bookingId: booking.id,
      userId: userId || booking.userId || undefined,
      amount,
      currency,
      provider: 'stripe',
      referenceNumber: intent.id,
      status: 'pending',
      stripePaymentIntentId: intent.id,
    });

    return {
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret || '',
      bookingId: booking.id,
      amount,
      currency,
    };
  }

  /**
   * 1. Handle checkout.session.completed with Auto-Refund Conflict resolution
   */
  async handleCheckoutSessionCompleted(session: stripe.Checkout.Session) {
    this.logger.log(`Handling checkout.session.completed: ${session.id}`);

    const bookingId = session.metadata?.bookingId;
    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;
    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;

    const amountTotal = session.amount_total ? session.amount_total / 100 : 0;
    const currency = session.currency || 'usd';

    if (bookingId) {
      const syncResult: any =
        await this.transactionRepository.syncBookingPayment({
          bookingId,
          paymentStatus: 'paid',
          checkoutSessionId: session.id,
          paymentIntentId,
          customerId,
          amount: amountTotal,
          currency,
          rawStatus: session.payment_status,
        });

      // Handle Stand Concurrency Conflict Auto-Refund
      if (syncResult?.conflict && paymentIntentId) {
        this.logger.warn(
          `Initiating Stripe Auto-Refund for PaymentIntent ${paymentIntentId} due to stand conflict!`,
        );
        try {
          await StripePayment.refundPaymentIntent(
            paymentIntentId,
            'Stand was already booked by another user first.',
          );
          await this.transactionRepository.syncBookingPayment({
            bookingId,
            paymentStatus: 'refunded',
            paymentIntentId,
            checkoutSessionId: session.id,
            rawStatus: 'stand_conflict_auto_refunded',
          });
        } catch (err) {
          this.logger.error(
            `Failed to issue Stripe auto-refund: ${err.message}`,
          );
        }
      }
    }
  }

  /**
   * 2. Handle payment_intent.succeeded
   */
  async handlePaymentIntentSucceeded(paymentIntent: stripe.PaymentIntent) {
    this.logger.log(`Handling payment_intent.succeeded: ${paymentIntent.id}`);

    const bookingId = paymentIntent.metadata?.bookingId;
    const customerId =
      typeof paymentIntent.customer === 'string'
        ? paymentIntent.customer
        : paymentIntent.customer?.id;

    let receiptUrl: string | undefined;

    if (paymentIntent.latest_charge) {
      try {
        const chargeId =
          typeof paymentIntent.latest_charge === 'string'
            ? paymentIntent.latest_charge
            : paymentIntent.latest_charge.id;
        const charge = await StripePayment.getCharge(chargeId);
        receiptUrl = charge.receipt_url || undefined;
      } catch (err) {
        this.logger.warn(
          `Could not retrieve receipt_url for charge: ${err.message}`,
        );
      }
    }

    const amount = paymentIntent.amount ? paymentIntent.amount / 100 : 0;

    if (bookingId) {
      const syncResult: any =
        await this.transactionRepository.syncBookingPayment({
          bookingId,
          paymentStatus: 'paid',
          paymentIntentId: paymentIntent.id,
          customerId,
          amount,
          currency: paymentIntent.currency,
          receiptUrl,
          rawStatus: paymentIntent.status,
        });

      if (syncResult?.conflict) {
        this.logger.warn(
          `Initiating Stripe Auto-Refund for PaymentIntent ${paymentIntent.id}`,
        );
        try {
          await StripePayment.refundPaymentIntent(
            paymentIntent.id,
            'Stand was already booked by another user first.',
          );
          await this.transactionRepository.syncBookingPayment({
            bookingId,
            paymentStatus: 'refunded',
            paymentIntentId: paymentIntent.id,
            rawStatus: 'stand_conflict_auto_refunded',
          });
        } catch (err) {
          this.logger.error(
            `Failed to issue Stripe auto-refund: ${err.message}`,
          );
        }
      }
    }
  }

  /**
   * 3. Handle payment_intent.payment_failed
   */
  async handlePaymentIntentFailed(paymentIntent: stripe.PaymentIntent) {
    this.logger.log(
      `Handling payment_intent.payment_failed: ${paymentIntent.id}`,
    );

    const bookingId = paymentIntent.metadata?.bookingId;
    const errorMessage =
      paymentIntent.last_payment_error?.message || 'payment_failed';

    if (bookingId) {
      await this.transactionRepository.syncBookingPayment({
        bookingId,
        paymentStatus: 'failed',
        paymentIntentId: paymentIntent.id,
        rawStatus: errorMessage,
      });
    }
  }

  /**
   * 4. Handle payment_intent.canceled
   */
  async handlePaymentIntentCanceled(paymentIntent: stripe.PaymentIntent) {
    this.logger.log(`Handling payment_intent.canceled: ${paymentIntent.id}`);

    const bookingId = paymentIntent.metadata?.bookingId;

    if (bookingId) {
      await this.transactionRepository.syncBookingPayment({
        bookingId,
        paymentStatus: 'canceled',
        paymentIntentId: paymentIntent.id,
        rawStatus: 'canceled',
      });
    }
  }

  /**
   * 5. Handle charge.refunded
   */
  async handleChargeRefunded(charge: stripe.Charge) {
    this.logger.log(`Handling charge.refunded: ${charge.id}`);

    const paymentIntentId =
      typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent?.id;

    if (paymentIntentId) {
      const booking = await this.prisma.booking.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
      });

      if (booking) {
        await this.transactionRepository.syncBookingPayment({
          bookingId: booking.id,
          paymentStatus: 'refunded',
          paymentIntentId,
          rawStatus: 'refunded',
        });
      }
    }
  }

  /**
   * Reconciliation: Syncs unpaid bookings created in last 24 hours against Stripe
   */
  async syncAllPendingBookings() {
    this.logger.log(
      'Starting full reconciliation of unpaid bookings against Stripe...',
    );

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const pendingBookings = await this.prisma.booking.findMany({
      where: {
        paymentStatus: 'unpaid',
        createdAt: { gte: twentyFourHoursAgo },
        OR: [
          { stripeCheckoutSessionId: { not: null } },
          { stripePaymentIntentId: { not: null } },
        ],
      },
    });

    if (pendingBookings.length === 0) {
      this.logger.log(
        'No pending unpaid bookings found in last 24 hours. Exiting reconciliation.',
      );
      return { totalScanned: 0, syncedCount: 0, canceledCount: 0 };
    }

    let syncedCount = 0;
    let canceledCount = 0;

    for (const booking of pendingBookings) {
      try {
        if (booking.stripeCheckoutSessionId) {
          const session = await StripePayment.getCheckoutSession(
            booking.stripeCheckoutSessionId,
          );

          if (session.payment_status === 'paid') {
            const paymentIntentId =
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : session.payment_intent?.id;
            const customerId =
              typeof session.customer === 'string'
                ? session.customer
                : session.customer?.id;

            await this.transactionRepository.syncBookingPayment({
              bookingId: booking.id,
              paymentStatus: 'paid',
              checkoutSessionId: session.id,
              paymentIntentId,
              customerId,
              amount: session.amount_total
                ? session.amount_total / 100
                : Number(booking.totalAmount),
              currency: session.currency || booking.currency || 'usd',
              rawStatus: session.payment_status,
            });
            syncedCount++;
          } else if (session.status === 'expired') {
            await this.transactionRepository.syncBookingPayment({
              bookingId: booking.id,
              paymentStatus: 'canceled',
              checkoutSessionId: session.id,
              rawStatus: 'expired',
            });
            canceledCount++;
          }
        }
      } catch (err) {
        this.logger.error(
          `Error reconciling booking ${booking.id}: ${err.message}`,
        );
      }
    }

    return { totalScanned: pendingBookings.length, syncedCount, canceledCount };
  }

  /**
   * Sync a specific booking by ID against Stripe
   */
  async syncBookingById(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    if (booking.stripeCheckoutSessionId) {
      const session = await StripePayment.getCheckoutSession(
        booking.stripeCheckoutSessionId,
      );
      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id;
      const customerId =
        typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id;

      const isPaid = session.payment_status === 'paid';
      const status: any = isPaid
        ? 'paid'
        : session.status === 'expired'
          ? 'canceled'
          : booking.paymentStatus;

      return await this.transactionRepository.syncBookingPayment({
        bookingId: booking.id,
        paymentStatus: status,
        checkoutSessionId: session.id,
        paymentIntentId,
        customerId,
        amount: session.amount_total
          ? session.amount_total / 100
          : Number(booking.totalAmount),
        currency: session.currency || booking.currency || 'usd',
        rawStatus: session.payment_status,
      });
    }

    return booking;
  }
}
