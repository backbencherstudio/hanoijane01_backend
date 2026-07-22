import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryStripeDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Filter Stripe sessions or intents by customer or stand ID',
    example: 'clx1stand...',
  })
  standId?: string;
}
