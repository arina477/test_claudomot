/**
 * Integration test: editMessage real-Postgres transaction rollback.
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
  harnessQuery,
  insertFixtureChannel,
  insertFixtureMembership,
  insertFixtureMention,
  insertFixtureMessage,
  insertFixtureServer,
  insertFixtureUser,
  setupHarness,
  teardownHarness,
  truncateTables,
} from './pg-harness';

// SUT import AFTER harness so the lazy db proxy resolves to the test DB
import type { PoolClient } from 'pg';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import * as dbModule from '../../src/db/index';
import { MessagesService } from '../../src/messaging/messages.service';

// Skip-with-reason when DATABASE_URL_TEST is absent (local dev without PG).
// Runs in CI where the Postgres 16 service + DATABASE_URL_TEST are provided.
const SKIP = !process.env.DATABASE_URL_TEST;

// ---------------------------------------------------------------------------
// Pool-query fault injection helpers
//
// The SUT's `db` export is a get-only Proxy (no `set` trap), so
// vi.spyOn(dbModule.db, 'transaction') throws at the spyOn line. The reliable
// injection point is the underlying node-postgres Pool: drizzle's
// transaction() calls pool.connect() (Promise-style, no callback) to get a
// dedicated PoolClient, then runs BEGIN / writes / COMMIT or ROLLBACK through
// that client's query() method. Wrapping pool.connect() to return a proxy
// client whose query() throws at the desired moment causes a real Postgres
// ROLLBACK, leaving the pre-edit rows intact.
//
// IMPORTANT — two calling conventions for pool.connect():
//
// (A) Promise-style: drizzle's NodePgSession.transaction() calls
//     `await this.client.connect()` with NO callback. The patched function
//     must return a Promise resolving to the patched PoolClient.
//
// (B) Callback-style: pg-pool's own pool.query() implementation calls
//     `this.connect(cb)` with a callback. editMessage's pre-flight db.select()
//     calls go through pool.query() (not pool.connect() directly), which
//     internally calls this.connect(cb). If the patched function ignores cb
//     those pre-flight selects hang forever (cb is never invoked), causing the
//     test to time out before the transaction even opens.
//
// The fix: detect whether a callback was supplied and handle both conventions.
// When cb is present, call originalConnect() as a Promise, patch the returned
// client, then invoke cb(null, client, client.release) so pool.query() can
// proceed. When cb is absent, resolve the Promise directly (drizzle's path).
// ---------------------------------------------------------------------------

/**
 * Wrap pool.connect() so the returned PoolClient's query() method applies
 * `queryInterceptor` to every query. The interceptor receives the query SQL
 * text and may throw to inject a fault.
 *
 * Handles both Promise-style (drizzle transaction) and callback-style
 * (pg-pool.query internal) callers — see module-level comment above.
 *
 * Returns a restore function that reverts pool.connect() to the original.
 */
function wrapPoolConnect(queryInterceptor: (sql: string) => void): () => void {
  // biome-ignore lint/suspicious/noExplicitAny: pool patching requires any — see module docstring
  const pool = dbModule.pool() as any;
  const originalConnect = pool.connect.bind(pool);

  // biome-ignore lint/suspicious/noExplicitAny: must match pg-pool connect(cb?) dual-mode signature
  pool.connect = async (cb?: (...args: any[]) => void) => {
    const client: PoolClient = await originalConnect();
    // biome-ignore lint/suspicious/noExplicitAny: patching client.query to intercept all statements
    const originalQuery = (client as any).query.bind(client);

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
      queryInterceptor(sqlText);
      return originalQuery(...queryArgs);
    };

    // (B) callback-style caller (pg-pool.query internal): invoke cb so the
    // caller can proceed. client.release was attached by originalConnect()
    // via the real pool machinery — pass it as the third argument as
    // pg-pool expects: cb(err, client, done).
    if (cb) {
      cb(null, client, client.release);
      return;
    }

    // (A) Promise-style caller (drizzle transaction): return the client.
    return client;
  };

  // Return a restore function — reverts pool.connect to the unpatched version
  return () => {
    pool.connect = originalConnect;
  };
}

// ---------------------------------------------------------------------------
// Fixture constants — stable IDs so FK relationships are easy to reason about
// ---------------------------------------------------------------------------

const AUTHOR_ID = 'wave25-author';
const AUTHOR_EMAIL = 'wave25-author@test.local';
const AUTHOR_USERNAME = 'authorwave25';

const ALICE_ID = 'wave25-alice';
const ALICE_EMAIL = 'wave25-alice@test.local';
const ALICE_USERNAME = 'alice';

const BOB_ID = 'wave25-bob';
const BOB_EMAIL = 'wave25-bob@test.local';
const BOB_USERNAME = 'bob';

// Use well-known UUIDs for server/channel/message to make FK wiring obvious
const SERVER_ID = '00000025-0000-0000-0000-000000000001';
const CHANNEL_ID = '00000025-0000-0000-0000-000000000002';
const MESSAGE_ID = '00000025-0000-0000-0000-000000000003';

describe.skipIf(SKIP)('editMessage — real-Postgres transaction (rollback + commit)', () => {
  beforeAll(async () => {
    await setupHarness();
  });

  afterAll(async () => {
    await teardownHarness();
  });

  let restorePool: (() => void) | undefined;

  beforeEach(async () => {
    await truncateTables();

    // Insert fixture users with usernames so resolveMentions can match tokens
    await insertFixtureUser(AUTHOR_ID, AUTHOR_EMAIL, AUTHOR_USERNAME);
    await insertFixtureUser(ALICE_ID, ALICE_EMAIL, ALICE_USERNAME);
    await insertFixtureUser(BOB_ID, BOB_EMAIL, BOB_USERNAME);

    // Insert server, channel, message (in dependency order)
    await insertFixtureServer(SERVER_ID, AUTHOR_ID, 'Wave-25 Test Server');
    await insertFixtureChannel(CHANNEL_ID, SERVER_ID, 'general');

    // All three users are server members so resolveMentions resolves their tokens
    await insertFixtureMembership(SERVER_ID, AUTHOR_ID);
    await insertFixtureMembership(SERVER_ID, ALICE_ID);
    await insertFixtureMembership(SERVER_ID, BOB_ID);

    // Pre-existing message with content "@alice" and one mention row for alice
    await insertFixtureMessage(MESSAGE_ID, CHANNEL_ID, AUTHOR_ID, '@alice');
    await insertFixtureMention(MESSAGE_ID, ALICE_ID);
  });

  afterEach(() => {
    // Always restore pool.connect() after each test, even on failure
    restorePool?.();
    restorePool = undefined;
  });

  // -----------------------------------------------------------------------
  // Helper: build a bare-minimum MessagesService (no NestJS DI needed here)
  // -----------------------------------------------------------------------
  function makeSut(): MessagesService {
    // MessagesService constructor requires eventEmitter, rbacService,
    // filesService. editMessage uses eventEmitter.emit() but does not call
    // rbacService or filesService — pass stubs.
    return new MessagesService({ emit: () => {} } as never, {} as never, {} as never);
  }

  // -----------------------------------------------------------------------
  // Positive case: successful editMessage commits all 3 writes atomically.
  //
  // Edits "@alice" → "@bob": deletes alice mention, inserts bob mention,
  // updates message content. No fault injection — proves the harness + txn
  // path works end-to-end before testing rollback.
  // -----------------------------------------------------------------------
  it('commits UPDATE + DELETE + INSERT on successful edit', async () => {
    const sut = makeSut();
    const result = await sut.editMessage(CHANNEL_ID, MESSAGE_ID, AUTHOR_ID, '@bob');

    // Message content updated
    expect(result.content).toBe('@bob');
    expect(result.isEdited).toBe(true);

    // Mention diff applied: alice removed, bob added — exactly 1 row
    expect(await countRows('message_mentions')).toBe(1);

    // bob's mention is present, alice's is gone — queried via the SEPARATE
    // harness pool to verify committed state is visible across connections.
    const rows = await harnessQuery<{ mentioned_user_id: string }>(
      'SELECT mentioned_user_id FROM message_mentions WHERE message_id = $1',
      [MESSAGE_ID],
    );
    expect(rows.map((r) => r.mentioned_user_id)).toEqual([BOB_ID]);
  });

  // -----------------------------------------------------------------------
  // Rollback case (load-bearing AC): mid-txn failure after UPDATE + DELETE.
  //
  // Mechanism: wrap pool.connect() so the returned PoolClient's query()
  // method throws on the INSERT into message_mentions. At that point the
  // UPDATE to messages and the DELETE of alice's mention row have been
  // executed inside the open transaction. The throw propagates out of
  // drizzle's transaction() callback, drizzle issues ROLLBACK, and the
  // pre-edit state is fully restored:
  //   - message content is still "@alice" (UPDATE rolled back)
  //   - message_mentions still has alice's row (DELETE rolled back)
  //   - bob's row is absent (INSERT never committed)
  //
  // ALL post-rollback assertions — countRows AND row-content checks — run via
  // the SEPARATE harness pool (a distinct Pool instance with its own TCP
  // connections, independent from the SUT's drizzle pool). This proves that
  // rolled-back writes are invisible across connections, satisfying standard
  // Postgres commit-visibility semantics (AC5). Mirrors the technique from
  // create-server-rollback.spec.ts.
  // -----------------------------------------------------------------------
  it('rolls back UPDATE + DELETE when message_mentions INSERT fails mid-txn', async () => {
    restorePool = wrapPoolConnect((sqlText) => {
      // Throw on the INSERT into message_mentions inside the transaction.
      // The UPDATE and DELETE have already executed at this point —
      // the ROLLBACK must undo both.
      if (/^\s*insert\s+into\s+"?message_mentions"?/i.test(sqlText)) {
        throw new Error('Simulated mid-txn failure on message_mentions INSERT (rollback test)');
      }
    });

    const sut = makeSut();

    // editMessage must reject — the mid-txn failure must propagate.
    // Drizzle wraps the error in DrizzleQueryError; match on the SQL text it
    // contains. The countRows=1 assertion below is the real rollback proof.
    await expect(sut.editMessage(CHANNEL_ID, MESSAGE_ID, AUTHOR_ID, '@bob')).rejects.toThrow(
      'message_mentions',
    );

    // ROLLBACK must have fired:
    // (a) message_mentions still has exactly alice's pre-edit row (1 row)
    expect(await countRows('message_mentions')).toBe(1);

    // (b) alice's row is present (DELETE was rolled back) — queried via the
    // SEPARATE harness pool: proves the rolled-back DELETE is invisible across
    // connections (standard Postgres commit-visibility semantics).
    const mentionRows = await harnessQuery<{ mentioned_user_id: string }>(
      'SELECT mentioned_user_id FROM message_mentions WHERE message_id = $1',
      [MESSAGE_ID],
    );
    expect(mentionRows.map((r) => r.mentioned_user_id)).toContain(ALICE_ID);

    // (c) bob's row is absent (INSERT never committed) — same harness pool:
    // proves the rolled-back INSERT is invisible across connections.
    expect(mentionRows.map((r) => r.mentioned_user_id)).not.toContain(BOB_ID);

    // (d) message content is unchanged — "@alice" not "@bob" (UPDATE rolled back)
    // Queried via the SEPARATE harness pool: proves the rolled-back UPDATE is
    // invisible across connections.
    const msgRows = await harnessQuery<{ content: string; is_edited: boolean }>(
      'SELECT content, is_edited FROM messages WHERE id = $1',
      [MESSAGE_ID],
    );
    expect(msgRows[0]?.content).toBe('@alice');
    expect(msgRows[0]?.is_edited).toBe(false);
  });
});

// When DATABASE_URL_TEST is not set, emit a clear skip message (not a silent pass).
if (SKIP) {
  describe('editMessage — real-Postgres transaction (rollback + commit)', () => {
    it.skip('SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run integration tests locally', () => {});
  });
}
