import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class QueryAdminTransactionDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      'Filter transactions by status (succeeded | failed | pending | canceled)',
    example: 'succeeded',
  })
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
  })
  limit?: number = 10;
}
