import 'reflect-metadata';
import { ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Isolate the unit under test — mock the DB module so no real connection
// is required.  We only test the error-mapping logic inside UsersService.
// ---------------------------------------------------------------------------

vi.mock('../db/index', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
  },
}));

import { db } from '../db/index';
import { UsersService } from './users.service';

// ---------------------------------------------------------------------------
// Helper — builds the error shape drizzle-orm actually throws:
//   DrizzleQueryError (outer) → PG DatabaseError (inner, at .cause)
// The outer error has no `.code`; the real PG code lives one level deep.
// ---------------------------------------------------------------------------
function makeDrizzleUniqueViolation(): Error {
  const pgError = new Error('duplicate key value violates unique constraint') as Error & {
    code: string;
    constraint: string;
  };
  pgError.code = '23505';
  pgError.constraint = 'users_username_lower_idx';

  // Mirrors DrizzleQueryError construction (drizzle-orm/errors.js)
  const drizzleError = new Error('Failed query: UPDATE "users" SET ...\nparams: [...]') as Error & {
    query: string;
    params: unknown[];
    cause: unknown;
  };
  drizzleError.query = 'UPDATE "users" SET "username" = $1 WHERE "id" = $2';
  drizzleError.params = ['takenuser', 'user-abc'];
  drizzleError.cause = pgError;

  return drizzleError;
}

// ---------------------------------------------------------------------------
// Fluent mock builder for the Drizzle update chain:  db.update().set().where()
// ---------------------------------------------------------------------------
function mockUpdateRejectedWith(err: unknown) {
  const chain = { set: vi.fn(), where: vi.fn() };
  chain.set.mockReturnValue(chain);
  chain.where.mockRejectedValue(err);
  (db.update as ReturnType<typeof vi.fn>).mockReturnValue(chain);
}

function mockUpdateResolvedWith(value: unknown = undefined) {
  const chain = { set: vi.fn(), where: vi.fn() };
  chain.set.mockReturnValue(chain);
  chain.where.mockResolvedValue(value);
  (db.update as ReturnType<typeof vi.fn>).mockReturnValue(chain);
}

// ---------------------------------------------------------------------------

describe('UsersService.updateProfile — unique-violation mapping', () => {
  let service: UsersService;

  beforeEach(() => {
    service = new UsersService();
    vi.clearAllMocks();
  });

  it('throws ConflictException (409) when drizzle wraps PG 23505 at err.cause.code', async () => {
    // This is the REAL error shape drizzle emits — code lives at err.cause.code,
    // NOT at err.code.  The previous synthetic { code: '23505' } mock masked the bug.
    mockUpdateRejectedWith(makeDrizzleUniqueViolation());

    await expect(service.updateProfile('user-abc', { username: 'takenuser' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('throws ConflictException (409) for legacy flat PG error (err.code === 23505)', async () => {
    // Guard: plain PG driver error (no drizzle wrapping) also maps correctly.
    const flatPgError = new Error('duplicate key') as Error & { code: string };
    flatPgError.code = '23505';
    mockUpdateRejectedWith(flatPgError);

    await expect(service.updateProfile('user-abc', { username: 'takenuser' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('rethrows unrelated DB errors unchanged', async () => {
    const connectionError = new Error('connection refused');
    mockUpdateRejectedWith(connectionError);

    await expect(service.updateProfile('user-abc', { username: 'someuser' })).rejects.toThrow(
      'connection refused',
    );

    // Must NOT be wrapped in ConflictException
    await expect(service.updateProfile('user-abc', { username: 'someuser' })).rejects.not.toThrow(
      ConflictException,
    );
  });

  it('resolves without throwing when update succeeds (happy path)', async () => {
    mockUpdateResolvedWith();

    await expect(
      service.updateProfile('user-abc', { displayName: 'Alice', username: 'alice_42' }),
    ).resolves.toBeUndefined();
  });
});
