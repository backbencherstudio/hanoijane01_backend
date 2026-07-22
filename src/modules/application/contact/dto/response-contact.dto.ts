import { ApiProperty } from '@nestjs/swagger';

export class ContactDataDto {
  @ApiProperty({ example: 'clx1contact...' })
  id: string;

  @ApiProperty({ example: 'John Doe', nullable: true })
  name: string | null;

  @ApiProperty({ example: 'Acme Inc', nullable: true })
  companyName: string | null;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: '+1234567890', nullable: true })
  phoneNumber: string | null;

  @ApiProperty({ example: 'Hello, I have an inquiry about stall booking.' })
  message: string;

  @ApiProperty({ example: 'clx1user...', nullable: true })
  userId: string | null;
}

export class ResponseContactDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Contact message submitted successfully' })
  message: string;

  @ApiProperty({ type: ContactDataDto })
  data: ContactDataDto;
}
