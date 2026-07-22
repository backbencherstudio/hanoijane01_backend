import { ApiProperty } from '@nestjs/swagger';

export class CheckoutSessionData {
  @ApiProperty({
    example: 'cs_test_a1b2c3d4...',
    description: 'Stripe Checkout Session ID',
  })
  sessionId: string;

  @ApiProperty({
    example: 'https://checkout.stripe.com/c/pay/cs_test_a1b2c3d4...',
    description: 'Hosted Stripe Checkout URL to redirect the client',
  })
  url: string;
}

export class CheckoutSessionResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: CheckoutSessionData })
  data: CheckoutSessionData;
}

export class PaymentIntentData {
  @ApiProperty({
    example: 'pi_3M2w1kL2eZvKYlo20d1a2b3c',
    description: 'Stripe PaymentIntent ID',
  })
  paymentIntentId: string;

  @ApiProperty({
    example: 'pi_3M2w1kL2eZvKYlo20d1a2b3c_secret_xyz123',
    description: 'Client secret for Stripe Elements on frontend',
  })
  clientSecret: string;
}

export class PaymentIntentResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: PaymentIntentData })
  data: PaymentIntentData;
}
