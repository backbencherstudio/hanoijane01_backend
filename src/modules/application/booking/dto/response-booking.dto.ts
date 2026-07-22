import { ApiProperty } from '@nestjs/swagger';

export class AppBookingItemDto {
  @ApiProperty({ example: 'clx1booking...' })
  id: string;

  @ApiProperty({ example: 575.0 })
  totalAmount: number;

  @ApiProperty({ example: 1, description: '1 = booked, 0 = pending' })
  status: number;

  @ApiProperty({ example: '2026-07-20T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: 'clx1stand...' })
  standId: string;

  @ApiProperty({ example: 'Gold Category' })
  category: string;

  @ApiProperty({ example: '3m x 3m' })
  size: string;

  @ApiProperty({ example: 'Main Hall A' })
  hall: string;

  @ApiProperty({ example: 'Annual Tech Expo 2026' })
  exhibitionTitle: string;

  @ApiProperty({ example: 'Dhaka Convention Center' })
  exhibitionLocation: string;

  @ApiProperty({ example: '2026-07-20T00:00:00.000Z' })
  exhibitionStartedAt: Date;
}

export class AppBookingMetaDataDto {
  @ApiProperty({ example: 10 })
  totalBookings: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}

export class AppBookingListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Bookings retrieved successfully' })
  message: string;

  @ApiProperty({ type: [AppBookingItemDto] })
  data: AppBookingItemDto[];

  @ApiProperty({ type: AppBookingMetaDataDto })
  meta_data: AppBookingMetaDataDto;
}

export class AppBookingCreatedDataDto {
  @ApiProperty({ example: 'clx1booking...' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  userName: string | null;

  @ApiProperty({ example: 'Acme Corp' })
  companyName: string | null;

  @ApiProperty({ example: 'john@example.com' })
  email: string | null;

  @ApiProperty({ example: 500.0 })
  subTotalAmount: number;

  @ApiProperty({ example: 75.0 })
  vatAmount: number;

  @ApiProperty({ example: 15.0 })
  vatPercentage: number;

  @ApiProperty({ example: 575.0 })
  totalAmount: number;

  @ApiProperty({ example: 'unpaid' })
  paymentStatus: string;

  @ApiProperty({ example: 'stripe' })
  paymentMethod: string;

  @ApiProperty({ example: 0 })
  status: number;
}

export class AppBookingCreateResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Booking created successfully' })
  message: string;

  @ApiProperty({ type: AppBookingCreatedDataDto })
  data: AppBookingCreatedDataDto;
}
