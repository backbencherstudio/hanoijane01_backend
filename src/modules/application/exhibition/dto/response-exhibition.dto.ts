import { ApiProperty } from '@nestjs/swagger';

export class AppStandCategoryDto {
  @ApiProperty({ example: 'Gold Category' })
  title: string;

  @ApiProperty({ example: 'gold-category' })
  slug: string;

  @ApiProperty({ example: '3m x 3m' })
  size: string;

  @ApiProperty({ example: 500.0 })
  price: number;

  @ApiProperty({ example: 15.0 })
  vatPercentage: number;

  @ApiProperty({ example: 575.0 })
  totalPrice: number;

  @ApiProperty({ example: 10 })
  totalStands: number;
}

export class AppHallDto {
  @ApiProperty({ example: 'Main Exhibition Hall A' })
  title: string;

  @ApiProperty({ example: 30 })
  totalStands: number;

  @ApiProperty({ type: [AppStandCategoryDto] })
  standCategories: AppStandCategoryDto[];
}

export class AppStandItemDto {
  @ApiProperty({ example: 'clx1stand...' })
  id: string;

  @ApiProperty({ example: 'Stand 101' })
  title: string;

  @ApiProperty({ example: 101 })
  standNumber: number;

  @ApiProperty({ example: 'stand-101' })
  slug: string;

  @ApiProperty({ example: 1, description: '1 = available, 0 = booked' })
  isAvailable: number;

  @ApiProperty({ example: '3m x 3m' })
  size: string;

  @ApiProperty({ example: 500.0 })
  price: number;

  @ApiProperty({ example: 15.0 })
  vatPercentage: number;

  @ApiProperty({ example: 575.0 })
  totalPrice: number;
}

export class AppExhibitionDataDto {
  @ApiProperty({ example: 'clx1exhibition...' })
  id: string;

  @ApiProperty({ example: 'Annual Tech Expo 2026' })
  title: string;

  @ApiProperty({ example: 'The largest technology exhibition' })
  description: string;

  @ApiProperty({ example: 'annual-tech-expo-2026' })
  slug: string;

  @ApiProperty({ example: 'Dhaka Convention Center' })
  location: string;

  @ApiProperty({ example: '2026-07-20T00:00:00.000Z' })
  startedAt: Date;

  @ApiProperty({ example: '2026-07-25T00:00:00.000Z' })
  endedAt: Date;

  @ApiProperty({ type: [AppHallDto] })
  halls: AppHallDto[];

  @ApiProperty({ type: [AppStandItemDto] })
  stands: AppStandItemDto[];
}

export class ResponseLatestExhibitionDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Exhibition fetched successfully' })
  message: string;

  @ApiProperty({ type: AppExhibitionDataDto })
  data: AppExhibitionDataDto;
}

export class ResponseStandDetailDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: AppStandItemDto })
  data: AppStandItemDto;
}
