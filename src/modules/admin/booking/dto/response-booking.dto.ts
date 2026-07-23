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

  @ApiProperty({ example: '101' })
  standNumber: string | null;
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

export class AdminBookingDetailDataDto {
  @ApiProperty({ example: 'clx1booking...' })
  id: string;

  @ApiProperty({ example: 'booked', enum: ['booked', 'pending', 'canceled'] })
  bookingType: string;

  @ApiProperty({ example: '08' })
  standNumber: string | null;

  @ApiProperty({ example: 'Goff Complex' })
  hall: string | null;

  @ApiProperty({ example: 'Premium' })
  category: string | null;

  @ApiProperty({ example: 3000 })
  price: number;

  @ApiProperty({ example: 'ITBA EXPO The NEXT 100' })
  event: string | null;

  @ApiProperty({ example: 'Acme Corp Inc.' })
  exhibitor: string | null;

  @ApiProperty({ example: 'Jacob Jones' })
  contactName: string | null;

  @ApiProperty({ example: 'jacod@gmail.com' })
  email: string | null;

  @ApiProperty({ example: '2026-03-16T00:00:00.000Z' })
  bookingDate: Date;

  @ApiProperty({
    example: 'paid',
    description: 'paid | unpaid | failed | refunded',
  })
  paymentStatus: string;

  @ApiProperty({ example: 3000 })
  subTotalAmount: number;

  @ApiProperty({ example: 0 })
  discountAmount: number;

  @ApiProperty({ example: 450 })
  vatAmount: number;

  @ApiProperty({ example: 15.0 })
  vatPercentage: number;

  @ApiProperty({ example: 3450 })
  totalAmount: number;

  @ApiProperty({ example: true })
  termsAndConditionsAccepted: boolean;

  @ApiProperty({ example: 'Acme Corp Ltd', nullable: true })
  onBehalfOf: string | null;

  @ApiProperty({ example: 'CEO', nullable: true })
  title: string | null;

  @ApiProperty({ example: 'signatures/sig_123.png', nullable: true })
  signaturePath: string | null;
}

export class AdminBookingDetailResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Booking details fetched successfully' })
  message: string;

  @ApiProperty({ type: AdminBookingDetailDataDto })
  data: AdminBookingDetailDataDto;
}

export class AdminBookingHistoryItemDto {
  @ApiProperty({ example: 'clx1booking...' })
  id: string;

  @ApiProperty({ example: '01' })
  standNumber: string | null;

  @ApiProperty({ example: 'Standard' })
  standCategory: string | null;

  @ApiProperty({ example: 'Goff Complex' })
  hall: string | null;

  @ApiProperty({ example: 'Acme Corp Inc.' })
  exhibitor: string | null;

  @ApiProperty({ example: 1750 })
  pricePerDay: number;

  @ApiProperty({ example: 'booked', enum: ['booked', 'pending', 'canceled'] })
  status: string;

  @ApiProperty({ example: '2026-06-20T00:00:00.000Z' })
  bookingDate: Date;
}

export class AdminBookingPaginationMetaDto {
  @ApiProperty({ example: 473 })
  totalItems: number;

  @ApiProperty({ example: 8 })
  itemCount: number;

  @ApiProperty({ example: 8 })
  itemsPerPage: number;

  @ApiProperty({ example: 60 })
  totalPages: number;

  @ApiProperty({ example: 3 })
  currentPage: number;
}

export class AdminBookingListResponseDataDto {
  @ApiProperty({ type: [AdminBookingHistoryItemDto] })
  items: AdminBookingHistoryItemDto[];

  @ApiProperty({ type: AdminBookingPaginationMetaDto })
  meta: AdminBookingPaginationMetaDto;
}

export class AdminBookingListPaginatedResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Bookings fetched successfully' })
  message: string;

  @ApiProperty({ type: AdminBookingListResponseDataDto })
  data: AdminBookingListResponseDataDto;
}

export class AdminBookingStatsDataDto {
  @ApiProperty({ example: 20 })
  availableStands: number;

  @ApiProperty({ example: 40 })
  bookedStands: number;

  @ApiProperty({ example: 5 })
  canceledStands: number;
}

export class AdminBookingStatsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Booking stats retrieved successfully' })
  message: string;

  @ApiProperty({ type: AdminBookingStatsDataDto })
  data: AdminBookingStatsDataDto;
}
