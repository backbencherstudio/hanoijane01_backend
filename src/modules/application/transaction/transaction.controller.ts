import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import {
  Session,
  UserSession,
} from 'src/modules/auth/decorators/session.decorator';
import { FindAllTransactionsQueryDto } from './dto/query-transaction.dto';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { Role } from 'src/common/guard/role/role.enum';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.USER)
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}
  @Get()
  findAll(
    @Session() session: UserSession,
    @Query() query: FindAllTransactionsQueryDto,
  ) {
    return this.transactionService.findAll(session, query);
  }
}
