/**
 * Integration test: PresenceService.getCoMemberUserIds — real-Postgres co-member resolution.
 *
 * AC1 (wave-24 B-2): Inserts real server + server_members rows via the harness,
 * then exercises the live DB query path in getCoMemberUserIds and asserts on
 * returned user IDs. No mock DB, no stubbed query.
 *
 * CF-2 (LOAD-BEARING): pg-harness MUST be the first import. It sets
 * process.env.DATABASE_URL = process.env.DATABASE_URL_TEST at module-eval
 * time, before any SUT module is imported.
 */
// CF-2 side-effect import: sets process.env.DATABASE_URL = DATABASE_URL_TEST
// at module-eval time so the lazy db singleton resolves to the test DB.
import './pg-harness';
import {
  insertFixtureMembership,
  insertFixtureServer,
  insertFixtureUser,
  setupHarness,
  teardownHarness,
  truncateTables,
} from './pg-harness';

// SUT import AFTER harness so the lazy db proxy resolves to the test DB.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PresenceService } from '../../src/presence/presence.service';

// Skip-with-reason when DATABASE_URL_TEST is absent (local dev without PG).
// Runs in CI where the Postgres 16 service + DATABASE_URL_TEST are provided.
const SKIP = !process.env.DATABASE_URL_TEST;

// ---------------------------------------------------------------------------
// Fixture constants
// ---------------------------------------------------------------------------

// Server IDs (UUID)
const SERVER_A = '00000000-0000-0000-0001-000000000001';
const SERVER_B = '00000000-0000-0000-0001-000000000002';

// User IDs (text PK, mirrors users.id type)
const USER_A = 'presence-user-a';
const USER_B = 'presence-user-b';
const USER_C = 'presence-user-c';
const USER_D = 'presence-user-d';

describe.skipIf(SKIP)(
  'PresenceService.getCoMemberUserIds — real-Postgres co-member resolution',
  () => {
    let sut!: PresenceService;

    beforeAll(async () => {
      await setupHarness();
      // PresenceService has no constructor dependencies — safe to instantiate directly.
      sut = new PresenceService();
    });

    afterAll(async () => {
      await teardownHarness();
    });

    beforeEach(async () => {
      await truncateTables();
    });

    // -----------------------------------------------------------------------
    // Load-bearing AC: shared server → co-member returned; isolated server → excluded.
    //
    // Topology:
    //   SERVER_A: USER_A + USER_B  (shared server)
    //   SERVER_B: USER_C           (separate server, not shared with A)
    //
    // Assertion: getCoMemberUserIds(USER_A) queries server_members twice (via
    // getServerIdsForUser then inArray) and returns exactly [USER_B].
    // USER_A is self-excluded; USER_C shares no server with USER_A.
    // -----------------------------------------------------------------------
    it('returns co-members from a shared server, excludes self + non-shared-server users', async () => {
      // Insert users before servers (FK: servers.owner_id → users.id)
      await insertFixtureUser(USER_A, 'presence-user-a@test.local');
      await insertFixtureUser(USER_B, 'presence-user-b@test.local');
      await insertFixtureUser(USER_C, 'presence-user-c@test.local');

      // Insert servers (USER_C owns SERVER_B to satisfy FK)
      await insertFixtureServer(SERVER_A, USER_A, 'Server Alpha');
      await insertFixtureServer(SERVER_B, USER_C, 'Server Beta');

      // USER_A and USER_B both in SERVER_A; USER_C is in SERVER_B only
      await insertFixtureMembership(SERVER_A, USER_A);
      await insertFixtureMembership(SERVER_A, USER_B);
      await insertFixtureMembership(SERVER_B, USER_C);

      // Real DB round-trip: getCoMemberUserIds → getServerIdsForUser (SELECT DISTINCT
      // server_id) + inArray query (SELECT user_id WHERE server_id IN [...])
      const coMembers = await sut.getCoMemberUserIds(USER_A);

      expect(coMembers).toHaveLength(1);
      expect(coMembers).toContain(USER_B);
      expect(coMembers).not.toContain(USER_A); // self must be excluded
      expect(coMembers).not.toContain(USER_C); // different server — no shared membership
    });

    // -----------------------------------------------------------------------
    // Edge case: user with zero server memberships → empty array (early return
    // path: getServerIdsForUser returns [] → getCoMemberUserIds returns []).
    // -----------------------------------------------------------------------
    it('returns empty array for a user with no server memberships', async () => {
      await insertFixtureUser(USER_D, 'presence-user-d@test.local');
      // No memberships inserted for USER_D

      // Real DB round-trip: getServerIdsForUser returns [] → early return []
      const coMembers = await sut.getCoMemberUserIds(USER_D);

      expect(coMembers).toHaveLength(0);
    });
  },
);

// When DATABASE_URL_TEST is not set, emit a clear skip message (not a silent pass).
if (SKIP) {
  describe('PresenceService.getCoMemberUserIds — real-Postgres co-member resolution', () => {
    it.skip('SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run integration tests locally', () => {});
  });
}
