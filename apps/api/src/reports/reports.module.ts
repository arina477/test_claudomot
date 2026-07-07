import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MessagingModule } from '../messaging/messaging.module';
import { RbacModule } from '../rbac/rbac.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

// ---------------------------------------------------------------------------
// ReportsModule — wave-69 M14 moderation reports
//
// Imports:
//   AuthModule    — provides AuthGuard (used by ReportsController)
//   RbacModule    — provides RbacService (moderate_members gate) +
//                   ModerationService (timeout route-through + rank guard)
//   MessagingModule — provides MessagesService (delete_message route-through)
//
// Note: ModerationService must be exported from RbacModule for DI here.
//   rbac.module.ts exports list was extended to include ModerationService.
// ---------------------------------------------------------------------------

@Module({
  imports: [AuthModule, RbacModule, MessagingModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
