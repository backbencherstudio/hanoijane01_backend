import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class OverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(exhibitionId?: string) {
    const standWhere: any = {
      deletedAt: null,
    };

    if (exhibitionId) {
      standWhere.exhibitionId = exhibitionId;
    }

    const bookingWhere: any = {
      paymentStatus: 'paid',
      deletedAt: null,
    };

    if (exhibitionId) {
      bookingWhere.stand = {
        exhibitionId: exhibitionId,
      };
    }

    const [totalStands, bookedStands, availableStands, revenueResult] =
      await Promise.all([
        this.prisma.stand.count({
          where: standWhere,
        }),
        this.prisma.stand.count({
          where: {
            ...standWhere,
            isAvailable: 0,
          },
        }),
        this.prisma.stand.count({
          where: {
            ...standWhere,
            isAvailable: 1,
          },
        }),
        this.prisma.booking.aggregate({
          _sum: {
            totalAmount: true,
          },
          where: bookingWhere,
        }),
      ]);

    const totalRevenue = Number(revenueResult._sum.totalAmount ?? 0);

    return {
      success: true,
      message: 'Overview stats retrieved successfully',
      data: {
        totalStands,
        bookedStands,
        availableStands,
        totalRevenue,
      },
    };
  }
}
