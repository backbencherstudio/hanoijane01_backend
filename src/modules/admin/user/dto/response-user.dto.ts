import { ApiProperty } from '@nestjs/swagger';

export class AdminUserDto {
  @ApiProperty({ example: 'clx1abc...', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: '+1 234 567 8900', nullable: true })
  phoneNumber: string | null;

  @ApiProperty({ example: '123 Business Rd, NY', nullable: true })
  companyAddress: string | null;

  @ApiProperty({ example: 'vendor', description: 'user | admin | vendor' })
  type: string;

  @ApiProperty({ example: '2026-07-18T00:00:00.000Z', nullable: true })
  approvedAt: Date | null;

  @ApiProperty({ example: '2026-07-18T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-18T00:00:00.000Z' })
  updatedAt: Date;
}

export class AdminUserDetailDto extends AdminUserDto {
  @ApiProperty({ example: 'avatar_img.png', nullable: true })
  avatar: string | null;

  @ApiProperty({
    example: 'http://localhost:4000/storage/avatar_img.png',
    nullable: true,
  })
  avatar_url?: string;

  @ApiProperty({ example: 'cus_abc123...', nullable: true })
  billingId: string | null;
}

export class AdminUserListResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [AdminUserDto] })
  data: AdminUserDto[];
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
