import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateStandAvailabilityDto {
  @ApiProperty({
    example: true,
    description:
      'true to unblock (make available for booking), false to block (hide from booking).',
  })
  @IsBoolean()
  isAvailable: boolean;
}
