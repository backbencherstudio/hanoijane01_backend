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
  ResponseStandDetailDto,
} from './dto/response-exhibition.dto';

@ApiTags('Application / Exhibition')
@Controller('exhibition')
export class ExhibitionController {
  constructor(private readonly exhibitionService: ExhibitionService) {}

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
  @UseGuards(AuthGuard)
  @Get('stand/:standId')
  getStand(@Param('standId') standId: string) {
    return this.exhibitionService.getStand(standId);
  }
}
