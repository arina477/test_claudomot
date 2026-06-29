import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { MeModule } from './me/me.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [HealthModule, AuthModule, MeModule, ProfileModule],
})
export class AppModule {}
