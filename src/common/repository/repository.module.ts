import { Global, Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserRepository } from './user/user.repository';
import { NotificationRepository } from './notification/notification.repository';
import { TransactionRepository } from './transaction/transaction.repository';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    UserRepository,
    NotificationRepository,
    TransactionRepository,
  ],
  exports: [
    UserRepository,
    NotificationRepository,
    TransactionRepository,
  ],
})
export class RepositoryModule {}
