import { ApiProperty } from '@nestjs/swagger';

export class AppTransactionItemDto {
  @ApiProperty({ example: 'clx1tx...' })
  id: string;

  @ApiProperty({
    example: 'succeeded',
    description: 'succeeded | pending | failed',
  })
  status: string;

  @ApiProperty({ example: 575.0 })
  amount: number;

  @ApiProperty({ example: 575.0, nullable: true })
  paidAmount: number | null;

  @ApiProperty({ example: 'pi_3M2w1kL...' })
  referenceNumber: string;

  @ApiProperty({ example: 'clx1booking...' })
  bookingId: string;

  @ApiProperty({ example: '2026-07-20T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: 'clx1stand...', nullable: true })
  standId?: string | null;

  @ApiProperty({ example: 'Stand 101', nullable: true })
  standTitle?: string | null;

  @ApiProperty({ example: 101, nullable: true })
  standNumber?: number | null;

  @ApiProperty({ example: 'stand-101', nullable: true })
  standSlug?: string | null;
}

export class ResponseTransactionListDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Transactions fetched successfully' })
  message: string;

  @ApiProperty({ type: [AppTransactionItemDto] })
  data: AppTransactionItemDto[];
}
