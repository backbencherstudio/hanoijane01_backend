import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsString,
  MinLength,
  IsIn,
  IsEnum,
} from 'class-validator';

export enum UserStatus {
  ACTIVE = 1,
  INACTIVE = 0,
  BANNED = -1,
}

export class CreateUserAdminDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'The name of the user',
    example: 'John Doe',
  })
  name: string;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    description: 'The email of the user',
    example: 'john.doe@example.com',
  })
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password should be minimum 6 characters' })
  @ApiProperty({
    description: 'The password of the user',
    example: 'password123',
  })
  password: string;

  @IsOptional()
  @IsIn(['user', 'admin'], { message: 'Type must be either user or admin' })
  @ApiPropertyOptional({
    description: 'The type/role of the user (user | admin)',
    example: 'admin',
    enum: ['user', 'admin'],
  })
  type?: string;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Status of the user (ACTIVE, INACTIVE, BANNED)',
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE', 'BANNED'],
  })
  @Transform(({ value }) => UserStatus[value?.toUpperCase()])
  @IsEnum(UserStatus)
  status?: UserStatus;
}
