import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';

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
    if (err instanceof HttpException) {
      const status = err.getStatus();
      const body = err.getResponse();
      res.status(status).json(body);
      return;
    }

    // Unknown non-HTTP error — return 500.
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
