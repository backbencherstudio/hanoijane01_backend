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
    const chartData = await this.prisma.$queryRaw<
      {
        hallId: string;
        hallTitle: string;
        totalStands: number;
        bookedStands: number;
        availableStands: number;
      }[]
    >`
      SELECT 
        h.id AS "hallId",
        COALESCE(h.title, 'Unnamed Hall') AS "hallTitle",
        COUNT(s.id)::int AS "totalStands",
        COUNT(CASE WHEN s.is_available = 0 THEN 1 END)::int AS "bookedStands",
        COUNT(CASE WHEN s.is_available = 1 THEN 1 END)::int AS "availableStands"
      FROM halls h
      LEFT JOIN stand_categories sc ON sc.hall_id = h.id AND sc.deleted_at IS NULL
      LEFT JOIN stands s ON s.category_id = sc.id AND s.deleted_at IS NULL
      WHERE h.deleted_at IS NULL
        ${exhibitionId ? Prisma.sql`AND h.exhibition_id = ${exhibitionId}` : Prisma.empty}
      GROUP BY h.id, h.title, h.created_at
      ORDER BY h.created_at ASC
    `;

    return {
      success: true,
      message: 'Stand vs Hall chart data retrieved successfully',
      data: chartData,
    };
  }
}
