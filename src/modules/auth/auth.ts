import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from 'prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import appConfig from '../../config/app.config';
import { MailService } from '../../mail/mail.service';
import { emailOTP, bearer, admin } from 'better-auth/plugins';
import { createAuthMiddleware, APIError } from 'better-auth/api';

const connectionString = appConfig().database.url;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const isProduction = appConfig().nodeEnv === 'production';

export const auth = betterAuth({
  trustedOrigins: [
    appConfig().app.client_app_url,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://10.10.9.45:3000',
    'https://itba-expo.vercel.app',
  ],
  advanced: {
    useSecureCookies: isProduction,
    cookies: {
      session_token: {
        attributes: {
          sameSite: isProduction ? 'none' : 'strict',
          secure: isProduction,
          httpOnly: true,
        },
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/sign-in/email') {
        const body = ctx.body as Record<string, unknown> | undefined;
        const email = typeof body?.email === 'string' ? body.email : undefined;
        if (email) {
          const userRecord = await prisma.user.findFirst({
            where: { email, deletedAt: null },
            select: { status: true },
          });
          if (userRecord && userRecord.status === -1) {
            throw new APIError('FORBIDDEN', {
              message: 'Your account has been banned. Please contact admin.',
            });
          }
        }
        return;
      }

      if (ctx.path !== '/sign-up/email') return;

      const body = ctx.body as Record<string, unknown> | undefined;
      const email = typeof body?.email === 'string' ? body.email : undefined;
      if (!email) return;

      const existingUser = await prisma.user.findFirst({
        where: { email, deletedAt: null },
        select: { id: true },
      });

      if (existingUser) {
        throw new APIError('BAD_REQUEST', {
          message: 'User with this email already exists',
        });
      }
    }),
  },
  databaseHooks: {
    user: {
      update: {
        after: async (user) => {
          // If email was verified and status is currently INACTIVE (0), activate user (status = 1).
          // If user status is BANNED (-1), do not activate automatically.
          if (user.emailVerified && user.status === 0) {
            await prisma.user.update({
              where: { id: user.id },
              data: { status: 1 },
            });
          }
        },
      },
    },
  },
  baseURL: appConfig().app.url,
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET || 'better-auth-secret-1234567890',

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  user: {
    modelName: 'User',
    changeEmail: {
      enabled: true,
    },
    additionalFields: {
      companyName: { type: 'string', required: false },
      companyAddress: { type: 'string', required: false },
      avatar: { type: 'string', required: false },
      phoneNumber: { type: 'string', required: false },
      billingId: { type: 'string', required: false },
      type: { type: 'string', required: false, defaultValue: 'user' },
      status: { type: 'number', required: false, defaultValue: 0 },
    },
  },

  session: {
    modelName: 'Session',
  },

  account: {
    modelName: 'Account',
  },

  verification: {
    modelName: 'Verification',
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    sendResetPassword: async ({ user, url }) => {
      if (MailService.instance) {
        await MailService.instance.sendResetPasswordEmail(
          user.email,
          user.name || 'there',
          url,
        );
      } else {
        console.error('MailService instance is not yet initialized');
      }
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },

  socialProviders: {
    google: {
      clientId: appConfig().auth.google.app_id as string,
      clientSecret: appConfig().auth.google.app_secret as string,
    },
  },

  plugins: [
    bearer(),
    admin({
      defaultRole: 'user',
      adminRole: ['admin'],
    }),
    emailOTP({
      otpLength: 5,
      overrideDefaultEmailVerification: true,
      sendVerificationOTP: async ({ email, otp }) => {
        if (MailService.instance) {
          const userRecord = await prisma.user.findUnique({
            where: { email },
          });
          const name = userRecord?.name || 'there';
          await MailService.instance.sendOtpCodeToEmail({
            name,
            email,
            otp,
          });
        } else {
          console.error('MailService instance is not yet initialized');
        }
      },
    }),
  ],
});

export type BetterAuthSession = typeof auth.$Infer.Session;
