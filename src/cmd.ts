// external imports
import { Module } from '@nestjs/common';
import { CommandFactory } from 'nest-commander';
import { ConfigModule } from '@nestjs/config';
// internal imports
import appConfig from './config/app.config';
import { PrismaModule } from './prisma/prisma.module';
import { RepositoryModule } from './common/repository/repository.module';
import { PrismaService } from './prisma/prisma.service';
import { SeedCommand } from './command/seed.command';
import { ExhibitionSeedCommand } from './command/exhibition-seed.command';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    PrismaModule,
    RepositoryModule,
  ],
  providers: [SeedCommand, ExhibitionSeedCommand, PrismaService],
})
export class AppModule {}

async function bootstrap() {
  // If invoked via ts-node, adjust process.argv so nest-commander correctly resolves subcommands
  if (
    process.argv[2] &&
    (process.argv[2].endsWith('cmd.ts') || process.argv[2].endsWith('cmd.js'))
  ) {
    process.argv.splice(1, 1);
  }

  try {
    await CommandFactory.run(AppModule, ['error', 'warn', 'log']);
  } catch (err) {
    console.error('Command execution failed:', err);
    process.exit(1);
  }
}

bootstrap();
