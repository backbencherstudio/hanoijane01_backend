import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetBookingStatsQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Filter stats by Exhibition ID',
    example: 'clx1exhibition...',
  })
  exhibitionId?: string;
}

export class GetBookingsQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Search keyword to filter bookings by exhibitor name, email, company, or stand number',
    example: 'Acme',
  })
  search?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Filter bookings by status: booked, pending, or canceled',
    example: 'booked',
    enum: ['booked', 'pending', 'canceled'],
  })
  status?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Filter bookings by Exhibition ID',
    example: 'clx1exhibition...',
  })
  exhibitionId?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ description: 'Page number', default: 1, example: 1 })
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ description: 'Items per page', default: 10, example: 10 })
  limit?: number = 10;
}
