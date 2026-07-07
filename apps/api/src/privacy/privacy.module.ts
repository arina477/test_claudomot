import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { AccountDataService } from './account-data.service';
import { AccountDeletionService } from './account-deletion.service';
import { AppendPrivacyEventService } from './append-privacy-event.service';
import { PrivacyController } from './privacy.controller';
import { PrivacyService } from './privacy.service';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [PrivacyController],
  providers: [
    PrivacyService,
    AccountDataService,
    AccountDeletionService,
    AppendPrivacyEventService,
  ],
  exports: [PrivacyService, AccountDataService, AccountDeletionService, AppendPrivacyEventService],
})
export class PrivacyModule {}
