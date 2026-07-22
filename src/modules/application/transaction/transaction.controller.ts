import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import {
  Session,
  UserSession,
} from 'src/modules/auth/decorators/session.decorator';
import { FindAllTransactionsQueryDto } from './dto/query-transaction.dto';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { Role } from 'src/common/guard/role/role.enum';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { ResponseTransactionListDto } from './dto/response-transaction.dto';

@ApiTags('Transaction')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.USER)
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @ApiOperation({
    summary: 'Get user payment transactions',
    description:
      'Fetches a paginated list of all payment transactions belonging to the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    type: ResponseTransactionListDto,
    description: 'Transactions fetched successfully',
  })
  @Get()
  findAll(
    @Session() session: UserSession,
    @Query() query: FindAllTransactionsQueryDto,
  ) {
    return this.transactionService.findAll(session, query);
  }
}
