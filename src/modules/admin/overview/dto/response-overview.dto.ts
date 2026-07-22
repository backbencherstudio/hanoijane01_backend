import { ApiProperty } from '@nestjs/swagger';

export class OverviewStatsDataDto {
  @ApiProperty({
    example: 100,
    description: 'Total count of stands in the system',
  })
  totalStands: number;

  @ApiProperty({ example: 40, description: 'Total count of booked stands' })
  bookedStands: number;

  @ApiProperty({ example: 60, description: 'Total count of available stands' })
  availableStands: number;

  @ApiProperty({
    example: 15000.5,
    description: 'Total revenue accumulated from paid bookings',
  })
  totalRevenue: number;
}

export class OverviewStatsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Overview stats retrieved successfully' })
  message: string;

  @ApiProperty({ type: OverviewStatsDataDto })
  data: OverviewStatsDataDto;
}

export class StandVsHallChartItemDto {
  @ApiProperty({ example: 'clx1hall...', description: 'Hall ID' })
  hallId: string;

  @ApiProperty({ example: 'Goffs Complex', description: 'Hall Title' })
  hallTitle: string;

  @ApiProperty({ example: 120, description: 'Total stands in this hall' })
  totalStands: number;

  @ApiProperty({
    example: 120,
    description: 'Total seats (alias for totalStands)',
  })
  totalSeats: number;

  @ApiProperty({ example: 60, description: 'Booked stands in this hall' })
  bookedStands: number;

  @ApiProperty({
    example: 60,
    description: 'Booked stands (alias for bookedStands)',
  })
  booked: number;

  @ApiProperty({ example: 60, description: 'Available stands in this hall' })
  availableStands: number;

  @ApiProperty({
    example: 60,
    description: 'Available stands (alias for availableStands)',
  })
  available: number;
}

export class StandVsHallChartResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Stand vs Hall chart data retrieved successfully' })
  message: string;

  @ApiProperty({ type: [StandVsHallChartItemDto] })
  data: StandVsHallChartItemDto[];
}
