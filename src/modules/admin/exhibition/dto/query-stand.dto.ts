import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetExhibitionStatsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter stats by Exhibition ID',
    example: 'clx1exhibition...',
  })
  @IsOptional()
  @IsString()
  exhibitionId?: string;
}

export class GetStandsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter stands by Exhibition ID',
    example: 'clx1exhibition...',
  })
  @IsOptional()
  @IsString()
  exhibitionId?: string;

  @ApiPropertyOptional({
    description: 'Search keyword for stand number, stand title, or exhibitor details',
    example: 'BK-1042',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by Hall ID or Hall Title/Slug',
    example: 'Goff Complex',
  })
  @IsOptional()
  @IsString()
  hall?: string;

  @ApiPropertyOptional({
    description: 'Filter by Category ID, Title, or Slug',
    example: 'Standard',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by status: available or booked',
    example: 'available',
    enum: ['available', 'booked'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
