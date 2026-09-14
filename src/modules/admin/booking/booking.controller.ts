import { Controller, Get, Param, UseGuards, Query, Patch, HttpCode, HttpStatus, Body } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { Role } from '../../../common/guard/role/role.enum';
import {
  AdminBookingDetailResponseDto,
  AdminBookingListPaginatedResponseDto,
  AdminBookingStatsResponseDto,
} from './dto/response-booking.dto';
import {
  GetBookingStatsQueryDto,
  GetBookingsQueryDto,
} from './dto/query-booking.dto';
import { RejectBookingDto } from './dto/action-booking.dto';

@ApiTags('Admin / Booking')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @ApiOperation({
    summary: 'Get booking stats (Admin)',
    description:
      'Retrieves summary statistics of available stands, booked stands, and canceled bookings.',
  })
  @ApiResponse({
    status: 200,
    type: AdminBookingStatsResponseDto,
    description: 'Stats retrieved successfully',
  })
  @Get('stats')
  getStats(@Query() query: GetBookingStatsQueryDto) {
    return this.bookingService.getStats(query);
  }

  @ApiOperation({
    summary: 'Get all bookings with filters and pagination (Admin)',
    description:
      'Retrieves a paginated list of bookings filtering by search and booking status.',
  })
  @ApiResponse({
    status: 200,
    type: AdminBookingListPaginatedResponseDto,
    description: 'List of bookings retrieved successfully',
  })
  @Get()
  findAll(@Query() query: GetBookingsQueryDto) {
    return this.bookingService.findAll(query);
  }

  @ApiOperation({
    summary: 'Get booking details by ID (Admin)',
    description:
      'Retrieves detailed booking information including user, stand, and transaction details.',
  })
  @ApiParam({
    name: 'bookingId',
    type: String,
    required: true,
    description: 'The unique ID of the booking record',
  })
  @ApiResponse({
    status: 200,
    type: AdminBookingDetailResponseDto,
    description: 'Booking details retrieved successfully',
  })
  @Get(':bookingId')
  findOne(@Param('bookingId') bookingId: string) {
    return this.bookingService.findOne(bookingId);
  }

  @ApiOperation({
    summary: 'Accept a booking (Admin)',
    description:
      'Approves a pending booking. Sets booking status to BOOKED, payment status to PAID, and marks the stand as unavailable.',
  })
  @ApiParam({
    name: 'bookingId',
    type: String,
    required: true,
    description: 'The unique ID of the booking record',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 400, description: 'Booking cannot be accepted' })
  @Patch(':bookingId/accept')
  @HttpCode(HttpStatus.OK)
  accept(@Param('bookingId') bookingId: string) {
    return this.bookingService.accept(bookingId);
  }

  @ApiOperation({
    summary: 'Reject a booking (Admin)',
    description:
      'Rejects a booking. Sets booking status to REJECTED (canceled), payment status to REJECTED, and frees up the stand.',
  })
  @ApiParam({
    name: 'bookingId',
    type: String,
    required: true,
    description: 'The unique ID of the booking record',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 400, description: 'Booking cannot be rejected' })
  @Patch(':bookingId/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('bookingId') bookingId: string,
    @Body() body: RejectBookingDto,
  ) {
    return this.bookingService.reject(bookingId, body);
  }
}
