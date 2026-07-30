import {
  Controller,
  Get,
  Param,
  Delete,
  Patch,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Request } from 'express';
import {
  NotificationActionResponse,
  NotificationListResponse,
} from './dto/response-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';

@ApiBearerAuth()
@ApiTags('Notification')
@UseGuards(AuthGuard)
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation({
    summary: 'Get all notifications with pagination',
    description:
      'Fetches notifications stored in the database with search and pagination support. Returns user-specific notifications and system-wide notifications for admins.',
  })
  @ApiResponse({
    status: 200,
    type: NotificationListResponse,
    description: 'Paginated list of notifications',
  })
  @Get()
  async findAll(@Req() req: Request, @Query() query: QueryNotificationDto) {
    const user_id = req.user.id;
    return this.notificationService.findAll(user_id, query);
  }

  @ApiOperation({
    summary: 'Delete a notification by id',
    description: 'Deletes a specific notification identified by its ID.',
  })
  @ApiParam({
    name: 'notificationId',
    type: String,
    required: true,
    description: 'The unique ID of the notification record to delete.',
  })
  @ApiResponse({
    status: 200,
    type: NotificationActionResponse,
    description: 'Notification deleted successfully',
  })
  @Delete(':notificationId')
  async remove(
    @Req() req: Request,
    @Param('notificationId') notificationId: string,
  ) {
    const user_id = req.user.id;
    return this.notificationService.remove(notificationId, user_id);
  }

  @Patch(':notificationId/read')
  @ApiOperation({
    summary: 'Mark a notification as read by id',
    description: 'Updates the readAt timestamp of a specific notification.',
  })
  @ApiParam({
    name: 'notificationId',
    type: String,
    required: true,
    description: 'The unique ID of the notification record to mark as read.',
  })
  @ApiResponse({
    status: 200,
    type: NotificationActionResponse,
    description: 'Notification marked as read successfully',
  })
  async markAsRead(
    @Req() req: Request,
    @Param('notificationId') notificationId: string,
  ) {
    const user_id = req.user.id;
    return this.notificationService.markAsRead(notificationId, user_id);
  }

  @Patch('read')
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description:
      'Updates the readAt timestamp of all unread notifications assigned to the user.',
  })
  @ApiResponse({
    status: 200,
    type: NotificationActionResponse,
    description: 'All notifications marked as read successfully',
  })
  async markAllAsRead(@Req() req: Request) {
    const user_id = req.user.id;
    return this.notificationService.markAllAsRead(user_id);
  }

  @ApiOperation({
    summary: 'Delete all notifications',
    description:
      'Permanently deletes all notifications assigned to the user or system notifications from the database.',
  })
  @ApiResponse({
    status: 200,
    type: NotificationActionResponse,
    description: 'All notifications deleted successfully',
  })
  @Delete()
  async removeAll(@Req() req: Request) {
    const user_id = req.user.id;
    return this.notificationService.removeAll(user_id);
  }
}
