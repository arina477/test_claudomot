import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { AccountDataService } from './account-data.service';
import { AccountDeletionService } from './account-deletion.service';
import { PrivacyController } from './privacy.controller';
import { PrivacyService } from './privacy.service';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [PrivacyController],
  providers: [PrivacyService, AccountDataService, AccountDeletionService],
  exports: [PrivacyService, AccountDataService, AccountDeletionService],
})
export class PrivacyModule {}
