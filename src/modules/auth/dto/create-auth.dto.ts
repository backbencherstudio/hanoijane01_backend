import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, MinLength } from 'class-validator';

export class CreateAuthDto {
  @IsNotEmpty()
  @ApiProperty({
    description: 'The name of the user',
    example: 'John Doe',
  })
  name: string;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    description: 'The email address of the user',
    example: 'user@example.com',
  })
  email: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Password should be minimum 8 characters' })
  @ApiProperty({
    description: 'The password of the user',
    example: '12345678',
  })
  password: string;

  @ApiProperty({
    description: 'The name of the company',
    example: 'John Doe',
  })
  companyName?: string;

  @ApiProperty({
    description: 'The phone number of the user',
    example: '123456789',
  })
  phoneNumber?: string;
}
