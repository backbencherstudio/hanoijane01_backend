import { ApiProperty } from '@nestjs/swagger';

export class PaymentTransactionDto {
  @ApiProperty({ example: 'clx1abc...', description: 'Transaction ID' })
  id: string;

  @ApiProperty({
    example: 'pi_3M2w1kL...',
    description: 'Payment reference number / ID from gateway',
  })
  referenceNumber: string;

  @ApiProperty({
    example: 'succeeded',
    description: 'succeeded | failed | pending | canceled',
  })
  status: string;

  @ApiProperty({ example: 'stripe', description: 'Payment provider name' })
  provider: string;

  @ApiProperty({ example: 49.99, description: 'Requested transaction amount' })
  amount: number;

  @ApiProperty({ example: 'usd', description: 'Requested currency' })
  currency: string;

  @ApiProperty({
    example: 49.99,
    description: 'Actually paid amount',
    nullable: true,
  })
  paidAmount: number | null;

  @ApiProperty({ example: 'usd', description: 'Paid currency', nullable: true })
  paidCurrency: string | null;

  @ApiProperty({ example: '2026-07-18T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-18T00:00:00.000Z' })
  updatedAt: Date;
}

export class PaymentTransactionListResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [PaymentTransactionDto] })
  data: PaymentTransactionDto[];
}

export class PaymentTransactionDetailResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: PaymentTransactionDto })
  data: PaymentTransactionDto;
}

export class PaymentTransactionActionResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;
}
