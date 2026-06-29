import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import Session from 'supertokens-node/recipe/session';

// Minimal response interface — avoids @types/express dependency.
interface HttpResponse {
  status(code: number): { json(body: unknown): void };
}

@Catch()
export class SupertokensExceptionFilter implements ExceptionFilter {
  catch(err: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<HttpResponse>();

    if (err instanceof Session.Error) {
      switch (err.type) {
        case Session.Error.TRY_REFRESH_TOKEN:
          res.status(HttpStatus.UNAUTHORIZED).json({ code: 'SESSION_EXPIRED' });
          return;
        case Session.Error.UNAUTHORISED:
          res.status(HttpStatus.UNAUTHORIZED).json({ code: 'UNAUTHORISED' });
          return;
        case Session.Error.TOKEN_THEFT_DETECTED:
          res.status(HttpStatus.UNAUTHORIZED).json({ code: 'TOKEN_THEFT_DETECTED' });
          return;
        case Session.Error.INVALID_CLAIMS:
          res.status(HttpStatus.FORBIDDEN).json({ code: 'EMAIL_NOT_VERIFIED' });
          return;
        default:
          // Fall through to generic error for unrecognised Session errors
          break;
      }
    }

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
