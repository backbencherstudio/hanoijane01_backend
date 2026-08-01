import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateSettingDto {
  @ApiProperty({
    example: true,
    description:
      'Enable (true) or disable (false) real-time socket and email notifications. Default is true.',
  })
  @IsBoolean()
  enabled: boolean;
}
