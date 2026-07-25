import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateBookingCheckoutDto {
  @ApiProperty({
    example: 'clx1booking...',
    description: 'The unique ID of the unpaid booking record.',
  })
  @IsNotEmpty()
  @IsString()
  bookingId: string;

  @ApiPropertyOptional({
    example: 'http://localhost:3000/booking/success',
    description: 'Redirection URL upon successful payment.',
  })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiPropertyOptional({
    example: 'http://localhost:3000/booking/cancel',
    description: 'Redirection URL if payment is canceled.',
  })
  @IsOptional()
  @IsString()
  cancelUrl?: string;
}

export class CreatePaymentIntentDto {
  @ApiProperty({
    example: 'clx1booking...',
    description: 'The unique ID of the unpaid booking record.',
  })
  @IsNotEmpty()
  @IsString()
  bookingId: string;
}
