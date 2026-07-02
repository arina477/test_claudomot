/**
 * Integration test: AccountDataService.getAccountData + exportAccountData — IDOR self-scoping.
 *
 * Wave-35 privacy regression: both service methods take a single `userId` parameter
 * derived from `req.session.getUserId()` in PrivacyController. There is no
 * route-level userId parameter that an external caller could override — the
 * controller at privacy.controller.ts:62 does not accept a ?userId query param.
 *
 * These tests assert:
 *   1. getAccountData(A) returns profile.userId === A (scoped to A).
 *   2. exportAccountData(A) returns the same self-scoped result.
 *   3. Calling with distinct user IDs (A vs B) resolves to distinct, non-overlapping
 *      responses — proving each userId resolves independently.
 *   4. A's memberships do NOT contain servers B never joined, and vice versa.
 *
 * CF-2 (LOAD-BEARING): pg-harness MUST be the first import.
 */

// CF-2 side-effect import: sets process.env.DATABASE_URL = DATABASE_URL_TEST
// at module-eval time so the lazy db singleton resolves to the test DB.
import './pg-harness';
import {
  countRows,
  insertFixtureMembership,
  insertFixtureServer,
  insertFixtureUser,
  setupHarness,
  teardownHarness,
  truncateTables,
} from './pg-harness';

// SUT import AFTER harness so the lazy db proxy resolves to the test DB.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccountDataService } from '../../src/privacy/account-data.service';

// Skip-with-reason when DATABASE_URL_TEST is absent.
const SKIP = !process.env.DATABASE_URL_TEST;

// ---------------------------------------------------------------------------
// Fixture constants
// ---------------------------------------------------------------------------

// Server A owned by USER_A — USER_B never joins
const SERVER_A_ID = 'b0000000-0000-0000-0000-000000000001';

// User IDs (text PK)
const USER_A_ID = 'idor-user-a';
const USER_B_ID = 'idor-user-b';

describe.skipIf(SKIP)(
  'AccountDataService.getAccountData + exportAccountData — IDOR self-scoping (wave-35 regression)',
  () => {
    let sut!: AccountDataService;

    beforeAll(async () => {
      await setupHarness();
      // AccountDataService has no constructor dependencies — instantiate directly.
      sut = new AccountDataService();
    });

    afterAll(async () => {
      await teardownHarness();
    });

    beforeEach(async () => {
      await truncateTables();

      // User A owns a server and is a member; User B has no memberships at all.
      // This asymmetry makes cross-user leakage immediately detectable:
      // any B call returning SERVER_A in memberships would indicate an IDOR.
      await insertFixtureUser(USER_A_ID, 'idor-a@idor.test');
      await insertFixtureUser(USER_B_ID, 'idor-b@idor.test');
      await insertFixtureServer(SERVER_A_ID, USER_A_ID, 'A Only Server');
      await insertFixtureMembership(SERVER_A_ID, USER_A_ID);
      // USER_B_ID intentionally has no server_members row
    });

    // -----------------------------------------------------------------------
    // Sanity: real rows exist after seed.
    // Prevents silent-skip if fixture inserts are no-ops (e.g. due to ID collision
    // with a previous test run and ON CONFLICT DO NOTHING).
    // -----------------------------------------------------------------------

    it('sanity: users table has 2 real rows after seed (non-trivial real-DB write proof)', async () => {
      const n = await countRows('users');
      expect(n).toBeGreaterThanOrEqual(2);
    });

    // -----------------------------------------------------------------------
    // getAccountData — self-scoped: A sees only A's data
    // -----------------------------------------------------------------------

    it('getAccountData(A): profile.userId === A, email === A email, 1 membership (SERVER_A)', async () => {
      const data = await sut.getAccountData(USER_A_ID);

      // Profile is scoped to A
      expect(data.profile.userId).toBe(USER_A_ID);
      expect(data.profile.email).toBe('idor-a@idor.test');

      // Memberships contain only SERVER_A (A joined; no other servers seeded)
      expect(data.memberships).toHaveLength(1);
      expect(data.memberships[0]?.serverId).toBe(SERVER_A_ID);
      expect(data.memberships[0]?.serverName).toBe('A Only Server');

      // Activity summary reflects real membership count
      expect(data.activitySummary.serversJoined).toBe(1);
    });

    it('getAccountData(B): profile.userId === B, email === B email, 0 memberships (B joined nothing)', async () => {
      const data = await sut.getAccountData(USER_B_ID);

      // Profile is scoped to B
      expect(data.profile.userId).toBe(USER_B_ID);
      expect(data.profile.email).toBe('idor-b@idor.test');

      // B has no memberships
      expect(data.memberships).toHaveLength(0);
      expect(data.activitySummary.serversJoined).toBe(0);
    });

    it('getAccountData(A) and getAccountData(B) return distinct, non-overlapping profiles', async () => {
      const dataA = await sut.getAccountData(USER_A_ID);
      const dataB = await sut.getAccountData(USER_B_ID);

      // Each call resolves to its own user — no cross-contamination
      expect(dataA.profile.userId).toBe(USER_A_ID);
      expect(dataB.profile.userId).toBe(USER_B_ID);
      expect(dataA.profile.userId).not.toBe(dataB.profile.userId);
      expect(dataA.profile.email).not.toBe(dataB.profile.email);

      // A's server does NOT appear in B's memberships
      const bServerIds = dataB.memberships.map((m) => m.serverId);
      expect(bServerIds).not.toContain(SERVER_A_ID);

      // SERVER_A appears in A's memberships but not B's — proves WHERE clause is userId-bound
      const aServerIds = dataA.memberships.map((m) => m.serverId);
      expect(aServerIds).toContain(SERVER_A_ID);
    });

    // -----------------------------------------------------------------------
    // IDOR structural proof
    //
    // The service queries server_members WHERE user_id = userId (the param),
    // and the controller derives userId exclusively from req.session.getUserId().
    // There is no URL/query/body parameter that a caller could supply to see
    // another user's data. The test below confirms this by showing that a call
    // bound to USER_A_ID never returns USER_B_ID's rows (and vice versa), even
    // when both users exist in the same DB.
    // -----------------------------------------------------------------------

    it('IDOR structural proof: A cannot obtain B memberships, B cannot obtain A memberships', async () => {
      // Simulate two independent session-scoped calls
      const dataForA = await sut.getAccountData(USER_A_ID);
      const dataForB = await sut.getAccountData(USER_B_ID);

      // A's response contains only A's profile fields
      expect(dataForA.profile.email).toBe('idor-a@idor.test');
      // A's memberships list SERVER_A; B's list is empty — no leakage
      expect(dataForA.memberships.map((m) => m.serverId)).toContain(SERVER_A_ID);
      expect(dataForB.memberships.map((m) => m.serverId)).not.toContain(SERVER_A_ID);

      // B's response contains only B's profile fields
      expect(dataForB.profile.email).toBe('idor-b@idor.test');
    });

    // -----------------------------------------------------------------------
    // exportAccountData — same self-scoped guarantee as getAccountData
    //
    // exportAccountData delegates to getAccountData; the controller differs only
    // in setting Content-Disposition: attachment for download. Data scoping is
    // identical.
    // -----------------------------------------------------------------------

    it('exportAccountData(A) returns profile.userId === A and memberships scoped to A', async () => {
      const data = await sut.exportAccountData(USER_A_ID);

      expect(data.profile.userId).toBe(USER_A_ID);
      expect(data.profile.userId).not.toBe(USER_B_ID);
      expect(data.memberships).toHaveLength(1);
      expect(data.memberships[0]?.serverId).toBe(SERVER_A_ID);
    });

    it('exportAccountData(A) returns data structurally identical to getAccountData(A)', async () => {
      const exported = await sut.exportAccountData(USER_A_ID);
      const fetched = await sut.getAccountData(USER_A_ID);

      expect(exported.profile.userId).toBe(fetched.profile.userId);
      expect(exported.memberships).toHaveLength(fetched.memberships.length);
      expect(exported.activitySummary.serversJoined).toBe(fetched.activitySummary.serversJoined);
    });
  },
);

// When DATABASE_URL_TEST is not set, emit a clear skip message (not a silent pass).
if (SKIP) {
  describe('AccountDataService.getAccountData + exportAccountData — IDOR self-scoping (wave-35 regression)', () => {
    it.skip('SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run integration tests locally', () => {});
  });
}
