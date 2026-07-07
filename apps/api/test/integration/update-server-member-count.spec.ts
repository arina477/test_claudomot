/**
 * Integration tests — real-Postgres (wave-68, task 2bd37c4c):
 *
 *   1. ServersService.updateServer — owner-gate, partial update, non-owner
 *      security assertion (update never applied for non-owner).
 *   2. ServersService.discoverServers — memberCount LEFT JOIN fix (mandatory
 *      live-DB guard: the previous correlated scalar subquery returned 0 at
 *      runtime; this test proves the fixed query returns the real count).
 *
 * CF-2 (LOAD-BEARING): pg-harness MUST be the first import.
 */
// CF-2 side-effect import: sets process.env.DATABASE_URL = DATABASE_URL_TEST
// at module-eval time so the lazy db singleton resolves to the test DB.
import './pg-harness';
import {
  harnessQuery,
  insertFixtureMembership,
  insertFixtureServer,
  insertFixtureUser,
  setupHarness,
  teardownHarness,
  truncateTables,
} from './pg-harness';

// SUT import AFTER harness so the lazy db proxy resolves to the test DB.
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ServersService } from '../../src/servers/servers.service';

const SKIP = !process.env.DATABASE_URL_TEST;

// ---------------------------------------------------------------------------
// Fixture constants
// ---------------------------------------------------------------------------

const OWNER_ID = 'upd-owner';
const NON_OWNER_ID = 'upd-nonowner';

const SERVER_A_ID = 'a0000000-0000-0000-0000-000000000001'; // 0 members
const SERVER_B_ID = 'b0000000-0000-0000-0000-000000000002'; // 1 member
const SERVER_C_ID = 'c0000000-0000-0000-0000-000000000003'; // 2 members

const MEMBER_1_ID = 'upd-member-1';
const MEMBER_2_ID = 'upd-member-2';

// ---------------------------------------------------------------------------
// updateServer — owner-gate + partial update
// ---------------------------------------------------------------------------

describe.skipIf(SKIP)('ServersService.updateServer — real-Postgres (task 2bd37c4c)', () => {
  let sut!: ServersService;

  beforeAll(async () => {
    await setupHarness();
    // updateServer does not call rbacService or entitlementsService — pass stubs.
    sut = new ServersService({} as never, {} as never);
  });

  afterAll(async () => {
    await teardownHarness();
  });

  beforeEach(async () => {
    await truncateTables();

    // Seed users
    await insertFixtureUser(OWNER_ID, 'upd-owner@test.local');
    await insertFixtureUser(NON_OWNER_ID, 'upd-nonowner@test.local');

    // Seed a private server owned by OWNER_ID
    await insertFixtureServer(SERVER_A_ID, OWNER_ID, 'Update Test Server');
    // Ensure is_public starts as false (default)
    await harnessQuery(
      'UPDATE servers SET is_public = false, description = NULL, topic = NULL WHERE id = $1',
      [SERVER_A_ID],
    );
  });

  // -----------------------------------------------------------------------
  // Owner can publish + set description + topic
  // -----------------------------------------------------------------------
  it('owner can publish (is_public=true) and set description + topic', async () => {
    const result = await sut.updateServer(SERVER_A_ID, OWNER_ID, {
      is_public: true,
      description: 'A great server',
      topic: 'Math',
    });

    expect(result).toMatchObject({ id: SERVER_A_ID, ownerId: OWNER_ID });

    // Verify the DB row was actually updated
    const rows = await harnessQuery<{
      is_public: boolean;
      description: string | null;
      topic: string | null;
    }>('SELECT is_public, description, topic FROM servers WHERE id = $1', [SERVER_A_ID]);
    expect(rows[0]?.is_public).toBe(true);
    expect(rows[0]?.description).toBe('A great server');
    expect(rows[0]?.topic).toBe('Math');
  });

  // -----------------------------------------------------------------------
  // Owner can unpublish (is_public=false)
  // -----------------------------------------------------------------------
  it('owner can unpublish (is_public=false)', async () => {
    // First publish
    await harnessQuery('UPDATE servers SET is_public = true WHERE id = $1', [SERVER_A_ID]);

    await sut.updateServer(SERVER_A_ID, OWNER_ID, { is_public: false });

    const rows = await harnessQuery<{ is_public: boolean }>(
      'SELECT is_public FROM servers WHERE id = $1',
      [SERVER_A_ID],
    );
    expect(rows[0]?.is_public).toBe(false);
  });

  // -----------------------------------------------------------------------
  // Partial update — only description; is_public untouched
  // -----------------------------------------------------------------------
  it('partial update: only description changes, is_public is untouched', async () => {
    // Seed with is_public=true
    await harnessQuery('UPDATE servers SET is_public = true WHERE id = $1', [SERVER_A_ID]);

    await sut.updateServer(SERVER_A_ID, OWNER_ID, { description: 'Only desc changed' });

    const rows = await harnessQuery<{ is_public: boolean; description: string | null }>(
      'SELECT is_public, description FROM servers WHERE id = $1',
      [SERVER_A_ID],
    );
    expect(rows[0]?.is_public).toBe(true); // untouched
    expect(rows[0]?.description).toBe('Only desc changed');
  });

  // -----------------------------------------------------------------------
  // SECURITY: non-owner → 403 AND the row is NOT modified
  // -----------------------------------------------------------------------
  it('SECURITY: non-owner PATCH throws ForbiddenException (403) and the row is NOT modified', async () => {
    // Seed a known state
    await harnessQuery(
      `UPDATE servers SET is_public = false, description = 'original', topic = 'original-topic' WHERE id = $1`,
      [SERVER_A_ID],
    );

    await expect(
      sut.updateServer(SERVER_A_ID, NON_OWNER_ID, {
        is_public: true,
        description: 'hacked',
        topic: 'hacked-topic',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    // Load-bearing security assertion: the row must be completely unchanged
    const rows = await harnessQuery<{
      is_public: boolean;
      description: string | null;
      topic: string | null;
    }>('SELECT is_public, description, topic FROM servers WHERE id = $1', [SERVER_A_ID]);
    expect(rows[0]?.is_public).toBe(false);
    expect(rows[0]?.description).toBe('original');
    expect(rows[0]?.topic).toBe('original-topic');
  });

  // -----------------------------------------------------------------------
  // Missing server → 404
  // -----------------------------------------------------------------------
  it('throws NotFoundException (404) for a non-existent serverId', async () => {
    await expect(
      sut.updateServer('00000000-0000-0000-0000-000000000099', OWNER_ID, { is_public: true }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ---------------------------------------------------------------------------
// discoverServers — memberCount LEFT JOIN (mandatory live-DB guard)
// ---------------------------------------------------------------------------

describe.skipIf(SKIP)(
  'ServersService.discoverServers — memberCount real-Postgres (task 2bd37c4c)',
  () => {
    let sut!: ServersService;

    beforeAll(async () => {
      await setupHarness();
      sut = new ServersService({} as never, {} as never);
    });

    afterAll(async () => {
      await teardownHarness();
    });

    beforeEach(async () => {
      await truncateTables();

      // Users
      await insertFixtureUser(OWNER_ID, 'mc-owner@test.local');
      await insertFixtureUser(MEMBER_1_ID, 'mc-member1@test.local');
      await insertFixtureUser(MEMBER_2_ID, 'mc-member2@test.local');

      // Three public servers with 0, 1, 2 members respectively
      await insertFixtureServer(SERVER_A_ID, OWNER_ID, 'Zero Members');
      await harnessQuery('UPDATE servers SET is_public = true WHERE id = $1', [SERVER_A_ID]);

      await insertFixtureServer(SERVER_B_ID, OWNER_ID, 'One Member');
      await harnessQuery('UPDATE servers SET is_public = true WHERE id = $1', [SERVER_B_ID]);
      await insertFixtureMembership(SERVER_B_ID, MEMBER_1_ID);

      await insertFixtureServer(SERVER_C_ID, OWNER_ID, 'Two Members');
      await harnessQuery('UPDATE servers SET is_public = true WHERE id = $1', [SERVER_C_ID]);
      await insertFixtureMembership(SERVER_C_ID, MEMBER_1_ID);
      await insertFixtureMembership(SERVER_C_ID, MEMBER_2_ID);
    });

    it('memberCount equals the real server_members count per server (0, 1, 2)', async () => {
      const { servers: results } = await sut.discoverServers({ limit: 50, offset: 0 });

      const byId = Object.fromEntries(results.map((s) => [s.id, s.memberCount]));

      // Zero Members server
      expect(byId[SERVER_A_ID]).toBe(0);
      // One Member server
      expect(byId[SERVER_B_ID]).toBe(1);
      // Two Members server
      expect(byId[SERVER_C_ID]).toBe(2);
    });

    it('all three public servers appear in the results', async () => {
      const { servers: results } = await sut.discoverServers({ limit: 50, offset: 0 });

      const ids = results.map((s) => s.id);
      expect(ids).toContain(SERVER_A_ID);
      expect(ids).toContain(SERVER_B_ID);
      expect(ids).toContain(SERVER_C_ID);
    });

    it('memberCount is 0 for a public server with no members (not NULL, not missing)', async () => {
      const { servers: results } = await sut.discoverServers({ limit: 50, offset: 0 });

      const zeroServer = results.find((s) => s.id === SERVER_A_ID);
      expect(zeroServer).toBeDefined();
      // Must be exactly 0 — not undefined, not null, not NaN
      expect(zeroServer?.memberCount).toBe(0);
      expect(typeof zeroServer?.memberCount).toBe('number');
    });

    it('ordering: higher memberCount servers appear first', async () => {
      const { servers: results } = await sut.discoverServers({ limit: 50, offset: 0 });

      const positions = [SERVER_C_ID, SERVER_B_ID, SERVER_A_ID].map((id) =>
        results.findIndex((s) => s.id === id),
      );
      // C (2 members) < B (1 member) < A (0 members) in index order
      expect(positions[0]).toBeLessThan(positions[1] as number);
      expect(positions[1]).toBeLessThan(positions[2] as number);
    });

    // -----------------------------------------------------------------------
    // PRIVATE-EXCLUSION (load-bearing directory-privacy invariant)
    //
    // Proves that a server with is_public=false is NEVER returned by
    // discoverServers, even when it has members.  A broken WHERE-public filter
    // under the LEFT JOIN / GROUP BY would leak private servers into the public
    // directory — this test catches that regression at the real-DB layer.
    // -----------------------------------------------------------------------
    it('PRIVATE-EXCLUSION: a private server (is_public=false) with members NEVER appears in discoverServers', async () => {
      // Seed a private server alongside the three public ones that already exist
      // from beforeEach.  Give it two members so a broken filter would rank it
      // at the top (memberCount DESC ordering) — making a false-positive obvious.
      const PRIVATE_SERVER_ID = 'f0000000-0000-0000-0000-000000000099';
      await insertFixtureServer(PRIVATE_SERVER_ID, OWNER_ID, 'Private Server Should Be Hidden');
      // Confirm is_public is false (insertFixtureServer uses the column default
      // which is false, but we set it explicitly to make the intent clear).
      await harnessQuery('UPDATE servers SET is_public = false WHERE id = $1', [PRIVATE_SERVER_ID]);
      // Add two members so a leaking server would float to the top.
      await insertFixtureMembership(PRIVATE_SERVER_ID, MEMBER_1_ID);
      await insertFixtureMembership(PRIVATE_SERVER_ID, MEMBER_2_ID);

      const { servers: results } = await sut.discoverServers({ limit: 50, offset: 0 });

      // The private server's id must be completely absent from the result set.
      const returnedIds = results.map((s) => s.id);
      expect(returnedIds).not.toContain(PRIVATE_SERVER_ID);

      // Belt-and-suspenders: none of the returned rows carry the private id.
      const leak = results.find((s) => s.id === PRIVATE_SERVER_ID);
      expect(leak).toBeUndefined();

      // The three public servers from beforeEach must still be present and correct.
      expect(returnedIds).toContain(SERVER_A_ID);
      expect(returnedIds).toContain(SERVER_B_ID);
      expect(returnedIds).toContain(SERVER_C_ID);
    });
  },
);

// When DATABASE_URL_TEST is not set, emit a clear skip message.
if (SKIP) {
  describe('updateServer + discoverServers memberCount — real-Postgres (task 2bd37c4c)', () => {
    it.skip('SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run integration tests locally', () => {});
  });
}
