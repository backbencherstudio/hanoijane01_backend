import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OverviewService } from './overview.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { Role } from '../../../common/guard/role/role.enum';
import { OverviewStatsResponseDto } from './dto/response-overview.dto';
import { QueryOverviewDto } from './dto/query-overview.dto';

@ApiBearerAuth()
@ApiTags('Admin Overview')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/overview')
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @ApiOperation({
    summary: 'Get admin overview statistics',
    description:
      'Retrieves total stands, booked stands, available stands, and total revenue.',
  })
  @ApiResponse({
    status: 200,
    type: OverviewStatsResponseDto,
    description: 'Overview statistics retrieved successfully',
  })
  @Get('stats')
  async getStats(@Query() queryDto: QueryOverviewDto) {
    return this.overviewService.getStats(queryDto.exhibitionId);
  }

  @ApiOperation({
    summary: 'Get admin overview statistics (alias endpoint)',
    description: 'Alias route for retrieving overview statistics.',
  })
  @ApiResponse({
    status: 200,
    type: OverviewStatsResponseDto,
    description: 'Overview statistics retrieved successfully',
  })
  @Get()
  async getOverview(@Query() queryDto: QueryOverviewDto) {
    return this.overviewService.getStats(queryDto.exhibitionId);
  }
}
