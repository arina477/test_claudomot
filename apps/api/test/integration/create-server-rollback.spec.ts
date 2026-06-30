/**
 * Integration test: createServer real-Postgres transaction rollback.
 *
 * CF-2 (LOAD-BEARING): pg-harness MUST be the first import. It sets
 * process.env.DATABASE_URL = process.env.DATABASE_URL_TEST at module-eval
 * time, before the lazy Proxy in apps/api/src/db/index.ts first resolves its
 * Pool. Importing pg-harness after any SUT module would cause the SUT's db
 * singleton to connect to the wrong database (or throw if DATABASE_URL is
 * absent).
 */
// CF-2 side-effect import: sets process.env.DATABASE_URL = DATABASE_URL_TEST
// at module-eval time so the lazy db singleton resolves to the test DB.
import './pg-harness';
import {
  countRows,
  insertFixtureUser,
  setupHarness,
  teardownHarness,
  truncateTables,
} from './pg-harness';

// SUT import AFTER harness so the lazy db proxy resolves to the test DB
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as dbModule from '../../src/db/index';
import { servers as serversTable } from '../../src/db/schema/servers';
import { ServersService } from '../../src/servers/servers.service';
import * as serversMod from '../../src/servers/servers.service';

// Skip-with-reason when DATABASE_URL_TEST is absent (local dev without PG).
// Runs in CI where the Postgres 16 service + DATABASE_URL_TEST are provided.
const SKIP = !process.env.DATABASE_URL_TEST;

describe.skipIf(SKIP)('createServer — real-Postgres transaction (rollback + commit)', () => {
  // Fixture owner user — satisfies FK on servers.owner_id + server_members.user_id
  const OWNER_ID = 'test-owner-wave17';
  const OWNER_EMAIL = 'wave17-owner@test.local';

  beforeAll(async () => {
    await setupHarness();
  });

  afterAll(async () => {
    await teardownHarness();
  });

  beforeEach(async () => {
    vi.restoreAllMocks();
    await truncateTables();
    await insertFixtureUser(OWNER_ID, OWNER_EMAIL);
  });

  // -----------------------------------------------------------------------
  // Helper: build a bare-minimum ServersService (no NestJS DI needed here —
  // we only call createServer which only uses db, not rbacService).
  // -----------------------------------------------------------------------
  function makeSut(): ServersService {
    // ServersService constructor requires rbacService but createServer does
    // not call it; pass a stub so NestJS DI is not needed.
    return new ServersService({} as never);
  }

  // -----------------------------------------------------------------------
  // Positive case: successful createServer commits ALL 5 row-kinds.
  //
  // Proves: the harness runs real transactions (not no-ops), migrations were
  // applied, and the positive path works end-to-end.
  // -----------------------------------------------------------------------
  it('commits all 5 row-kinds on success', async () => {
    const sut = makeSut();
    const result = await sut.createServer(OWNER_ID, 'Wave-17 Server');

    expect(result).toMatchObject({
      id: expect.any(String),
      name: 'Wave-17 Server',
      ownerId: OWNER_ID,
      createdAt: expect.any(String),
    });

    // All 5 inserts must have committed exactly 1 row each
    expect(await countRows('servers')).toBe(1);
    expect(await countRows('roles')).toBe(1);
    expect(await countRows('server_members')).toBe(1);
    expect(await countRows('categories')).toBe(1);
    expect(await countRows('channels')).toBe(1);
  });

  // -----------------------------------------------------------------------
  // Rollback case (load-bearing AC): mid-txn failure after ≥1 insert.
  //
  // Mechanism: spy on db.transaction so we can intercept the drizzle `tx`
  // proxy and count insert calls. On the 5th tx.insert call (channels — the
  // LAST insert in the transaction), we throw a synthetic error. This fires
  // AFTER server + role + server_member + category rows have been inserted
  // within the open transaction but BEFORE commit. The transaction is never
  // committed; drizzle catches the throw and issues ROLLBACK.
  //
  // Why this mechanism: the channels table has no UNIQUE constraint to hit
  // with a pre-seeded row, and the other late-insert targets require knowing
  // the server UUID assigned by gen_random_uuid() inside the txn (e.g.
  // server_members: unique(server_id, user_id)). Intercepting the drizzle tx
  // object is the "acceptable alternative" described in P-3 plan: "wrap the
  // pool client / a single tx.insert to throw after N statements (still
  // through the real txn so ROLLBACK actually fires)".
  //
  // The ROLLBACK is real: the 4 rows inserted before the throw are never
  // committed. The assertion countRows = 0 for all tables proves this.
  // -----------------------------------------------------------------------
  it('rolls back ALL rows when channels insert fails mid-txn', async () => {
    // Capture the real transaction method before spying, typed as any to avoid
    // fighting drizzle's complex generic signatures in test code.
    // biome-ignore lint/suspicious/noExplicitAny: test-only capture of drizzle internal
    const realTransaction = dbModule.db.transaction.bind(dbModule.db) as any;

    // Wrap db.transaction: intercept the callback's `tx` argument and count
    // insert calls. Throw on the 5th (channels) to simulate mid-txn failure.
    // biome-ignore lint/suspicious/noExplicitAny: mocking drizzle tx internals requires any
    vi.spyOn(dbModule.db, 'transaction').mockImplementation(async (callback: any) =>
      // biome-ignore lint/suspicious/noExplicitAny: intercepting drizzle internal tx proxy
      realTransaction(async (tx: any) => {
        const originalInsert = tx.insert.bind(tx);
        let insertCallCount = 0;

        // Count insert calls; throw on 5th (channels — last insert in txn)
        // biome-ignore lint/suspicious/noExplicitAny: drizzle tx.insert signature varies
        tx.insert = (...args: any[]) => {
          insertCallCount++;
          if (insertCallCount === 5) {
            // 5th insert = channels — throw AFTER server+role+member+category inserted
            throw new Error('Simulated mid-txn failure on channels insert (insert call #5)');
          }
          return originalInsert(...args);
        };

        return callback(tx);
      }),
    );

    const sut = makeSut();

    // createServer must reject — the mid-txn failure must propagate
    await expect(sut.createServer(OWNER_ID, 'Rollback Test Server')).rejects.toThrow(
      'Simulated mid-txn failure on channels insert (insert call #5)',
    );

    // ROLLBACK must have fired: zero rows across ALL 5 tables
    expect(await countRows('servers')).toBe(0);
    expect(await countRows('roles')).toBe(0);
    expect(await countRows('server_members')).toBe(0);
    expect(await countRows('categories')).toBe(0);
    expect(await countRows('channels')).toBe(0);
  });

  // -----------------------------------------------------------------------
  // Edge case: early failure (1st insert — servers) also produces zero orphans.
  //
  // Uses the servers.invite_code UNIQUE constraint: spy on generateCode to
  // return a fixed value, pre-seed a server row with that invite_code, then
  // invoke createServer. The servers INSERT (position 1) throws a Postgres
  // 23505 unique_violation → ROLLBACK immediately → zero additional rows.
  // -----------------------------------------------------------------------
  it('rolls back cleanly on first-insert failure (invite_code collision)', async () => {
    const COLLISION_CODE = 'wave17-collision-code';

    // Pre-seed a second user + server that owns the collision invite_code.
    const OTHER_OWNER_ID = 'test-other-owner-wave17';
    await insertFixtureUser(OTHER_OWNER_ID, 'wave17-other@test.local');

    // Insert a server directly (bypassing createServer) with the known code.
    await dbModule.db.insert(serversTable).values({
      name: 'Pre-existing Server',
      owner_id: OTHER_OWNER_ID,
      invite_code: COLLISION_CODE,
    });

    // Force generateCode to return the colliding value
    vi.spyOn(serversMod, 'generateCode').mockReturnValue(COLLISION_CODE);

    const sut = makeSut();

    // createServer must reject with a PG unique violation on invite_code
    await expect(sut.createServer(OWNER_ID, 'Collision Server')).rejects.toThrow();

    // Only the pre-seeded server row exists; the failed attempt left no trace
    expect(await countRows('servers')).toBe(1); // only the pre-seeded one
    expect(await countRows('roles')).toBe(0);
    expect(await countRows('server_members')).toBe(0);
    expect(await countRows('categories')).toBe(0);
    expect(await countRows('channels')).toBe(0);
  });
});

// When DATABASE_URL_TEST is not set, emit a clear skip message (not a silent pass).
if (SKIP) {
  describe('createServer — real-Postgres transaction (rollback + commit)', () => {
    it.skip('SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run integration tests locally', () => {});
  });
}
