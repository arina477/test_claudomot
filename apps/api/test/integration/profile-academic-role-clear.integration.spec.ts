/**
 * Integration test: wave-78 B-2 (task 4be3b084) — clearing academicRole persists
 * SQL NULL, real-Postgres via the pg-harness.
 *
 * The write-path distinction under test (three-way):
 *   - academicRole ABSENT (undefined) → column untouched (partial PATCH)
 *   - academicRole === null           → column set to SQL NULL (CLEARED)
 *   - academicRole === 'educator'|... → column set to the enum string
 *
 * B-1 already made UpdateProfileSchema.academicRole preprocess '' → null, so at the
 * HTTP boundary an empty-string select maps to null (a clear). This spec proves the
 * SERVICE persists that null as SQL NULL and a subsequent read returns null — the
 * gap karen flagged at P-4 (patch column type was `string`, could not carry null).
 *
 * Non-enum values are rejected at the Zod contract boundary (400) by
 * UpdateProfileSchema, NOT by the service — so this spec does not exercise them
 * (the service param type is AcademicRole | null | undefined; garbage never reaches it).
 *
 * CF-2 (LOAD-BEARING): pg-harness MUST be the first import.
 */
// CF-2 side-effect import: sets process.env.DATABASE_URL = DATABASE_URL_TEST
import './pg-harness';
import {
  harnessQuery,
  insertFixtureUser,
  setupHarness,
  teardownHarness,
  truncateTables,
} from './pg-harness';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { UsersService } from '../../src/users/users.service';

// Skip when DATABASE_URL_TEST is absent.
const SKIP = !process.env.DATABASE_URL_TEST;

const USER = 'ar-user';

// Read the stored academic_role for USER via the SEPARATE harness connection —
// proves committed cross-connection visibility, not just in-session SUT state.
async function readAcademicRole(): Promise<string | null> {
  const rows = await harnessQuery<{ academic_role: string | null }>(
    'SELECT academic_role FROM users WHERE id = $1',
    [USER],
  );
  return rows[0]?.academic_role ?? null;
}

describe.skipIf(SKIP)('UsersService.updateProfile — academicRole clear (wave-78 4be3b084)', () => {
  let usersService: UsersService;

  beforeAll(async () => {
    await setupHarness();
    usersService = new UsersService();
  });

  afterAll(async () => {
    await teardownHarness();
  });

  beforeEach(async () => {
    await truncateTables();
    await insertFixtureUser(USER, 'ar-user@test.local', 'aruser');
  });

  // 1. set 'educator' then clear with null → column is SQL NULL; read returns null.
  it('set educator then null → academic_role is SQL NULL (cleared)', async () => {
    await usersService.updateProfile(USER, { academicRole: 'educator' });
    expect(await readAcademicRole()).toBe('educator');

    await usersService.updateProfile(USER, { academicRole: null });
    // Column is genuinely SQL NULL (harnessQuery returns JS null for a NULL cell).
    const rows = await harnessQuery<{ academic_role: string | null }>(
      'SELECT academic_role FROM users WHERE id = $1',
      [USER],
    );
    expect(rows[0]?.academic_role).toBeNull();

    // And a service read (findById) surfaces it as null.
    const user = await usersService.findById(USER);
    expect(user?.academic_role).toBeNull();
  });

  // 2. academicRole ABSENT (undefined) after 'educator' → NOT clobbered (undefined ≠ null).
  it('academicRole absent (undefined) → stays educator, not clobbered', async () => {
    await usersService.updateProfile(USER, { academicRole: 'educator' });
    expect(await readAcademicRole()).toBe('educator');

    // Update a DIFFERENT field only; academicRole is absent from the patch.
    await usersService.updateProfile(USER, { displayName: 'Ada Lovelace' });

    // academic_role untouched — undefined must not write NULL.
    expect(await readAcademicRole()).toBe('educator');
    const user = await usersService.findById(USER);
    expect(user?.display_name).toBe('Ada Lovelace');
  });

  // 3. set 'staff' → persists 'staff'.
  it("set academicRole 'staff' → persists 'staff'", async () => {
    await usersService.updateProfile(USER, { academicRole: 'staff' });
    expect(await readAcademicRole()).toBe('staff');
  });

  // 4. clear from an already-null state is a no-op clear (idempotent) → stays NULL.
  it('clear (null) from already-null state → stays NULL', async () => {
    // fixture user starts with academic_role NULL
    expect(await readAcademicRole()).toBeNull();
    await usersService.updateProfile(USER, { academicRole: null });
    expect(await readAcademicRole()).toBeNull();
  });
});

// When DATABASE_URL_TEST is not set, emit a clear skip message.
if (SKIP) {
  describe('UsersService.updateProfile — academicRole clear (wave-78 4be3b084)', () => {
    it.skip('SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run integration tests locally', () => {});
  });
}
