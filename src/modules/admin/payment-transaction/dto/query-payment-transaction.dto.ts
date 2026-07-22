import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryPaymentTransactionDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      'Filter transactions by status (succeeded | failed | pending | canceled)',
    example: 'succeeded',
  })
  status?: string;
}
