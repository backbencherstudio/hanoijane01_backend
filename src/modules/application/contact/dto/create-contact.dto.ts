import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class CreateContactDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Name of the person submitting the contact form',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'Acme Corp',
    description: 'Company name',
  })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Contact email address',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Contact phone number',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    example: 'I would like to inquire about booking multiple stands.',
    description: 'The contact message body',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
