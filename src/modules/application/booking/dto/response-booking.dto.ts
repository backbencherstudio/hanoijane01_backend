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

export class AppBookingCreateResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Booking created successfully' })
  message: string;

  @ApiProperty({
    example: {
      id: 'clx1booking...',
      totalAmount: 575.0,
      paymentStatus: 'unpaid',
      paymentMethod: 'stripe',
    },
  })
  data: any;
}
