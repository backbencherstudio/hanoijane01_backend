import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryExhibitionDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Keyword to search exhibitions',
    example: 'Tech',
  })
  q?: string;
}
