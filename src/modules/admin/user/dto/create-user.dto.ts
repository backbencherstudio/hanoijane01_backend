import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsString,
  MinLength,
  IsInt,
  IsIn,
} from 'class-validator';

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
  @IsInt()
  @ApiPropertyOptional({
    description: 'Status of the user (1 = Active, 0 = Inactive, 2 = Banned)',
    example: 1,
    default: 1,
  })
  status?: number;
}
