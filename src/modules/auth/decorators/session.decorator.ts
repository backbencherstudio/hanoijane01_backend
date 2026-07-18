import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'prisma/generated/client';
import { Session as BetterAuthSession } from 'better-auth/types';

export type UserSession = {
  user: User;
  session: BetterAuthSession;
};

export const Session = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user
      ? { user: request.user, session: request.session }
      : null;
  },
);
