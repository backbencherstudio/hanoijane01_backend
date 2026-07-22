import {
  All,
  Body,
  Controller,
  Get,
  Logger,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { memoryStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';

import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import {
  LoginAuthDto,
  ForgotPasswordAuthDto,
  ResetPasswordAuthDto,
  VerifyEmailAuthDto,
  ResendVerificationAuthDto,
} from './dto/query-auth.dto';
import {
  ApiSuccessResponse,
  LoginSuccessResponse,
  MeSuccessResponse,
  SignupSuccessResponse,
} from './dto/response-auth.dto';
import { AuthGuard } from './guards/auth.guard';
import { Session, UserSession } from './decorators/session.decorator';
import { auth } from './auth';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  // Helper: Forward cookies from Better Auth response
  private forwardCookies(result: { headers?: Headers }, res: Response) {
    const cookies = result.headers?.getSetCookie?.() ?? [];
    cookies.forEach((cookie) => res.append('Set-Cookie', cookie));
  }

  @ApiOperation({
    summary: 'Login with email and password',
    description:
      'Authenticates a user using email and password, returning session details, set-cookie headers, and an auth token.',
  })
  @ApiBody({ type: LoginAuthDto })
  @ApiResponse({
    status: 200,
    type: LoginSuccessResponse,
    description: 'Login successful — returns session token and cookies',
  })
  @Post('login')
  async login(
    @Body() body: LoginAuthDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { headers, response } = await auth.api.signInEmail({
      body: { email: body.email, password: body.password },
      headers: req.headers as HeadersInit,
      returnHeaders: true,
    });

    this.forwardCookies({ headers }, res);

    return { success: true, data: response };
  }

  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Registers a new user record in the database and triggers an email verification code (OTP) to the registered email address.',
  })
  @ApiBody({ type: CreateAuthDto })
  @ApiResponse({
    status: 200,
    type: SignupSuccessResponse,
    description: 'Signup successful — OTP sent to email',
  })
  @Post('signup')
  async signup(@Body() body: CreateAuthDto, @Req() req: Request) {
    const result = await auth.api.signUpEmail({
      body: {
        name: body.name || '',
        email: body.email || '',
        password: body.password,
      },
      headers: req.headers as HeadersInit,
    });
    return { success: true, data: result };
  }

  @ApiOperation({
    summary: 'Logout current session',
    description:
      'Clears the user session both on the database side and removes the local auth cookies by sending clear cookie headers.',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    type: ApiSuccessResponse,
    description: 'Logged out successfully',
  })
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await auth.api.signOut({
      headers: req.headers as HeadersInit,
      returnHeaders: true,
    });
    this.forwardCookies(result, res);
    return { success: true, message: 'Logged out successfully' };
  }

  @ApiOperation({
    summary: 'Forgot password',
    description:
      'Sends a 5-digit verification OTP (One-Time Password) code to the registered email address to initiate the password reset sequence.',
  })
  @ApiBody({ type: ForgotPasswordAuthDto })
  @ApiResponse({
    status: 200,
    type: ApiSuccessResponse,
    description: 'OTP sent successfully',
  })
  @Post('forgot-password')
  async forgotPassword(
    @Body() body: ForgotPasswordAuthDto,
    @Req() req: Request,
  ) {
    const result = await auth.api.forgetPasswordEmailOTP({
      body: { email: body.email },
      headers: req.headers as HeadersInit,
    });
    return { success: true, data: result };
  }

  @ApiOperation({
    summary: 'Reset password',
    description:
      'Resets the user password by validating the email address and matching the 5-digit OTP sent to their email.',
  })
  @ApiBody({ type: ResetPasswordAuthDto })
  @ApiResponse({
    status: 200,
    type: ApiSuccessResponse,
    description: 'Password reset successful',
  })
  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordAuthDto, @Req() req: Request) {
    const result = await auth.api.resetPasswordEmailOTP({
      body: { email: body.email, otp: body.otp, password: body.password },
      headers: req.headers as HeadersInit,
    });
    return { success: true, data: result };
  }

  @ApiOperation({
    summary: 'Verify email with OTP',
    description:
      "Verifies the user's email address by passing the 5-digit signup OTP sent to their inbox, activating their session directly.",
  })
  @ApiBody({ type: VerifyEmailAuthDto })
  @ApiResponse({
    status: 200,
    type: LoginSuccessResponse,
    description: 'Email verified — returns session token',
  })
  @Post('verify-email')
  async verifyEmail(
    @Body() body: VerifyEmailAuthDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await auth.api.verifyEmailOTP({
      body: { email: body.email, otp: body.otp },
      headers: req.headers as HeadersInit,
      returnHeaders: true,
    });
    this.forwardCookies(result, res);
    return { success: true, data: result.response };
  }

  @ApiOperation({
    summary: 'Resend verification email OTP',
    description:
      'Resends a fresh 5-digit verification OTP (One-Time Password) to the user email for account verification.',
  })
  @ApiBody({ type: ResendVerificationAuthDto })
  @ApiResponse({
    status: 200,
    type: ApiSuccessResponse,
    description: 'Verification OTP resent successfully',
  })
  @Post('resend-verification-email')
  async resendVerificationEmail(
    @Body() body: ResendVerificationAuthDto,
    @Req() req: Request,
  ) {
    await auth.api.sendVerificationOTP({
      body: {
        email: body.email,
        type: 'email-verification',
      },
      headers: req.headers as HeadersInit,
    });
    return { success: true, message: 'Verification OTP resent successfully' };
  }

  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Fetches the profile details of the currently authenticated user based on their session token.',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    type: MeSuccessResponse,
    description: 'User profile details',
  })
  @UseGuards(AuthGuard)
  @Get('me')
  async me(@Session() session: UserSession) {
    return this.authService.me(session.user.id);
  }

  @ApiOperation({
    summary: 'Update user profile',
    description:
      'Updates the profile fields (name, phone, company info) and supports uploading a new avatar image using Multipart form-data.',
  })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    type: ApiSuccessResponse,
    description: 'Profile updated successfully',
  })
  @UseGuards(AuthGuard)
  @Patch('update')
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async updateUser(
    @Session() session: UserSession,
    @Body() data: UpdateAuthDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.authService.updateUser(session.user.id, data, image);
  }

  // Catch-all proxy for Better Auth endpoints
  @ApiExcludeEndpoint()
  @All('*')
  handleAuth(@Req() req: Request, @Res() res: Response) {
    return toNodeHandler(auth)(req, res);
  }
}
