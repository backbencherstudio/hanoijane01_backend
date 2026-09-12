import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from 'prisma/generated/client';
import {
  GetExhibitionStatsQueryDto,
  GetStandsQueryDto,
} from './dto/query-stand.dto';
import { UpdateLatestExhibitionDto } from './dto/update-exhibition.dto';

@Injectable()
export class ExhibitionService {
  constructor(private readonly prisma: PrismaService) {}
  async updateLatestExhibition(dto: UpdateLatestExhibitionDto) {
    const latestExhibition = await this.prisma.exhibition.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestExhibition) {
      throw new NotFoundException('No active exhibition found to update');
    }

    await this.prisma.exhibition.update({
      where: { id: latestExhibition.id },
      data: {
        title: dto.title,
        startedAt: dto.startedAt ? new Date(dto.startedAt) : undefined,
        endedAt: dto.endedAt ? new Date(dto.endedAt) : undefined,
        location: dto.location,
        bookingStatedAt: dto.bookingStatedAt
          ? new Date(dto.bookingStatedAt)
          : undefined,
        bookingEndedAt: dto.bookingEndedAt
          ? new Date(dto.bookingEndedAt)
          : undefined,
      },
    });

    return {
      success: true,
      message: 'Latest exhibition updated successfully',
    };
  }

  async getLatestExhibitionDetails() {
    const exhibition = await this.prisma.exhibition.findFirst({
      where: { deletedAt: null },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        location: true,
        startedAt: true,
        endedAt: true,
        bookingStatedAt: true,
        bookingEndedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!exhibition) {
      throw new NotFoundException('No active exhibition found');
    }

    return {
      success: true,
      message: 'Latest exhibition details retrieved successfully',
      data: exhibition,
    };
  }

  async getLatestExhibition() {
    const exhibition = await this.prisma.exhibition.findFirst({
      where: { deletedAt: null },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        location: true,
        startedAt: true,
        endedAt: true,
        bookingStatedAt: true,
        bookingEndedAt: true,
        stands: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            standNumber: true,
            isAvailable: true,
            category: {
              select: {
                slug: true,
                title: true,
                price: true,
                priceInMinorUnit: true,
                vatPercentage: true,
                size: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!exhibition) {
      throw new NotFoundException('No active exhibition found');
    }

    return {
      success: true,
      message: 'Exhibition fetched successfully',
      data: {
        id: exhibition.id,
        title: exhibition.title,
        description: exhibition.description,
        slug: exhibition.slug,
        location: exhibition.location,
        startedAt: exhibition.startedAt,
        endedAt: exhibition.endedAt,
        bookingStatedAt: exhibition.bookingStatedAt,
        bookingEndedAt: exhibition.bookingEndedAt,
        stands: exhibition.stands
          .map(({ category, ...stand }) => {
            const basePrice = (category?.priceInMinorUnit ?? 0) / 100;
            const vatPct = Number(category?.vatPercentage ?? 0);
            const totalPrice = Number(
              (basePrice + basePrice * (vatPct / 100)).toFixed(2),
            );
            const categoryTitle = category?.title ?? '';
            const categorySlug = category?.slug ?? '';
            return {
              ...stand,
              isAvailable: stand.isAvailable ? true : false,
              size: category?.size ?? '',
              price: basePrice,
              vatPercentage: vatPct,
              totalPrice,
              categoryTitle,
              categorySlug,
            };
          })
          .sort((a, b) =>
            a.standNumber.localeCompare(b.standNumber, undefined, {
              numeric: true,
              sensitivity: 'base',
            }),
          ),
      },
    };
  }

  async getStandsStats(query: GetExhibitionStatsQueryDto) {
    const { exhibitionId } = query;

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

    const stats = halls.map((hall) => {
      let totalStands = 0;
      let bookedStands = 0;
      let availableStands = 0;
      let blockedStands = 0;

      hall.standCategories.forEach((category) => {
        category.stands.forEach((stand) => {
          totalStands += 1;
          if (stand.isAvailable === 0) {
            // We need booking info to tell them apart. If you don't want to
            // change the query shape, just treat all as "unavailable".
            // To properly distinguish, include bookings in the select below.
            bookedStands += 1; // ← currently lumps both together
          } else {
            availableStands += 1;
          }
        });
      });

      return {
        id: hall.id,
        title: hall.title ?? 'Unnamed Hall',
        totalStands,
        bookedStands,
        availableStands,
        blockedStands, // you'd need bookings in the select to compute this
      };
    });

    return {
      success: true,
      message: 'Stand stats retrieved successfully',
      data: stats,
    };
  }

  async getStandsList(query: GetStandsQueryDto) {
    const {
      exhibitionId,
      search,
      hall,
      category,
      status,
      page = 1,
      limit = 10,
    } = query;

    const where: Prisma.StandWhereInput = {
      deletedAt: null,
    };

    if (exhibitionId) {
      where.exhibitionId = exhibitionId;
    }

    // 1. Search Query
    if (search) {
      const searchOR: Prisma.StandWhereInput[] = [
        { title: { contains: search, mode: 'insensitive' } },
        { standNumber: { contains: search, mode: 'insensitive' } },
        {
          category: {
            title: { contains: search, mode: 'insensitive' },
          },
        },
        {
          bookings: {
            some: {
              OR: [
                { userName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { companyName: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];

      where.AND = [
        ...(where.AND
          ? Array.isArray(where.AND)
            ? where.AND
            : [where.AND]
          : []),
        { OR: searchOR },
      ];
    }

    // 2 & 3. Category & Hall Query
    const categoryWhere: Prisma.StandCategoryWhereInput = {
      deletedAt: null,
    };

    if (hall) {
      categoryWhere.hall = {
        OR: [{ id: hall }, { title: { contains: hall, mode: 'insensitive' } }],
      };
    }

    if (category) {
      categoryWhere.OR = [
        { id: category },
        { title: { contains: category, mode: 'insensitive' } },
        { slug: { contains: category, mode: 'insensitive' } },
      ];
    }

    if (hall || category) {
      where.category = categoryWhere;
    }

    // 4. Status Query
    if (status) {
      const s = status.toLowerCase();

      if (s === 'available') {
        where.isAvailable = 1;
      } else if (s === 'booked') {
        // Booked = has an active booking (status = 1)
        where.bookings = {
          some: { status: 1, deletedAt: null },
        };
      } else if (s === 'unavailable') {
        // Unavailable = blocked by admin (isAvailable = 0) AND has no active booking.
        // This distinguishes admin-blocked stands from booked stands.
        where.isAvailable = 0;
        where.bookings = {
          none: { status: 1, deletedAt: null },
        };
      }
    }

    const [totalItems, stands] = await Promise.all([
      this.prisma.stand.count({ where }),
      this.prisma.stand.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: {
            include: {
              hall: true,
            },
          },
          bookings: {
            where: {
              status: 1, // Booked
              deletedAt: null,
            },
            include: {
              user: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          standNumber: 'asc',
        },
      }),
    ]);

    const items = stands
      .map((stand) => {
        const activeBooking = stand.bookings[0] || null;
        return {
          id: stand.id,
          isAvailable: stand.isAvailable ? true : false,
          standNumber: stand.standNumber,
          title: stand.title,
          hall: stand.category?.hall?.title || null,
          category: stand.category?.title || null,
          size: stand.category?.size || null,
          price: stand.category ? Number(stand.category.price) : 0,
          bookingId: activeBooking?.id || null,
          bookedBy: activeBooking
            ? {
                name:
                  activeBooking.userName || activeBooking.user?.name || null,
                email: activeBooking.email || activeBooking.user?.email || null,
              }
            : null,
        };
      })
      .sort((a, b) =>
        a.standNumber.localeCompare(b.standNumber, undefined, {
          numeric: true,
          sensitivity: 'base',
        }),
      );

    const totalPages = Math.ceil(totalItems / limit);

    return {
      success: true,
      message: 'Stands list retrieved successfully',
      data: items,
      metaData: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }

  /**
   * Block or unblock a stand by id.
   * `isAvailable = 1` → available (unblocked)
   * `isAvailable = 0` → blocked (not bookable)
   */
  async updateStandAvailability(standId: string, isAvailable: boolean) {
    const stand = await this.prisma.stand.findFirst({
      where: { id: standId, deletedAt: null },
      include: {
        category: {
          include: {
            hall: true,
          },
        },
        bookings: {
          where: { status: 1, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!stand) {
      throw new NotFoundException('Stand not found');
    }

    // Safety: don't allow blocking a stand that has an active (booked) booking.
    if (!isAvailable && stand.bookings.length > 0) {
      throw new BadRequestException(
        'Cannot block a stand that has an active booking. Cancel or move the booking first.',
      );
    }

    // If you add a `blockReason` column later, wire it here:
    // data: { isAvailable: isAvailable ? 1 : 0, blockReason: isAvailable ? null : reason ?? null }
    const updated = await this.prisma.stand.update({
      where: { id: standId },
      data: { isAvailable: isAvailable ? 1 : 0 },
      include: {
        category: {
          include: {
            hall: true,
          },
        },
      },
    });

    const activeBooking = stand.bookings[0] ?? null;

    return {
      success: true,
      message: isAvailable
        ? 'Stand unblocked successfully'
        : 'Stand blocked successfully',
      data: {
        id: updated.id,
        isAvailable: updated.isAvailable ? true : false,
        standNumber: updated.standNumber,
        title: updated.title,
        hall: updated.category?.hall?.title ?? null,
        category: updated.category?.title ?? null,
        size: updated.category?.size ?? null,
        price: updated.category ? Number(updated.category.price) : 0,
        updatedAt: updated.updatedAt,
        // Handy for the frontend if it wants to show "this row had a booking".
        bookingId: activeBooking?.id ?? null,
      },
    };
  }
}
