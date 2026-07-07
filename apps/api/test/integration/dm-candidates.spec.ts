/**
 * Integration test: DmService.getDmCandidates — real-Postgres privacy-fence
 * negative-case controls (wave-48, task 03ccf636).
 *
 * Closes the two never-live-proven counter-example controls that wave-46/47
 * unit tests left as mock no-ops:
 *
 *   (a) who_can_dm='nobody' exclusion — caller shares a server with user X,
 *       but X.who_can_dm='nobody'. getDmCandidates(caller) MUST NOT include X.
 *       Also asserts a control user Y (who_can_dm='everyone') IS returned,
 *       proving the query returns co-members in general but filters the
 *       nobody-user specifically (exercises the real ne(who_can_dm,'nobody')
 *       WHERE predicate against real rows).
 *
 *   (b) Disjoint non-co-member isolation — user Z is a member of server T
 *       which the caller is NOT in (no shared server). getDmCandidates(caller)
 *       MUST NOT include Z (exercises the inArray(caller's servers) scope).
 *
 * CF-2 (LOAD-BEARING): pg-harness MUST be the first import. It sets
 * process.env.DATABASE_URL = process.env.DATABASE_URL_TEST at module-eval
 * time, before any SUT module is imported.
 */
// CF-2 side-effect import: sets process.env.DATABASE_URL = DATABASE_URL_TEST
// at module-eval time so the lazy db singleton resolves to the test DB.
import './pg-harness';
import { DM_CANDIDATES_LIMIT } from '../../src/dm/dm.service';
import {
  insertFixtureMembership,
  insertFixtureServer,
  insertFixtureUser,
  setupHarness,
  teardownHarness,
  truncateTables,
} from './pg-harness';

// SUT import AFTER harness so the lazy db proxy resolves to the test DB.
import { EventEmitter2 } from '@nestjs/event-emitter';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { BlocksService } from '../../src/blocks/blocks.service';
import { DmService } from '../../src/dm/dm.service';

// Skip-with-reason when DATABASE_URL_TEST is absent (local dev without PG).
// Runs in CI where the Postgres 16 service + DATABASE_URL_TEST are provided
// (see .github/workflows/ci.yml — test job sets DATABASE_URL_TEST).
const SKIP = !process.env.DATABASE_URL_TEST;

// ---------------------------------------------------------------------------
// Fixture constants — UUIDs for servers, text IDs for users (mirrors schema)
// ---------------------------------------------------------------------------

// Shared server (caller + nobody-user X + everyone-user Y are all members)
const SERVER_S = '00000000-0000-0000-0002-000000000001';
// Disjoint server (only user Z is a member; caller is NOT in this server)
const SERVER_T = '00000000-0000-0000-0002-000000000002';

const CALLER = 'dm-cand-caller';
// Co-member with who_can_dm='nobody' — must be excluded
const USER_X_NOBODY = 'dm-cand-x-nobody';
// Co-member with who_can_dm='everyone' — control user, must be included
const USER_Y_EVERYONE = 'dm-cand-y-everyone';
// Non-co-member (disjoint server) — must be excluded
const USER_Z_DISJOINT = 'dm-cand-z-disjoint';

// --- case (d) fixtures: defensive LIMIT cap (wave-56 B-2, task c5051444) ---
// Fresh non-colliding IDs — no overlap with cases a/b/c above.
const SERVER_D_SHARED = '00000000-0000-0000-0002-000000000005';
const CALLER_D = 'dm-cand-d-caller';
const USER_D1 = 'dm-cand-d-member-1';
const USER_D2 = 'dm-cand-d-member-2';
const USER_D3 = 'dm-cand-d-member-3';

// --- case (c) fixtures: who_can_dm='server-members' ---
// Shared server for case (c): caller + server-members-co-member are both in it
const SERVER_C_SHARED = '00000000-0000-0000-0002-000000000003';
// Disjoint server for case (c): only the disjoint server-members user is in it
const SERVER_C_DISJOINT = '00000000-0000-0000-0002-000000000004';
// Co-member with who_can_dm='server-members' in SERVER_C_SHARED — must be included
const USER_P_SERVERMEMBERS_COMEMBER = 'dm-cand-p-sm-comember';
// Non-co-member with who_can_dm='server-members' in SERVER_C_DISJOINT — must be excluded
const USER_Q_SERVERMEMBERS_DISJOINT = 'dm-cand-q-sm-disjoint';

describe.skipIf(SKIP)(
  'DmService.getDmCandidates — real-Postgres privacy-fence negative controls',
  () => {
    let sut!: DmService;

    beforeAll(async () => {
      await setupHarness();
      // DmService constructor requires EventEmitter2 + BlocksService.
      // getDmCandidates does not use either directly, but uses BlocksService
      // for the block HIDE predicate in the query (wave-70 addition). We pass a
      // real BlocksService here so the getDmCandidates integration tests remain
      // unaffected (no blocks seeded, so isBlockedBetween always returns false).
      const emitter = new EventEmitter2();
      const blocksService = new BlocksService();
      sut = new DmService(emitter, blocksService);
    });

    afterAll(async () => {
      await teardownHarness();
    });

    beforeEach(async () => {
      await truncateTables();
    });

    // -----------------------------------------------------------------------
    // (a) who_can_dm='nobody' exclusion
    //
    // Topology:
    //   SERVER_S: CALLER + USER_X_NOBODY (nobody) + USER_Y_EVERYONE (everyone)
    //
    // getDmCandidates(CALLER) should return [USER_Y_EVERYONE] and NOT include
    // USER_X_NOBODY. This exercises the real ne(users.who_can_dm,'nobody')
    // predicate against actual Postgres rows — not a pre-filtering mock.
    // -----------------------------------------------------------------------
    it('(a) excludes a co-member whose who_can_dm is "nobody"; includes the control everyone-user', async () => {
      // Insert users — CALLER owns SERVER_S (FK: servers.owner_id)
      await insertFixtureUser(CALLER, 'dm-cand-caller@test.local');
      await insertFixtureUser(USER_X_NOBODY, 'dm-cand-x@test.local', undefined, 'nobody');
      await insertFixtureUser(USER_Y_EVERYONE, 'dm-cand-y@test.local', undefined, 'everyone');

      await insertFixtureServer(SERVER_S, CALLER, 'Server Shared');

      await insertFixtureMembership(SERVER_S, CALLER);
      await insertFixtureMembership(SERVER_S, USER_X_NOBODY);
      await insertFixtureMembership(SERVER_S, USER_Y_EVERYONE);

      const candidates = await sut.getDmCandidates(CALLER);

      const ids = candidates.map((c) => c.userId);

      // Control: the everyone-user in the shared server IS returned
      expect(ids).toContain(USER_Y_EVERYONE);

      // Privacy fence: the nobody-user in the same shared server is NOT returned
      expect(ids).not.toContain(USER_X_NOBODY);

      // Self-exclusion remains intact
      expect(ids).not.toContain(CALLER);
    });

    // -----------------------------------------------------------------------
    // (b) Disjoint non-co-member isolation
    //
    // Topology:
    //   SERVER_S: CALLER only
    //   SERVER_T: USER_Z_DISJOINT only (no shared server with CALLER)
    //
    // getDmCandidates(CALLER) should NOT include USER_Z_DISJOINT because the
    // caller shares no server with Z. This exercises the inArray(callerServerIds)
    // scope in the WHERE clause against real Postgres rows.
    // -----------------------------------------------------------------------
    it('(b) does not expose a user who shares no server with the caller', async () => {
      // CALLER owns SERVER_S; USER_Z_DISJOINT owns SERVER_T
      await insertFixtureUser(CALLER, 'dm-cand-caller@test.local');
      await insertFixtureUser(USER_Z_DISJOINT, 'dm-cand-z@test.local');

      await insertFixtureServer(SERVER_S, CALLER, 'Server Caller');
      await insertFixtureServer(SERVER_T, USER_Z_DISJOINT, 'Server Disjoint');

      // CALLER is only in SERVER_S; USER_Z_DISJOINT is only in SERVER_T
      await insertFixtureMembership(SERVER_S, CALLER);
      await insertFixtureMembership(SERVER_T, USER_Z_DISJOINT);

      const candidates = await sut.getDmCandidates(CALLER);

      const ids = candidates.map((c) => c.userId);

      // Disjoint user must not appear (inArray scope enforcement)
      expect(ids).not.toContain(USER_Z_DISJOINT);

      // Caller has no co-members in any shared server → empty list
      expect(candidates).toHaveLength(0);
    });

    // -----------------------------------------------------------------------
    // (c) who_can_dm='server-members' truth-table
    //
    // Wave-55 B-2 — task 344eabde.
    //
    // Topology (positive leg):
    //   SERVER_C_SHARED: CALLER + USER_P_SERVERMEMBERS_COMEMBER
    //   USER_P has who_can_dm='server-members'
    //   → getDmCandidates(CALLER) MUST include USER_P (shared server satisfies
    //     the 'server-members' tier; only 'nobody' is excluded by the WHERE
    //     predicate, so 'server-members' behaves identically to 'everyone' for
    //     callers who share a server).
    //
    // Topology (negative / load-bearing leg):
    //   SERVER_C_DISJOINT: USER_Q_SERVERMEMBERS_DISJOINT only
    //   USER_Q has who_can_dm='server-members'
    //   → getDmCandidates(CALLER) MUST NOT include USER_Q (no shared server).
    //   This proves the inArray(callerServerIds) fence applies to the
    //   'server-members' tier specifically: if a future refactor widened the
    //   shared-server predicate to skip the tier check, this case would catch it.
    // -----------------------------------------------------------------------
    it('(c) who_can_dm=server-members: co-member in shared server is included, disjoint user is excluded', async () => {
      // --- positive leg: caller shares SERVER_C_SHARED with USER_P ---
      await insertFixtureUser(CALLER, 'dm-cand-caller@test.local');
      await insertFixtureUser(
        USER_P_SERVERMEMBERS_COMEMBER,
        'dm-cand-p-sm@test.local',
        undefined,
        'server-members',
      );
      await insertFixtureUser(
        USER_Q_SERVERMEMBERS_DISJOINT,
        'dm-cand-q-sm@test.local',
        undefined,
        'server-members',
      );

      // SERVER_C_SHARED is owned by CALLER (FK: servers.owner_id)
      await insertFixtureServer(SERVER_C_SHARED, CALLER, 'Server C Shared');
      // SERVER_C_DISJOINT is owned by USER_Q so FK is satisfied
      await insertFixtureServer(
        SERVER_C_DISJOINT,
        USER_Q_SERVERMEMBERS_DISJOINT,
        'Server C Disjoint',
      );

      // Memberships: CALLER + USER_P share SERVER_C_SHARED; USER_Q is only in SERVER_C_DISJOINT
      await insertFixtureMembership(SERVER_C_SHARED, CALLER);
      await insertFixtureMembership(SERVER_C_SHARED, USER_P_SERVERMEMBERS_COMEMBER);
      await insertFixtureMembership(SERVER_C_DISJOINT, USER_Q_SERVERMEMBERS_DISJOINT);

      const candidates = await sut.getDmCandidates(CALLER);
      const ids = candidates.map((c) => c.userId);

      // Positive: co-member with who_can_dm='server-members' in a shared server IS returned
      expect(ids).toContain(USER_P_SERVERMEMBERS_COMEMBER);

      // Negative (load-bearing lock): user with who_can_dm='server-members' in a
      // disjoint server (no shared server with CALLER) is NOT returned
      expect(ids).not.toContain(USER_Q_SERVERMEMBERS_DISJOINT);

      // Self-exclusion remains intact
      expect(ids).not.toContain(CALLER);
    });

    // -----------------------------------------------------------------------
    // (d) Defensive LIMIT cap — wave-56 B-2, task c5051444
    //
    // Topology:
    //   SERVER_D_SHARED: CALLER_D + USER_D1 + USER_D2 + USER_D3
    //   All three co-members have who_can_dm='everyone' (all eligible).
    //
    // Non-vacuous bound proof: inject cap=2 (< 3 eligible co-members).
    //   getDmCandidates(CALLER_D, 2)  → length ≤ 2 (LIMIT bites; proves > cap → ≤ cap)
    //   getDmCandidates(CALLER_D)     → length == 3 (default cap 500 >> 3; MVP-scale unchanged)
    //
    // Why non-vacuous: with 3 candidates and cap=2, the DB MUST truncate before
    // the in-memory sort sees the rows. If .limit() were absent the first
    // assertion would fail (length == 3 > 2). No 500-fixture insert needed.
    // -----------------------------------------------------------------------
    it('(d) injected cap of 2 truncates 3 eligible co-members; default cap leaves all 3 intact', async () => {
      await insertFixtureUser(CALLER_D, 'dm-cand-d-caller@test.local');
      await insertFixtureUser(USER_D1, 'dm-cand-d-1@test.local');
      await insertFixtureUser(USER_D2, 'dm-cand-d-2@test.local');
      await insertFixtureUser(USER_D3, 'dm-cand-d-3@test.local');

      await insertFixtureServer(SERVER_D_SHARED, CALLER_D, 'Server D Shared');

      await insertFixtureMembership(SERVER_D_SHARED, CALLER_D);
      await insertFixtureMembership(SERVER_D_SHARED, USER_D1);
      await insertFixtureMembership(SERVER_D_SHARED, USER_D2);
      await insertFixtureMembership(SERVER_D_SHARED, USER_D3);

      // Injected cap of 2 — LIMIT must fire and truncate the 3 eligible rows.
      const capped = await sut.getDmCandidates(CALLER_D, 2);
      expect(capped.length).toBeLessThanOrEqual(2);
      // Must return at least 1 (the query is not broken — just capped).
      expect(capped.length).toBeGreaterThan(0);

      // Default cap (DM_CANDIDATES_LIMIT = 500) — all 3 co-members come through
      // unchanged; proves production-scale behaviour is unaffected at MVP volumes.
      const uncapped = await sut.getDmCandidates(CALLER_D);
      expect(uncapped).toHaveLength(3);
      // Sanity: self-exclusion still intact under default cap
      expect(uncapped.map((c) => c.userId)).not.toContain(CALLER_D);

      // Reference the exported constant so it participates in the type-check.
      expect(DM_CANDIDATES_LIMIT).toBe(500);
    });
  },
);

// When DATABASE_URL_TEST is not set, emit a clear skip message (not a silent pass).
if (SKIP) {
  describe('DmService.getDmCandidates — real-Postgres privacy-fence negative controls', () => {
    it.skip('SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run integration tests locally', () => {});
  });
}
