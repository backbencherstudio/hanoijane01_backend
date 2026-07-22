import { Controller, Get, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { NotificationService } from './notification.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../../common/guard/role/role.enum';
import { Roles } from '../../common/guard/role/roles.decorator';
import { RolesGuard } from '../../common/guard/role/roles.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Request } from 'express';
import {
  NotificationActionResponse,
  NotificationListResponse,
} from './dto/response-notification.dto';

@ApiBearerAuth()
@ApiTags('Notification')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation({
    summary: 'Get all notifications',
    description:
      'Fetches all notifications stored in the database. Returns user-specific notifications and system-wide notifications for admins.',
  })
  @ApiResponse({
    status: 200,
    type: NotificationListResponse,
    description: 'List of all notifications',
  })
  @Get()
  async findAll(@Req() req: Request) {
    const user_id = req.user.id;
    return this.notificationService.findAll(user_id);
  }

  @ApiOperation({
    summary: 'Delete a notification by id',
    description: 'Deletes a specific notification identified by its ID.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'The unique ID of the notification record to delete.',
  })
  @ApiResponse({
    status: 200,
    type: NotificationActionResponse,
    description: 'Notification deleted successfully',
  })
  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user_id = req.user.id;
    return this.notificationService.remove(id, user_id);
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
