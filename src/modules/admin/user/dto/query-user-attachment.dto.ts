import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryUserAttachmentDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      'Search string to filter by exhibitor name, email, company name, file name, or file type',
    example: 'Acme',
  })
  search?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Filter by specific user ID',
    example: 'user_123',
  })
  userId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Filter by document / file type (e.g. Trade Licence)',
    example: 'Trade Licence',
  })
  fileType?: string;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  page?: number;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 8,
    default: 8,
  })
  limit?: number;
}
