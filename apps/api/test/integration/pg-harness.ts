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
 * Truncate all tables touched by createServer, plus users (fixture).
 * Order matters: children before parents to avoid FK violations.
 * CASCADE handles anything we miss, but explicit order is safer.
 */
export async function truncateTables(): Promise<void> {
  if (!harnessPool) throw new Error('pg-harness: call setupHarness() first');
  // Truncate in dependency order: most-derived first, then parents.
  // RESTART IDENTITY resets sequences; CASCADE catches any missed deps.
  await harnessPool.query(
    `TRUNCATE
       channel_permission_overrides,
       channels,
       categories,
       server_members,
       roles,
       invites,
       servers,
       users
     RESTART IDENTITY CASCADE`,
  );
}

/**
 * Insert a minimal real user row sufficient to satisfy the FK on servers.owner_id
 * and server_members.user_id (both reference users.id which is text PK).
 */
export async function insertFixtureUser(id: string, email: string): Promise<void> {
  if (!harnessPool) throw new Error('pg-harness: call setupHarness() first');
  await harnessPool.query(
    `INSERT INTO users (id, email) VALUES ($1, $2)
     ON CONFLICT (id) DO NOTHING`,
    [id, email],
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
 * Tear down the harness pool after all tests complete.
 * Does NOT drop tables — migrations are idempotent and the test DB persists
 * across CI runs (truncate-between-cases ensures isolation).
 */
export async function teardownHarness(): Promise<void> {
  await harnessPool?.end();
  harnessPool = undefined;
  harnessDb = undefined;
}
