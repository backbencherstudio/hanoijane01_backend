import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class FindAllTransactionsQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    type: Number,
    required: false,
    default: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Limit per page',
    type: Number,
    required: false,
    default: 10,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit: number = 10;
}
