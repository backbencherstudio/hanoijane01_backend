import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RejectBookingDto {
  @ApiPropertyOptional({
    description: 'Optional reason for rejecting the booking',
    example: 'Payment not received within the deadline',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
