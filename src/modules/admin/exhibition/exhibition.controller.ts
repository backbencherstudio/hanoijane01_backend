import {
  Controller,
  Get,
  Param,
  UseGuards,
  Query,
  Patch,
  Body,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ExhibitionService } from './exhibition.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { Role } from '../../../common/guard/role/role.enum';
import {
  AdminExhibitionLatestResponseDto,
  AdminExhibitionActionResponseDto,
} from './dto/response-exhibition.dto';
import {
  GetExhibitionStatsQueryDto,
  GetStandsQueryDto,
} from './dto/query-stand.dto';
import {
  HallStatsResponseDto,
  StandListResponseDto,
} from './dto/response-stand.dto';
import { UpdateLatestExhibitionDto } from './dto/update-exhibition.dto';

@ApiTags('Admin / Exhibition')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/exhibition')
export class ExhibitionController {
  constructor(private readonly exhibitionService: ExhibitionService) {}

  @ApiOperation({
    summary: 'Get latest exhibition without halls (Admin)',
    description:
      'Fetches the active exhibition details along with its stands, category details, pricing, and counts, excluding the halls list.',
  })
  @ApiResponse({
    status: 200,
    type: AdminExhibitionLatestResponseDto,
    description: 'Latest exhibition details retrieved successfully',
  })
  @Get('latest-one')
  getLatestExhibition() {
    return this.exhibitionService.getLatestExhibition();
  }

  @ApiOperation({
    summary: 'Update latest exhibition details (Admin)',
    description:
      'Updates the metadata (Event name, date, venue, deadline) of the latest active exhibition.',
  })
  @ApiResponse({
    status: 200,
    type: AdminExhibitionActionResponseDto,
    description: 'Latest exhibition updated successfully',
  })
  @Patch('latest-one')
  updateLatestExhibition(@Body() dto: UpdateLatestExhibitionDto) {
    return this.exhibitionService.updateLatestExhibition(dto);
  }

  @ApiOperation({
    summary: 'Get stand stats grouped by hall (Admin)',
    description:
      'Retrieves count statistics of total, booked, and available stands for each hall.',
  })
  @ApiResponse({
    status: 200,
    type: HallStatsResponseDto,
    description: 'Stand statistics retrieved successfully',
  })
  @Get('stands/stats')
  getStandsStats(@Query() query: GetExhibitionStatsQueryDto) {
    return this.exhibitionService.getStandsStats(query);
  }

  @ApiOperation({
    summary: 'Get paginated stands list with filters (Admin)',
    description:
      'Retrieves a list of stands with parameters for search, pagination, hall, category, and booking status.',
  })
  @ApiResponse({
    status: 200,
    type: StandListResponseDto,
    description: 'Paginated stands retrieved successfully',
  })
  @Get('stands')
  getStandsList(@Query() query: GetStandsQueryDto) {
    return this.exhibitionService.getStandsList(query);
  }
}
