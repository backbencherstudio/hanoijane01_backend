import { Controller, Get, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { PaymentTransactionService } from './payment-transaction.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { Role } from '../../../common/guard/role/role.enum';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { Request } from 'express';
import {
  PaymentTransactionActionResponse,
  PaymentTransactionDetailResponse,
  PaymentTransactionListResponse,
} from './dto/payment-transaction-response.dto';

@ApiBearerAuth()
@ApiTags('Payment transaction')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/payment-transaction')
export class PaymentTransactionController {
  constructor(
    private readonly paymentTransactionService: PaymentTransactionService,
  ) {}

  @ApiOperation({ summary: 'Get all payment transactions' })
  @ApiResponse({
    status: 200,
    type: PaymentTransactionListResponse,
    description: 'List of all transactions',
  })
  @Get()
  async findAll(@Req() req: Request) {
    const user_id = req.user.id;
    return this.paymentTransactionService.findAll(user_id);
  }

  @ApiOperation({ summary: 'Get details of a single transaction' })
  @ApiResponse({
    status: 200,
    type: PaymentTransactionDetailResponse,
    description: 'Transaction details',
  })
  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user_id = req.user.id;
    return this.paymentTransactionService.findOne(id, user_id);
  }

  @ApiOperation({ summary: 'Delete a payment transaction by id' })
  @ApiResponse({
    status: 200,
    type: PaymentTransactionActionResponse,
    description: 'Transaction deleted successfully',
  })
  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user_id = req.user.id;
    return this.paymentTransactionService.remove(id, user_id);
  }
}
