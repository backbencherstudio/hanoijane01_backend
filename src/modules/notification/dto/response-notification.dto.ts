import { ApiProperty } from '@nestjs/swagger';

export class NotificationDto {
  @ApiProperty({ example: 'clx1abc...', description: 'Notification ID' })
  id: string;

  @ApiProperty({ example: 'System Event', nullable: true })
  type: string | null;

  @ApiProperty({ example: 'Your stand booking was confirmed!', nullable: true })
  text: string | null;

  @ApiProperty({ example: '2026-07-18T00:00:00.000Z', nullable: true })
  readAt: Date | null;

  @ApiProperty({ example: '2026-07-18T00:00:00.000Z' })
  createdAt: Date;
}

export class NotificationListResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [NotificationDto] })
  data: NotificationDto[];
}

export class NotificationActionResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;
}
