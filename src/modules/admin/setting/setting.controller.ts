import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SettingService } from './setting.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { AdminSettingResponseDto } from './dto/response-setting.dto';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { Role } from '../../../common/guard/role/role.enum';
import { Session, UserSession } from '../../auth/decorators/session.decorator';

@ApiBearerAuth()
@ApiTags('Admin / Setting')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/setting')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @ApiOperation({
    summary: 'Get notification settings (Admin)',
    description:
      'Retrieves the current notification settings for the authenticated admin user.',
  })
  @ApiResponse({
    status: 200,
    type: AdminSettingResponseDto,
    description: 'Notification settings retrieved successfully',
  })
  @Get()
  async getSettings(@Session() session: UserSession) {
    return this.settingService.getSettings(session.user.id);
  }

  @ApiOperation({
    summary: 'Update notification settings (Admin)',
    description:
      'Updates the notification setting (`notification: boolean`). Default is true. When set to false, notification emails and socket events will be disabled for this user, but database entries will still be recorded.',
  })
  @ApiResponse({
    status: 200,
    type: AdminSettingResponseDto,
    description: 'Notification settings updated successfully',
  })
  @Patch()
  async updateSettings(
    @Session() session: UserSession,
    @Body() updateDto: UpdateSettingDto,
  ) {
    return this.settingService.updateSettings(session.user.id, updateDto);
  }
}
