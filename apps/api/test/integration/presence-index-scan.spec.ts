/**
 * Integration test: server_members(user_id) index — EXPLAIN proof (wave-27 Spec A).
 *
 * AC2: asserts that getServerIdsForUser's WHERE user_id query uses
 *      server_members_user_id_idx (Index Scan, NOT Seq Scan).
 * AC3: behavior-preserving — the returned server ID set is correct.
 *
 * CF-2 (LOAD-BEARING): pg-harness MUST be the first import. It sets
 * process.env.DATABASE_URL = process.env.DATABASE_URL_TEST at module-eval
 * time, before any SUT module is imported.
 */
// CF-2 side-effect import: sets process.env.DATABASE_URL = DATABASE_URL_TEST
// at module-eval time so the lazy db singleton resolves to the test DB.
import './pg-harness';
import {
  harnessExplainWithSeqscanOff,
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

const SERVER_X = '10000000-0000-0000-0001-000000000001';
const SERVER_Y = '10000000-0000-0000-0001-000000000002';

const USER_X = 'index-scan-user-x';
const USER_Y = 'index-scan-user-y';
const USER_Z = 'index-scan-user-z';

describe.skipIf(SKIP)(
  'server_members_user_id_idx — EXPLAIN proof + behavior-preserving correctness',
  () => {
    let sut!: PresenceService;

    beforeAll(async () => {
      await setupHarness();
      sut = new PresenceService();
    });

    afterAll(async () => {
      await teardownHarness();
    });

    beforeEach(async () => {
      await truncateTables();
    });

    // -----------------------------------------------------------------------
    // AC2: EXPLAIN proves Index Scan on server_members_user_id_idx
    //
    // We use EXPLAIN (FORMAT TEXT) and assert the plan text:
    //   - contains "Index Scan"
    //   - contains "server_members_user_id_idx"
    //   - does NOT contain "Seq Scan" on server_members
    //
    // The query mirrors exactly what getServerIdsForUser executes via Drizzle:
    //   SELECT server_id FROM server_members WHERE user_id = $1
    // -----------------------------------------------------------------------
    it('EXPLAIN confirms Index Scan on server_members_user_id_idx for WHERE user_id = $1', async () => {
      // Seed a user + server + membership so the planner sees real rows.
      // Table cardinality does NOT determine the outcome: we use
      // enable_seqscan=off (see below) to force the planner to cost the index
      // path, making the assertion deterministic regardless of row count.
      await insertFixtureUser(USER_X, 'index-scan-user-x@test.local');
      await insertFixtureServer(SERVER_X, USER_X, 'Index-Scan Server');
      await insertFixtureMembership(SERVER_X, USER_X);

      // EXPLAIN (not EXPLAIN ANALYZE — no execution, deterministic in CI).
      // FORMAT TEXT produces the human-readable plan string.
      //
      // `harnessExplainWithSeqscanOff` wraps the EXPLAIN in a single dedicated
      // connection: BEGIN → SET LOCAL enable_seqscan = off → EXPLAIN → ROLLBACK.
      // SET LOCAL disables sequential scans for the duration of this transaction
      // only, forcing the planner to use the index path if one is eligible.
      // This proves the index is USABLE (not merely cost-preferred on a large
      // table), which is the correct invariant for a schema migration proof test.
      type ExplainRow = { 'QUERY PLAN': string };
      const planRows = await harnessExplainWithSeqscanOff<ExplainRow>(
        'EXPLAIN (FORMAT TEXT) SELECT server_id FROM server_members WHERE user_id = $1',
        [USER_X],
      );

      const planText = planRows.map((r) => r['QUERY PLAN']).join('\n');

      // Index must be present and usable — not a sequential scan.
      expect(planText, `Expected "Index Scan" in plan:\n${planText}`).toMatch(/Index Scan/i);
      expect(
        planText,
        `Expected index name "server_members_user_id_idx" in plan:\n${planText}`,
      ).toContain('server_members_user_id_idx');
      expect(
        planText,
        `Expected NO "Seq Scan" in plan (got Seq Scan — index is missing or not usable):\n${planText}`,
      ).not.toMatch(/Seq Scan on server_members/i);
    });

    // -----------------------------------------------------------------------
    // AC3: behavior-preserving — getServerIdsForUser returns correct IDs
    //
    // Topology:
    //   USER_X → SERVER_X + SERVER_Y
    //   USER_Y → SERVER_X (co-member; should not appear in getServerIdsForUser(USER_X))
    //   USER_Z → no memberships
    //
    // Assert getServerIdsForUser(USER_X) = {SERVER_X, SERVER_Y} exactly.
    // The index must not affect which rows are returned — same semantics as a Seq Scan.
    // -----------------------------------------------------------------------
    it('getServerIdsForUser returns correct server IDs unchanged after index addition', async () => {
      await insertFixtureUser(USER_X, 'index-scan-user-x@test.local');
      await insertFixtureUser(USER_Y, 'index-scan-user-y@test.local');
      await insertFixtureUser(USER_Z, 'index-scan-user-z@test.local');

      await insertFixtureServer(SERVER_X, USER_X, 'Server X');
      await insertFixtureServer(SERVER_Y, USER_X, 'Server Y');

      // USER_X belongs to both servers; USER_Y only to SERVER_X; USER_Z has none
      await insertFixtureMembership(SERVER_X, USER_X);
      await insertFixtureMembership(SERVER_Y, USER_X);
      await insertFixtureMembership(SERVER_X, USER_Y);

      const serverIds = await sut.getServerIdsForUser(USER_X);

      // Must contain both SERVER_X and SERVER_Y — order not guaranteed
      expect(serverIds).toHaveLength(2);
      expect(serverIds).toContain(SERVER_X);
      expect(serverIds).toContain(SERVER_Y);

      // USER_Y has only SERVER_X
      const yServers = await sut.getServerIdsForUser(USER_Y);
      expect(yServers).toHaveLength(1);
      expect(yServers).toContain(SERVER_X);

      // USER_Z has no memberships → empty
      const zServers = await sut.getServerIdsForUser(USER_Z);
      expect(zServers).toHaveLength(0);
    });
  },
);

// When DATABASE_URL_TEST is not set, emit a clear skip message (not a silent pass).
if (SKIP) {
  describe('server_members_user_id_idx — EXPLAIN proof + behavior-preserving correctness', () => {
    it.skip('SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run integration tests locally', () => {});
  });
}
