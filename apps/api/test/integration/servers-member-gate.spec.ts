/**
 * Integration test: ServersService.listServerMembers — real-Postgres member gate.
 *
 * AC2 (wave-24 B-2): Exercises the member-gate check at servers.service.ts:232
 * and the roster innerJoin at :244 against real server_members rows. Asserts
 * that a member receives the real roster and a non-member receives ForbiddenException.
 * No mock DB, no stubbed query.
 *
 * CF-2 (LOAD-BEARING): pg-harness MUST be the first import.
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
import { ForbiddenException } from '@nestjs/common';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ServersService } from '../../src/servers/servers.service';

// Skip-with-reason when DATABASE_URL_TEST is absent.
const SKIP = !process.env.DATABASE_URL_TEST;

// ---------------------------------------------------------------------------
// Fixture constants
// ---------------------------------------------------------------------------

const SERVER_ID = '10000000-0000-0000-0000-000000000001';

// User IDs (text PK)
const OWNER_ID = 'gate-owner';
const MEMBER_ID = 'gate-member';
const NON_MEMBER_ID = 'gate-nonmember';

describe.skipIf(SKIP)('ServersService.listServerMembers — real-Postgres member gate (AC2)', () => {
  let sut!: ServersService;

  beforeAll(async () => {
    await setupHarness();
    // ServersService constructor requires rbacService + entitlementsService;
    // listServerMembers calls neither — pass stubs.
    sut = new ServersService({} as never, {} as never);
  });

  afterAll(async () => {
    await teardownHarness();
  });

  beforeEach(async () => {
    await truncateTables();

    // Seed: owner + member users, server, memberships.
    // Order: users first (FK: servers.owner_id → users.id).
    await insertFixtureUser(OWNER_ID, 'gate-owner@test.local');
    await insertFixtureUser(MEMBER_ID, 'gate-member@test.local');
    await insertFixtureUser(NON_MEMBER_ID, 'gate-nonmember@test.local');
    await insertFixtureServer(SERVER_ID, OWNER_ID, 'Gate Test Server');
    await insertFixtureMembership(SERVER_ID, OWNER_ID);
    await insertFixtureMembership(SERVER_ID, MEMBER_ID);
    // NON_MEMBER_ID intentionally has no server_members row
  });

  // -----------------------------------------------------------------------
  // Load-bearing AC (positive path): a real member receives the full roster.
  //
  // listServerMembers queries server_members WHERE server_id = ? to check
  // membership, then does an innerJoin with users to build the roster.
  // Both queries run against real Postgres rows inserted via the harness.
  // -----------------------------------------------------------------------
  it('returns full member roster for a real server member', async () => {
    // Real DB round-trip: member-gate SELECT + innerJoin roster SELECT
    const roster = await sut.listServerMembers(MEMBER_ID, SERVER_ID);

    const userIds = roster.map((m) => m.userId);
    expect(userIds).toContain(OWNER_ID);
    expect(userIds).toContain(MEMBER_ID);

    // Shape: each entry must have userId (string) + displayName (string)
    for (const m of roster) {
      expect(typeof m.userId).toBe('string');
      expect(typeof m.displayName).toBe('string');
      expect(m.displayName.length).toBeGreaterThan(0);
    }
  });

  // -----------------------------------------------------------------------
  // Load-bearing AC (gate path): non-member → ForbiddenException (403).
  //
  // The member-gate at servers.service.ts:232 queries server_members and
  // throws ForbiddenException when no matching row exists.
  // The assertion targets the real exception class (not just a string match)
  // to confirm the 403 contract, per P-4 jenny carry.
  // -----------------------------------------------------------------------
  it('throws ForbiddenException for a user with no server_members row (member gate :232)', async () => {
    // Real DB round-trip: member-gate SELECT finds no row → ForbiddenException
    await expect(sut.listServerMembers(NON_MEMBER_ID, SERVER_ID)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

// When DATABASE_URL_TEST is not set, emit a clear skip message (not a silent pass).
if (SKIP) {
  describe('ServersService.listServerMembers — real-Postgres member gate (AC2)', () => {
    it.skip('SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run integration tests locally', () => {});
  });
}
