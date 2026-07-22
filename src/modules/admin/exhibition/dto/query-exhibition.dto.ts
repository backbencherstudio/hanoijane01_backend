import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryExhibitionDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Optional search keyword to filter exhibitions',
    example: 'Tech Expo',
  })
  q?: string;
}
