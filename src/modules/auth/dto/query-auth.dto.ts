import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, MinLength, IsString } from 'class-validator';

export class SigninAuthDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password should be minimum 8 characters' })
  @ApiProperty({
    description: 'User password',
    example: '12345678',
  })
  password: string;
}

export class ForgotPasswordAuthDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;
}

export class ResetPasswordAuthDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'OTP code sent via email',
    example: '12345',
  })
  otp: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Password should be minimum 8 characters' })
  @ApiProperty({
    description: 'New password',
    example: '12345678',
  })
  password: string;
}

export class VerifyEmailAuthDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'OTP code sent via email',
    example: '12345',
  })
  otp: string;
}

export class ResendVerificationAuthDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;
}
