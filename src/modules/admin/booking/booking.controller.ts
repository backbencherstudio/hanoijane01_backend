import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { Role } from '../../../common/guard/role/role.enum';
import {
  AdminBookingActionResponseDto,
  AdminBookingDetailResponseDto,
  AdminBookingListResponseDto,
} from './dto/response-booking.dto';

@ApiTags('Admin / Booking')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @ApiOperation({
    summary: 'Create a booking (Admin)',
    description:
      'Manually creates a stand booking record from the admin dashboard.',
  })
  @ApiResponse({
    status: 201,
    type: AdminBookingActionResponseDto,
    description: 'Booking created successfully',
  })
  @Post()
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.create(createBookingDto);
  }

  @ApiOperation({
    summary: 'Get all bookings (Admin)',
    description:
      'Retrieves a list of all user stand bookings across exhibitions.',
  })
  @ApiResponse({
    status: 200,
    type: AdminBookingListResponseDto,
    description: 'List of bookings retrieved successfully',
  })
  @Get()
  findAll() {
    return this.bookingService.findAll();
  }

  @ApiOperation({
    summary: 'Get booking details by ID (Admin)',
    description:
      'Retrieves detailed booking information including user, stand, and transaction details.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'The unique ID of the booking record',
  })
  @ApiResponse({
    status: 200,
    type: AdminBookingDetailResponseDto,
    description: 'Booking details retrieved successfully',
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update a booking by ID (Admin)',
    description: 'Updates details or status of an existing stand booking.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'The unique ID of the booking record to update',
  })
  @ApiResponse({
    status: 200,
    type: AdminBookingActionResponseDto,
    description: 'Booking updated successfully',
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingService.update(id, updateBookingDto);
  }

  @ApiOperation({
    summary: 'Delete a booking by ID (Admin)',
    description: 'Permanently removes a booking record from the database.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'The unique ID of the booking record to delete',
  })
  @ApiResponse({
    status: 200,
    type: AdminBookingActionResponseDto,
    description: 'Booking deleted successfully',
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookingService.remove(id);
  }
}
