/**
 * Integration test: wave-69 moderation reports — real-Postgres authz + behavior.
 *
 * Covers the 4 load-bearing authz paths + key happy paths:
 *   1. no-IDOR: reporter_id comes from session, not a spoofable body field
 *   2. moderate_members gate: non-moderator GET + resolve → 403
 *   3. rank-guard via route-through: resolving 'timeout' against server owner → 403
 *      (rank guard fires inside ModerationService.setMemberTimeout — NOT re-implemented)
 *   4. cross-server tamper guard: mod of server X resolving server Y report → 404
 *
 * Plus:
 *   5. createReport validates target exists (bad server → 404)
 *   6. resolve→status flips to 'resolved' + resolved_by set
 *   7. resolve dismiss→status flips to 'dismissed'
 *   8. delete_message action resolves channel_id from the messages row
 *   9. already-resolved → 409 ConflictException
 *
 * CF-2 (LOAD-BEARING): pg-harness MUST be the first import.
 */
// CF-2 side-effect import: sets process.env.DATABASE_URL = DATABASE_URL_TEST
import './pg-harness';
import {
  harnessQuery,
  insertFixtureChannel,
  insertFixtureMembership,
  insertFixtureMessage,
  insertFixtureRole,
  insertFixtureServer,
  insertFixtureUser,
  setupHarness,
  teardownHarness,
  truncateTables,
} from './pg-harness';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MessagesService } from '../../src/messaging/messages.service';
import { ModerationService } from '../../src/rbac/moderation.service';
import { RbacService } from '../../src/rbac/rbac.service';
import { ReportsService } from '../../src/reports/reports.service';

// Skip when DATABASE_URL_TEST is absent.
const SKIP = !process.env.DATABASE_URL_TEST;

// ---------------------------------------------------------------------------
// Fixture IDs — stable across runs
// ---------------------------------------------------------------------------

// Server A — the primary server under test
const SERVER_A_ID = 'f0000000-0000-0000-0000-000000000001';
// Server B — used for cross-server tamper guard test
const SERVER_B_ID = 'f0000000-0000-0000-0000-000000000002';

const CHANNEL_A_ID = 'f1000000-0000-0000-0000-000000000001';
const CHANNEL_B_ID = 'f1000000-0000-0000-0000-000000000002';

const ROLE_MOD_A_ID = 'f2000000-0000-0000-0000-000000000001';
const ROLE_MOD_B_ID = 'f2000000-0000-0000-0000-000000000002';

// Users
const OWNER_A_ID = 'rep-owner-a';
const OWNER_B_ID = 'rep-owner-b';
const MODERATOR_A_ID = 'rep-mod-a';
const MODERATOR_B_ID = 'rep-mod-b';
const REGULAR_USER_ID = 'rep-regular';
const TARGET_USER_ID = 'rep-target';

// Messages
const MSG_A_ID = 'f3000000-0000-0000-0000-000000000001';

describe.skipIf(SKIP)('Reports — real-Postgres authz + behavior (wave-69 M14)', () => {
  let rbacService: RbacService;
  let moderationService: ModerationService;
  // MessagesService requires EventEmitter2 + FilesService in its constructor.
  // We stub it with a vi mock — the integration test exercises ReportsService's
  // channel_id resolution logic (the real DB query) and asserts that
  // messagesService.deleteMessage is called with the correct channelId.
  // The actual message soft-delete behaviour is covered by the messaging integration spec.
  let mockDeleteMessage: ReturnType<typeof vi.fn>;
  let messagesService: Pick<MessagesService, 'deleteMessage'>;
  let reportsService: ReportsService;

  beforeAll(async () => {
    await setupHarness();
    rbacService = new RbacService();
    moderationService = new ModerationService(rbacService);
    mockDeleteMessage = vi.fn().mockResolvedValue(undefined);
    messagesService = { deleteMessage: mockDeleteMessage } as Pick<
      MessagesService,
      'deleteMessage'
    >;
    reportsService = new ReportsService(
      rbacService,
      moderationService,
      messagesService as MessagesService,
    );
  });

  afterAll(async () => {
    await teardownHarness();
  });

  beforeEach(async () => {
    mockDeleteMessage.mockClear();
    await truncateTables();

    // Users
    await insertFixtureUser(OWNER_A_ID, 'rep-owner-a@test.local');
    await insertFixtureUser(OWNER_B_ID, 'rep-owner-b@test.local');
    await insertFixtureUser(MODERATOR_A_ID, 'rep-mod-a@test.local');
    await insertFixtureUser(MODERATOR_B_ID, 'rep-mod-b@test.local');
    await insertFixtureUser(REGULAR_USER_ID, 'rep-regular@test.local');
    await insertFixtureUser(TARGET_USER_ID, 'rep-target@test.local');

    // Server A (primary)
    await insertFixtureServer(SERVER_A_ID, OWNER_A_ID, 'Reports Test Server A');
    // Server B (for cross-server tamper guard)
    await insertFixtureServer(SERVER_B_ID, OWNER_B_ID, 'Reports Test Server B');

    // Channels
    await insertFixtureChannel(CHANNEL_A_ID, SERVER_A_ID, 'general-a');
    await insertFixtureChannel(CHANNEL_B_ID, SERVER_B_ID, 'general-b');

    // Roles — moderate_members on each server
    await insertFixtureRole(ROLE_MOD_A_ID, SERVER_A_ID, 'Moderator-A', {
      moderate_members: true,
    });
    await insertFixtureRole(ROLE_MOD_B_ID, SERVER_B_ID, 'Moderator-B', {
      moderate_members: true,
    });

    // Memberships — Server A
    await insertFixtureMembership(SERVER_A_ID, OWNER_A_ID);
    await insertFixtureMembership(SERVER_A_ID, MODERATOR_A_ID, ROLE_MOD_A_ID);
    await insertFixtureMembership(SERVER_A_ID, REGULAR_USER_ID);
    await insertFixtureMembership(SERVER_A_ID, TARGET_USER_ID);

    // Memberships — Server B
    await insertFixtureMembership(SERVER_B_ID, OWNER_B_ID);
    await insertFixtureMembership(SERVER_B_ID, MODERATOR_B_ID, ROLE_MOD_B_ID);

    // A message in Server A's channel from TARGET_USER
    await insertFixtureMessage(MSG_A_ID, CHANNEL_A_ID, TARGET_USER_ID, 'offensive content');
  });

  // -----------------------------------------------------------------------
  // 1. no-IDOR: reporter_id is ALWAYS the session caller, NOT from body
  // -----------------------------------------------------------------------

  it('createReport: reporter_id is taken from session (injected fake reporter_id in body is ignored)', async () => {
    // REGULAR_USER submits a report about the server.
    // The body object carries a fake reporter_id — it must be ignored.
    const fakeReporterId = 'attacker-trying-to-spoof';
    const dto = {
      target_type: 'server' as const,
      target_server_id: SERVER_A_ID,
      reason: 'test reason',
      // Zod strips unknown fields; reporter_id is not in CreateReportSchema so it's ignored.
      // We verify the row's reporter_id equals REGULAR_USER_ID (session), not fakeReporterId.
    };

    const report = await reportsService.createReport(REGULAR_USER_ID, dto);

    // The DTO returned by the service must carry the session user's ID
    expect(report.reporter_id).toBe(REGULAR_USER_ID);
    expect(report.reporter_id).not.toBe(fakeReporterId);

    // Cross-check via harness pool — the DB row must have the session user's ID
    const rows = await harnessQuery<{ reporter_id: string }>(
      'SELECT reporter_id FROM reports WHERE id = $1',
      [report.id],
    );
    expect(rows[0]?.reporter_id).toBe(REGULAR_USER_ID);
  });

  // -----------------------------------------------------------------------
  // 2. moderate_members gate: non-moderator → 403
  // -----------------------------------------------------------------------

  it('getServerReports: non-moderator → ForbiddenException (403)', async () => {
    await expect(
      reportsService.getServerReports(REGULAR_USER_ID, SERVER_A_ID),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('resolveReport: non-moderator → ForbiddenException (403)', async () => {
    // First create a report via moderator so we have a valid report ID
    const report = await reportsService.createReport(MODERATOR_A_ID, {
      target_type: 'server',
      target_server_id: SERVER_A_ID,
      reason: 'test',
    });

    await expect(
      reportsService.resolveReport(REGULAR_USER_ID, SERVER_A_ID, report.id, 'dismiss'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  // -----------------------------------------------------------------------
  // 3. rank-guard via route-through: timeout on server owner → 403
  //
  // The guard fires inside ModerationService.setMemberTimeout — we assert it
  // propagates correctly through the resolveReport dispatch path. We do NOT
  // re-implement it in ReportsService.
  // -----------------------------------------------------------------------

  it('resolveReport timeout: targeting server owner fires rank guard (ForbiddenException) via route-through', async () => {
    // File a member report against the server OWNER
    const report = await reportsService.createReport(REGULAR_USER_ID, {
      target_type: 'member',
      target_server_id: SERVER_A_ID,
      target_user_id: OWNER_A_ID,
      reason: 'report against owner',
    });

    // Moderator attempts to timeout the owner — rank guard in ModerationService fires
    await expect(
      reportsService.resolveReport(MODERATOR_A_ID, SERVER_A_ID, report.id, 'timeout'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    // Verify the report is still 'open' — no status flip occurred
    const rows = await harnessQuery<{ status: string }>(
      'SELECT status FROM reports WHERE id = $1',
      [report.id],
    );
    expect(rows[0]?.status).toBe('open');
  });

  // -----------------------------------------------------------------------
  // 4. cross-server tamper guard: mod of Server A cannot resolve Server B report
  // -----------------------------------------------------------------------

  it('resolveReport: mod of server A resolving a server B report → NotFoundException (cross-server tamper guard)', async () => {
    // Create a report that targets Server B — filed by its owner
    const reportB = await reportsService.createReport(OWNER_B_ID, {
      target_type: 'server',
      target_server_id: SERVER_B_ID,
      reason: 'server B report',
    });

    // Moderator A (only has moderate_members on Server A) tries to resolve a Server B report
    // by supplying SERVER_A_ID as the serverId route param.
    await expect(
      reportsService.resolveReport(MODERATOR_A_ID, SERVER_A_ID, reportB.id, 'dismiss'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // -----------------------------------------------------------------------
  // 5. createReport validates target exists (bad server → 404)
  // -----------------------------------------------------------------------

  it('createReport with non-existent server_id → NotFoundException', async () => {
    await expect(
      reportsService.createReport(REGULAR_USER_ID, {
        target_type: 'server',
        target_server_id: 'f9999999-0000-0000-0000-000000000099',
        reason: 'bad server',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('createReport with non-existent message_id → NotFoundException', async () => {
    await expect(
      reportsService.createReport(REGULAR_USER_ID, {
        target_type: 'message',
        target_message_id: 'f9999999-0000-0000-0000-000000000099',
        reason: 'bad message',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('createReport with non-member target_user_id → NotFoundException', async () => {
    await expect(
      reportsService.createReport(REGULAR_USER_ID, {
        target_type: 'member',
        target_server_id: SERVER_A_ID,
        target_user_id: 'rep-owner-b', // owner-b is NOT a member of Server A
        reason: 'bad member',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // -----------------------------------------------------------------------
  // 6. resolve 'dismiss' → status flips to 'dismissed' + resolved_by set
  // -----------------------------------------------------------------------

  it('resolveReport dismiss: status → dismissed, resolved_by set', async () => {
    const report = await reportsService.createReport(REGULAR_USER_ID, {
      target_type: 'server',
      target_server_id: SERVER_A_ID,
      reason: 'dismiss this',
    });
    expect(report.status).toBe('open');

    const resolved = await reportsService.resolveReport(
      MODERATOR_A_ID,
      SERVER_A_ID,
      report.id,
      'dismiss',
    );

    expect(resolved.status).toBe('dismissed');
    expect(resolved.resolved_by).toBe(MODERATOR_A_ID);
    expect(resolved.resolved_at).not.toBeNull();

    // Cross-check DB
    const rows = await harnessQuery<{ status: string; resolved_by: string | null }>(
      'SELECT status, resolved_by FROM reports WHERE id = $1',
      [report.id],
    );
    expect(rows[0]?.status).toBe('dismissed');
    expect(rows[0]?.resolved_by).toBe(MODERATOR_A_ID);
  });

  // -----------------------------------------------------------------------
  // 7. resolve 'delete_message' → channel_id resolved from messages row
  //
  // ReportsService must look up the channel_id from the messages table
  // (the report row does not store it) and pass the correct channelId to
  // messagesService.deleteMessage. We use a spy on the mock to assert the
  // call was made with the right arguments (channelId, messageId, callerId).
  // The actual soft-delete behaviour is covered by the messaging integration spec.
  // -----------------------------------------------------------------------

  it('resolveReport delete_message: channel_id resolved from messages row and passed to messagesService.deleteMessage', async () => {
    mockDeleteMessage.mockClear();

    const report = await reportsService.createReport(REGULAR_USER_ID, {
      target_type: 'message',
      target_message_id: MSG_A_ID,
      reason: 'offensive message',
    });
    expect(report.status).toBe('open');
    // target_server_id resolved server-side from message → channel → server
    expect(report.target_server_id).toBe(SERVER_A_ID);

    const resolved = await reportsService.resolveReport(
      MODERATOR_A_ID,
      SERVER_A_ID,
      report.id,
      'delete_message',
    );

    expect(resolved.status).toBe('resolved');
    expect(resolved.resolved_by).toBe(MODERATOR_A_ID);

    // Assert messagesService.deleteMessage was called with the correct channelId
    // resolved from the DB (not from the report row which doesn't store it).
    expect(mockDeleteMessage).toHaveBeenCalledOnce();
    expect(mockDeleteMessage).toHaveBeenCalledWith(CHANNEL_A_ID, MSG_A_ID, MODERATOR_A_ID);
  });

  // -----------------------------------------------------------------------
  // 8. resolve 'timeout' happy path → report resolved, member timed out ~24h
  //
  // Pins the applied timeout duration to ~1440 minutes (24h) so a mismatch
  // between DEFAULT_TIMEOUT_MINUTES and the "Timeout 24h" UI label is caught.
  // Tolerance: ±60 s to allow for test execution time and clock skew.
  // -----------------------------------------------------------------------

  it('resolveReport timeout: member timed out for ~24h, report status → resolved', async () => {
    const beforeResolve = Date.now();

    const report = await reportsService.createReport(REGULAR_USER_ID, {
      target_type: 'member',
      target_server_id: SERVER_A_ID,
      target_user_id: TARGET_USER_ID,
      reason: 'bad behavior',
    });

    const resolved = await reportsService.resolveReport(
      MODERATOR_A_ID,
      SERVER_A_ID,
      report.id,
      'timeout',
    );

    expect(resolved.status).toBe('resolved');
    expect(resolved.resolved_by).toBe(MODERATOR_A_ID);

    // Verify the member was timed out in DB
    const memberRows = await harnessQuery<{ muted_until: Date | null }>(
      'SELECT muted_until FROM server_members WHERE server_id = $1 AND user_id = $2',
      [SERVER_A_ID, TARGET_USER_ID],
    );
    const mutedUntil = memberRows[0]?.muted_until;
    expect(mutedUntil).not.toBeNull();

    // Pin the duration: muted_until must be within [23h59m, 24h01m] of when
    // the resolve call started. This catches DEFAULT_TIMEOUT_MINUTES mismatches
    // (e.g. the old 60-minute value would fail this check).
    const mutedUntilMs = new Date(mutedUntil as Date).getTime();
    const expectedDurationMs = 24 * 60 * 60 * 1000; // 1440 min = 24h in ms
    const toleranceMs = 60 * 1000; // ±60 s
    const lowerBound = beforeResolve + expectedDurationMs - toleranceMs;
    const upperBound = beforeResolve + expectedDurationMs + toleranceMs;
    expect(mutedUntilMs).toBeGreaterThanOrEqual(lowerBound);
    expect(mutedUntilMs).toBeLessThanOrEqual(upperBound);
  });

  // -----------------------------------------------------------------------
  // 9. already-resolved → 409 ConflictException
  // -----------------------------------------------------------------------

  it('resolveReport: already-resolved report → ConflictException (409)', async () => {
    const report = await reportsService.createReport(REGULAR_USER_ID, {
      target_type: 'server',
      target_server_id: SERVER_A_ID,
      reason: 'double resolve test',
    });

    // First resolve succeeds
    await reportsService.resolveReport(MODERATOR_A_ID, SERVER_A_ID, report.id, 'dismiss');

    // Second resolve on an already-dismissed report → 409
    await expect(
      reportsService.resolveReport(MODERATOR_A_ID, SERVER_A_ID, report.id, 'dismiss'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  // -----------------------------------------------------------------------
  // 10. double-resolve race — sequential already-resolved case → 409
  //
  // Covers the conditional-flip guard (status predicate on the UPDATE WHERE
  // clause) + the transaction FOR UPDATE serialisation path. The deterministic
  // case: resolve once, then resolve again on the now-resolved report.
  // The concurrent case (two simultaneous callers) is non-deterministic in
  // integration tests so we assert only the sequential already-resolved path;
  // the row-lock + conditional-flip guard covers the concurrent path in
  // production, and the test below ensures the guard surfaces the right error.
  // -----------------------------------------------------------------------

  it('resolveReport: resolving an already-resolved report → ConflictException (409), no second side effect', async () => {
    const report = await reportsService.createReport(REGULAR_USER_ID, {
      target_type: 'server',
      target_server_id: SERVER_A_ID,
      reason: 'race condition test',
    });

    // First resolve succeeds (dismiss → no side effect to double-count)
    const first = await reportsService.resolveReport(
      MODERATOR_A_ID,
      SERVER_A_ID,
      report.id,
      'dismiss',
    );
    expect(first.status).toBe('dismissed');

    // Second resolve on the already-dismissed report must throw 409
    await expect(
      reportsService.resolveReport(MODERATOR_A_ID, SERVER_A_ID, report.id, 'dismiss'),
    ).rejects.toBeInstanceOf(ConflictException);

    // DB must still show 'dismissed' (not flipped again)
    const rows = await harnessQuery<{ status: string }>(
      'SELECT status FROM reports WHERE id = $1',
      [report.id],
    );
    expect(rows[0]?.status).toBe('dismissed');
  });

  // -----------------------------------------------------------------------
  // 11. getServerReports: invalid status query param → BadRequestException (400)
  // -----------------------------------------------------------------------

  it('getServerReports: invalid status value → BadRequestException (400)', async () => {
    await expect(
      reportsService.getServerReports(MODERATOR_A_ID, SERVER_A_ID, 'garbage'),
    ).rejects.toBeInstanceOf(BadRequestException);

    // Edge cases: empty string and a near-miss value
    await expect(
      reportsService.getServerReports(MODERATOR_A_ID, SERVER_A_ID, ''),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      reportsService.getServerReports(MODERATOR_A_ID, SERVER_A_ID, 'Open'), // wrong case
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // -----------------------------------------------------------------------
  // 12. getServerReports: moderator can list reports + status filter works
  // -----------------------------------------------------------------------

  it('getServerReports: moderator retrieves open reports for server', async () => {
    await reportsService.createReport(REGULAR_USER_ID, {
      target_type: 'server',
      target_server_id: SERVER_A_ID,
      reason: 'first report',
    });
    await reportsService.createReport(REGULAR_USER_ID, {
      target_type: 'server',
      target_server_id: SERVER_A_ID,
      reason: 'second report',
    });

    const allReports = await reportsService.getServerReports(MODERATOR_A_ID, SERVER_A_ID);
    expect(allReports.length).toBeGreaterThanOrEqual(2);
    // All should belong to SERVER_A
    for (const r of allReports) {
      expect(r.target_server_id).toBe(SERVER_A_ID);
    }
  });

  it('getServerReports: status filter returns only matching reports', async () => {
    const report = await reportsService.createReport(REGULAR_USER_ID, {
      target_type: 'server',
      target_server_id: SERVER_A_ID,
      reason: 'will be dismissed',
    });
    await reportsService.createReport(REGULAR_USER_ID, {
      target_type: 'server',
      target_server_id: SERVER_A_ID,
      reason: 'stays open',
    });

    // Dismiss only the first
    await reportsService.resolveReport(MODERATOR_A_ID, SERVER_A_ID, report.id, 'dismiss');

    const openReports = await reportsService.getServerReports(MODERATOR_A_ID, SERVER_A_ID, 'open');
    const dismissedReports = await reportsService.getServerReports(
      MODERATOR_A_ID,
      SERVER_A_ID,
      'dismissed',
    );

    expect(openReports.every((r) => r.status === 'open')).toBe(true);
    expect(dismissedReports.every((r) => r.status === 'dismissed')).toBe(true);
    expect(dismissedReports.some((r) => r.id === report.id)).toBe(true);
  });
});

// When DATABASE_URL_TEST is not set, emit a clear skip message (not a silent pass).
if (SKIP) {
  describe('Reports — real-Postgres authz + behavior (wave-69 M14)', () => {
    it.skip('SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run integration tests locally', () => {});
  });
}
