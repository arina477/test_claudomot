import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { AccountDataService } from './account-data.service';
import { PrivacyController } from './privacy.controller';
import { PrivacyService } from './privacy.service';

// NOTE: PrivacyModule is NOT registered in AppModule here.
// Registration is deferred to B-4 wiring (app.module.ts is owned by another agent).
@Module({
  imports: [UsersModule, AuthModule],
  controllers: [PrivacyController],
  providers: [PrivacyService, AccountDataService],
  exports: [PrivacyService, AccountDataService],
})
export class PrivacyModule {}
