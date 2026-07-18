import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateAuthDto } from './create-auth.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAuthDto extends PartialType(CreateAuthDto) {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Phone number of the user',
    example: '+91 9876543210',
    required: false,
  })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Company name',
    example: 'Acme Corp',
    required: false,
  })
  companyName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Company address',
    example: '123 Business St, New York',
    required: false,
  })
  companyAddress?: string;
}
