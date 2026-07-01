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
// Fixture helpers — servers, roles, server_members (wave-24)
// ---------------------------------------------------------------------------

/**
 * Permission flags for a role row (all default false when omitted).
 * Covers all 5 RBAC boolean columns incl manage_assignments (wave-23).
 */
export interface RolePerms {
  manage_server?: boolean;
  manage_roles?: boolean;
  manage_channels?: boolean;
  manage_members?: boolean;
  manage_assignments?: boolean;
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
        is_default)
     VALUES ($1, $2, $3, 0, $4, $5, $6, $7, $8, false)
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
