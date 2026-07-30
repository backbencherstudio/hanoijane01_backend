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
   * Private Helper: Validates booking existence, payment status, and stand availability.
   */
  private async validateBookingForPayment(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { stand: { include: { category: true } } },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    if (booking.paymentStatus === 'paid') {
      throw new BadRequestException('This booking has already been paid for.');
    }

    const stand = booking.stand;

    // Strict Stand Availability Check
    if (stand && stand.isAvailable === 0) {
      if (booking.paymentStatus === 'unpaid') {
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: {
            paymentStatus: 'canceled',
            status: -1,
          },
        });
      }
      throw new BadRequestException(
        'The stand associated with this booking has already been claimed by another user. Please select an available stand.',
      );
    }

    const amount =
      Number(booking.totalAmount) ||
      (stand?.category?.price ? Number(stand.category.price) : 0);
    const currency = (booking.currency || 'eur').toLowerCase();

    if (amount <= 0) {
      throw new BadRequestException(
        'Booking pricing is invalid or 0. Cannot create checkout session.',
      );
    }

    return { booking, stand, amount, currency };
  }

  /**
   * Private Helper: Executes payment sync and auto-refunds in case of concurrency conflict.
   */
  private async syncAndCheckConflict(params: {
    bookingId: string;
    paymentStatus:
      | 'paid'
      | 'failed'
      | 'canceled'
      | 'refunded'
      | 'unpaid'
      | 'conflict_refund_needed';
    paymentIntentId?: string;
    checkoutSessionId?: string;
    customerId?: string;
    amount?: number;
    currency?: string;
    receiptUrl?: string;
    rawStatus?: string;
  }) {
    const syncResult: any =
      await this.transactionRepository.syncBookingPayment(params);

    if (syncResult?.conflict && params.paymentIntentId) {
      this.logger.warn(
        `Initiating Stripe Auto-Refund for PaymentIntent ${params.paymentIntentId} due to stand conflict!`,
      );
      try {
        await StripePayment.refundPaymentIntent(
          params.paymentIntentId,
          'Stand was already booked by another user first.',
        );
        return await this.transactionRepository.syncBookingPayment({
          bookingId: params.bookingId,
          paymentStatus: 'refunded',
          paymentIntentId: params.paymentIntentId,
          checkoutSessionId: params.checkoutSessionId,
          rawStatus: 'stand_conflict_auto_refunded',
        });
      } catch (err) {
        this.logger.error(`Failed to issue Stripe auto-refund: ${err.message}`);
      }
    }

    return syncResult;
  }

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
    const { booking, stand, amount, currency } =
      await this.validateBookingForPayment(dto.bookingId);

    // Reuse existing open & valid Checkout Session if price and currency match and session is unexpired
    if (booking.stripeCheckoutSessionId) {
      try {
        const existingSession = await StripePayment.getCheckoutSession(
          booking.stripeCheckoutSessionId,
        );
        const expectedAmountCents = Math.round(amount * 100);
        const isNotExpired =
          !existingSession.expires_at ||
          existingSession.expires_at * 1000 > Date.now();

        if (
          existingSession.status === 'open' &&
          isNotExpired &&
          existingSession.amount_total === expectedAmountCents &&
          existingSession.currency?.toLowerCase() === currency
        ) {
          this.logger.log(
            `Reusing existing active Checkout Session ${existingSession.id} for Booking ${booking.id}`,
          );
          return {
            sessionId: existingSession.id,
            checkoutUrl: existingSession.url || '',
            bookingId: booking.id,
            amount,
            currency,
          };
        }
      } catch (err) {
        this.logger.warn(
          `Could not retrieve existing Checkout Session ${booking.stripeCheckoutSessionId}: ${err.message}. Creating a new one.`,
        );
      }
    }

    const customerEmail = booking.email || undefined;
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
    const { booking, amount, currency } = await this.validateBookingForPayment(
      dto.bookingId,
    );

    // Reuse existing active Payment Intent if price and currency match
    if (booking.stripePaymentIntentId) {
      try {
        const existingIntent = await StripePayment.getPaymentIntent(
          booking.stripePaymentIntentId,
        );
        const expectedAmountCents = Math.round(amount * 100);
        const isActiveStatus = [
          'requires_payment_method',
          'requires_confirmation',
          'requires_action',
        ].includes(existingIntent.status);

        if (
          isActiveStatus &&
          existingIntent.amount === expectedAmountCents &&
          existingIntent.currency?.toLowerCase() === currency
        ) {
          this.logger.log(
            `Reusing existing active PaymentIntent ${existingIntent.id} for Booking ${booking.id}`,
          );
          return {
            paymentIntentId: existingIntent.id,
            clientSecret: existingIntent.client_secret || '',
            bookingId: booking.id,
            amount,
            currency,
          };
        }
      } catch (err) {
        this.logger.warn(
          `Could not retrieve existing PaymentIntent ${booking.stripePaymentIntentId}: ${err.message}. Creating a new one.`,
        );
      }
    }

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
    const currency = session.currency || 'eur';

    if (bookingId) {
      await this.syncAndCheckConflict({
        bookingId,
        paymentStatus: 'paid',
        checkoutSessionId: session.id,
        paymentIntentId,
        customerId,
        amount: amountTotal,
        currency,
        rawStatus: session.payment_status,
      });
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
      await this.syncAndCheckConflict({
        bookingId,
        paymentStatus: 'paid',
        paymentIntentId: paymentIntent.id,
        customerId,
        amount,
        currency: paymentIntent.currency,
        receiptUrl,
        rawStatus: paymentIntent.status,
      });
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

            await this.syncAndCheckConflict({
              bookingId: booking.id,
              paymentStatus: 'paid',
              checkoutSessionId: session.id,
              paymentIntentId,
              customerId,
              amount: session.amount_total
                ? session.amount_total / 100
                : Number(booking.totalAmount),
              currency: session.currency || booking.currency || 'eur',
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
        } else if (booking.stripePaymentIntentId) {
          const intent = await StripePayment.getPaymentIntent(
            booking.stripePaymentIntentId,
          );

          if (intent.status === 'succeeded') {
            const customerId =
              typeof intent.customer === 'string'
                ? intent.customer
                : intent.customer?.id;

            await this.syncAndCheckConflict({
              bookingId: booking.id,
              paymentStatus: 'paid',
              paymentIntentId: intent.id,
              customerId,
              amount: intent.amount
                ? intent.amount / 100
                : Number(booking.totalAmount),
              currency: intent.currency || booking.currency || 'eur',
              rawStatus: intent.status,
            });

            syncedCount++;
          } else if (intent.status === 'canceled') {
            await this.transactionRepository.syncBookingPayment({
              bookingId: booking.id,
              paymentStatus: 'canceled',
              paymentIntentId: intent.id,
              rawStatus: 'canceled',
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

      return await this.syncAndCheckConflict({
        bookingId: booking.id,
        paymentStatus: status,
        checkoutSessionId: session.id,
        paymentIntentId,
        customerId,
        amount: session.amount_total
          ? session.amount_total / 100
          : Number(booking.totalAmount),
        currency: session.currency || booking.currency || 'eur',
        rawStatus: session.payment_status,
      });
    } else if (booking.stripePaymentIntentId) {
      const intent = await StripePayment.getPaymentIntent(
        booking.stripePaymentIntentId,
      );
      const customerId =
        typeof intent.customer === 'string'
          ? intent.customer
          : intent.customer?.id;

      const isPaid = intent.status === 'succeeded';
      const status: any = isPaid
        ? 'paid'
        : intent.status === 'canceled'
          ? 'canceled'
          : booking.paymentStatus;

      return await this.syncAndCheckConflict({
        bookingId: booking.id,
        paymentStatus: status,
        paymentIntentId: intent.id,
        customerId,
        amount: intent.amount
          ? intent.amount / 100
          : Number(booking.totalAmount),
        currency: intent.currency || booking.currency || 'eur',
        rawStatus: intent.status,
      });
    }

    return booking;
  }
}
