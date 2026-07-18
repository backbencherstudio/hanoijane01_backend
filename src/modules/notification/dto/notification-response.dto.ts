import { ApiProperty } from '@nestjs/swagger';

export class NotificationUserDto {
  @ApiProperty({ example: 'clx1abc...' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'avatar.png', nullable: true })
  avatar: string | null;

  @ApiProperty({ example: 'http://localhost:4000/storage/avatar.png', nullable: true })
  avatar_url?: string;
}

export class NotificationEventDto {
  @ApiProperty({ example: 'clx1event...' })
  id: string;

  @ApiProperty({ example: 'booking', description: 'message | comment | review | booking | payment_transaction | package | blog' })
  type: string;

  @ApiProperty({ example: 'You have a new booking' })
  text: string;
}

export class NotificationDto {
  @ApiProperty({ example: 'clx1notif...', description: 'Notification ID' })
  id: string;

  @ApiProperty({ example: 'clx1sender...', description: 'ID of the user who triggered the event', nullable: true })
  senderId: string | null;

  @ApiProperty({ example: 'clx1receiver...', description: 'ID of the user notified', nullable: true })
  receiverId: string | null;

  @ApiProperty({ example: 'clx1entity...', description: 'ID of the associated entity', nullable: true })
  entityId: string | null;

  @ApiProperty({ example: '2026-07-18T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ type: NotificationUserDto, nullable: true })
  sender: NotificationUserDto | null;

  @ApiProperty({ type: NotificationUserDto, nullable: true })
  receiver: NotificationUserDto | null;

  @ApiProperty({ type: NotificationEventDto })
  notificationEvent: NotificationEventDto;
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
