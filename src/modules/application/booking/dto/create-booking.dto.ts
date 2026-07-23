import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBookingDto {
  @ApiProperty({
    description: 'Stand Id',
    type: 'string',
    example: 'stand-1',
  })
  @IsNotEmpty()
  standId: string;

  @ApiProperty({
    description: 'User name',
    type: 'string',
    example: 'John Doe',
  })
  @IsNotEmpty()
  userName: string;

  @ApiProperty({
    description: 'Company name',
    type: 'string',
    example: 'John Doe',
  })
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({
    description: 'Company address',
    type: 'string',
    example: '123 Main St',
  })
  @IsNotEmpty()
  companyAddress: string;

  @ApiProperty({
    description: 'Email address',
    type: 'string',
    example: 'john@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Phone number',
    type: 'string',
    example: '1234567890',
  })
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description: 'Whether terms and conditions were accepted',
    type: 'boolean',
    example: true,
  })
  @IsNotEmpty()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  termsAndConditionsAccepted: boolean;

  @ApiProperty({
    description: 'Booking on behalf of (organization or person)',
    type: 'string',
    example: 'Acme Corp Ltd',
    required: false,
  })
  @IsOptional()
  @IsString()
  onBehalfOf?: string;

  @ApiProperty({
    description: 'Title of the user booking',
    type: 'string',
    example: 'CEO',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Signature image file',
    type: 'string',
    format: 'binary',
  })
  @IsNotEmpty()
  signature: Express.Multer.File;
}
