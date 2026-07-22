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
