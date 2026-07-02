import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ReminderScanService } from './reminder-scan.service';

// ---------------------------------------------------------------------------
// NotificationsModule — wave-37 M7 in-app notifications (B-2)
//
// Providers:
//   ReminderScanService — hourly cron for assignment due-date reminder emails
//                         (wave-30 B-2); now also calls NotificationsService
//                         to persist in-app notifications alongside emails.
//   NotificationsService — @OnEvent('mention.created') persist + list/mark REST
//
// Controllers:
//   NotificationsController — GET/PATCH/POST /me/notifications/* endpoints
//
// EventEmitterModule.forRoot() is registered globally in AppModule; @OnEvent
// decorators in NotificationsService receive events without a local import.
//
// ScheduleModule.forRoot() is registered in AppModule (wave-30 wire step);
// @Cron on ReminderScanService works without a local import.
// ---------------------------------------------------------------------------

@Module({
  imports: [EmailModule],
  providers: [ReminderScanService, NotificationsService],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
