import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryUserDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      'Search string to filter users by name or email (case-insensitive partial match)',
    example: 'John',
  })
  q?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Role/Type filter (e.g. "user", "admin", "vendor")',
    example: 'user',
  })
  type?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Approval filter status ("approved" or null)',
    example: 'approved',
  })
  approved?: string;
}
