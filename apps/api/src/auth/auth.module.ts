import { Module } from '@nestjs/common';
import type { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';
import { SupertokensExceptionFilter } from './auth.exception.filter';
import { AuthGuard } from './auth.guard';
import { SupertokensMiddleware } from './auth.middleware';
import { SessionNoVerifyGuard } from './session-no-verify.guard';

// NOTE: initSuperTokens() is called in main.ts bootstrap(), before NestFactory.create(),
// to ensure the SDK is initialized before getAllCORSHeaders() and before the middleware
// handles any request. AuthModule no longer implements OnModuleInit — that pattern fired
// too late (inside app.listen()) causing the "Initialisation not done" crash.

@Module({
  imports: [UsersModule, EmailModule],
  providers: [AuthGuard, SessionNoVerifyGuard, SupertokensExceptionFilter],
  exports: [AuthGuard, SessionNoVerifyGuard, SupertokensExceptionFilter],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Mount the SuperTokens middleware on all routes.
    // CRITICAL: NestJS module-level middleware always runs before route handlers.
    // This must remain before any route-level guards.
    consumer.apply(SupertokensMiddleware).forRoutes('*');
  }
}
