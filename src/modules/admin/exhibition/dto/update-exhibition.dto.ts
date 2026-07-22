import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateExhibitionDto } from './create-exhibition.dto';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateExhibitionDto extends PartialType(CreateExhibitionDto) {}

export class UpdateLatestExhibitionDto {
  @ApiPropertyOptional({ example: 'Industry Expo 2027', description: 'Event Name' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: '2027-01-06T00:00:00.000Z', description: 'Event Date' })
  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @ApiPropertyOptional({ example: 'Europe/London (GMT+1)', description: 'Venue/Location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: '2026-12-06T00:00:00.000Z', description: 'Booking Deadline' })
  @IsOptional()
  @IsDateString()
  bookingEndedAt?: string;
}
