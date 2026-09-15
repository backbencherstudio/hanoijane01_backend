import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from 'prisma/generated/client';
import {
  GetBookingStatsQueryDto,
  GetBookingsQueryDto,
} from './dto/query-booking.dto';
import { RejectBookingDto } from './dto/action-booking.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async getStats(query: GetBookingStatsQueryDto) {
    const { exhibitionId } = query;

    const standWhere: Prisma.StandWhereInput = {
      deletedAt: null,
    };
    const bookingWhere: Prisma.BookingWhereInput = {
      deletedAt: null,
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
      // Canceled bookings: booking status = -1 or canceled/refunded/failed
      this.prisma.booking.count({
        where: {
          ...bookingWhere,
          OR: [
            { status: -1 },
            { paymentStatus: { in: ['canceled', 'refunded', 'failed'] } },
          ],
        },
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
      } else if (statusLower === 'pending') {
        where.status = 0;
      } else if (statusLower === 'canceled') {
        where.OR = [
          { status: -1 },
          { paymentStatus: { in: ['refunded', 'failed', 'canceled'] } },
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
      let bookingStatus = 'PENDING';
      if (
        booking.paymentStatus === 'refunded' ||
        booking.paymentStatus === 'conflict_refund_needed'
      ) {
        bookingStatus = 'REFUNDED';
      } else if (
        booking.status === -1 ||
        ['failed', 'canceled'].includes(booking.paymentStatus || '')
      ) {
        bookingStatus = 'CANCELED';
      } else if (booking.status === 1 || booking.paymentStatus === 'paid') {
        bookingStatus = 'BOOKED';
      } else if (booking.status === 0) {
        bookingStatus = 'PENDING';
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

      const formattedPaymentStatus = (
        booking.paymentStatus || 'UNPAID'
      ).toUpperCase();

      return {
        id: booking.id,
        standNumber,
        standCategory,
        hall,
        exhibitor,
        pricePerDay,
        status: bookingStatus,
        paymentStatus: formattedPaymentStatus,
        bookingDate: booking.createdAt,
      };
    });

    const totalPages = Math.ceil(totalItems / limit);

    return {
      success: true,
      message: 'Bookings fetched successfully',
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
    let bookingType = 'PENDING';
    if (
      booking.paymentStatus === 'refunded' ||
      booking.paymentStatus === 'conflict_refund_needed'
    ) {
      bookingType = 'REFUNDED';
    } else if (
      booking.status === -1 ||
      ['failed', 'canceled'].includes(booking.paymentStatus || '')
    ) {
      bookingType = 'CANCELED';
    } else if (booking.status === 1 || booking.paymentStatus === 'paid') {
      bookingType = 'BOOKED';
    } else if (booking.status === 0) {
      bookingType = 'PENDING';
    }

    const data = {
      id: booking.id,
      status: bookingType,
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
      paymentStatus: (booking.paymentStatus || 'UNPAID').toUpperCase(),
      subTotalAmount: Number(booking.subTotalAmount),
      discountAmount: Number(booking.discountAmount),
      vatAmount: Number(booking.vatAmount),
      vatPercentage: Number(booking.vatPercentage),
      totalAmount: Number(booking.totalAmount),
      termsAndConditionsAccepted: booking.termsAndConditionsAccepted,
      onBehalfOf: booking.onBehalfOf || null,
      title: booking.title || null,
      signaturePath: booking.signaturePath || null,
    };

    return {
      success: true,
      message: 'Booking details fetched successfully',
      data,
    };
  }

  /**
   * Accept a booking:
   * - booking.status = 1  (booked)
   * - booking.paymentStatus = 'paid'
   * - booking.paidAt = now (if not set)
   * - stand.isAvailable = 0 (stand becomes unavailable)
   * - linked PaymentTransaction → status: 'succeeded', paidAmount, paidCurrency
   * - emails the user
   */
  async accept(id: string) {
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
      },
    });

    if (!booking || booking.deletedAt) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    if (booking.status === 1) {
      throw new BadRequestException('Booking is already accepted');
    }

    if (booking.status === -1) {
      throw new BadRequestException(
        'Rejected booking cannot be accepted. Please restore it first.',
      );
    }

    const paidAt = booking.paidAt ?? new Date();
    const amount = Number(booking.totalAmount);
    const currency = (booking.currency || 'eur').toLowerCase();

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update booking
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: {
          status: 1,
          paymentStatus: 'paid',
          paidAt,
          rejectionReason: null,
          rejectedAt: null,
        },
      });

      // 2. Block the stand
      if (booking.standId) {
        await tx.stand.update({
          where: { id: booking.standId },
          data: { isAvailable: 0 },
        });
      }

      // 3. Sync the linked PaymentTransaction(s)
      await tx.paymentTransaction.updateMany({
        where: {
          bookingId: booking.id,
          deletedAt: null,
        },
        data: {
          status: 'succeeded',
          rawStatus: 'manually_approved_by_admin',
          paidAmount: amount,
          paidCurrency: currency,
          ...(booking.stripePaymentIntentId
            ? { stripePaymentIntentId: booking.stripePaymentIntentId }
            : {}),
          ...(booking.stripeCheckoutSessionId
            ? { stripeCheckoutSessionId: booking.stripeCheckoutSessionId }
            : {}),
        },
      });

      return updatedBooking;
    });

    // ✅ Send approval email
    const recipientEmail = booking.email || booking.user?.email;
    if (recipientEmail) {
      await this.mailService.sendBookingAcceptedEmail({
        email: recipientEmail,
        name:
          booking.userName || booking.user?.name || booking.companyName || null,
        bookingId: booking.id,
        standNumber: booking.stand?.standNumber
          ? String(booking.stand.standNumber).padStart(2, '0')
          : null,
        hall: booking.stand?.category?.hall?.title || null,
        category: booking.stand?.category?.title || null,
        event: booking.stand?.exhibition?.title || null,
        totalAmount: amount,
        currency,
      });
    }

    return {
      success: true,
      message: 'Booking accepted successfully',
      data: {
        id: result.id,
        status: 'BOOKED',
        paymentStatus: 'PAID',
      },
    };
  }

  /**
   * Reject a booking:
   * - booking.status = -1 (canceled / rejected)
   * - booking.paymentStatus = 'rejected'
   * - booking.rejectionReason / rejectedAt set
   * - stand.isAvailable = 1 (stand becomes available again)
   * - linked PaymentTransaction → status: 'canceled'
   * - emails the user
   */
  async reject(id: string, dto: RejectBookingDto) {
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
      },
    });

    if (!booking || booking.deletedAt) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    if (booking.status === -1) {
      throw new BadRequestException('Booking is already rejected');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: {
          status: -1,
          paymentStatus: 'rejected',
          rejectionReason: dto.reason ?? null,
          rejectedAt: new Date(),
        },
      });

      if (booking.standId) {
        await tx.stand.update({
          where: { id: booking.standId },
          data: { isAvailable: 1 },
        });
      }

      // Mirror into the transaction ledger
      await tx.paymentTransaction.updateMany({
        where: { bookingId: booking.id, deletedAt: null },
        data: {
          status: 'canceled',
          rawStatus: dto.reason
            ? `rejected_by_admin: ${dto.reason}`
            : 'rejected_by_admin',
        },
      });

      return updatedBooking;
    });

    // ✅ Send rejection email
    const recipientEmail = booking.email || booking.user?.email;
    if (recipientEmail) {
      await this.mailService.sendBookingRejectedEmail({
        email: recipientEmail,
        name:
          booking.userName || booking.user?.name || booking.companyName || null,
        bookingId: booking.id,
        standNumber: booking.stand?.standNumber
          ? String(booking.stand.standNumber).padStart(2, '0')
          : null,
        hall: booking.stand?.category?.hall?.title || null,
        category: booking.stand?.category?.title || null,
        event: booking.stand?.exhibition?.title || null,
        reason: dto.reason ?? null,
        rejectedAt: result.rejectedAt,
      });
    }

    return {
      success: true,
      message: 'Booking rejected successfully',
      data: {
        id: result.id,
        status: 'REJECTED',
        paymentStatus: 'REJECTED',
        rejectionReason: result.rejectionReason,
        rejectedAt: result.rejectedAt,
      },
    };
  }
}
