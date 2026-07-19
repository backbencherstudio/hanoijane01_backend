import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

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
}
