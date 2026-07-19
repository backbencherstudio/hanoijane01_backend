import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ExhibitionService } from './exhibition.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { Role } from '../../../common/guard/role/role.enum';

@ApiTags('Admin / Exhibition')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/exhibition')
export class ExhibitionController {
  constructor(private readonly exhibitionService: ExhibitionService) {}

  @ApiOperation({
    summary: 'Get all exhibitions (Admin)',
    description: 'Retrieves a list of all exhibitions with nested halls, categories, and stands.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of exhibitions retrieved successfully',
  })
  @Get()
  findAll() {
    return this.exhibitionService.findAll();
  }

  @ApiOperation({
    summary: 'Get exhibition by ID (Admin)',
    description: 'Retrieves detailed information of a specific exhibition.',
  })
  @ApiParam({ name: 'id', description: 'The unique ID of the exhibition' })
  @ApiResponse({
    status: 200,
    description: 'Exhibition details retrieved successfully',
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exhibitionService.findOne(id);
  }
}
