import { ApiProperty } from '@nestjs/swagger';

export class AdminSettingDataDto {
  @ApiProperty({
    example: true,
    description: 'Whether notification emails and socket emissions are enabled',
  })
  notification: boolean;
}

export class AdminSettingResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Settings updated successfully' })
  message: string;

  @ApiProperty({ type: AdminSettingDataDto })
  data: AdminSettingDataDto;
}
