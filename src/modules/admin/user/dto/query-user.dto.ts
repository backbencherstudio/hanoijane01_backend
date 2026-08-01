import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum UserStatus {
  ACTIVE = 1,
  INACTIVE = 0,
  BANNED = -1,
}

export enum ApprovalStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
}

export class QueryUserDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      'Search string to filter users by name or email (case-insensitive partial match)',
    example: 'John',
  })
  search?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Role/Type filter (e.g. "user", "admin")',
    example: 'user',
  })
  type?: string;

  @IsOptional()
  @ApiPropertyOptional({
    enum: ['ALL', 'ACTIVE', 'INACTIVE', 'BANNED'],
    example: 'ALL',
  })
  @Transform(({ value }) => UserStatus[value?.toUpperCase()] ?? undefined)
  @IsEnum(UserStatus)
  status?: UserStatus;

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
    example: 10,
    default: 10,
  })
  limit?: number;
}
