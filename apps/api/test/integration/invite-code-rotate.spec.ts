/**
 * Integration test: ServersService.rotateInviteCode — real-Postgres (task d058283d).
 *
 * Covers ACs 2, 3, 4, 5 of the rotate spec against a live Postgres DB.
 * AC6 (AuthGuard 401/403) and AC7 (CSPRNG + 23505 retry) are pure-unit concerns
 * proven in servers.service.spec.ts.
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
  harnessQuery,
} from './pg-harness';

// SUT import AFTER harness so the lazy db proxy resolves to the test DB.
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ServersService } from '../../src/servers/servers.service';

const SKIP = !process.env.DATABASE_URL_TEST;

// ---------------------------------------------------------------------------
// Fixture constants
// ---------------------------------------------------------------------------

const SERVER_ID = '20000000-0000-0000-0000-000000000001';
const NONEXISTENT_SERVER_ID = '20000000-0000-0000-0000-000000000099';

const OWNER_ID = 'rotate-owner';
const MEMBER_ID = 'rotate-member';

describe.skipIf(SKIP)(
  'ServersService.rotateInviteCode — real-Postgres (task d058283d)',
  () => {
    let sut!: ServersService;

    beforeAll(async () => {
      await setupHarness();
      // rotateInviteCode does not call rbacService — pass empty stub.
      sut = new ServersService({} as never);
    });

    afterAll(async () => {
      await teardownHarness();
    });

    beforeEach(async () => {
      await truncateTables();

      // Seed: owner + member users, server with a known initial invite_code.
      await insertFixtureUser(OWNER_ID, 'rotate-owner@test.local');
      await insertFixtureUser(MEMBER_ID, 'rotate-member@test.local');
      await insertFixtureServer(SERVER_ID, OWNER_ID, 'Rotate Test Server');
      await insertFixtureMembership(SERVER_ID, OWNER_ID);
      await insertFixtureMembership(SERVER_ID, MEMBER_ID);

      // Stamp a known initial invite_code so we can assert it changed.
      await harnessQuery(
        `UPDATE servers SET invite_code = 'initial-perm-code-aaa' WHERE id = $1`,
        [SERVER_ID],
      );
    });

    // -----------------------------------------------------------------------
    // AC1 + AC2: rotate returns new code ≠ old; old code no longer resolves.
    // -----------------------------------------------------------------------
    it('returns a new invite_code that differs from the initial code (AC1)', async () => {
      const result = await sut.rotateInviteCode(SERVER_ID, OWNER_ID);

      expect(result.invite_code).toBeDefined();
      expect(result.invite_code).not.toBe('initial-perm-code-aaa');
    });

    it('old permanent code no longer resolves via getInvitePreview after rotate (AC2)', async () => {
      const OLD_CODE = 'initial-perm-code-aaa';

      await sut.rotateInviteCode(SERVER_ID, OWNER_ID);

      // getInvitePreview falls through to servers.invite_code lookup —
      // the old code is no longer stored so neither table holds it → 404.
      await expect(sut.getInvitePreview(OLD_CODE)).rejects.toThrow(NotFoundException);
    });

    it('old permanent code no longer admits members via joinViaInvite after rotate (AC2)', async () => {
      const OLD_CODE = 'initial-perm-code-aaa';
      await insertFixtureUser('rotate-joiner-old', 'joiner-old@test.local');

      await sut.rotateInviteCode(SERVER_ID, OWNER_ID);

      await expect(sut.joinViaInvite(OLD_CODE, 'rotate-joiner-old')).rejects.toThrow(
        NotFoundException,
      );
    });

    // -----------------------------------------------------------------------
    // AC3: new code resolves preview and admits members.
    // -----------------------------------------------------------------------
    it('new code resolves getInvitePreview after rotate (AC3)', async () => {
      const { invite_code: newCode } = await sut.rotateInviteCode(SERVER_ID, OWNER_ID);

      const preview = await sut.getInvitePreview(newCode);

      expect(preview.server.id).toBe(SERVER_ID);
      expect(preview.server.name).toBe('Rotate Test Server');
      expect(typeof preview.server.memberCount).toBe('number');
    });

    it('new code admits a new member via joinViaInvite after rotate (AC3)', async () => {
      await insertFixtureUser('rotate-joiner-new', 'joiner-new@test.local');
      const { invite_code: newCode } = await sut.rotateInviteCode(SERVER_ID, OWNER_ID);

      const result = await sut.joinViaInvite(newCode, 'rotate-joiner-new');

      expect(result.serverId).toBe(SERVER_ID);
    });

    // -----------------------------------------------------------------------
    // AC4: non-owner member → ForbiddenException.
    // -----------------------------------------------------------------------
    it('throws ForbiddenException (403) when a non-owner member calls rotate (AC4)', async () => {
      await expect(sut.rotateInviteCode(SERVER_ID, MEMBER_ID)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    // -----------------------------------------------------------------------
    // AC5: non-existent server → NotFoundException.
    // -----------------------------------------------------------------------
    it('throws NotFoundException (404) for a non-existent serverId (AC5)', async () => {
      await expect(
        sut.rotateInviteCode(NONEXISTENT_SERVER_ID, OWNER_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  },
);

// When DATABASE_URL_TEST is not set, emit a clear skip message (not a silent pass).
if (SKIP) {
  describe('ServersService.rotateInviteCode — real-Postgres (task d058283d)', () => {
    it.skip(
      'SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run integration tests locally',
      () => {},
    );
  });
}
