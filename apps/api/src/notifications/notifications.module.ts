import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { ReminderScanService } from './reminder-scan.service';

// ---------------------------------------------------------------------------
// NotificationsModule — wave-30 B-2 (task c5c30363, Refs 4a4c2715)
//
// Cron host for due-date reminder scans.
// Imports EmailModule (exports EmailService) so ReminderScanService can send
// transactional reminder emails.
//
// ScheduleModule.forRoot() is registered in AppModule (wire step) per NestJS
// @nestjs/schedule requirement — it must be imported at the root level.
// ---------------------------------------------------------------------------

@Module({
  imports: [EmailModule],
  providers: [ReminderScanService],
})
export class NotificationsModule {}
