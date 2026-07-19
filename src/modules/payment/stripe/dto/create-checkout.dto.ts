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
    example: 'user@example.com',
    description:
      'Customer email address for Stripe receipt and notification. Optional if already on booking.',
  })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({
    example: 150.0,
    description:
      'Optional custom payment amount in dollars. Defaults to booking totalAmount if omitted.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  amount?: number;

  @ApiPropertyOptional({
    example: 'usd',
    description:
      'Currency code (e.g. "usd", "eur"). Defaults to booking currency or "usd".',
  })
  @IsOptional()
  @IsString()
  currency?: string;

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

export class CreatePaymentIntentDto extends CreateBookingCheckoutDto {}
