import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { Role } from 'src/common/guard/role/role.enum';
import {
  UserSession,
  Session,
} from 'src/modules/auth/decorators/session.decorator';
import { FindAllBookingsQueryDto } from './dto/query-booking.dto';
import {
  AppBookingCreateResponseDto,
  AppBookingListResponseDto,
} from './dto/response-booking.dto';

@ApiTags('Booking')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.USER)
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @ApiOperation({
    summary: 'Create a new stand booking',
    description:
      'Reserves an available stand for the logged-in user and calculates subtotal, VAT, and total amounts.',
  })
  @ApiResponse({
    status: 201,
    type: AppBookingCreateResponseDto,
    description: 'Booking created successfully',
  })
  @Post()
  create(
    @Session() session: UserSession,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingService.create(session, createBookingDto);
  }

  @ApiOperation({
    summary: 'Get user bookings with pagination',
    description:
      'Fetches a paginated list of all stand bookings made by the currently logged-in user.',
  })
  @ApiResponse({
    status: 200,
    type: AppBookingListResponseDto,
    description: 'Bookings retrieved successfully',
  })
  @Get()
  findAll(
    @Session() session: UserSession,
    @Query() query: FindAllBookingsQueryDto,
  ) {
    return this.bookingService.findAll(session, query);
  }
}
