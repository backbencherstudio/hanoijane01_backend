import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
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

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.USER)
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  create(
    @Session() session: UserSession,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingService.create(session, createBookingDto);
  }

  @Get()
  findAll(
    @Session() session: UserSession,
    @Query() query: FindAllBookingsQueryDto,
  ) {
    return this.bookingService.findAll(session, query);
  }
}
