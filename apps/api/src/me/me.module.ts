import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { MeController } from './me.controller';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [MeController],
})
export class MeModule {}
