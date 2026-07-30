import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { Role } from '../../../common/guard/role/role.enum';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { Request } from 'express';
import { StripeService } from '../../payment/stripe/stripe.service';
import {
  PaymentTransactionActionResponse,
  PaymentTransactionListResponse,
} from './dto/response-transaction.dto';
import { QueryAdminTransactionDto } from './dto/query-transaction.dto';

@ApiBearerAuth()
@ApiTags('Admin / Transaction')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/transaction')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly stripeService: StripeService,
  ) {}

  @ApiOperation({
    summary: 'Get all payment transactions',
    description:
      'Fetches a list of all payment transactions recorded in the database. Vendors are restricted to viewing only their own transactions, while admins can view all.',
  })
  @ApiResponse({
    status: 200,
    type: PaymentTransactionListResponse,
    description: 'List of all transactions',
  })
  @Get()
  async findAll(@Req() req: Request, @Query() query: QueryAdminTransactionDto) {
    const user_id = req.user.id;
    return this.transactionService.findAll(user_id, query);
  }

  @ApiOperation({
    summary: 'Trigger full Stripe reconciliation sync',
    description:
      'Scans all pending/unpaid bookings and queries Stripe API to reconcile payment status, reserve stalls, and update transactions.',
  })
  @ApiResponse({
    status: 200,
    type: PaymentTransactionActionResponse,
    description: 'Stripe reconciliation started/completed successfully',
  })
  @Post('sync-stripe')
  async syncStripe() {
    const result = await this.stripeService.syncAllPendingBookings();
    return {
      success: true,
      message: `Stripe sync complete. Total scanned: ${result.totalScanned}, Synced: ${result.syncedCount}, Expired/Canceled: ${result.canceledCount}`,
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Manually sync a specific booking against Stripe',
    description:
      'Queries Stripe for the payment status of a specific booking ID and updates the database, stall reservation, and transaction records.',
  })
  @ApiParam({
    name: 'bookingId',
    type: String,
    required: true,
    description: 'The unique ID of the booking record to sync against Stripe.',
  })
  @ApiResponse({
    status: 200,
    type: PaymentTransactionActionResponse,
    description: 'Booking payment status synced successfully',
  })
  @Post('sync-booking/:bookingId')
  async syncBooking(@Param('bookingId') bookingId: string) {
    const result = await this.stripeService.syncBookingById(bookingId);
    return {
      success: true,
      message: 'Booking payment status synced with Stripe successfully',
      data: result,
    };
  }
}
