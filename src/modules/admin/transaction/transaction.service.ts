import { Injectable } from '@nestjs/common';
import { Prisma } from 'prisma/generated/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueryAdminTransactionDto } from './dto/query-transaction.dto';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: QueryAdminTransactionDto) {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.PaymentTransactionWhereInput = {};

    if (status) {
      whereClause.status = status;
    }

    const [paymentTransactions, totalTransactions] = await Promise.all([
      this.prisma.paymentTransaction.findMany({
        where: whereClause,
        select: {
          id: true,
          referenceNumber: true,
          status: true,
          provider: true,
          amount: true,
          currency: true,
          paidAmount: true,
          paidCurrency: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: limit,
      }),
      this.prisma.paymentTransaction.count({
        where: whereClause,
      }),
    ]);

    return {
      success: true,
      message: 'Payment transactions retrieved successfully',
      data: paymentTransactions,
      metaData: {
        total: totalTransactions,
        page: page,
        limit: limit,
      },
    };
  }

  async getStats() {
    const [succeeded, pending, failed, refunded] = await Promise.all([
      this.prisma.paymentTransaction.count({
        where: {
          status: { in: ['succeeded', 'Succeeded', 'paid', 'Paid'] },
          deletedAt: null,
        },
      }),
      this.prisma.paymentTransaction.count({
        where: {
          status: { in: ['pending', 'Pending', 'unpaid', 'Unpaid'] },
          deletedAt: null,
        },
      }),
      this.prisma.paymentTransaction.count({
        where: {
          status: { in: ['failed', 'Failed'] },
          deletedAt: null,
        },
      }),
      this.prisma.paymentTransaction.count({
        where: {
          status: { in: ['refunded', 'Refunded', 'canceled', 'Canceled'] },
          deletedAt: null,
        },
      }),
    ]);

    return {
      success: true,
      message: 'Transaction statistics retrieved successfully',
      data: {
        succeeded,
        pending,
        failed,
        refunded,
      },
    };
  }
}
