import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import supertokens from 'supertokens-node';
import { AppModule } from './app.module';
import { SupertokensExceptionFilter } from './auth/auth.exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Split WEB_ORIGIN on comma to support multiple origins (e.g. localhost + prod)
  const rawOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:5173';
  const allowedOrigins = rawOrigin.split(',').map((o) => o.trim());
  const origin = allowedOrigins.length === 1 ? (allowedOrigins[0] ?? rawOrigin) : allowedOrigins;

  // CORS must be configured before routes. SuperTokens CORS headers are required
  // for the SDK to function across origins (e.g. cookie negotiation).
  app.enableCors({
    origin,
    credentials: true,
    allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
  });

  // Global exception filter maps SuperTokens session errors to typed StudyHall codes.
  // Mounted as a global filter — catches errors from verifySession() in AuthGuard.
  app.useGlobalFilters(new SupertokensExceptionFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  Logger.log(`StudyHall API listening on http://localhost:${port}`, 'Bootstrap');
}

bootstrap().catch((err) => {
  Logger.error(err, 'Bootstrap');
  process.exit(1);
});
