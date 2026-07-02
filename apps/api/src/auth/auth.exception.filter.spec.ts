/**
 * SupertokensExceptionFilter unit tests — wave-33 B-2
 *
 * Covers:
 *   - isInvalidTextRepresentation helper (pg-error-utils): direct + cause + cause.cause walks
 *   - SupertokensExceptionFilter.catch: 22P02 DrizzleQueryError → 400 (no stack/DB detail)
 *   - SupertokensExceptionFilter.catch: HttpException passthrough unchanged (401/403/404/400)
 *   - SupertokensExceptionFilter.catch: headersSent guard (no double-send)
 *   - SupertokensExceptionFilter.catch: unknown error → 500
 *   - HttpException check runs BEFORE 22P02 check (ordering contract)
 *
 * Test type: unit — simulates DrizzleQueryError shape (no real DB required).
 * The real-DB 22P02 path is exercised by the integration spec at
 * test/integration/malformed-uuid-params.spec.ts.
 */

import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { SupertokensExceptionFilter } from './auth.exception.filter';
import { isInvalidTextRepresentation } from './pg-error-utils';

// ---------------------------------------------------------------------------
// isInvalidTextRepresentation helper tests
// ---------------------------------------------------------------------------

describe('isInvalidTextRepresentation', () => {
  it('returns false for non-object (null / undefined / string)', () => {
    expect(isInvalidTextRepresentation(null)).toBe(false);
    expect(isInvalidTextRepresentation(undefined)).toBe(false);
    expect(isInvalidTextRepresentation('22P02')).toBe(false);
  });

  it('returns true when err.code === "22P02" directly', () => {
    expect(isInvalidTextRepresentation({ code: '22P02' })).toBe(true);
  });

  it('returns false when err.code is a different PG code', () => {
    expect(isInvalidTextRepresentation({ code: '23505' })).toBe(false);
    expect(isInvalidTextRepresentation({ code: '42501' })).toBe(false);
  });

  it('returns true when err.cause.code === "22P02" (DrizzleQueryError wraps PG error)', () => {
    const drizzleWrapped = {
      message: 'DrizzleQueryError: ...',
      cause: { code: '22P02', message: 'invalid input syntax for type uuid' },
    };
    expect(isInvalidTextRepresentation(drizzleWrapped)).toBe(true);
  });

  it('returns true when err.cause.cause.code === "22P02" (double-wrapped)', () => {
    const doubleWrapped = {
      message: 'outer',
      cause: {
        message: 'middle',
        cause: { code: '22P02', message: 'invalid input syntax for type uuid' },
      },
    };
    expect(isInvalidTextRepresentation(doubleWrapped)).toBe(true);
  });

  it('returns false when code is missing at all levels', () => {
    const err = { message: 'something went wrong', cause: { message: 'no code here' } };
    expect(isInvalidTextRepresentation(err)).toBe(false);
  });

  it('handles null cause gracefully (no throw)', () => {
    expect(isInvalidTextRepresentation({ cause: null })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SupertokensExceptionFilter.catch tests
// ---------------------------------------------------------------------------

/** Build a minimal mock of the NestJS ArgumentsHost for HTTP context. */
function makeHost(jsonSpy: ReturnType<typeof vi.fn>, headersSent = false) {
  const statusFn = vi.fn().mockReturnValue({ json: jsonSpy });
  const res = {
    headersSent,
    status: statusFn,
  };
  return {
    host: {
      switchToHttp: () => ({ getResponse: () => res }),
    } as never,
    res,
    statusFn,
    jsonSpy,
  };
}

describe('SupertokensExceptionFilter.catch', () => {
  const filter = new SupertokensExceptionFilter();

  // ── headersSent guard ──────────────────────────────────────────────────────

  it('does nothing when res.headersSent is true (SuperTokens already responded)', () => {
    const jsonSpy = vi.fn();
    const { host } = makeHost(jsonSpy, true);
    filter.catch(new Error('anything'), host);
    expect(jsonSpy).not.toHaveBeenCalled();
  });

  // ── HttpException passthrough ──────────────────────────────────────────────

  it('forwards HttpException 401 (UnauthorizedException) unchanged', () => {
    const jsonSpy = vi.fn();
    const { host, statusFn } = makeHost(jsonSpy);
    filter.catch(new UnauthorizedException(), host);
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(jsonSpy).toHaveBeenCalledOnce();
  });

  it('forwards HttpException 403 (ForbiddenException) unchanged', () => {
    const jsonSpy = vi.fn();
    const { host, statusFn } = makeHost(jsonSpy);
    filter.catch(new ForbiddenException('Insufficient permissions'), host);
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    const body = jsonSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(body.statusCode).toBe(HttpStatus.FORBIDDEN);
  });

  it('forwards HttpException 404 (NotFoundException) unchanged', () => {
    const jsonSpy = vi.fn();
    const { host, statusFn } = makeHost(jsonSpy);
    filter.catch(new NotFoundException('Not found'), host);
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
  });

  it('forwards HttpException 400 (BadRequestException) thrown by app code unchanged', () => {
    const jsonSpy = vi.fn();
    const { host, statusFn } = makeHost(jsonSpy);
    // App code throws BadRequestException directly (e.g. Zod validation failure)
    filter.catch(new BadRequestException({ message: 'validation error', errors: [] }), host);
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    // Body must be the app-thrown shape, not the generic 22P02 body
    const body = jsonSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    // NestJS BadRequestException wraps the provided object inside getResponse()
    expect(body).toMatchObject({ message: 'validation error', errors: [] });
  });

  // ── 22P02 → 400 ───────────────────────────────────────────────────────────

  it('maps a DrizzleQueryError with cause.code=22P02 → 400 Bad Request', () => {
    const jsonSpy = vi.fn();
    const { host, statusFn } = makeHost(jsonSpy);
    const drizzleErr = Object.assign(new Error('DrizzleQueryError'), {
      cause: { code: '22P02', message: 'invalid input syntax for type uuid: "junk"' },
    });
    filter.catch(drizzleErr, host);
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const body = jsonSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(body.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(body.message).toBe('Bad Request');
  });

  it('400 body from 22P02 contains no stack, SQL, or DB detail', () => {
    const jsonSpy = vi.fn();
    const { host } = makeHost(jsonSpy);
    const drizzleErr = Object.assign(new Error('DrizzleQueryError'), {
      cause: { code: '22P02', message: 'invalid input syntax for type uuid: "not-a-uuid"' },
    });
    filter.catch(drizzleErr, host);
    const body = jsonSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    // Must NOT expose internal error detail
    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toContain('22P02');
    expect(bodyStr).not.toContain('stack');
    expect(bodyStr).not.toContain('invalid input syntax');
    expect(bodyStr).not.toContain('DrizzleQueryError');
  });

  it('maps a double-wrapped cause.cause.code=22P02 error → 400', () => {
    const jsonSpy = vi.fn();
    const { host, statusFn } = makeHost(jsonSpy);
    const doubleWrapped = Object.assign(new Error('outer'), {
      cause: {
        message: 'middle',
        cause: { code: '22P02' },
      },
    });
    filter.catch(doubleWrapped, host);
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
  });

  // ── HttpException is NOT mis-classified as 22P02 ──────────────────────────

  it('a BadRequestException (HttpException) is NOT intercepted by 22P02 branch', () => {
    // Verify ordering: HttpException check runs first, so BadRequestException
    // thrown by app code (not a DrizzleQueryError) forwards the app's body.
    const jsonSpy = vi.fn();
    const { host, statusFn } = makeHost(jsonSpy);
    // Construct a BadRequestException whose message coincidentally mentions uuid
    filter.catch(new BadRequestException('uuid param missing'), host);
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const body = jsonSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    // NestJS wraps string messages as { message, statusCode, error } from getResponse()
    const message = typeof body.message === 'string' ? body.message : JSON.stringify(body.message);
    expect(message).toContain('uuid param missing');
  });

  // ── unknown error → 500 ───────────────────────────────────────────────────

  it('maps unknown non-HTTP error → 500', () => {
    const jsonSpy = vi.fn();
    const { host, statusFn } = makeHost(jsonSpy);
    filter.catch(new TypeError('something completely unexpected'), host);
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const body = jsonSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(body.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(body.message).toBe('Internal server error');
  });

  it('maps thrown plain object → 500 (not a DB error, not HttpException)', () => {
    const jsonSpy = vi.fn();
    const { host, statusFn } = makeHost(jsonSpy);
    filter.catch({ reason: 'some library threw a plain object' }, host);
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});
