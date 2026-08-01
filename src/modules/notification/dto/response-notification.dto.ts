import { ApiProperty } from '@nestjs/swagger';

export class NotificationDto {
  @ApiProperty({ example: 'clx1abc...', description: 'Notification ID' })
  id: string;

  @ApiProperty({ example: 'Booking', nullable: true })
  title: string | null;

  @ApiProperty({
    example: 'Your stand booking was confirmed!',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ example: '2026-07-18T00:00:00.000Z', nullable: true })
  readAt: Date | null;

  @ApiProperty({ example: '2026-07-18T00:00:00.000Z' })
  createdAt: Date;
}

export class NotificationPaginationMetaDto {
  @ApiProperty({ example: 100 })
  totalItems: number;

  @ApiProperty({ example: 10 })
  unreadCount: number;

  @ApiProperty({ example: 10 })
  itemsPerPage: number;

  @ApiProperty({ example: 10 })
  totalPages: number;

  @ApiProperty({ example: 1 })
  currentPage: number;
}

export class NotificationListResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Notifications retrieved successfully' })
  message: string;

  @ApiProperty({ type: [NotificationDto] })
  data: NotificationDto[];

  @ApiProperty({ type: NotificationPaginationMetaDto })
  metaData: NotificationPaginationMetaDto;
}

export class NotificationActionResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;
}
