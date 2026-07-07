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
import type { PoolClient } from 'pg';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import * as dbModule from '../../src/db/index';
import { EntitlementsService } from '../../src/billing/entitlements.service';
import { ServersService } from '../../src/servers/servers.service';

// Skip-with-reason when DATABASE_URL_TEST is absent (local dev without PG).
// Runs in CI where the Postgres 16 service + DATABASE_URL_TEST are provided.
const SKIP = !process.env.DATABASE_URL_TEST;

// ---------------------------------------------------------------------------
// Pool-query fault injection helpers
//
// Rationale: the SUT's `db` export is a get-only Proxy (only a `get` trap,
// no `set` trap), so vi.spyOn(dbModule.db, 'transaction') throws at the spyOn
// line — the spy never installs. Similarly, createServer calls generateCode()
// as a bare intra-module reference, so module-level spies on
// serversMod.generateCode are no-ops under esbuild/ESM.
//
// The reliable injection point is the underlying node-postgres Pool: drizzle's
// transaction() calls pool.connect() to get a PoolClient, then runs all
// queries (BEGIN / INSERTs / COMMIT or ROLLBACK) through that client's
// query() method. By wrapping pool.connect() to return a proxy client whose
// query() method throws at the desired moment — INSIDE the open transaction —
// the real Postgres ROLLBACK fires, leaving zero orphan rows.
//
// This is the mechanism described in the B-6 review fix plan ("pool-query
// fault injection — inject the mid-txn fault at a SETTABLE, real target").
// ---------------------------------------------------------------------------

/**
 * Wrap pool.connect() so the returned PoolClient's query() method applies
 * `queryInterceptor` to every query. The interceptor receives the query SQL
 * text and the call count (1-based across all queries for this connection
 * lifetime) and may throw to inject a fault.
 *
 * Returns a restore function that reverts the pool.connect() binding.
 */
function wrapPoolConnect(queryInterceptor: (sql: string, callNumber: number) => void): () => void {
  // biome-ignore lint/suspicious/noExplicitAny: pool patching requires any — see module docstring
  const pool = dbModule.pool() as any;
  const originalConnect = pool.connect.bind(pool);

  pool.connect = async () => {
    const client: PoolClient = await originalConnect();
    // biome-ignore lint/suspicious/noExplicitAny: patching client.query to intercept all statements
    const originalQuery = (client as any).query.bind(client);
    let callCount = 0;

    // Patch query — intercept every call regardless of overload shape
    // biome-ignore lint/suspicious/noExplicitAny: drizzle uses multiple client.query overloads
    (client as any).query = (...queryArgs: any[]) => {
      // Extract SQL text regardless of call shape (string or {text:...} config object)
      const sqlText: string =
        typeof queryArgs[0] === 'string'
          ? queryArgs[0]
          : typeof queryArgs[0] === 'object' && queryArgs[0] !== null
            ? (queryArgs[0].text ?? '')
            : '';
      queryInterceptor(sqlText, ++callCount);
      return originalQuery(...queryArgs);
    };

    return client;
  };

  // Return a restore function — reverts pool.connect to the unpatched version
  return () => {
    pool.connect = originalConnect;
  };
}

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

  let restorePool: (() => void) | undefined;

  beforeEach(async () => {
    await truncateTables();
    await insertFixtureUser(OWNER_ID, OWNER_EMAIL);
  });

  afterEach(() => {
    // Always restore pool.connect() after each test, even on failure
    restorePool?.();
    restorePool = undefined;
  });

  // -----------------------------------------------------------------------
  // Helper: build a bare-minimum ServersService (no NestJS DI needed here —
  // we only call createServer which only uses db, not rbacService).
  // -----------------------------------------------------------------------
  function makeSut(): ServersService {
    // ServersService constructor requires rbacService + entitlementsService.
    // createServer does not use rbacService; pass a stub.
    // Use the real EntitlementsService so the create-gate resolves correctly
    // against the test DB (owner has 0 servers → permissive free cap passes).
    return new ServersService({} as never, new EntitlementsService());
  }

  // -----------------------------------------------------------------------
  // Positive case: successful createServer commits ALL 5 row-kinds.
  //
  // Proves: the harness runs real transactions (not no-ops), migrations were
  // applied, and the positive path works end-to-end. No fault injection here.
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
  // Mechanism: wrap pool.connect() so the returned PoolClient's query()
  // method counts every INSERT call and throws a synthetic error on the 5th
  // INSERT (which targets "channels" — the last insert in createServer's
  // transaction). At that point server + role + server_member + category rows
  // exist inside the open transaction. The throw propagates out of drizzle's
  // transaction() callback, drizzle issues ROLLBACK, and zero rows are
  // committed.
  //
  // Why pool-query injection: the `db` export is a get-only Proxy (no set
  // trap), so vi.spyOn(dbModule.db, 'transaction') throws before the test
  // runs. Pool.connect() IS writable — we replace it on the singleton and
  // restore after the test via afterEach.
  //
  // The ROLLBACK is real: all 4 rows inserted before the throw are abandoned.
  // countRows via the SEPARATE harness pool proves zero cross-connection
  // visibility (standard Postgres commit-visibility semantics).
  // -----------------------------------------------------------------------
  it('rolls back ALL rows when channels insert fails mid-txn', async () => {
    let insertCount = 0;

    restorePool = wrapPoolConnect((sqlText, _callNumber) => {
      // Count only INSERT statements (case-insensitive match on query text)
      if (/^\s*insert/i.test(sqlText)) {
        insertCount++;
        if (insertCount === 5) {
          // 5th INSERT = channels — throw AFTER server+role+member+category inserted
          throw new Error('Simulated mid-txn failure on channels insert (INSERT #5)');
        }
      }
    });

    const sut = makeSut();

    // createServer must reject — the mid-txn failure must propagate.
    // Drizzle wraps the thrown error in DrizzleQueryError("Failed query: insert into
    // "channels" …") with our error as .cause. Match on the drizzle wrapper message
    // (the SQL text it contains) — the countRows=0 assertions below are the real proof.
    await expect(sut.createServer(OWNER_ID, 'Rollback Test Server')).rejects.toThrow('channels');

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
  // Mechanism: wrap pool.connect() so the returned PoolClient's query()
  // method throws a synthetic error on the very first INSERT it sees
  // (targeting the "servers" table). The transaction rolls back immediately
  // with zero rows committed.
  //
  // Why pool-query injection instead of generateCode spy: createServer calls
  // generateCode() as a bare intra-module reference (servers.service.ts:69).
  // Under esbuild/CommonJS, the module-namespace spy vi.spyOn(serversMod,
  // 'generateCode') does NOT intercept bare calls — only the exported binding
  // is patched, not the closure variable used inside the module. Pool-query
  // injection is module-boundary-agnostic: it fires at the network level
  // regardless of how the SUT calls its helpers.
  // -----------------------------------------------------------------------
  it('rolls back cleanly on first-insert failure (servers insert fault)', async () => {
    restorePool = wrapPoolConnect((sqlText, _callNumber) => {
      if (/^\s*insert\s+into\s+"?servers"?/i.test(sqlText)) {
        throw new Error('Simulated first-insert failure on servers table');
      }
    });

    const sut = makeSut();

    // createServer must reject — the first-insert failure must propagate.
    // Drizzle wraps the thrown error in DrizzleQueryError("Failed query: insert into
    // "servers" …") with our error as .cause. Match on the drizzle wrapper message
    // (the SQL text it contains) — the countRows=0 assertions below are the real proof.
    await expect(sut.createServer(OWNER_ID, 'First-Insert Failure Server')).rejects.toThrow(
      '"servers"',
    );

    // No rows at all — transaction rolled back before the first INSERT committed
    expect(await countRows('servers')).toBe(0);
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
