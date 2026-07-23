import { ApiProperty } from '@nestjs/swagger';

// ──────────────────────────────────────────────
// Stands nested inside each StandCategory
// ──────────────────────────────────────────────
export class AppCategoryStandDto {
  @ApiProperty({ example: 'clx1stand...' })
  id: string;

  @ApiProperty({ example: '12' })
  standNumber: string;

  @ApiProperty({ example: 'Stand 12' })
  title: string;
}

// ──────────────────────────────────────────────
// Stand Category (inside a Hall)
// ──────────────────────────────────────────────
export class AppStandCategoryDto {
  @ApiProperty({ example: 'Gold Category' })
  title: string;

  @ApiProperty({ example: 'gold-category' })
  slug: string;

  @ApiProperty({ example: '3m x 2m' })
  size: string;

  @ApiProperty({
    example: 500.0,
    description: 'Base price after VAT calculation',
  })
  price: number;

  @ApiProperty({ example: 15.0, description: 'VAT percentage (e.g. 15 = 15%)' })
  vatPercentage: number;

  @ApiProperty({ example: 575.0, description: 'Final price including VAT' })
  totalPrice: number;

  @ApiProperty({
    type: [AppCategoryStandDto],
    description: 'Stands belonging to this category',
  })
  stands: AppCategoryStandDto[];

  @ApiProperty({
    example: 10,
    description: 'Total number of stands in this category',
  })
  totalStands: number;
}

// ──────────────────────────────────────────────
// Hall (inside Exhibition)
// ──────────────────────────────────────────────
export class AppHallDto {
  @ApiProperty({ example: 'Main Exhibition Hall A' })
  title: string;

  @ApiProperty({
    example: 30,
    description: 'Total stands across all categories in this hall',
  })
  totalStands: number;

  @ApiProperty({ type: [AppStandCategoryDto] })
  standCategories: AppStandCategoryDto[];
}

// ──────────────────────────────────────────────
// Flat Stand (top-level stands list in exhibition)
// ──────────────────────────────────────────────
export class AppStandItemDto {
  @ApiProperty({ example: 'clx1stand...' })
  id: string;

  @ApiProperty({ example: 'Stand 12' })
  title: string;

  @ApiProperty({ example: '12' })
  standNumber: string;

  @ApiProperty({
    example: true,
    description: 'true = available, false = booked',
  })
  isAvailable: boolean;

  @ApiProperty({ example: '3m x 2m' })
  size: string;

  @ApiProperty({
    example: 500.0,
    description: 'Base price after VAT calculation',
  })
  price: number;

  @ApiProperty({ example: 15.0, description: 'VAT percentage' })
  vatPercentage: number;

  @ApiProperty({ example: 575.0, description: 'Final price including VAT' })
  totalPrice: number;

  @ApiProperty({ example: 'Gold Category' })
  categoryTitle: string;

  @ApiProperty({ example: 'gold-category' })
  categorySlug: string;
}

// ──────────────────────────────────────────────
// Exhibition (main data object)
// ──────────────────────────────────────────────
export class AppExhibitionDataDto {
  @ApiProperty({ example: 'clx1exhibition...' })
  id: string;

  @ApiProperty({ example: 'ITBA EXPO The NEXT 100' })
  title: string;

  @ApiProperty({ example: 'The premier industry exhibition event.' })
  description: string;

  @ApiProperty({ example: 'itba-expo-next-100' })
  slug: string;

  @ApiProperty({ example: 'Goffs, Naas, Co. Kildare' })
  location: string;

  @ApiProperty({ example: '2027-01-06T00:00:00.000Z' })
  startedAt: Date;

  @ApiProperty({ example: '2027-01-08T00:00:00.000Z' })
  endedAt: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  bookingStatedAt: Date;

  @ApiProperty({ example: '2026-12-06T00:00:00.000Z' })
  bookingEndedAt: Date;

  @ApiProperty({ type: [AppHallDto] })
  halls: AppHallDto[];

  @ApiProperty({ type: [AppStandItemDto] })
  stands: AppStandItemDto[];
}

// ──────────────────────────────────────────────
// Stand Detail Data (returned by getStand)
// ──────────────────────────────────────────────
export class AppStandDetailDataDto {
  @ApiProperty({ example: 'clx1stand...' })
  id: string;

  @ApiProperty({ example: '12' })
  standNumber: string;

  @ApiProperty({ example: 'Stand 12' })
  title: string;

  @ApiProperty({
    example: true,
    description: 'true = available, false = booked',
  })
  isAvailable: boolean;

  @ApiProperty({ example: 'Gold Category', nullable: true })
  category: string | null;

  @ApiProperty({ example: 500.0 })
  price: number;

  @ApiProperty({ example: 15.0 })
  vatPercentage: number;

  @ApiProperty({ example: 75.0 })
  vatAmount: number;

  @ApiProperty({ example: 575.0 })
  totalPrice: number;

  @ApiProperty({ example: '3m x 2m' })
  size: string;

  @ApiProperty({ example: 'Main Exhibition Hall A', nullable: true })
  hall: string | null;

  @ApiProperty({ example: 'ITBA EXPO The NEXT 100', nullable: true })
  exhibition: string | null;

  @ApiProperty({ example: 'Goffs, Naas, Co. Kildare', nullable: true })
  exhibitionLocation: string | null;

  @ApiProperty({ example: '2027-01-06T00:00:00.000Z', nullable: true })
  exhibitionStartedAt: Date | null;

  @ApiProperty({ example: '2027-01-08T00:00:00.000Z', nullable: true })
  exhibitionEndedAt: Date | null;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', nullable: true })
  exhibitionBookingStatedAt: Date | null;

  @ApiProperty({ example: '2026-12-06T00:00:00.000Z', nullable: true })
  exhibitionBookingEndedAt: Date | null;
}

// ──────────────────────────────────────────────
// Response wrappers
// ──────────────────────────────────────────────
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

  @ApiProperty({ type: AppStandDetailDataDto })
  data: AppStandDetailDataDto;
}
