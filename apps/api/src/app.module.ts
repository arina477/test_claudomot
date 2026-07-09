import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AssignmentsModule } from './assignments/assignments.module';
import { AuthModule } from './auth/auth.module';
import { EntitlementsModule } from './billing/entitlements.module';
import { BlocksModule } from './blocks/blocks.module';
import { GenericThrottlerGuard } from './common/generic-throttler.guard';
import { DmModule } from './dm/dm.module';
import { FilesModule } from './files/files.module';
import { HealthModule } from './health/health.module';
import { MeModule } from './me/me.module';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PresenceModule } from './presence/presence.module';
import { PrivacyModule } from './privacy/privacy.module';
import { ProfileModule } from './profile/profile.module';
import { ReportsModule } from './reports/reports.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { ServersModule } from './servers/servers.module';
import { StudyRoomModule } from './study-room/study-room.module';
import { StudyTimerModule } from './study-timer/study-timer.module';
import { VoiceModule } from './voice/voice.module';

@Module({
  imports: [
    // In-memory throttler — single-pod MVP, no Redis.
    // 10 requests per 60 seconds for all NestJS-handled routes.
    // SuperTokens /auth/* routes are rate-limited at the Express level
    // in main.ts (see authRateLimiter middleware) because those routes
    // are handled by the SuperTokens middleware before NestJS routing.
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // 60 seconds (ms since @nestjs/throttler v5+)
        limit: 10,
      },
    ]),
    // EventEmitter for domain events (message.created → Socket.IO gateway)
    EventEmitterModule.forRoot(),
    // Schedule module — enables @Cron decorators (wave-30 B-2 reminder cron)
    ScheduleModule.forRoot(),
    HealthModule,
    AuthModule,
    EntitlementsModule,
    DmModule,
    MeModule,
    ProfileModule,
    FilesModule,
    ServersModule,
    MessagingModule,
    PresenceModule,
    AssignmentsModule,
    SchedulingModule,
    NotificationsModule,
    VoiceModule,
    PrivacyModule,
    StudyTimerModule,
    ReportsModule,
    BlocksModule,
    StudyRoomModule,
  ],
  providers: [
    // GenericThrottlerGuard (ThrottlerGuard subclass) as APP_GUARD covers all
    // NestJS-handled routes. It emits a GENERIC 429 body (no framework class
    // name) while keeping HTTP 429 + Retry-After (wave-83 B-2, F23-T-8d).
    // /health is exempt via @SkipThrottle (applied in health.controller.ts).
    {
      provide: APP_GUARD,
      useClass: GenericThrottlerGuard,
    },
  ],
})
export class AppModule {}
