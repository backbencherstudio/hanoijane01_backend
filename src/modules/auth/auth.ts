import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from 'prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import appConfig from '../../config/app.config';
import { MailService } from '../../mail/mail.service';
import { emailOTP, bearer } from 'better-auth/plugins';

const connectionString = appConfig().database.url;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export const auth = betterAuth({
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

