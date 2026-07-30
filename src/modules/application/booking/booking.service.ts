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
import { NajimStorage } from '../../../common/lib/Disk/NajimStorage';
import appConfig from 'src/config/app.config';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    session: UserSession,
    createBookingDto: CreateBookingDto,
    signature?: Express.Multer.File,
  ) {
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
      await this.prisma.booking.updateMany({
        where: {
          userId: session.user.id,
          standId: createBookingDto.standId,
          paymentStatus: 'unpaid',
        },
        data: {
          paymentStatus: 'canceled',
          status: -1,
        },
      });

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

    let signaturePathToSave: string | null = null;
    if (signature) {
      const meta = NajimStorage.generateFileMeta(
        signature.originalname,
        appConfig().storageUrl.booking,
      );
      await NajimStorage.put(meta.fileKey, signature.buffer);
      signaturePathToSave = meta.fileKey;
    }

    // Reuse existing unpaid booking for the same user and stand if present to prevent duplicates
    const existingUnpaidBooking = await this.prisma.booking.findFirst({
      where: {
        userId: session.user.id,
        standId: createBookingDto.standId,
        paymentStatus: 'unpaid',
        status: 0,
        deletedAt: null,
      },
    });

    const bookingSelect = {
      id: true,
      userName: true,
      companyName: true,
      companyAddress: true,
      email: true,
      phoneNumber: true,
      termsAndConditionsAccepted: true,
      onBehalfOf: true,
      title: true,
      signaturePath: true,
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
    };

    let booking;
    if (existingUnpaidBooking) {
      booking = await this.prisma.booking.update({
        where: { id: existingUnpaidBooking.id },
        data: {
          userName: createBookingDto.userName,
          companyName: createBookingDto.companyName,
          companyAddress: createBookingDto.companyAddress,
          email: createBookingDto.email,
          phoneNumber: createBookingDto.phoneNumber,
          termsAndConditionsAccepted:
            createBookingDto.termsAndConditionsAccepted,
          onBehalfOf: createBookingDto.onBehalfOf || null,
          title: createBookingDto.title || null,
          ...(signaturePathToSave
            ? { signaturePath: signaturePathToSave }
            : {}),
          subTotalAmount,
          vatAmount,
          vatPercentage: vatPct,
          totalAmount,
        },
        select: bookingSelect,
      });
    } else {
      booking = await this.prisma.booking.create({
        data: {
          userId: session.user.id,
          standId: createBookingDto.standId,
          userName: createBookingDto.userName,
          companyName: createBookingDto.companyName,
          companyAddress: createBookingDto.companyAddress,
          email: createBookingDto.email,
          phoneNumber: createBookingDto.phoneNumber,
          termsAndConditionsAccepted:
            createBookingDto.termsAndConditionsAccepted,
          onBehalfOf: createBookingDto.onBehalfOf || null,
          title: createBookingDto.title || null,
          signaturePath: signaturePathToSave,
          subTotalAmount,
          vatAmount,
          vatPercentage: vatPct,
          totalAmount,
          paymentStatus: 'unpaid',
          paymentMethod: 'stripe',
          status: 0,
        },
        select: bookingSelect,
      });
    }

    const {
      stand: { category, ...restStand },
      ...restBooking
    } = booking;

    return {
      success: true,
      message: 'Booking created successfully',
      data: {
        ...restBooking,
        status:
          restBooking.status === 1
            ? 'BOOKED'
            : restBooking.status === -1 ||
                restBooking.paymentStatus === 'canceled'
              ? 'CANCELED'
              : 'PENDING',
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
          paymentStatus: true,
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
        const { stand, status, ...restBooking } = booking;
        const formattedPaymentStatus = (
          restBooking.paymentStatus || 'UNPAID'
        ).toUpperCase();

        const formattedStatus =
          status === 1
            ? 'BOOKED'
            : status === -1 ||
                ['CANCELED', 'REFUNDED', 'FAILED'].includes(
                  formattedPaymentStatus,
                )
              ? 'CANCELED'
              : 'PENDING';

        return {
          ...restBooking,
          status: formattedStatus,
          paymentStatus: formattedPaymentStatus,
          standId: stand.id,
          standNumber: stand.standNumber,
          standTitle: stand.title,
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
