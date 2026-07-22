import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface CreateTransactionParams {
  bookingId?: string;
  userId?: string;
  amount?: number;
  currency?: string;
  paidAmount?: number;
  paidCurrency?: string;
  provider?: string;
  referenceNumber?: string;
  status?: string;
  rawStatus?: string;
  stripeCustomerId?: string;
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
  stripeChargeId?: string;
  receiptUrl?: string;
}

export interface UpdateTransactionParams {
  referenceNumber?: string;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  status?: string;
  rawStatus?: string;
  paidAmount?: number;
  paidCurrency?: string;
  stripeChargeId?: string;
  receiptUrl?: string;
}

@Injectable()
export class TransactionRepository {
  private readonly logger = new Logger(TransactionRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create or log a new payment transaction
   */
  async createTransaction(params: CreateTransactionParams) {
    const data: any = {};

    if (params.bookingId) data.bookingId = params.bookingId;
    if (params.userId) data.userId = params.userId;
    if (params.amount !== undefined) data.amount = params.amount;
    if (params.currency) data.currency = params.currency;
    if (params.paidAmount !== undefined) data.paidAmount = params.paidAmount;
    if (params.paidCurrency) data.paidCurrency = params.paidCurrency;
    if (params.provider) data.provider = params.provider;
    if (params.referenceNumber) data.referenceNumber = params.referenceNumber;
    if (params.status) data.status = params.status;
    if (params.rawStatus) data.rawStatus = params.rawStatus;
    if (params.stripeCustomerId)
      data.stripeCustomerId = params.stripeCustomerId;
    if (params.stripePaymentIntentId)
      data.stripePaymentIntentId = params.stripePaymentIntentId;
    if (params.stripeCheckoutSessionId)
      data.stripeCheckoutSessionId = params.stripeCheckoutSessionId;
    if (params.stripeChargeId) data.stripeChargeId = params.stripeChargeId;
    if (params.receiptUrl) data.receiptUrl = params.receiptUrl;

    return await this.prisma.paymentTransaction.create({ data });
  }

  /**
   * Update transaction records matching referenceNumber or Stripe IDs
   */
  async updateTransaction(params: UpdateTransactionParams) {
    const data: any = {};
    if (params.status) data.status = params.status;
    if (params.rawStatus) data.rawStatus = params.rawStatus;
    if (params.paidAmount !== undefined) data.paidAmount = params.paidAmount;
    if (params.paidCurrency) data.paidCurrency = params.paidCurrency;
    if (params.stripeChargeId) data.stripeChargeId = params.stripeChargeId;
    if (params.receiptUrl) data.receiptUrl = params.receiptUrl;
    if (params.stripePaymentIntentId)
      data.stripePaymentIntentId = params.stripePaymentIntentId;
    if (params.stripeCheckoutSessionId)
      data.stripeCheckoutSessionId = params.stripeCheckoutSessionId;

    const whereOr: any[] = [];
    if (params.referenceNumber)
      whereOr.push({ referenceNumber: params.referenceNumber });
    if (params.stripeCheckoutSessionId)
      whereOr.push({ stripeCheckoutSessionId: params.stripeCheckoutSessionId });
    if (params.stripePaymentIntentId)
      whereOr.push({ stripePaymentIntentId: params.stripePaymentIntentId });

    if (whereOr.length === 0) {
      return null;
    }

    return await this.prisma.paymentTransaction.updateMany({
      where: { OR: whereOr },
      data,
    });
  }

  /**
   * Process booking payment status, transaction ledger, and stand reservation with First-Come First-Served concurrency checks
   */
  async syncBookingPayment({
    bookingId,
    paymentStatus,
    paymentIntentId,
    checkoutSessionId,
    customerId,
    amount,
    currency,
    receiptUrl,
    rawStatus,
  }: {
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
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { stand: true },
    });

    if (!booking) {
      this.logger.warn(`Booking not found for ID: ${bookingId}`);
      return null;
    }

    const isPaid = paymentStatus === 'paid';
    const isFailedOrCanceled =
      paymentStatus === 'failed' ||
      paymentStatus === 'canceled' ||
      paymentStatus === 'refunded';

    // Race Condition Check: If stand was already locked by another user before this payment finished
    if (isPaid && booking.standId && booking.stand) {
      if (booking.stand.isAvailable === 0 && booking.paymentStatus !== 'paid') {
        this.logger.error(
          `CONCURRENCY CONFLICT: Stand ${booking.standId} was already claimed by another user before Booking ${bookingId} finalized!`,
        );

        // Update booking to conflict state
        await this.prisma.booking.update({
          where: { id: bookingId },
          data: {
            paymentStatus: 'conflict_refund_needed',
            status: 0,
            stripePaymentIntentId:
              paymentIntentId || booking.stripePaymentIntentId,
            stripeCheckoutSessionId:
              checkoutSessionId || booking.stripeCheckoutSessionId,
          },
        });

        return { conflict: true, booking, paymentIntentId, checkoutSessionId };
      }
    }

    // 1. Update Booking record
    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus,
        status: isPaid
          ? 1
          : isFailedOrCanceled && paymentStatus === 'canceled'
            ? 0
            : booking.status,
        stripePaymentIntentId: paymentIntentId || booking.stripePaymentIntentId,
        stripeCheckoutSessionId:
          checkoutSessionId || booking.stripeCheckoutSessionId,
        stripeCustomerId: customerId || booking.stripeCustomerId,
        paidAt: isPaid ? new Date() : booking.paidAt,
      },
    });

    // 2. Update Stand availability if applicable
    if (booking.standId) {
      await this.prisma.stand.update({
        where: { id: booking.standId },
        data: {
          isAvailable: isPaid
            ? 0
            : isFailedOrCanceled
              ? 1
              : (booking.stand?.isAvailable ?? 1),
        },
      });
    }

    // 3. Upsert PaymentTransaction record for ledger
    const existingTransaction = await this.prisma.paymentTransaction.findFirst({
      where: {
        OR: [
          ...(checkoutSessionId
            ? [{ stripeCheckoutSessionId: checkoutSessionId }]
            : []),
          ...(paymentIntentId
            ? [{ stripePaymentIntentId: paymentIntentId }]
            : []),
          { bookingId: bookingId },
        ],
      },
    });

    const txStatus = isPaid ? 'succeeded' : paymentStatus;

    if (existingTransaction) {
      await this.prisma.paymentTransaction.update({
        where: { id: existingTransaction.id },
        data: {
          status: txStatus,
          rawStatus: rawStatus || txStatus,
          paidAmount:
            isPaid && amount !== undefined
              ? amount
              : existingTransaction.paidAmount,
          paidCurrency: currency || existingTransaction.paidCurrency,
          stripePaymentIntentId:
            paymentIntentId || existingTransaction.stripePaymentIntentId,
          stripeCheckoutSessionId:
            checkoutSessionId || existingTransaction.stripeCheckoutSessionId,
          stripeCustomerId: customerId || existingTransaction.stripeCustomerId,
          receiptUrl: receiptUrl || existingTransaction.receiptUrl,
        },
      });
    } else {
      await this.prisma.paymentTransaction.create({
        data: {
          bookingId: bookingId,
          userId: booking.userId,
          amount: amount !== undefined ? amount : Number(booking.totalAmount),
          currency: currency || booking.currency || 'usd',
          paidAmount: isPaid
            ? amount !== undefined
              ? amount
              : Number(booking.totalAmount)
            : 0,
          paidCurrency: currency || booking.currency || 'usd',
          provider: 'stripe',
          referenceNumber: paymentIntentId || checkoutSessionId || bookingId,
          status: txStatus,
          rawStatus: rawStatus || txStatus,
          stripeCustomerId: customerId,
          stripePaymentIntentId: paymentIntentId,
          stripeCheckoutSessionId: checkoutSessionId,
          receiptUrl: receiptUrl,
        },
      });
    }

    return updatedBooking;
  }
}
