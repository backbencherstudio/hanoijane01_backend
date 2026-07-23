import { ApiProperty } from '@nestjs/swagger';

export class HallStatsDataDto {
  @ApiProperty({ example: 'clx1hall...' })
  id: string;

  @ApiProperty({ example: 'Goff Complex' })
  title: string;

  @ApiProperty({ example: 19 })
  totalStands: number;

  @ApiProperty({ example: 5 })
  bookedStands: number;

  @ApiProperty({ example: 14 })
  availableStands: number;
}

export class HallStatsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Stand stats retrieved successfully' })
  message: string;

  @ApiProperty({ type: [HallStatsDataDto] })
  data: HallStatsDataDto[];
}

export class StandBookedByDto {
  @ApiProperty({ example: 'John Doe', nullable: true })
  name: string | null;

  @ApiProperty({ example: 'john@example.com', nullable: true })
  email: string | null;

  @ApiProperty({ example: 'Acme Corp Inc.', nullable: true })
  companyName: string | null;

  @ApiProperty({
    example: 1,
    description: 'User status (1 = Active, 0 = Inactive, 2 = Banned)',
    nullable: true,
  })
  status: number | null;

  @ApiProperty({
    example: 'Active',
    description: 'User status text representation',
    nullable: true,
  })
  statusText: string | null;
}

export class StandListItemDto {
  @ApiProperty({ example: 'clx1stand...' })
  id: string;

  @ApiProperty({ example: '01' })
  standNumber: string | null;

  @ApiProperty({ example: 'Stand 01' })
  title: string | null;

  @ApiProperty({ example: 'Goff Complex' })
  hall: string | null;

  @ApiProperty({ example: 'Standard' })
  category: string | null;

  @ApiProperty({ example: '3m x 2m' })
  size: string | null;

  @ApiProperty({ example: 1750 })
  price: number;

  @ApiProperty({ example: 'available', enum: ['available', 'booked'] })
  status: string;

  @ApiProperty({ example: 'BK-1042', nullable: true })
  bookingId: string | null;

  @ApiProperty({ type: StandBookedByDto, nullable: true })
  bookedBy: StandBookedByDto | null;
}

export class StandPaginationMetaDto {
  @ApiProperty({ example: 100 })
  totalItems: number;

  @ApiProperty({ example: 10 })
  itemCount: number;

  @ApiProperty({ example: 10 })
  itemsPerPage: number;

  @ApiProperty({ example: 10 })
  totalPages: number;

  @ApiProperty({ example: 1 })
  currentPage: number;
}

export class StandListResponseDataDto {
  @ApiProperty({ type: [StandListItemDto] })
  items: StandListItemDto[];

  @ApiProperty({ type: StandPaginationMetaDto })
  meta: StandPaginationMetaDto;
}

export class StandListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Stands list retrieved successfully' })
  message: string;

  @ApiProperty({ type: StandListResponseDataDto })
  data: StandListResponseDataDto;
}
