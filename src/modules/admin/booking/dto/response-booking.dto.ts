import { ApiProperty } from '@nestjs/swagger';

export class AdminBookingUserDto {
  @ApiProperty({ example: 'clx1user...' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string | null;

  @ApiProperty({ example: 'john@example.com' })
  email: string | null;

  @ApiProperty({ example: '+1234567890' })
  phoneNumber: string | null;

  @ApiProperty({ example: 'Acme Corp' })
  companyName: string | null;
}

export class AdminBookingStandDto {
  @ApiProperty({ example: 'clx1stand...' })
  id: string;

  @ApiProperty({ example: 'Stand 101' })
  title: string | null;

  @ApiProperty({ example: 101 })
  standNumber: number | null;

  @ApiProperty({ example: 'stand-101' })
  slug: string;
}

export class AdminBookingDto {
  @ApiProperty({ example: 'clx1booking...' })
  id: string;

  @ApiProperty({ example: 1, description: '1 = booked, 0 = not booked' })
  status: number;

  @ApiProperty({ example: 'John Doe' })
  userName: string | null;

  @ApiProperty({ example: 'Acme Corp' })
  companyName: string | null;

  @ApiProperty({ example: '123 Business Way' })
  companyAddress: string | null;

  @ApiProperty({ example: 'john@example.com' })
  email: string | null;

  @ApiProperty({ example: '+1234567890' })
  phoneNumber: string | null;

  @ApiProperty({ example: 500.0 })
  subTotalAmount: number;

  @ApiProperty({ example: 75.0 })
  vatAmount: number;

  @ApiProperty({ example: 15.0 })
  vatPercentage: number;

  @ApiProperty({ example: 575.0 })
  totalAmount: number;

  @ApiProperty({
    example: 'paid',
    description: 'paid | unpaid | failed | refunded',
  })
  paymentStatus: string | null;

  @ApiProperty({ example: 'stripe' })
  paymentMethod: string | null;

  @ApiProperty({ type: AdminBookingUserDto, nullable: true })
  user?: AdminBookingUserDto | null;

  @ApiProperty({ type: AdminBookingStandDto, nullable: true })
  stand?: AdminBookingStandDto | null;

  @ApiProperty({ example: '2026-07-20T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-20T00:00:00.000Z' })
  updatedAt: Date;
}

export class AdminBookingListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [AdminBookingDto] })
  data: AdminBookingDto[];
}

export class AdminBookingDetailResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: AdminBookingDto })
  data: AdminBookingDto;
}

export class AdminBookingActionResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;
}
