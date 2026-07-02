import './instrument';
import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import supertokens from 'supertokens-node';
import { AppModule } from './app.module';
import { SupertokensExceptionFilter } from './auth/auth.exception.filter';
import { initSuperTokens } from './auth/supertokens.config';
import { EmailService } from './email/email.service';
import { UsersService } from './users/users.service';

// ── Auth rate limiter (Express-level) ────────────────────────────────────────
// SuperTokens handles /auth/* entirely via its own Express middleware, which
// means NestJS APP_GUARD (ThrottlerGuard) never sees those requests.
// This Express middleware runs BEFORE SupertokensMiddleware (registered in
// AuthModule.configure()) because app.use() below is called before app.listen().
// The NestJS middleware pipeline runs during request handling, after the raw
// Express app.use() middleware stack has already been applied.
//
// Strategy: in-memory sliding-window per IP — 10 req/60 s on /auth/* paths.
// No Redis, no external dep — single-pod MVP per _library L423.
const AUTH_RATE_LIMIT_WINDOW_MS = 60_000;
const AUTH_RATE_LIMIT_MAX = 10;

const authRateLimitStore = new Map<string, number[]>();

// biome-ignore lint/suspicious/noExplicitAny: Express req/res/next — @types/express not installed
function authRateLimiter(req: any, res: any, next: () => void): void {
  // Only applies to /auth/* paths.
  if (!req.path.startsWith('/auth/') && req.path !== '/auth') {
    next();
    return;
  }

  // Key on the leftmost X-Forwarded-For entry: that is always the real originating
  // client IP, regardless of how many proxy hops Railway inserts. With Railway's
  // two-hop topology (public edge + internal LB), XFF arrives as:
  //   X-Forwarded-For: <client-ip>, <railway-internal-lb-ip>
  // Using req.ip (trust-proxy walk from the right) would yield the Railway internal
  // LB IP, which varies per node and makes the per-IP counter never accumulate.
  // Keying on XFF[0] gives a stable, client-specific key in every request.
  const xff = req.headers['x-forwarded-for'];
  const xffFirstHop = typeof xff === 'string' ? xff.split(',')[0]?.trim() : undefined;
  const ip = (xffFirstHop ?? req.socket?.remoteAddress ?? 'unknown') as string;
  const now = Date.now();
  const windowStart = now - AUTH_RATE_LIMIT_WINDOW_MS;

  // Retrieve and prune timestamps outside the current window.
  const timestamps = (authRateLimitStore.get(ip) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= AUTH_RATE_LIMIT_MAX) {
    res.status(429).json({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded — maximum 10 auth requests per minute.',
    });
    return;
  }

  timestamps.push(now);
  authRateLimitStore.set(ip, timestamps);
  next();
}

async function bootstrap(): Promise<void> {
  // ORDERING GUARANTEE: supertokens.init() MUST run before NestFactory.create(),
  // before getAllCORSHeaders(), and before any HTTP request can be served.
  //
  // Why not onModuleInit(): NestJS fires onModuleInit() lazily, during app.listen()
  // (or app.init()), which is AFTER enableCors() has already called getAllCORSHeaders().
  // The SDK throws "Initialisation not done" if any SDK function is called before init().
  //
  // Why new UsersService() / new EmailService() here: both classes have no injected
  // constructor arguments — UsersService uses the db module-level singleton directly,
  // EmailService reads env vars in its constructor. They are safe to instantiate
  // without Nest DI. AuthModule still provides them via DI for all other consumers
  // (guards, controllers, etc.); these pre-DI instances are used only for the
  // initSuperTokens override closures that run inside the SDK itself.
  //
  // initSuperTokens is idempotent (guarded by _initialized flag) so AuthModule's
  // providers constructing these services via DI later causes no double-init.
  initSuperTokens(new UsersService(), new EmailService());

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Wire the Socket.IO adapter so that @WebSocketGateway() decorators are
  // handled by Socket.IO rather than the default ws adapter. Required when
  // using @nestjs/platform-express (the default HTTP adapter) + Socket.IO
  // gateways — NestJS does not auto-discover the Socket.IO adapter in that
  // combination.
  app.useWebSocketAdapter(new IoAdapter(app));

  // Tell Express to trust the Railway edge proxy. Railway injects two hops:
  // the public edge and an internal load-balancer, so XFF arrives as:
  //   X-Forwarded-For: <real-client-ip>, <railway-internal-lb-ip>
  // With trust proxy=true (or a subnet list), req.ip would walk from the right and
  // land on the railway-internal IP (which varies per LB node). The rate-limiter
  // instead keys on the leftmost XFF entry directly (the real client IP), which is
  // the robust approach regardless of hop count. Setting trust proxy=true is still
  // correct for req.secure, req.hostname, and other Express features.
  app.set('trust proxy', true);

  // Split WEB_ORIGIN on comma to support multiple origins (e.g. localhost + prod)
  const rawOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:5173';
  const allowedOrigins = rawOrigin.split(',').map((o) => o.trim());
  const origin = allowedOrigins.length === 1 ? (allowedOrigins[0] ?? rawOrigin) : allowedOrigins;

  // CORS must be configured before routes. SuperTokens CORS headers are required
  // for the SDK to function across origins (e.g. cookie negotiation). getAllCORSHeaders()
  // is safe here because initSuperTokens() ran above, before NestFactory.create().
  app.enableCors({
    origin,
    credentials: true,
    allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
  });

  // Global exception filter maps SuperTokens session errors to typed StudyHall codes.
  // Mounted as a global filter — catches errors from verifySession() in AuthGuard.
  app.useGlobalFilters(new SupertokensExceptionFilter());

  // Mount the Express-level auth rate limiter BEFORE NestJS begins accepting
  // requests. This must run before the SuperTokens middleware (which handles
  // /auth/* entirely and never surfaces those requests to NestJS route guards).
  // app.use() on the NestJS adapter registers on the underlying Express instance
  // and runs ahead of the module-level middleware pipeline.
  // trust proxy (set above) ensures req.ip == real client IP, making the
  // per-IP counter accumulate correctly and firing 429 after 10 requests.
  app.use(authRateLimiter);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  Logger.log(`StudyHall API listening on http://localhost:${port}`, 'Bootstrap');
}

bootstrap().catch((err) => {
  Logger.error(err, 'Bootstrap');
  process.exit(1);
});
