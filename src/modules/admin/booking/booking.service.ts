import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from 'prisma/generated/client';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import {
  GetBookingStatsQueryDto,
  GetBookingsQueryDto,
} from './dto/query-booking.dto';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(query: GetBookingStatsQueryDto) {
    const { exhibitionId } = query;

    const standWhere: Prisma.StandWhereInput = {
      deletedAt: null,
    };
    const bookingWhere: Prisma.BookingWhereInput = {
      deletedAt: null,
      status: 0,
    };

    if (exhibitionId) {
      standWhere.exhibitionId = exhibitionId;
      bookingWhere.stand = {
        exhibitionId,
      };
    }

    const [availableStands, bookedStands, canceledStands] = await Promise.all([
      // Available Stands: where isAvailable = 1
      this.prisma.stand.count({
        where: {
          ...standWhere,
          isAvailable: 1,
        },
      }),
      // Booked Stands: where isAvailable = 0
      this.prisma.stand.count({
        where: {
          ...standWhere,
          isAvailable: 0,
        },
      }),
      // Canceled bookings: booking status = 0
      this.prisma.booking.count({
        where: bookingWhere,
      }),
    ]);

    return {
      success: true,
      message: 'Booking stats retrieved successfully',
      data: {
        availableStands,
        bookedStands,
        canceledStands,
      },
    };
  }

  async findAll(query: GetBookingsQueryDto) {
    const { search, status, exhibitionId, page = 1, limit = 10 } = query;

    const where: Prisma.BookingWhereInput = {
      deletedAt: null,
    };

    if (exhibitionId) {
      where.stand = {
        exhibitionId: exhibitionId,
      };
    }

    // 1. Status Filter
    if (status) {
      const statusLower = status.toLowerCase();
      if (statusLower === 'booked') {
        where.status = 1;
        where.paymentStatus = 'paid';
      } else if (statusLower === 'pending') {
        where.status = 1;
        where.paymentStatus = { in: ['unpaid', 'pending'] };
      } else if (statusLower === 'canceled') {
        where.OR = [
          { status: 0 },
          { paymentStatus: { in: ['refunded', 'failed'] } },
        ];
      }
    }

    // 2. Search Filter
    if (search) {
      const searchOR: Prisma.BookingWhereInput[] = [
        { userName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { companyName: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        {
          stand: {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { standNumber: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchOR }];
        delete where.OR;
      } else {
        where.OR = searchOR;
      }
    }

    const [totalItems, bookings] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: true,
          stand: {
            include: {
              category: {
                include: {
                  hall: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    const items = bookings.map((booking) => {
      // Determine mapped status string
      let bookingStatus = 'pending';
      if (
        booking.status === 0 ||
        ['refunded', 'failed'].includes(booking.paymentStatus || '')
      ) {
        bookingStatus = 'canceled';
      } else if (booking.status === 1 && booking.paymentStatus === 'paid') {
        bookingStatus = 'booked';
      }

      // Format stand category (category title) and hall (hall title)
      const standCategory = booking.stand?.category?.title || null;
      const hall = booking.stand?.category?.hall?.title || null;
      const pricePerDay = booking.stand?.category
        ? Number(booking.stand.category.price)
        : 0;

      // Exhibitor name
      const exhibitor =
        booking.companyName ||
        booking.user?.companyName ||
        booking.userName ||
        booking.user?.name ||
        null;

      // Stand number formatting (e.g. 1 -> "01", or just string number)
      const standNumRaw = booking.stand?.standNumber;
      const standNumber =
        standNumRaw !== null && standNumRaw !== undefined
          ? String(standNumRaw).padStart(2, '0')
          : null;

      return {
        id: booking.id,
        standNumber,
        standCategory,
        hall,
        exhibitor,
        pricePerDay,
        status: bookingStatus,
        bookingDate: booking.createdAt,
      };
    });

    const totalPages = Math.ceil(totalItems / limit);

    return {
      success: true,
      message: 'Bookings fetched successfully',
      data: items,
      meta_data: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        stand: {
          include: {
            exhibition: true,
            category: {
              include: {
                hall: true,
              },
            },
          },
        },
        paymentTransactions: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // Map booking type
    let bookingType = 'pending';
    if (
      booking.status === 0 ||
      ['refunded', 'failed'].includes(booking.paymentStatus || '')
    ) {
      bookingType = 'canceled';
    } else if (booking.status === 1 && booking.paymentStatus === 'paid') {
      bookingType = 'booked';
    }

    const data = {
      id: booking.id,
      bookingType,
      standNumber: booking.stand?.standNumber
        ? String(booking.stand.standNumber).padStart(2, '0')
        : null,
      hall: booking.stand?.category?.hall?.title || null,
      category: booking.stand?.category?.title || null,
      price: booking.stand?.category ? Number(booking.stand.category.price) : 0,
      event: booking.stand?.exhibition?.title || null,
      exhibitor: booking.companyName || booking.user?.companyName || null,
      contactName: booking.userName || booking.user?.name || null,
      email: booking.email || booking.user?.email || null,
      bookingDate: booking.createdAt,
      paymentStatus: booking.paymentStatus || 'unpaid',
      subTotalAmount: Number(booking.subTotalAmount),
      discountAmount: Number(booking.discountAmount),
      vatAmount: Number(booking.vatAmount),
      vatPercentage: Number(booking.vatPercentage),
      totalAmount: Number(booking.totalAmount),
    };

    return {
      success: true,
      message: 'Booking details fetched successfully',
      data,
    };
  }
}
