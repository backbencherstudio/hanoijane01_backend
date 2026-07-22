import { ApiProperty } from '@nestjs/swagger';

// ─── Generic wrappers ────────────────────────────────────────────────────────

export class ApiSuccessResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;
}

// ─── Login / Signup ───────────────────────────────────────────────────────────

export class AuthUserDto {
  @ApiProperty({ example: 'clx1abc...', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: false })
  emailVerified: boolean;

  @ApiProperty({ example: 'Acme Corp', nullable: true, required: false })
  companyName?: string | null;

  @ApiProperty({ example: '+8801711223344', nullable: true, required: false })
  phoneNumber?: string | null;

  @ApiProperty({ example: '123 Main St', nullable: true, required: false })
  companyAddress?: string | null;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    nullable: true,
    required: false,
  })
  avatar?: string | null;

  @ApiProperty({ example: 'user', description: 'user | admin' })
  type: string;

  @ApiProperty({ example: '2026-07-18T00:00:00.000Z' })
  createdAt: Date;
}

export class LoginResponseData {
  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;

  @ApiProperty({
    example: 'sess_abc123...',
    description: 'Session token (Bearer)',
  })
  token: string;
}

export class LoginSuccessResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: LoginResponseData })
  data: LoginResponseData;
}

export class SignupResponseData {
  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;

  @ApiProperty({
    example: null,
    nullable: true,
    required: false,
    description: 'Session token if auto sign-in is enabled',
  })
  token?: string | null;
}

export class SignupSuccessResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: SignupResponseData })
  data: SignupResponseData;
}

// ─── Me ──────────────────────────────────────────────────────────────────────

export class MeResponseData {
  @ApiProperty({ example: 'clx1abc...' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: null, nullable: true })
  avatar: string | null;

  @ApiProperty({ example: null, nullable: true })
  phoneNumber: string | null;

  @ApiProperty({ example: null, nullable: true })
  companyName: string | null;

  @ApiProperty({ example: null, nullable: true })
  companyAddress: string | null;

  @ApiProperty({ example: 'user' })
  type: string;

  @ApiProperty({ example: '2026-07-18T00:00:00.000Z' })
  createdAt: Date;
}

export class MeSuccessResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: MeResponseData })
  data: MeResponseData;
}
