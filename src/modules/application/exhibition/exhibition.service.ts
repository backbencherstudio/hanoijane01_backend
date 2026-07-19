import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ExhibitionService {
  constructor(private readonly prisma: PrismaService) {}

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
            slug: true,
            isAvailable: true,
            category: {
              select: {
                price: true,
                priceInMinorUnit: true,
                vatPercentage: true,
                size: true,
              },
            },
          },
        },
      },
    });

    if (!exhibition) {
      throw new NotFoundException('No active exhibition found');
    }

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
              return {
                ...standCategory,
                price: basePrice,
                vatPercentage: vatPct,
                totalPrice,
                totalStands: _count.stands ?? 0,
              };
            },
          ),
        })),
        stands: exhibition.stands.map(({ category, ...stand }) => {
          const basePrice = (category?.priceInMinorUnit ?? 0) / 100;
          const vatPct = Number(category?.vatPercentage ?? 0);
          const totalPrice = Number(
            (basePrice + basePrice * (vatPct / 100)).toFixed(2),
          );
          return {
            ...stand,
            size: category?.size ?? '',
            price: basePrice,
            vatPercentage: vatPct,
            totalPrice,
          };
        }),
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
        slug: true,
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
      },
    });

    if (!stand) {
      throw new NotFoundException(`Stand with ID ${id} not found`);
    }

    const { category, ...rest } = stand;
    const restCategory: any = category || {};
    const hall: any = restCategory.hall;

    const basePrice = (restCategory.priceInMinorUnit ?? 0) / 100;
    const vatPct = Number(restCategory.vatPercentage ?? 0);
    const vatAmount = basePrice * (vatPct / 100);
    const totalPrice = Number((basePrice + vatAmount).toFixed(2));

    return {
      success: true,
      data: {
        ...rest,
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
