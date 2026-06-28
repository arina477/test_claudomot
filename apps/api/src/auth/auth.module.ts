import { Module } from '@nestjs/common';
import type { MiddlewareConsumer, NestModule, OnModuleInit } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { EmailService } from '../email/email.service';
import { UsersModule } from '../users/users.module';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { UsersService } from '../users/users.service';
import { SupertokensExceptionFilter } from './auth.exception.filter';
import { AuthGuard } from './auth.guard';
import { SupertokensMiddleware } from './auth.middleware';
import { initSuperTokens } from './supertokens.config';

@Module({
  imports: [UsersModule, EmailModule],
  providers: [AuthGuard, SupertokensExceptionFilter],
  exports: [AuthGuard, SupertokensExceptionFilter],
})
export class AuthModule implements NestModule, OnModuleInit {
  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  onModuleInit(): void {
    // Initialize SuperTokens exactly once at bootstrap.
    // Called before any request is handled.
    initSuperTokens(this.usersService, this.emailService);
  }

  configure(consumer: MiddlewareConsumer): void {
    // Mount the SuperTokens middleware on all routes.
    // CRITICAL: NestJS module-level middleware always runs before route handlers.
    // This must remain before any route-level guards.
    consumer.apply(SupertokensMiddleware).forRoutes('*');
  }
}
