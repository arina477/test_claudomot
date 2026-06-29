import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';
import { HealthModule } from './health/health.module';
import { MeModule } from './me/me.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [HealthModule, AuthModule, MeModule, ProfileModule, FilesModule],
})
export class AppModule {}
