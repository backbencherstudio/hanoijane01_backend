import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from 'prisma/generated/client';

@Injectable()
export class OverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(exhibitionId?: string) {
    const standWhere: Prisma.StandWhereInput = {
      deletedAt: null,
    };

    if (exhibitionId) {
      standWhere.exhibitionId = exhibitionId;
    }

    const bookingWhere: Prisma.BookingWhereInput = {
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

  async getStandVsHallChart(exhibitionId?: string) {
    const hallWhere: Prisma.HallWhereInput = {
      deletedAt: null,
    };

    if (exhibitionId) {
      hallWhere.exhibitionId = exhibitionId;
    }

    const halls = await this.prisma.hall.findMany({
      where: hallWhere,
      select: {
        id: true,
        title: true,
        exhibitionId: true,
        standCategories: {
          where: { deletedAt: null },
          select: {
            stands: {
              where: { deletedAt: null },
              select: {
                id: true,
                isAvailable: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const chartData = halls.map((hall) => {
      let totalStands = 0;
      let bookedStands = 0;
      let availableStands = 0;

      hall.standCategories.forEach((category) => {
        category.stands.forEach((stand) => {
          totalStands += 1;
          if (stand.isAvailable === 0) {
            bookedStands += 1;
          } else {
            availableStands += 1;
          }
        });
      });

      return {
        hallId: hall.id,
        hallTitle: hall.title ?? 'Unnamed Hall',
        totalStands,
        totalSeats: totalStands,
        bookedStands,
        booked: bookedStands,
        availableStands,
        available: availableStands,
      };
    });

    return {
      success: true,
      message: 'Stand vs Hall chart data retrieved successfully',
      data: chartData,
    };
  }
}
