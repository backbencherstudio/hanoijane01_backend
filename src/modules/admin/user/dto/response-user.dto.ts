import { ApiProperty } from '@nestjs/swagger';

export class AdminUserDto {
  @ApiProperty({ example: 'clx1abc...', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string | null;

  @ApiProperty({ example: 'john@example.com' })
  email: string | null;

  @ApiProperty({ example: '+1 234 567 8900', nullable: true })
  phoneNumber: string | null;

  @ApiProperty({ example: '123 Business Rd, NY', nullable: true })
  companyAddress: string | null;

  @ApiProperty({ example: 'user', description: 'user | admin | vendor' })
  type: string | null;

  @ApiProperty({
    example: 1,
    description: '1 = Active, 0 = Inactive, 2 = Banned',
  })
  status: number | null;

  @ApiProperty({ example: 'Active', description: 'Active | Inactive | Banned' })
  statusText: string;

  @ApiProperty({ example: 'avatar_img.png', nullable: true })
  avatar: string | null;

  @ApiProperty({
    example: 'http://localhost:4000/storage/avatar_img.png',
    nullable: true,
  })
  avatar_url?: string;

  @ApiProperty({ example: '2026-07-18T00:00:00.000Z', nullable: true })
  approvedAt: Date | null;

  @ApiProperty({ example: '2026-06-20T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-18T00:00:00.000Z' })
  updatedAt: Date;
}

export class AdminUserDetailDto extends AdminUserDto {
  @ApiProperty({ example: 'cus_abc123...', nullable: true })
  billingId: string | null;
}

export class AdminUserMetaDataDto {
  @ApiProperty({ example: 473 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 8 })
  limit: number;

  @ApiProperty({ example: 60 })
  totalPages: number;
}

export class AdminUserListResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [AdminUserDto] })
  data: AdminUserDto[];

  @ApiProperty({ type: AdminUserMetaDataDto })
  meta_data: AdminUserMetaDataDto;
}

export class AdminUserDetailResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: AdminUserDetailDto })
  data: AdminUserDetailDto;
}

export class AdminUserActionResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;
}

export class AdminUserStatsDataDto {
  @ApiProperty({ example: 5, description: 'Total count of users' })
  totalUser: number;

  @ApiProperty({
    example: 2,
    description: 'Count of active users (status = 1)',
  })
  activeUser: number;

  @ApiProperty({
    example: 2,
    description: 'Count of inactive users (status = 0)',
  })
  inactiveUser: number;

  @ApiProperty({
    example: 1,
    description: 'Count of banned users (status = 2)',
  })
  bannedUser: number;
}

export class AdminUserStatsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'User stats retrieved successfully' })
  message: string;

  @ApiProperty({ type: AdminUserStatsDataDto })
  data: AdminUserStatsDataDto;
}
