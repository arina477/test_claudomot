/**
 * Integration test: RbacService.getEffectivePermissions + can — real-Postgres authz.
 *
 * AC3 (wave-24 B-2, closes wave-23 F23-T-4): Exercises all 4 branches of
 * getEffectivePermissions (owner, member-with-role, member-no-role, non-member)
 * and 2 sub-cases of can() for the manage_assignments flag, all against real
 * Postgres rows inserted via the harness. No mock DB, no stubbed query.
 *
 * CF-2 (LOAD-BEARING): pg-harness MUST be the first import.
 */
// CF-2 side-effect import: sets process.env.DATABASE_URL = DATABASE_URL_TEST
// at module-eval time so the lazy db singleton resolves to the test DB.
import './pg-harness';
import {
  insertFixtureMembership,
  insertFixtureRole,
  insertFixtureServer,
  insertFixtureUser,
  setupHarness,
  teardownHarness,
  truncateTables,
} from './pg-harness';

// SUT import AFTER harness so the lazy db proxy resolves to the test DB.
import { ForbiddenException } from '@nestjs/common';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { RbacService } from '../../src/rbac/rbac.service';

// Skip-with-reason when DATABASE_URL_TEST is absent.
const SKIP = !process.env.DATABASE_URL_TEST;

// ---------------------------------------------------------------------------
// Fixture constants
// ---------------------------------------------------------------------------

// Server + role IDs (UUID)
const SERVER_ID = '20000000-0000-0000-0000-000000000001';
const ROLE_WITH_ASSIGNMENTS_ID = '30000000-0000-0000-0000-000000000001';

// User IDs (text PK)
const OWNER_ID = 'rbac-owner';
const MEMBER_WITH_ROLE_ID = 'rbac-member-with-role';
const MEMBER_NO_ROLE_ID = 'rbac-member-no-role';
const NON_MEMBER_ID = 'rbac-nonmember';

describe.skipIf(SKIP)(
  'RbacService — real-Postgres getEffectivePermissions + can (manage_assignments, closes F23-T-4)',
  () => {
    let sut!: RbacService;

    beforeAll(async () => {
      await setupHarness();
      // RbacService has no constructor dependencies — safe to instantiate directly.
      sut = new RbacService();
    });

    afterAll(async () => {
      await teardownHarness();
    });

    beforeEach(async () => {
      await truncateTables();

      // Users (must precede server — FK: servers.owner_id → users.id)
      await insertFixtureUser(OWNER_ID, 'rbac-owner@test.local');
      await insertFixtureUser(MEMBER_WITH_ROLE_ID, 'rbac-member-role@test.local');
      await insertFixtureUser(MEMBER_NO_ROLE_ID, 'rbac-member-norole@test.local');
      await insertFixtureUser(NON_MEMBER_ID, 'rbac-nonmember@test.local');

      // Server (must precede roles — FK: roles.server_id → servers.id)
      await insertFixtureServer(SERVER_ID, OWNER_ID, 'RBAC Test Server');

      // Role: manage_assignments=true, all other 4 flags false
      await insertFixtureRole(ROLE_WITH_ASSIGNMENTS_ID, SERVER_ID, 'AssignmentManager', {
        manage_assignments: true,
      });

      // Memberships:
      //   OWNER_ID          — no explicit role needed (owner superuser path)
      //   MEMBER_WITH_ROLE  — assigned ROLE_WITH_ASSIGNMENTS_ID
      //   MEMBER_NO_ROLE    — no role (role_id = NULL)
      //   NON_MEMBER_ID     — intentionally no server_members row
      await insertFixtureMembership(SERVER_ID, OWNER_ID);
      await insertFixtureMembership(SERVER_ID, MEMBER_WITH_ROLE_ID, ROLE_WITH_ASSIGNMENTS_ID);
      await insertFixtureMembership(SERVER_ID, MEMBER_NO_ROLE_ID);
    });

    // -----------------------------------------------------------------------
    // getEffectivePermissions — 4 branches (rbac.service.ts:278)
    // -----------------------------------------------------------------------

    it('owner: getEffectivePermissions → owner=true + all 5 flags true (superuser short-circuit)', async () => {
      // Real DB round-trip: SELECT servers (owner check) → returns owner branch immediately
      const perms = await sut.getEffectivePermissions(OWNER_ID, SERVER_ID);

      expect(perms.owner).toBe(true);
      expect(perms.manage_server).toBe(true);
      expect(perms.manage_roles).toBe(true);
      expect(perms.manage_channels).toBe(true);
      expect(perms.manage_members).toBe(true);
      expect(perms.manage_assignments).toBe(true);
    });

    it('member with manage_assignments role: getEffectivePermissions → manage_assignments=true, all others false', async () => {
      // Real DB round-trip: SELECT servers → not owner; SELECT server_members → role_id;
      // SELECT roles → flags read from real row
      const perms = await sut.getEffectivePermissions(MEMBER_WITH_ROLE_ID, SERVER_ID);

      expect(perms.owner).toBe(false);
      expect(perms.manage_assignments).toBe(true);
      // All other flags must be false (role was inserted with only manage_assignments=true)
      expect(perms.manage_server).toBe(false);
      expect(perms.manage_roles).toBe(false);
      expect(perms.manage_channels).toBe(false);
      expect(perms.manage_members).toBe(false);
    });

    it('member with no role: getEffectivePermissions → owner=false + all 5 flags false (null role_id path)', async () => {
      // Real DB round-trip: SELECT servers → not owner; SELECT server_members →
      // role_id = NULL → all-false early return
      const perms = await sut.getEffectivePermissions(MEMBER_NO_ROLE_ID, SERVER_ID);

      expect(perms.owner).toBe(false);
      expect(perms.manage_server).toBe(false);
      expect(perms.manage_roles).toBe(false);
      expect(perms.manage_channels).toBe(false);
      expect(perms.manage_members).toBe(false);
      expect(perms.manage_assignments).toBe(false);
    });

    it('non-member: getEffectivePermissions → ForbiddenException (403)', async () => {
      // Real DB round-trip: SELECT servers → found; SELECT server_members → no row
      // → ForbiddenException('You are not a member of this server')
      await expect(sut.getEffectivePermissions(NON_MEMBER_ID, SERVER_ID)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    // -----------------------------------------------------------------------
    // can() — manage_assignments flag (rbac.service.ts:52)
    //
    // Tests the same permission flag via the simpler boolean-returning method.
    // -----------------------------------------------------------------------

    it('can(): member holding manage_assignments role → true', async () => {
      // Real DB round-trip: owner check → not owner; membership check → role_id found;
      // role flag check → manage_assignments = true
      const result = await sut.can(MEMBER_WITH_ROLE_ID, SERVER_ID, 'manage_assignments');

      expect(result).toBe(true);
    });

    it('can(): member without a role → false for manage_assignments (null role_id → default-deny)', async () => {
      // Real DB round-trip: owner check → not owner; membership check → role_id = null
      // → default-deny (false)
      const result = await sut.can(MEMBER_NO_ROLE_ID, SERVER_ID, 'manage_assignments');

      expect(result).toBe(false);
    });
  },
);

// When DATABASE_URL_TEST is not set, emit a clear skip message (not a silent pass).
if (SKIP) {
  describe('RbacService — real-Postgres getEffectivePermissions + can (manage_assignments, closes F23-T-4)', () => {
    it.skip('SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run integration tests locally', () => {});
  });
}
