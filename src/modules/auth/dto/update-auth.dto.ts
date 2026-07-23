import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateAuthDto } from './create-auth.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAuthDto extends PartialType(
  OmitType(CreateAuthDto, ['password', 'email'] as const),
) {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Company address',
    example: '123 Business St, New York',
    required: false,
  })
  companyAddress?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Avatar of the user',
    type: 'string',
    format: 'binary',
    required: false,
  })
  avatar?: Express.Multer.File;
}
