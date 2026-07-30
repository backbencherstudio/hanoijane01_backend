import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ExhibitionService } from './exhibition.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import {
  ResponseLatestExhibitionDto,
  ResponseLatestExhibitionDetailsDto,
  ResponseStandDetailDto,
} from './dto/response-exhibition.dto';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { Role } from 'src/common/guard/role/role.enum';

@ApiTags('Application / Exhibition')
@Controller('exhibition')
export class ExhibitionController {
  constructor(private readonly exhibitionService: ExhibitionService) {}

  @ApiOperation({
    summary: 'Get latest exhibition details/metadata without halls and stands',
    description:
      'Fetches basic details (title, dates, venue, booking deadlines) of the active exhibition.',
  })
  @ApiResponse({
    status: 200,
    type: ResponseLatestExhibitionDetailsDto,
    description: 'Exhibition details fetched successfully',
  })
  @Get('latest-details')
  getLatestExhibitionDetails() {
    return this.exhibitionService.getLatestExhibitionDetails();
  }

  @ApiOperation({
    summary: 'Get latest exhibition with nested halls, categories, and stands',
    description:
      'Fetches the active exhibition details along with its halls, stand categories, availability status, pricing, and counts.',
  })
  @ApiResponse({
    status: 200,
    type: ResponseLatestExhibitionDto,
    description: 'Exhibition details fetched successfully',
  })
  @Get('latest-one')
  getLatestExhibition() {
    return this.exhibitionService.getLatestExhibition();
  }

  @ApiOperation({
    summary: 'Get stand details by ID',
    description:
      'Fetches details of a specific stand including category, hall, exhibition, and pricing.',
  })
  @ApiParam({
    name: 'standId',
    type: String,
    required: true,
    description: 'The unique ID of the stand',
  })
  @ApiResponse({
    status: 200,
    type: ResponseStandDetailDto,
    description: 'Stand details fetched successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Get('stand/:standId')
  getStand(@Param('standId') standId: string) {
    return this.exhibitionService.getStand(standId);
  }
}
