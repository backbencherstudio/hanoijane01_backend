import { ApiProperty } from '@nestjs/swagger';

export class AdminStandDto {
  @ApiProperty({ example: 'clx1stand...' })
  id: string;

  @ApiProperty({ example: 'Stand 101' })
  title: string | null;

  @ApiProperty({ example: 101 })
  standNumber: number | null;

  @ApiProperty({ example: 'stand-101' })
  slug: string;

  @ApiProperty({ example: 1, description: '1 = available, 0 = booked' })
  isAvailable: number;
}

export class AdminStandCategoryDto {
  @ApiProperty({ example: 'clx1cat...' })
  id: string;

  @ApiProperty({ example: 'Gold Category' })
  title: string | null;

  @ApiProperty({ example: 'gold-category' })
  slug: string;

  @ApiProperty({ example: '3m x 3m' })
  size: string | null;

  @ApiProperty({ example: 500.0 })
  price: number;

  @ApiProperty({ example: 50000 })
  priceInMinorUnit: number;

  @ApiProperty({ example: 15.0 })
  vatPercentage: number;

  @ApiProperty({ type: [AdminStandDto] })
  stands: AdminStandDto[];
}

export class AdminHallDto {
  @ApiProperty({ example: 'clx1hall...' })
  id: string;

  @ApiProperty({ example: 'Main Exhibition Hall A' })
  title: string | null;

  @ApiProperty({ type: [AdminStandCategoryDto] })
  standCategories: AdminStandCategoryDto[];
}

export class AdminExhibitionDto {
  @ApiProperty({ example: 'clx1exhibition...' })
  id: string;

  @ApiProperty({ example: 'Annual Tech Expo 2026' })
  title: string | null;

  @ApiProperty({ example: 'The largest electronics and technology fair' })
  description: string | null;

  @ApiProperty({ example: 'annual-tech-expo-2026' })
  slug: string | null;

  @ApiProperty({ example: 'Dhaka International Convention Center' })
  location: string | null;

  @ApiProperty({ example: '2026-07-20T00:00:00.000Z' })
  startedAt: Date | null;

  @ApiProperty({ example: '2026-07-25T00:00:00.000Z' })
  endedAt: Date | null;

  @ApiProperty({ type: [AdminHallDto] })
  halls: AdminHallDto[];
}

export class AdminExhibitionListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [AdminExhibitionDto] })
  data: AdminExhibitionDto[];
}

export class AdminExhibitionDetailResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: AdminExhibitionDto })
  data: AdminExhibitionDto;
}
