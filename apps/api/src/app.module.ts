import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';
import { HealthModule } from './health/health.module';
import { MeModule } from './me/me.module';
import { ProfileModule } from './profile/profile.module';

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
    HealthModule,
    AuthModule,
    MeModule,
    ProfileModule,
    FilesModule,
  ],
  providers: [
    // ThrottlerGuard as APP_GUARD covers all NestJS-handled routes.
    // /health is exempt via @SkipThrottle (applied in health.controller.ts).
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
