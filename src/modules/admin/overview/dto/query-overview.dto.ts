import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryOverviewDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      'Optional exhibition ID to filter stats for a specific exhibition',
    example: 'clx1abc...',
  })
  exhibitionId?: string;
}
