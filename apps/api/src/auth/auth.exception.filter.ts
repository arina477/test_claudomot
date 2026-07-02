import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { SentryExceptionCaptured } from '@sentry/nestjs';
import { isInvalidTextRepresentation } from './pg-error-utils';

// Minimal response interface — avoids @types/express dependency.
// headersSent: true when SuperTokens' own errorHandler already sent the response
// (CSRF rejection, session-error paths). Checking this prevents the double-send
// that previously caused ERR_HTTP_HEADERS_SENT and a process crash-loop.
interface HttpResponse {
  headersSent: boolean;
  status(code: number): { json(body: unknown): void };
}

@Catch()
export class SupertokensExceptionFilter implements ExceptionFilter {
  @SentryExceptionCaptured()
  catch(err: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<HttpResponse>();

    // SuperTokens' middleware() and verifySession() call supertokens.errorHandler()
    // internally, which sends the 401/403 response before propagating the error to
    // NestJS. Calling res.status().json() a second time causes ERR_HTTP_HEADERS_SENT
    // and crashes the process. Guard here so every code path below is safe.
    if (res.headersSent) {
      return;
    }

    // Session.Error cases (TRY_REFRESH_TOKEN, UNAUTHORISED, INVALID_CLAIMS, etc.) are
    // handled exclusively by the SuperTokens SDK's own errorHandler. They must NOT be
    // handled here — the SDK already sent a clean 401/403 and set headersSent=true.
    // If a Session.Error somehow reaches this filter with headersSent=false (SDK bug or
    // misconfiguration), fall through to the generic 500 so the process stays up.

    // Forward HttpExceptions (BadRequestException, NotFoundException, etc.) as-is so
    // NestJS-style validation errors return the correct 4xx status instead of crashing.
    // Registering this filter via app.useGlobalFilters(new ...) means BaseExceptionFilter
    // cannot be used (no HttpAdapterHost injected), so we handle HttpException directly.
    //
    // IMPORTANT: this check runs BEFORE the 22P02 check below so that any
    // HttpException (including app-thrown BadRequestException / ForbiddenException /
    // NotFoundException) is always forwarded unchanged — a DrizzleQueryError is never
    // an HttpException, so the ordering is safe and the two branches never overlap.
    if (err instanceof HttpException) {
      const status = err.getStatus();
      const body = err.getResponse();
      res.status(status).json(body);
      return;
    }

    // Postgres SQLSTATE 22P02 (invalid_text_representation) — thrown when a
    // malformed non-UUID string is cast to uuid in a parameterised WHERE clause.
    // Drizzle wraps the PG error inside DrizzleQueryError, so we walk .cause
    // (and .cause.cause) to find the code — same layered walk as isUniqueViolation
    // in users.service.ts:23-38.
    //
    // We map this to 400 Bad Request with a clean generic body (no stack/DB detail).
    // This covers all ~30 UUID route params across 7 controllers in one place.
    //
    // Auth boundary: AuthGuard runs BEFORE the controller method (and therefore
    // before any DB query). A 401/403 from SuperTokens is sent by the SDK's own
    // errorHandler (headersSent=true, caught above) or reaches this filter as an
    // HttpException (forwarded above). 22P02 can only fire AFTER auth succeeds —
    // an unauthenticated request never reaches the parameterised DB query.
    if (isInvalidTextRepresentation(err)) {
      res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Bad Request',
      });
      return;
    }

    // Unknown non-HTTP error — return 500.
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
