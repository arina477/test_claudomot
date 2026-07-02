/**
 * Integration test: ServersService.listServerMembers — real-Postgres profile_visibility filter.
 *
 * Wave-35 privacy regression: the filter at servers.service.ts:253
 *   `r.profileVisibility !== 'nobody' || r.userId === userId`
 * is exercised against real Postgres rows with all three profile_visibility enum values
 * ('nobody', 'everyone', 'server-members'). The column was shipped in wave-35
 * migration 0014_sparkling_gorgon.sql — no schema change needed here.
 *
 * profile_visibility is set via harnessQuery UPDATE because insertFixtureUser
 * has no profile_visibility param.
 *
 * CF-2 (LOAD-BEARING): pg-harness MUST be the first import.
 */

// CF-2 side-effect import: sets process.env.DATABASE_URL = DATABASE_URL_TEST
// at module-eval time so the lazy db singleton resolves to the test DB.
import './pg-harness';
import {
  countRows,
  harnessQuery,
  insertFixtureMembership,
  insertFixtureServer,
  insertFixtureUser,
  setupHarness,
  teardownHarness,
  truncateTables,
} from './pg-harness';

// SUT import AFTER harness so the lazy db proxy resolves to the test DB.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ServersService } from '../../src/servers/servers.service';

// Skip-with-reason when DATABASE_URL_TEST is absent.
const SKIP = !process.env.DATABASE_URL_TEST;

// ---------------------------------------------------------------------------
// Fixture constants
// ---------------------------------------------------------------------------

const SERVER_ID = 'a0000000-0000-0000-0000-000000000001';

// User IDs (text PK) — A owns the server; B is a co-member
const USER_A_ID = 'priv-user-a';
const USER_B_ID = 'priv-user-b';

describe.skipIf(SKIP)(
  'ServersService.listServerMembers — profile_visibility filter (wave-35 privacy regression)',
  () => {
    let sut!: ServersService;

    beforeAll(async () => {
      await setupHarness();
      // ServersService constructor requires rbacService, but listServerMembers
      // does not call it — pass a stub exactly as servers-member-gate.spec.ts does.
      sut = new ServersService({} as never);
    });

    afterAll(async () => {
      await teardownHarness();
    });

    beforeEach(async () => {
      await truncateTables();

      // Users: A owns server; B is a co-member. Both start with default
      // profile_visibility='everyone' (the column DEFAULT from migration 0014).
      await insertFixtureUser(USER_A_ID, 'priv-a@privacy.test');
      await insertFixtureUser(USER_B_ID, 'priv-b@privacy.test');

      // Server and both memberships
      await insertFixtureServer(SERVER_ID, USER_A_ID, 'Privacy Filter Server');
      await insertFixtureMembership(SERVER_ID, USER_A_ID);
      await insertFixtureMembership(SERVER_ID, USER_B_ID);
    });

    // -----------------------------------------------------------------------
    // Sanity: real rows exist in the database before any visibility filter
    // is applied. This assertion prevents a silent-skip scenario where all
    // fixture inserts are no-ops (e.g. ON CONFLICT DO NOTHING if IDs collide
    // across wave cycles) and the test passes vacuously on an empty roster.
    // -----------------------------------------------------------------------

    it('sanity: server_members has 2 real rows after seed (non-trivial real-DB write proof)', async () => {
      const n = await countRows('server_members');
      expect(n).toBeGreaterThanOrEqual(2);
    });

    // -----------------------------------------------------------------------
    // profile_visibility = 'nobody'
    //
    // Filter: `r.profileVisibility !== 'nobody' || r.userId === userId`
    //   → When viewer is B: A fails both branches (A.visibility === 'nobody', A !== B) → excluded.
    //   → When viewer is A: A passes the second branch (A === A) → self always visible.
    // -----------------------------------------------------------------------

    it("'nobody': A is excluded from B's roster but included in A's own roster (self-always-visible)", async () => {
      await harnessQuery<Record<string, unknown>>(
        'UPDATE users SET profile_visibility=$1 WHERE id=$2',
        ['nobody', USER_A_ID],
      );

      // B's view: A should be absent (A set visibility='nobody' and A !== B)
      const rosterByB = await sut.listServerMembers(USER_B_ID, SERVER_ID);
      const idsByB = rosterByB.map((m) => m.userId);
      expect(idsByB).not.toContain(USER_A_ID);
      expect(idsByB).toContain(USER_B_ID);
      expect(rosterByB.length).toBe(1); // only B visible to B

      // A's view: A must appear despite setting own visibility='nobody' (self-inclusion rule)
      const rosterByA = await sut.listServerMembers(USER_A_ID, SERVER_ID);
      const idsByA = rosterByA.map((m) => m.userId);
      expect(idsByA).toContain(USER_A_ID); // self always visible
      expect(idsByA).toContain(USER_B_ID); // B is 'everyone' → still visible to A
      expect(rosterByA.length).toBe(2);
    });

    it("'nobody': roster length for B drops from 2 (default) to 1 after A sets visibility='nobody' (provable before/after delta)", async () => {
      // Baseline: both users have default profile_visibility='everyone' → 2 members visible
      const baseline = await sut.listServerMembers(USER_B_ID, SERVER_ID);
      expect(baseline.length).toBe(2); // proves real rows and default filter passes both

      // Apply 'nobody' to A
      await harnessQuery<Record<string, unknown>>(
        'UPDATE users SET profile_visibility=$1 WHERE id=$2',
        ['nobody', USER_A_ID],
      );

      // After: B's roster shrinks by exactly 1 (A removed)
      const filtered = await sut.listServerMembers(USER_B_ID, SERVER_ID);
      expect(filtered.length).toBe(1);
      expect(filtered.length).toBeLessThan(baseline.length);
      expect(filtered.map((m) => m.userId)).not.toContain(USER_A_ID);
    });

    // -----------------------------------------------------------------------
    // profile_visibility = 'everyone'
    //
    // 'everyone' passes the first branch of the filter (visibility !== 'nobody')
    // → no members excluded.
    // -----------------------------------------------------------------------

    it("'everyone': A is visible to B (no filtering applied — default verified explicitly)", async () => {
      await harnessQuery<Record<string, unknown>>(
        'UPDATE users SET profile_visibility=$1 WHERE id=$2',
        ['everyone', USER_A_ID],
      );

      const roster = await sut.listServerMembers(USER_B_ID, SERVER_ID);
      const ids = roster.map((m) => m.userId);
      expect(ids).toContain(USER_A_ID);
      expect(ids).toContain(USER_B_ID);
      expect(roster.length).toBe(2);
    });

    // -----------------------------------------------------------------------
    // profile_visibility = 'server-members'
    //
    // 'server-members' also passes the first branch (visibility !== 'nobody')
    // → member visible to co-members. Future DM-level enforcement is separate.
    // -----------------------------------------------------------------------

    it("'server-members': A is visible to B because B is a verified co-member of the same server", async () => {
      await harnessQuery<Record<string, unknown>>(
        'UPDATE users SET profile_visibility=$1 WHERE id=$2',
        ['server-members', USER_A_ID],
      );

      const roster = await sut.listServerMembers(USER_B_ID, SERVER_ID);
      const ids = roster.map((m) => m.userId);
      expect(ids).toContain(USER_A_ID);
      expect(ids).toContain(USER_B_ID);
      expect(roster.length).toBe(2);
    });
  },
);

// When DATABASE_URL_TEST is not set, emit a clear skip message (not a silent pass).
if (SKIP) {
  describe('ServersService.listServerMembers — profile_visibility filter (wave-35 privacy regression)', () => {
    it.skip('SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run integration tests locally', () => {});
  });
}
