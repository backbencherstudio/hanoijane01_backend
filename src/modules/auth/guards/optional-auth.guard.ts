import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { auth } from '../auth';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (session) {
        request.user = session.user;
        request.session = session.session;
      }
    } catch {
      // Optional auth: fail gracefully for guest requests
    }

    return true;
  }
}
