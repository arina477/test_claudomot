import { type ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ThrottlerGuard, type ThrottlerLimitDetail } from '@nestjs/throttler';

/**
 * GenericThrottlerGuard — StudyHall wave-83 B-2.
 *
 * The stock @nestjs/throttler ThrottlerGuard throws `ThrottlerException`, whose
 * default message is the literal `'ThrottlerException: Too Many Requests'`. That
 * leaks the framework class name into the 429 response body (fingerprinting
 * hygiene gap, F23-T-8d).
 *
 * This subclass overrides ONLY the throw so the 429 body is a generic envelope
 * `{ statusCode: 429, message: 'Too Many Requests' }` — no class name. It changes
 * nothing else:
 *   - HTTP status stays 429 (HttpStatus.TOO_MANY_REQUESTS).
 *   - The `Retry-After` header (and X-RateLimit-* headers) are set by the base
 *     guard's handleRequest() BEFORE throwThrottlingException() is called, so
 *     they are unaffected by this override.
 *
 * Smallest-footprint approach vs a module-level errorMessage string: a plain
 * string would still be wrapped by ThrottlerException into a bare-string body;
 * overriding the throw lets us emit the structured `{ statusCode, message }`
 * envelope the spec (AC7) requires.
 */
@Injectable()
export class GenericThrottlerGuard extends ThrottlerGuard {
  protected override async throwThrottlingException(
    _context: ExecutionContext,
    _throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    throw new HttpException(
      { statusCode: HttpStatus.TOO_MANY_REQUESTS, message: 'Too Many Requests' },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
