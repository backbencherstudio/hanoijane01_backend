import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationService } from '../../../modules/notification/notification.service';

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

type PaymentStatus =
  | 'paid'
  | 'failed'
  | 'canceled'
  | 'refunded'
  | 'unpaid'
  | 'conflict_refund_needed';

interface SyncBookingPaymentParams {
  bookingId: string;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string;
  checkoutSessionId?: string;
  customerId?: string;
  amount?: number;
  currency?: string;
  receiptUrl?: string;
  rawStatus?: string;
}

interface SyncResult {
  conflict?: boolean;
  booking?: any;
  paymentIntentId?: string;
  checkoutSessionId?: string;
  standId?: string;
  userId?: string;
  amount?: number;
  standNumber?: string | null;
  skipped?: boolean;
  reason?: string;
}

@Injectable()
export class TransactionRepository {
  private readonly logger = new Logger(TransactionRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

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

    if (whereOr.length === 0) return null;

    return await this.prisma.paymentTransaction.updateMany({
      where: { OR: whereOr },
      data,
    });
  }

  /**
   * Process booking payment status, transaction ledger, and stand reservation.
   *
   * STATE MACHINE (this is the contract):
   *   booking.status:  0 = PENDING, 1 = BOOKED (admin approved), -1 = REJECTED/CANCELED
   *   paymentStatus:   unpaid | paid | failed | canceled | refunded | conflict_refund_needed
   *
   * RULES:
   *   - payment success does NOT set status=1. Admin approval does.
   *   - payment failure/cancel does NOT touch the stand (admin controls it).
   *   - refund does NOT release the stand unless it's still PENDING and unapproved.
   *   - Only an admin approval action releases/blocks the stand.
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
  }: SyncBookingPaymentParams): Promise<SyncResult | null> {
    // -------- Phase 1: Do all DB work atomically --------
    let result: SyncResult | null = null;

    try {
      result = await this.prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
          include: { stand: true },
        });

        if (!booking) {
          this.logger.warn(`Booking not found for ID: ${bookingId}`);
          return null;
        }

        // Idempotency: if already in the target terminal state, skip.
        if (this.isAlreadyInTargetState(booking, paymentStatus)) {
          this.logger.log(
            `Booking ${bookingId} already in state paymentStatus=${booking.paymentStatus}, status=${booking.status}. Skipping.`,
          );
          return {
            booking,
            standId: booking.standId ?? undefined,
            userId: booking.userId ?? undefined,
            amount: amount ?? Number(booking.totalAmount),
            standNumber: booking.stand?.standNumber ?? null,
            skipped: true,
            reason: 'already_in_target_state',
          };
        }

        const isPaid = paymentStatus === 'paid';
        const isFailedOrCanceled =
          paymentStatus === 'failed' ||
          paymentStatus === 'canceled' ||
          paymentStatus === 'refunded';

        // -------- Concurrency conflict check (only for `paid`) --------
        // If someone else already PAID for the same stand, this booking must lose.
        if (isPaid && booking.standId && booking.paymentStatus !== 'paid') {
          const conflictingPaidBooking = await tx.booking.findFirst({
            where: {
              standId: booking.standId,
              id: { not: bookingId },
              paymentStatus: 'paid',
              deletedAt: null,
              status: { not: -1 },
            },
            orderBy: { paidAt: 'asc' },
          });

          if (conflictingPaidBooking) {
            this.logger.error(
              `CONCURRENCY CONFLICT: Stand ${booking.standId} already has paid booking ${conflictingPaidBooking.id}. Booking ${bookingId} will be marked for refund.`,
            );

            await tx.booking.update({
              where: { id: bookingId },
              data: {
                paymentStatus: 'conflict_refund_needed',
                status: -1,
                stripePaymentIntentId:
                  paymentIntentId || booking.stripePaymentIntentId,
                stripeCheckoutSessionId:
                  checkoutSessionId || booking.stripeCheckoutSessionId,
              },
            });

            return {
              conflict: true,
              booking,
              paymentIntentId,
              checkoutSessionId,
              standId: booking.standId ?? undefined,
              userId: booking.userId ?? undefined,
              amount: amount ?? Number(booking.totalAmount),
              standNumber: booking.stand?.standNumber ?? null,
            };
          }
        }

        // -------- Update Booking --------
        // IMPORTANT: Paid keeps status as-is (0 = PENDING). Admin approval sets 1.
        // Failed/canceled/refunded → -1, but ONLY if it's still PENDING (0).
        //   If admin already approved (status=1), a refund must NOT un-book the stand automatically.
        let newStatus = booking.status;
        if (isFailedOrCanceled && booking.status === 0) {
          newStatus = -1;
        }

        const updatedBooking = await tx.booking.update({
          where: { id: bookingId },
          data: {
            paymentStatus,
            status: newStatus,
            stripePaymentIntentId:
              paymentIntentId || booking.stripePaymentIntentId,
            stripeCheckoutSessionId:
              checkoutSessionId || booking.stripeCheckoutSessionId,
            stripeCustomerId: customerId || booking.stripeCustomerId,
            paidAt: isPaid && !booking.paidAt ? new Date() : booking.paidAt,
          },
        });

        // -------- Stand availability --------
        // We do NOT touch stand.isAvailable here.
        //   - On paid: admin approval blocks it.
        //   - On fail/cancel/refund: admin approval / rejection controls it.
        // (If you later want auto-release on refund of an UN-approved booking,
        //  add: if (!isPaid && booking.status === 0 && booking.standId) { ...set 1... })
        // For now, leave the stand entirely to admin actions, which is the source of truth.

        // -------- PaymentTransaction ledger (upsert) --------
        const existingTransaction = await tx.paymentTransaction.findFirst({
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
          await tx.paymentTransaction.update({
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
                checkoutSessionId ||
                existingTransaction.stripeCheckoutSessionId,
              stripeCustomerId:
                customerId || existingTransaction.stripeCustomerId,
              receiptUrl: receiptUrl || existingTransaction.receiptUrl,
            },
          });
        } else {
          await tx.paymentTransaction.create({
            data: {
              bookingId: bookingId,
              userId: booking.userId,
              amount:
                amount !== undefined ? amount : Number(booking.totalAmount),
              currency: currency || booking.currency || 'eur',
              paidAmount: isPaid
                ? amount !== undefined
                  ? amount
                  : Number(booking.totalAmount)
                : 0,
              paidCurrency: currency || booking.currency || 'eur',
              provider: 'stripe',
              referenceNumber:
                paymentIntentId || checkoutSessionId || bookingId,
              status: txStatus,
              rawStatus: rawStatus || txStatus,
              stripeCustomerId: customerId,
              stripePaymentIntentId: paymentIntentId,
              stripeCheckoutSessionId: checkoutSessionId,
              receiptUrl: receiptUrl,
            },
          });
        }

        return {
          booking: updatedBooking,
          standId: booking.standId ?? undefined,
          userId: booking.userId ?? undefined,
          amount: amount ?? Number(booking.totalAmount),
          standNumber: booking.stand?.standNumber ?? null,
          conflict: false,
          paymentIntentId,
          checkoutSessionId,
        };
      });
    } catch (err: any) {
      this.logger.error(
        `syncBookingPayment transaction failed for booking ${bookingId}: ${err.message}`,
        err.stack,
      );
      throw err;
    }

    // -------- Phase 2: Side effects AFTER commit (notifications/emails) --------
    if (!result || result.skipped) return result;

    try {
      await this.sendPaymentNotifications(result, paymentStatus);
    } catch (err: any) {
      // Notifications must never roll back the ledger.
      this.logger.error(
        `Notification dispatch failed for booking ${bookingId}: ${err.message}`,
        err.stack,
      );
    }

    return result;
  }

  /**
   * Guard: is this booking already at the state this webhook wants to put it in?
   * Prevents duplicate webhook deliveries from re-triggering side effects.
   */
  private isAlreadyInTargetState(
    booking: { paymentStatus: string | null; status: number },
    incoming: PaymentStatus,
  ): boolean {
    if (incoming === 'paid' && booking.paymentStatus === 'paid') return true;
    if (
      incoming === 'failed' &&
      (booking.paymentStatus === 'failed' ||
        booking.paymentStatus === 'canceled')
    )
      return true;
    if (incoming === 'canceled' && booking.paymentStatus === 'canceled')
      return true;
    if (incoming === 'refunded' && booking.paymentStatus === 'refunded')
      return true;
    if (
      incoming === 'conflict_refund_needed' &&
      booking.paymentStatus === 'conflict_refund_needed'
    )
      return true;
    return false;
  }

  private async sendPaymentNotifications(
    result: SyncResult,
    paymentStatus: PaymentStatus,
  ) {
    const bookingId = result.booking?.id;
    if (!bookingId) return;

    const standName = result.standNumber
      ? `Stand ${result.standNumber}`
      : 'your stand';
    const formattedAmount = result.amount ?? 0;

    if (paymentStatus === 'paid') {
      if (result.userId) {
        await this.notificationService.sendNotification({
          type: 'payment_success',
          title: 'Payment Successful',
          text: `Your payment of €${formattedAmount} for ${standName} was received and is pending admin approval.`,
          receiverIds: result.userId,
          entityId: bookingId,
          sendEmail: true,
          emailSubject: 'Payment Successful - Awaiting Approval',
        });
      }
      await this.notificationService.sendNotification({
        type: 'payment_success',
        title: 'New Payment Received',
        text: `Payment of €${formattedAmount} for ${standName} was received and is pending approval.`,
        receiverIds: null,
        entityId: bookingId,
        sendEmail: true,
        emailSubject: 'New Stand Booking Payment Received (Pending Approval)',
      });
    } else if (paymentStatus === 'failed') {
      if (result.userId) {
        await this.notificationService.sendNotification({
          type: 'payment_failed',
          title: 'Payment Failed',
          text: `Payment for ${standName} failed. Please try again or update your payment method.`,
          receiverIds: result.userId,
          entityId: bookingId,
          sendEmail: true,
          emailSubject: 'Payment Failed Notice',
        });
      }
    } else if (
      paymentStatus === 'refunded' ||
      paymentStatus === 'conflict_refund_needed'
    ) {
      if (result.userId) {
        await this.notificationService.sendNotification({
          type: 'booking_refunded',
          title: 'Booking Canceled & Refunded',
          text: `Your booking for ${standName} has been canceled and auto-refunded.`,
          receiverIds: result.userId,
          entityId: bookingId,
          sendEmail: true,
          emailSubject: 'Booking Canceled & Refunded',
        });
      }
      await this.notificationService.sendNotification({
        type: 'booking_refunded',
        title: 'Booking Auto-Refunded',
        text: `Booking for ${standName} was canceled and refunded.`,
        receiverIds: null,
        entityId: bookingId,
        sendEmail: true,
        emailSubject: 'Booking Refund Notification',
      });
    }
  }
}
