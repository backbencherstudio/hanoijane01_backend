import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateSettingDto } from './dto/update-setting.dto';

const NOTIFICATION_KEY = 'NOTIFICATION_ENABLED';

@Injectable()
export class SettingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create setting definition helper
   */
  private async getSettingDefinition() {
    return await this.prisma.setting.upsert({
      where: { key: NOTIFICATION_KEY },
      update: {},
      create: {
        key: NOTIFICATION_KEY,
        category: 'NOTIFICATION',
        label: 'Enable Notification Emails and Real-Time Sockets',
        description:
          'Controls whether push socket notifications and emails are sent to the user/admin. When false, notifications are only saved to the database.',
        defaultValue: 'true',
      },
    });
  }

  /**
   * Get notification settings for authenticated user
   */
  async getSettings(userId: string) {
    const settingDef = await this.getSettingDefinition();

    const userSetting = await this.prisma.userSetting.findFirst({
      where: {
        userId,
        settingId: settingDef.id,
      },
    });

    const enabled = userSetting ? userSetting.value !== 'false' : true;

    return {
      success: true,
      message: 'Notification settings retrieved successfully',
      data: {
        enabled,
      },
    };
  }

  /**
   * Update notification settings for authenticated user
   */
  async updateSettings(userId: string, updateDto: UpdateSettingDto) {
    const settingDef = await this.getSettingDefinition();
    const strValue = updateDto.enabled ? 'true' : 'false';

    const existingUserSetting = await this.prisma.userSetting.findFirst({
      where: {
        userId,
        settingId: settingDef.id,
      },
    });

    if (existingUserSetting) {
      await this.prisma.userSetting.update({
        where: { id: existingUserSetting.id },
        data: { value: strValue },
      });
    } else {
      await this.prisma.userSetting.create({
        data: {
          userId,
          settingId: settingDef.id,
          value: strValue,
        },
      });
    }

    return {
      success: true,
      message: 'Notification settings updated successfully',
      data: {
        enabled: updateDto.enabled,
      },
    };
  }
}
