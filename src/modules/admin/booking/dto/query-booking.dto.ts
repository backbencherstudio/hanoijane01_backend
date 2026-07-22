import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryBookingDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      'Search keyword to filter bookings by user name, email, or company name',
    example: 'Acme',
  })
  q?: string;
}
