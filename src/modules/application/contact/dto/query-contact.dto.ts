import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryContactDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Filter contact messages by search keyword',
    example: 'inquiry',
  })
  q?: string;
}
