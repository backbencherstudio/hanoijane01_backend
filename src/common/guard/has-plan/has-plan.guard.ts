import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserRepository } from '../../repository/user/user.repository';

@Injectable()
export class HasPlanGuard implements CanActivate {
  constructor(private readonly userRepository: UserRepository) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user_id = req.user.id;
    await this.userRepository.getUserDetails(user_id);
    return true;
  }
}
