import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { UserSession } from '../../auth/decorators/session.decorator';
import { PrismaService } from '../../../prisma/prisma.service';
import { FindAllBookingsQueryDto } from './dto/query-booking.dto';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(session: UserSession, createBookingDto: CreateBookingDto) {
    const stand = await this.prisma.stand.findUnique({
      where: {
        id: createBookingDto.standId,
      },
      include: {
        category: true,
      },
    });

    if (!stand) {
      throw new NotFoundException(
        `Stand with ID ${createBookingDto.standId} not found`,
      );
    }
    if (stand.isAvailable === 0) {
      throw new BadRequestException(
        `Stand with ID ${createBookingDto.standId} is already booked`,
      );
    }
    if (!stand.category) {
      throw new BadRequestException(
        `Stand with ID ${createBookingDto.standId} does not have an assigned category`,
      );
    }

    const priceInMinorUnit = stand.category.priceInMinorUnit ?? 0;
    const subTotalAmount = priceInMinorUnit / 100;
    const vatPct = Number(stand.category.vatPercentage ?? 0);
    const vatAmount = Number((subTotalAmount * (vatPct / 100)).toFixed(2));
    const totalAmount = Number((subTotalAmount + vatAmount).toFixed(2));

    const booking = await this.prisma.booking.create({
      data: {
        userId: session.user.id,
        standId: createBookingDto.standId,
        userName: createBookingDto.userName,
        companyName: createBookingDto.companyName,
        companyAddress: createBookingDto.companyAddress,
        email: createBookingDto.email,
        phoneNumber: createBookingDto.phoneNumber,
        subTotalAmount,
        vatAmount,
        vatPercentage: vatPct,
        totalAmount,
        paymentStatus: 'unpaid',
        paymentMethod: 'stripe',
        status: 0,
      },
      select: {
        id: true,
        userName: true,
        companyName: true,
        companyAddress: true,
        email: true,
        phoneNumber: true,
        subTotalAmount: true,
        vatAmount: true,
        vatPercentage: true,
        totalAmount: true,
        paymentStatus: true,
        paymentMethod: true,
        status: true,
        stand: {
          select: {
            id: true,
            standNumber: true,
            title: true,
            category: {
              select: {
                title: true,
                slug: true,
                size: true,
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
        },
      },
    });

    const {
      stand: { category, ...restStand },
      ...restBooking
    } = booking;

    return {
      success: true,
      message: 'Booking created successfully',
      data: {
        ...restBooking,
        stand: {
          ...restStand,
          category: category.title ?? null,
          hall: category.hall?.title ?? null,
          exhibition: category.hall?.exhibition?.title ?? null,
          exhibitionLocation: category.hall?.exhibition?.location ?? null,
          exhibitionStartedAt: category.hall?.exhibition?.startedAt ?? null,
          exhibitionEndedAt: category.hall?.exhibition?.endedAt ?? null,
          exhibitionBookingStatedAt:
            category.hall?.exhibition?.bookingStatedAt ?? null,
          exhibitionBookingEndedAt:
            category.hall?.exhibition?.bookingEndedAt ?? null,
        },
      },
    };
  }

  async findAll(session: UserSession, query: FindAllBookingsQueryDto) {
    const { page, limit } = query;

    const [bookings, totalBookings] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: (page - 1) * limit,
        select: {
          id: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          stand: {
            select: {
              id: true,
              standNumber: true,
              title: true,
              category: {
                select: {
                  title: true,
                  size: true,
                  hall: {
                    select: {
                      title: true,
                      exhibition: {
                        select: {
                          title: true,
                          location: true,
                          startedAt: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.booking.count({
        where: {
          userId: session.user.id,
        },
      }),
    ]);
    const totalPages = Math.ceil(totalBookings / limit);
    return {
      success: true,
      message: 'Bookings retrieved successfully',
      data: bookings.map((booking) => {
        const { stand, ...restBooking } = booking;
        return {
          restBooking,
          standId: stand.id,
          category: stand.category.title,
          size: stand.category.size,
          hall: stand.category.hall?.title,
          exhibitionTitle: stand.category.hall?.exhibition?.title,
          exhibitionLocation: stand.category.hall?.exhibition?.location,
          exhibitionStartedAt: stand.category.hall?.exhibition?.startedAt,
        };
      }),
      meta_data: {
        totalItems: totalBookings,
        itemCount: bookings.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }
}
