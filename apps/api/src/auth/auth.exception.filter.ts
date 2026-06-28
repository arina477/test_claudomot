import { Catch, HttpStatus } from '@nestjs/common';
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
          // Fall through to re-throw for unrecognised Session errors
          break;
      }
    }

    // Not a SuperTokens error — re-throw so NestJS default handler processes it
    throw err;
  }
}
