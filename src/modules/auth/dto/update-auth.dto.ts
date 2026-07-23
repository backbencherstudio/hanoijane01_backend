import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

const EmptyToUndefined = () =>
  Transform(({ value }) =>
    value === '' || value === null ? undefined : value,
  );

export class UpdateAuthDto {
  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'The name of the user',
    example: 'John Doe',
  })
  name?: string;

  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'The name of the company',
    example: 'Acme Inc',
  })
  companyName?: string;

  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'The phone number of the user',
    example: '123456789',
  })
  phoneNumber?: string;

  @EmptyToUndefined()
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Company address',
    example: '123 Business St, New York',
  })
  companyAddress?: string;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Avatar of the user',
    type: 'string',
    format: 'binary',
  })
  avatar?: Express.Multer.File;
}
