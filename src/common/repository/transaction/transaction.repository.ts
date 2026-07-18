import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}
  /**
   * Create transaction
   * @returns
   */
  async createTransaction({
    orderId,
    amount,
    currency,
    referenceNumber,
    status = 'pending',
  }: {
    orderId: string;
    amount?: number;
    currency?: string;
    referenceNumber?: string;
    status?: string;
  }) {
    const data = {};
    if (orderId) {
      data['orderId'] = orderId;
    }
    if (amount) {
      data['amount'] = Number(amount);
    }
    if (currency) {
      data['currency'] = currency;
    }
    if (referenceNumber) {
      data['referenceNumber'] = referenceNumber;
    }
    if (status) {
      data['status'] = status;
    }
    return await this.prisma.paymentTransaction.create({
      data: {
        ...data,
      },
    });
  }

  /**
   * Update transaction
   * @returns
   */
  async updateTransaction({
    referenceNumber,
    status = 'pending',
    paidAmount,
    paidCurrency,
    rawStatus,
  }: {
    referenceNumber: string;
    status: string;
    paidAmount?: number;
    paidCurrency?: string;
    rawStatus?: string;
  }) {
    const data = {};
    if (status) {
      data['status'] = status;
    }
    if (paidAmount) {
      data['paidAmount'] = Number(paidAmount);
    }
    if (paidCurrency) {
      data['paidCurrency'] = paidCurrency;
    }
    if (rawStatus) {
      data['rawStatus'] = rawStatus;
    }

    return await this.prisma.paymentTransaction.updateMany({
      where: {
        referenceNumber: referenceNumber,
      },
      data: {
        ...data,
      },
    });
  }
}
