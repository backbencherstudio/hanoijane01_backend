import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ExhibitionService {
  constructor(private readonly prisma: PrismaService) {}

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
      message: 'Exhibition details fetched successfully',
      data: exhibition,
    };
  }

  async getLatestExhibition() {
    const exhibition = await this.prisma.exhibition.findFirst({
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
        halls: {
          select: {
            title: true,
            standCategories: {
              select: {
                title: true,
                slug: true,
                size: true,
                price: true,
                priceInMinorUnit: true,
                vatPercentage: true,
                stands: {
                  select: {
                    id: true,
                    standNumber: true,
                    title: true,
                    isAvailable: true,
                    // ── active bookings fetch (pending / paid) ──
                    bookings: {
                      where: {
                        deletedAt: null,
                        status: { in: [0, 1] },
                      },
                      select: {
                        id: true,
                        status: true,
                        paymentStatus: true,
                        createdAt: true,
                      },
                      orderBy: { createdAt: 'desc' },
                      take: 1,
                    },
                  },
                  orderBy: {
                    title: 'asc',
                  },
                },
                _count: {
                  select: {
                    stands: true,
                  },
                },
              },
            },
          },
        },
        stands: {
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
            // ── active bookings fetch for map view ──
            bookings: {
              where: {
                deletedAt: null,
                status: { in: [0, 1] },
              },
              select: {
                id: true,
                status: true,
                paymentStatus: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
          orderBy: {
            title: 'asc',
          },
        },
      },
    });

    if (!exhibition) {
      throw new NotFoundException('No active exhibition found');
    }

    // ── helper: compute stand state ────────────────────────────
    const computeStandState = (
      isAvailable: number,
      activeBooking?: {
        status: number;
        paymentStatus: string | null;
      } | null,
    ): 'available' | 'pending' | 'booked' => {
      // already marked unavailable → booked
      if (isAvailable === 0) return 'booked';

      // no active booking → available
      if (!activeBooking) return 'available';

      // status 1 = approved/booked
      if (activeBooking.status === 1) return 'booked';

      // status 0 = pending (unpaid/paid but awaiting approval)
      if (activeBooking.status === 0) {
        // if payment canceled/failed/refunded → treat as available
        const ps = (activeBooking.paymentStatus || '').toLowerCase();
        if (['canceled', 'failed', 'refunded'].includes(ps)) {
          return 'available';
        }
        return 'pending';
      }

      return 'available';
    };

    return {
      success: true,
      message: 'Exhibition fetched successfully',
      data: {
        ...exhibition,
        halls: exhibition.halls.map((hall) => ({
          ...hall,
          totalStands:
            hall.standCategories.reduce(
              (acc, category) => acc + category._count.stands,
              0,
            ) ?? 0,
          standCategories: hall.standCategories.map(
            ({
              _count,
              stands,
              priceInMinorUnit,
              vatPercentage,
              ...standCategory
            }) => {
              const basePrice = (priceInMinorUnit ?? 0) / 100;
              const vatPct = Number(vatPercentage ?? 0);
              const totalPrice = Number(
                (basePrice + basePrice * (vatPct / 100)).toFixed(2),
              );

              const sortedStands = [...stands].sort((a, b) =>
                (a.standNumber ?? '').localeCompare(
                  b.standNumber ?? '',
                  undefined,
                  {
                    numeric: true,
                    sensitivity: 'base',
                  },
                ),
              );

              return {
                ...standCategory,
                price: basePrice,
                vatPercentage: vatPct,
                totalPrice,
                stands: sortedStands.map(({ bookings, ...stand }) => {
                  const activeBooking = bookings?.[0] ?? null;
                  const state = computeStandState(
                    stand.isAvailable,
                    activeBooking,
                  );

                  return {
                    id: stand.id,
                    standNumber: stand.standNumber,
                    title: stand.title,
                    state, // 'available' | 'pending' | 'booked'
                    isAvailable: state === 'available',
                    isPending: state === 'pending',
                    isBooked: state === 'booked',
                  };
                }),
                totalStands: _count.stands ?? 0,
              };
            },
          ),
        })),
        stands: exhibition.stands
          .map(({ category, bookings, ...stand }) => {
            const basePrice = (category?.priceInMinorUnit ?? 0) / 100;
            const vatPct = Number(category?.vatPercentage ?? 0);
            const totalPrice = Number(
              (basePrice + basePrice * (vatPct / 100)).toFixed(2),
            );
            const categoryTitle = category?.title ?? '';
            const categorySlug = category?.slug ?? '';

            const activeBooking = bookings?.[0] ?? null;
            const state = computeStandState(stand.isAvailable, activeBooking);

            return {
              ...stand,
              state, // 'available' | 'pending' | 'booked'
              isAvailable: state === 'available',
              isPending: state === 'pending',
              isBooked: state === 'booked',
              size: category?.size ?? '',
              price: basePrice,
              vatPercentage: vatPct,
              totalPrice,
              categoryTitle,
              categorySlug,
            };
          })
          .sort((a, b) =>
            (a.standNumber ?? '').localeCompare(
              b.standNumber ?? '',
              undefined,
              {
                numeric: true,
                sensitivity: 'base',
              },
            ),
          ),
      },
    };
  }

  async getStand(id: string) {
    const stand = await this.prisma.stand.findUnique({
      where: { id },
      select: {
        id: true,
        standNumber: true,
        title: true,
        isAvailable: true,
        category: {
          select: {
            title: true,
            slug: true,
            size: true,
            price: true,
            priceInMinorUnit: true,
            vatPercentage: true,
            hall: {
              select: {
                title: true,
                exhibition: {
                  select: {
                    title: true,
                    slug: true,
                    location: true,
                    startedAt: true,
                    endedAt: true,
                    bookingStatedAt: true,
                    bookingEndedAt: true,
                  },
                },
              },
            },
          },
        },
        // ── active bookings for state ──
        bookings: {
          where: {
            deletedAt: null,
            status: { in: [0, 1] },
          },
          select: {
            id: true,
            status: true,
            paymentStatus: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!stand) {
      throw new NotFoundException(`Stand with ID ${id} not found`);
    }

    const { category, bookings, ...rest } = stand;
    const restCategory: any = category || {};
    const hall: any = restCategory.hall;

    const basePrice = (restCategory.priceInMinorUnit ?? 0) / 100;
    const vatPct = Number(restCategory.vatPercentage ?? 0);
    const vatAmount = basePrice * (vatPct / 100);
    const totalPrice = Number((basePrice + vatAmount).toFixed(2));

    // ── compute state ──
    const activeBooking = bookings?.[0] ?? null;
    let state: 'available' | 'pending' | 'booked' = 'available';

    if (rest.isAvailable === 0) {
      state = 'booked';
    } else if (activeBooking) {
      if (activeBooking.status === 1) {
        state = 'booked';
      } else if (activeBooking.status === 0) {
        const ps = (activeBooking.paymentStatus || '').toLowerCase();
        if (['canceled', 'failed', 'refunded'].includes(ps)) {
          state = 'available';
        } else {
          state = 'pending';
        }
      }
    }

    return {
      success: true,
      data: {
        ...rest,
        state, // 'available' | 'pending' | 'booked'
        isAvailable: state === 'available',
        isPending: state === 'pending',
        isBooked: state === 'booked',
        category: restCategory.title ?? null,
        price: basePrice,
        vatPercentage: vatPct,
        vatAmount: Number(vatAmount.toFixed(2)),
        totalPrice,
        size: restCategory.size ?? '',
        hall: hall?.title ?? null,
        exhibition: hall?.exhibition?.title ?? null,
        exhibitionLocation: hall?.exhibition?.location ?? null,
        exhibitionStartedAt: hall?.exhibition?.startedAt ?? null,
        exhibitionEndedAt: hall?.exhibition?.endedAt ?? null,
        exhibitionBookingStatedAt: hall?.exhibition?.bookingStatedAt ?? null,
        exhibitionBookingEndedAt: hall?.exhibition?.bookingEndedAt ?? null,
      },
    };
  }
}
