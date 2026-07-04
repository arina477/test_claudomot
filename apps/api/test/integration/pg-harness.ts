/**
 * Reusable real-Postgres integration harness for wave-17+.
 *
 * CF-2 (LOAD-BEARING): process.env.DATABASE_URL is set to DATABASE_URL_TEST
 * HERE, at module-eval time, before any other module in this file is imported.
 * This ensures the lazy Proxy in apps/api/src/db/index.ts resolves its Pool
 * using the test DB connection string — not the production DATABASE_URL.
 *
 * The harness must be imported BEFORE importing createServer (or any module
 * that transitively touches apps/api/src/db/index.ts). The integration spec
 * enforces this by placing the harness import first.
 *
 * Consumer: create-server-rollback.spec.ts (wave-17)
 *           Additional integration specs (task 02fa8011, wave-17+)
 */

// --- CF-2: redirect SUT db singleton to test DB BEFORE any SUT import ---
const testDbUrl = process.env.DATABASE_URL_TEST;
if (testDbUrl) {
  process.env.DATABASE_URL = testDbUrl;
}
// -------------------------------------------------------------------------

import * as path from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from '../../src/db/schema/index';

// Absolute path to migrations directory — harness must work regardless of cwd
const MIGRATIONS_DIR = path.resolve(__dirname, '../../drizzle/migrations');

let harnessPool: Pool | undefined;
let harnessDb: ReturnType<typeof drizzle<typeof schema>> | undefined;

/**
 * Call once in beforeAll. Connects to DATABASE_URL_TEST and applies all
 * drizzle migrations (fail-loud on any error).
 *
 * Sets process.env.DATABASE_URL (CF-2) as a side effect of module import
 * (above). The harness pool is separate from the SUT pool — it is used only
 * for truncate/count helpers. The SUT's db singleton connects using the same
 * DATABASE_URL_TEST string set via process.env.DATABASE_URL.
 */
export async function setupHarness(): Promise<void> {
  if (!testDbUrl) {
    throw new Error(
      'pg-harness: setupHarness() called but DATABASE_URL_TEST is unset. ' +
        'Check your describe.skipIf guard.',
    );
  }

  harnessPool = new Pool({ connectionString: testDbUrl });
  harnessDb = drizzle(harnessPool, { schema });

  // Apply all migrations — fail loud so CI surfaces schema drift immediately
  await migrate(harnessDb, { migrationsFolder: MIGRATIONS_DIR });
}

/**
 * Truncate all tables touched by createServer, createMessage, editMessage,
 * plus users (fixture). Order matters: children before parents to avoid FK
 * violations. CASCADE handles anything we miss, but explicit order is safer.
 */
export async function truncateTables(): Promise<void> {
  if (!harnessPool) throw new Error('pg-harness: call setupHarness() first');
  // Truncate in dependency order: most-derived first, then parents.
  // RESTART IDENTITY resets sequences; CASCADE catches any missed deps.
  await harnessPool.query(
    `TRUNCATE
       notifications,
       message_mentions,
       message_reactions,
       messages,
       channel_permission_overrides,
       channels,
       categories,
       server_members,
       roles,
       invites,
       servers,
       assignment_reminder,
       assignments,
       users
     RESTART IDENTITY CASCADE`,
  );
}

/**
 * Insert a minimal real user row sufficient to satisfy the FK on servers.owner_id
 * and server_members.user_id (both reference users.id which is text PK).
 *
 * Pass `username` to set the users.username column so resolveMentions can
 * match @token slugs (e.g. wave-25 editMessage rollback spec).
 *
 * Pass `whoCanDm` to override the users.who_can_dm column (defaults to
 * 'everyone' matching the DB column default — existing 3-arg callers unaffected).
 * Valid values: 'everyone' | 'server-members' | 'nobody'.
 */
export async function insertFixtureUser(
  id: string,
  email: string,
  username?: string,
  whoCanDm: 'everyone' | 'server-members' | 'nobody' = 'everyone',
): Promise<void> {
  if (!harnessPool) throw new Error('pg-harness: call setupHarness() first');
  await harnessPool.query(
    `INSERT INTO users (id, email, username, who_can_dm) VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO NOTHING`,
    [id, email, username ?? null, whoCanDm],
  );
}

// ---------------------------------------------------------------------------
// Fixture helpers — servers, roles, server_members (wave-24)
// ---------------------------------------------------------------------------

/**
 * Permission flags for a role row (all default false when omitted).
 * Covers all 6 RBAC boolean columns incl manage_assignments (wave-23)
 * and moderate_members (wave-41).
 */
export interface RolePerms {
  manage_server?: boolean;
  manage_roles?: boolean;
  manage_channels?: boolean;
  manage_members?: boolean;
  manage_assignments?: boolean;
  moderate_members?: boolean;
}

/**
 * Insert a minimal real servers row.
 * ownerId must already exist in users (FK: servers.owner_id → users.id).
 * invite_code is omitted (defaults to NULL — Postgres allows multiple NULL values on a UNIQUE column).
 */
export async function insertFixtureServer(
  id: string,
  ownerId: string,
  name: string,
): Promise<void> {
  if (!harnessPool) throw new Error('pg-harness: call setupHarness() first');
  await harnessPool.query(
    `INSERT INTO servers (id, name, owner_id)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [id, name, ownerId],
  );
}

/**
 * Insert a real roles row with explicit permission flags (all default false).
 * serverId must already exist in servers (FK: roles.server_id → servers.id).
 */
export async function insertFixtureRole(
  id: string,
  serverId: string,
  name: string,
  perms: RolePerms = {},
): Promise<void> {
  if (!harnessPool) throw new Error('pg-harness: call setupHarness() first');
  await harnessPool.query(
    `INSERT INTO roles
       (id, server_id, name, position,
        manage_server, manage_roles, manage_channels, manage_members, manage_assignments,
        moderate_members, is_default)
     VALUES ($1, $2, $3, 0, $4, $5, $6, $7, $8, $9, false)
     ON CONFLICT DO NOTHING`,
    [
      id,
      serverId,
      name,
      perms.manage_server ?? false,
      perms.manage_roles ?? false,
      perms.manage_channels ?? false,
      perms.manage_members ?? false,
      perms.manage_assignments ?? false,
      perms.moderate_members ?? false,
    ],
  );
}

/**
 * Insert a real server_members row.
 * serverId and userId must already exist (FK). roleId is optional (may be null —
 * server_members.role_id is nullable per schema).
 */
export async function insertFixtureMembership(
  serverId: string,
  userId: string,
  roleId?: string,
): Promise<void> {
  if (!harnessPool) throw new Error('pg-harness: call setupHarness() first');
  await harnessPool.query(
    `INSERT INTO server_members (server_id, user_id, role_id)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [serverId, userId, roleId ?? null],
  );
}

// ---------------------------------------------------------------------------
// Fixture helpers — channels, messages, message_mentions (wave-25)
// ---------------------------------------------------------------------------

/**
 * Insert a minimal real channels row.
 * serverId must already exist in servers (FK: channels.server_id → servers.id).
 */
export async function insertFixtureChannel(
  id: string,
  serverId: string,
  name: string,
): Promise<void> {
  if (!harnessPool) throw new Error('pg-harness: call setupHarness() first');
  await harnessPool.query(
    `INSERT INTO channels (id, server_id, name)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [id, serverId, name],
  );
}

/**
 * Insert a minimal real messages row.
 * channelId and authorId must already exist (FK). messageId is a UUID supplied
 * by the caller so FKs in message_mentions can reference it deterministically.
 */
export async function insertFixtureMessage(
  id: string,
  channelId: string,
  authorId: string,
  content: string,
): Promise<void> {
  if (!harnessPool) throw new Error('pg-harness: call setupHarness() first');
  await harnessPool.query(
    `INSERT INTO messages (id, channel_id, author_id, content)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT DO NOTHING`,
    [id, channelId, authorId, content],
  );
}

/**
 * Insert a minimal real message_mentions row.
 * messageId and mentionedUserId must already exist (FK).
 */
export async function insertFixtureMention(
  messageId: string,
  mentionedUserId: string,
): Promise<void> {
  if (!harnessPool) throw new Error('pg-harness: call setupHarness() first');
  await harnessPool.query(
    `INSERT INTO message_mentions (message_id, mentioned_user_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [messageId, mentionedUserId],
  );
}

// ---------------------------------------------------------------------------
// Row-count helpers (used by specs for assertions)
// ---------------------------------------------------------------------------

export async function countRows(table: string): Promise<number> {
  if (!harnessPool) throw new Error('pg-harness: call setupHarness() first');
  const result = await harnessPool.query<{ count: string }>(
    `SELECT count(*)::text AS count FROM ${table}`,
  );
  return Number.parseInt(result.rows[0]?.count ?? '0', 10);
}

/**
 * Run an arbitrary parameterised query on the SEPARATE harness pool.
 *
 * Use this wherever a spec needs to assert row content (not just row count)
 * via a connection that is independent from the SUT's drizzle pool. Querying
 * through this pool proves that committed state is visible across connections
 * and that rolled-back state is NOT visible — standard Postgres commit-visibility
 * semantics verified from a genuinely separate TCP connection.
 *
 * The type parameter T describes the shape of a single result row.
 */
export async function harnessQuery<T extends Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  if (!harnessPool) throw new Error('pg-harness: call setupHarness() first');
  const result = await harnessPool.query<T>(sql, params);
  return result.rows;
}

/**
 * Run a SELECT/EXPLAIN query on a dedicated pool client with
 * `SET LOCAL enable_seqscan = off` active for the duration.
 *
 * Use this to assert index ELIGIBILITY in EXPLAIN proofs: `SET LOCAL
 * enable_seqscan = off` inside a transaction tells the planner "treat every
 * sequential scan as prohibitively expensive", so if an index is usable the
 * planner WILL pick it — regardless of table cardinality. This is the
 * canonical way to prove an index exists and is scan-eligible without needing
 * hundreds of rows to tip the cost model.
 *
 * Implementation: acquires a dedicated PoolClient (not a pool.query() call so
 * SET LOCAL is guaranteed to apply to the same connection as the EXPLAIN), runs
 * BEGIN / SET LOCAL enable_seqscan = off / the supplied SQL / ROLLBACK, then
 * releases the client unconditionally.
 *
 * The type parameter T describes the shape of a single result row.
 */
export async function harnessExplainWithSeqscanOff<T extends Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  if (!harnessPool) throw new Error('pg-harness: call setupHarness() first');
  const client = await harnessPool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SET LOCAL enable_seqscan = off');
    const result = await client.query<T>(sql, params);
    await client.query('ROLLBACK');
    return result.rows;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Tear down the harness pool after all tests complete.
 * Does NOT drop tables — migrations are idempotent and the test DB persists
 * across CI runs (truncate-between-cases ensures isolation).
 */
export async function teardownHarness(): Promise<void> {
  await harnessPool?.end();
  harnessPool = undefined;
  harnessDb = undefined;
}
