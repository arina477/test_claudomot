/**
 * Integration test (wave-87): new-member joins stamp the server's default role.
 *
 * Wave-87 changed joinPublicServer + joinViaInvite so a new server_members row
 * carries the server's existing default 'Member' role (is_default=true) instead
 * of role_id=NULL.  The unit specs (servers.service.spec.ts) MOCK the DB, so the
 * real resolveDefaultRoleId SELECT + the server_members INSERT stamp are
 * UNCOVERED against a live schema.  This T-4 spec proves the stamp end-to-end
 * against real Postgres:
 *
 *   1. Public join stamps the default role (role_id == is_default role id).
 *   2. Invite join stamps the default role (via the permanent invite_code).
 *   3. Zero-default fallback: no is_default role → join succeeds, role_id NULL.
 *   4. Re-join preserves the existing role (onConflictDoNothing does not restamp).
 *
 * Seeding uses the REAL createServer path (not hand-inserted roles) so the
 * default 'Member' role under test is the exact row production seeds.
 *
 * CF-2 (LOAD-BEARING): pg-harness MUST be the first import. It sets
 * process.env.DATABASE_URL = process.env.DATABASE_URL_TEST at module-eval time,
 * before the lazy Proxy in apps/api/src/db/index.ts first resolves its Pool.
 */
// CF-2 side-effect import: sets process.env.DATABASE_URL = DATABASE_URL_TEST
// at module-eval time so the lazy db singleton resolves to the test DB.
import './pg-harness';
import {
  harnessQuery,
  insertFixtureUser,
  setupHarness,
  teardownHarness,
  truncateTables,
} from './pg-harness';

// SUT import AFTER harness so the lazy db proxy resolves to the test DB.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { EntitlementsService } from '../../src/billing/entitlements.service';
import { ServersService } from '../../src/servers/servers.service';

// Skip-with-reason when DATABASE_URL_TEST is absent (local dev without PG).
// Runs in CI where the Postgres 16 service + DATABASE_URL_TEST are provided.
const SKIP = !process.env.DATABASE_URL_TEST;

// ---------------------------------------------------------------------------
// Permissive EntitlementsService stub so createServer's create-gate always
// passes without a live DB SELECT through resolveCreateGateForOwner. Mirrors
// create-server-rollback.spec.ts — currentServerCount=0, maxServersPerOwner=100.
// ---------------------------------------------------------------------------
function makeEntitlementsStub(): EntitlementsService {
  return {
    resolveCreateGateForOwner: async (_ownerId: string) => ({
      tier: 'free' as const,
      caps: {
        storageMb: 2_048,
        callCapacity: 50,
        educatorAdminTools: false,
        maxServersPerOwner: 100,
      },
      currentServerCount: 0,
    }),
    resolveForServer: async (_serverId: string) => ({
      tier: 'free' as const,
      entitlements: {
        storageMb: 2_048,
        callCapacity: 50,
        educatorAdminTools: false,
      },
    }),
  } as unknown as EntitlementsService;
}

// ---------------------------------------------------------------------------
// Fixture constants
// ---------------------------------------------------------------------------

const OWNER_ID = 'jdr-owner';
const OWNER_EMAIL = 'jdr-owner@test.local';
const JOINER_ID = 'jdr-joiner';
const JOINER_EMAIL = 'jdr-joiner@test.local';

// Row shape for the server_members assertion query.
// `type` (not `interface`) so it satisfies harnessQuery's Record<string, unknown> bound.
type MemberRow = {
  role_id: string | null;
};

describe.skipIf(SKIP)('ServersService default-role stamp on join — real-Postgres (wave-87)', () => {
  let sut!: ServersService;

  beforeAll(async () => {
    await setupHarness();
    // createServer needs entitlementsService (stubbed permissive); the join
    // paths use neither rbacService nor entitlementsService — pass a stub for
    // rbacService.
    sut = new ServersService({} as never, makeEntitlementsStub());
  });

  afterAll(async () => {
    await teardownHarness();
  });

  beforeEach(async () => {
    await truncateTables();
    // Users first (FK: servers.owner_id + server_members.user_id → users.id).
    await insertFixtureUser(OWNER_ID, OWNER_EMAIL);
    await insertFixtureUser(JOINER_ID, JOINER_EMAIL);
  });

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /** Create a server via the REAL createServer path, then publish it. */
  async function createPublicServer(name: string): Promise<string> {
    const server = await sut.createServer(OWNER_ID, name);
    await harnessQuery('UPDATE servers SET is_public = true WHERE id = $1', [server.id]);
    return server.id;
  }

  /** Read the is_default=true role id for a server (the row createServer seeds). */
  async function defaultRoleId(serverId: string): Promise<string> {
    const rows = await harnessQuery<{ id: string }>(
      'SELECT id FROM roles WHERE server_id = $1 AND is_default = true',
      [serverId],
    );
    const id = rows[0]?.id;
    if (!id) throw new Error(`No is_default role found for server ${serverId}`);
    return id;
  }

  /** Read a single member's role_id from the real server_members row. */
  async function memberRoleId(serverId: string, userId: string): Promise<string | null> {
    const rows = await harnessQuery<MemberRow>(
      'SELECT role_id FROM server_members WHERE server_id = $1 AND user_id = $2',
      [serverId, userId],
    );
    expect(rows.length).toBe(1); // exactly one membership row
    return rows[0]?.role_id ?? null;
  }

  // -------------------------------------------------------------------------
  // 1. Public join stamps the server's default role.
  //
  // createServer seeds the default 'Member' role (is_default=true).  A fresh
  // user joining the public server must have role_id == that default role id —
  // NOT null.  Proves resolveDefaultRoleId's SELECT + the INSERT stamp against
  // a live schema.
  // -------------------------------------------------------------------------
  it('public join stamps the server default role (role_id == is_default role id, not null)', async () => {
    const serverId = await createPublicServer('Public Join Default-Role');
    const expectedRoleId = await defaultRoleId(serverId);

    const result = await sut.joinPublicServer(serverId, JOINER_ID);
    expect(result).toEqual({ serverId });

    const stampedRoleId = await memberRoleId(serverId, JOINER_ID);
    expect(stampedRoleId).not.toBeNull();
    expect(stampedRoleId).toBe(expectedRoleId);
  });

  // -------------------------------------------------------------------------
  // 2. Invite join stamps the server's default role.
  //
  // Uses the permanent invite_code createServer generates (read via the harness
  // pool — ServerResponse does not expose it).  joinViaInvite must stamp the
  // same default role id.
  // -------------------------------------------------------------------------
  it('invite join stamps the server default role (role_id == is_default role id, not null)', async () => {
    // Invite path does not require is_public — plain createServer is enough.
    const server = await sut.createServer(OWNER_ID, 'Invite Join Default-Role');
    const expectedRoleId = await defaultRoleId(server.id);

    // Read the permanent invite_code createServer stamped on the server row.
    const codeRows = await harnessQuery<{ invite_code: string | null }>(
      'SELECT invite_code FROM servers WHERE id = $1',
      [server.id],
    );
    const code = codeRows[0]?.invite_code;
    expect(code).toBeTruthy();

    const result = await sut.joinViaInvite(code as string, JOINER_ID);
    expect(result).toEqual({ serverId: server.id });

    const stampedRoleId = await memberRoleId(server.id, JOINER_ID);
    expect(stampedRoleId).not.toBeNull();
    expect(stampedRoleId).toBe(expectedRoleId);
  });

  // -------------------------------------------------------------------------
  // 3. Zero-default fallback: no is_default role → join succeeds, role_id NULL.
  //
  // Delete the seeded is_default role so resolveDefaultRoleId finds none.
  // roles has NO FK from server_members via a blocking action — the FK on
  // server_members.role_id is ON DELETE SET NULL, and at this point only the
  // owner (stamped with the default role by createServer) references it, so the
  // delete succeeds (owner's role_id is nulled as a side effect).  A subsequent
  // fresh join must NOT throw and must produce role_id = NULL.
  // -------------------------------------------------------------------------
  it('zero-default fallback: join succeeds with role_id NULL when the server has no is_default role', async () => {
    const serverId = await createPublicServer('Zero-Default Server');

    // Remove the seeded default role. server_members.role_id is ON DELETE SET
    // NULL, so the owner's existing stamp is nulled rather than blocking.
    const deleted = await harnessQuery<{ id: string }>(
      'DELETE FROM roles WHERE server_id = $1 AND is_default = true RETURNING id',
      [serverId],
    );
    expect(deleted.length).toBe(1); // the seeded default role was removed

    // Confirm no is_default role remains for this server.
    const remaining = await harnessQuery<{ id: string }>(
      'SELECT id FROM roles WHERE server_id = $1 AND is_default = true',
      [serverId],
    );
    expect(remaining.length).toBe(0);

    // Join must succeed (no throw) and stamp NULL — same behavior as pre-wave-87.
    const result = await sut.joinPublicServer(serverId, JOINER_ID);
    expect(result).toEqual({ serverId });

    const stampedRoleId = await memberRoleId(serverId, JOINER_ID);
    expect(stampedRoleId).toBeNull();
  });

  // -------------------------------------------------------------------------
  // 4. Re-join preserves the existing role (onConflictDoNothing).
  //
  // Pre-insert the joiner as a member carrying a DISTINCT non-default role, then
  // call joinPublicServer.  The INSERT ... ON CONFLICT (server_id, user_id) DO
  // NOTHING must NOT overwrite the existing role_id with the default role id.
  // Uses a distinct role (not the default) so a restamp regression is visible.
  // -------------------------------------------------------------------------
  it('re-join preserves an existing member role (onConflictDoNothing does not restamp default)', async () => {
    const serverId = await createPublicServer('Re-Join Preserve Role');
    const defaultId = await defaultRoleId(serverId);

    // Create a DISTINCT non-default role and pre-stamp the joiner with it.
    const customRows = await harnessQuery<{ id: string }>(
      `INSERT INTO roles (server_id, name, position, is_default)
       VALUES ($1, 'Moderator', 1, false) RETURNING id`,
      [serverId],
    );
    const customRoleId = customRows[0]?.id;
    expect(customRoleId).toBeTruthy();
    expect(customRoleId).not.toBe(defaultId); // sanity: distinct from the default

    await harnessQuery(
      'INSERT INTO server_members (server_id, user_id, role_id) VALUES ($1, $2, $3)',
      [serverId, JOINER_ID, customRoleId],
    );

    // Re-join: onConflictDoNothing must leave the existing row (and its role) intact.
    const result = await sut.joinPublicServer(serverId, JOINER_ID);
    expect(result).toEqual({ serverId });

    const stampedRoleId = await memberRoleId(serverId, JOINER_ID);
    expect(stampedRoleId).toBe(customRoleId); // unchanged — NOT restamped to default
    expect(stampedRoleId).not.toBe(defaultId);
  });
});

// When DATABASE_URL_TEST is not set, emit a clear skip message (not a silent pass).
if (SKIP) {
  describe('ServersService default-role stamp on join — real-Postgres (wave-87)', () => {
    it.skip('SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run integration tests locally', () => {});
  });
}
