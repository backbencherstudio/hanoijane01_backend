import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllTransactionsQueryDto } from './dto/query-transaction.dto';
import { UserSession } from 'src/modules/auth/decorators/session.decorator';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(session: UserSession, query: FindAllTransactionsQueryDto) {
    const { page, limit } = query;
    const skip = limit * (page - 1);
    const [transactions, total] = await Promise.all([
      this.prisma.paymentTransaction.findMany({
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
          status: true,
          amount: true,
          paidAmount: true,
          bookingId: true,
          referenceNumber: true,
          createdAt: true,
          booking: {
            select: {
              stand: {
                select: {
                  id: true,
                  title: true,
                  standNumber: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.paymentTransaction.count({
        where: {
          userId: session.user.id,
        },
      }),
    ]);
    const totalPages = Math.ceil(total / limit);
    return {
      success: true,
      message: 'Transactions fetched successfully',
      data: transactions.map((t) => ({
        id: t.id,
        status: t.status,
        amount: t.amount,
        paidAmount: t.paidAmount,
        referenceNumber: t.referenceNumber,
        bookingId: t.bookingId,
        createdAt: t.createdAt,
        standId: t.booking?.stand?.id,
        standTitle: t.booking?.stand?.title,
        standNumber: t.booking?.stand?.standNumber,
        standSlug: null,
      })),
      meta_data: {
        totalItems: total,
        itemCount: transactions.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }
}
