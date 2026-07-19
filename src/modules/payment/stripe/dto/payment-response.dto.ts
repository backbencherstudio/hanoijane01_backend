import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutSessionDataDto {
  @ApiProperty({ example: 'cs_test_a1b2c3...' })
  sessionId: string;

  @ApiProperty({ example: 'https://checkout.stripe.com/c/pay/cs_test_a1b2c3...' })
  checkoutUrl: string;

  @ApiProperty({ example: 'clx1booking...' })
  bookingId: string;

  @ApiProperty({ example: 150.0 })
  amount: number;

  @ApiProperty({ example: 'usd' })
  currency: string;
}

export class CheckoutSessionResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: CheckoutSessionDataDto })
  data: CheckoutSessionDataDto;
}

export class PaymentIntentDataDto {
  @ApiProperty({ example: 'pi_3M2w1k...' })
  paymentIntentId: string;

  @ApiProperty({ example: 'pi_3M2w1k_secret_abc123...' })
  clientSecret: string;

  @ApiProperty({ example: 'clx1booking...' })
  bookingId: string;

  @ApiProperty({ example: 150.0 })
  amount: number;

  @ApiProperty({ example: 'usd' })
  currency: string;
}

export class PaymentIntentResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: PaymentIntentDataDto })
  data: PaymentIntentDataDto;
}
