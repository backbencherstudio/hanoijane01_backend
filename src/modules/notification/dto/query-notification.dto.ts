import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryNotificationDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Filter notification list by keyword',
    example: 'booking',
  })
  q?: string;
}
