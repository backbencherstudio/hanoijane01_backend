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
    description: 'Search string alias for q',
    example: 'John',
  })
  search?: string;

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
    description: 'Status filter (1 / active, 0 / inactive, 2 / banned)',
    example: '1',
  })
  status?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Approval filter status ("approved" or null)',
    example: 'approved',
  })
  approved?: string;

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
