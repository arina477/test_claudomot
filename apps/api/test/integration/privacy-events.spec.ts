/**
 * Integration test: AppendPrivacyEventService + hook seams (wave-73 B-2).
 *
 * Covers:
 *   1. deleteAccount seam: real AccountDeletionService call → privacy_events row
 *      with event_type='account_deleted', correct actor_id + target_id.
 *   2. exportAccountData seam: real AccountDataService call → privacy_events row
 *      with event_type='data_exported', correct actor_id + target_id.
 *   3. updatePrivacy seam: real PrivacyService call → privacy_events row with
 *      event_type='privacy_settings_changed'; context carries ONLY non-PII
 *      visibility/whoCanDm values (no email/display_name).
 *   4. createBlock seam: real BlocksService call → privacy_events row with
 *      event_type='user_blocked', correct actor_id + target_id.
 *   5. removeBlock seam: real BlocksService call → privacy_events row with
 *      event_type='user_unblocked', correct actor_id + target_id.
 *   6. no-IDOR: listForActor returns ONLY the caller's own events (seed 2
 *      users' events; assert user A's read excludes user B's events).
 *   7. best-effort non-blocking (unit path): inject a throwing append stub
 *      and assert the underlying action still succeeds (does not throw/500).
 *   8. no-PII: context for privacy_settings_changed contains ONLY visibility
 *      and whoCanDm enum values (no email/display_name).
 *
 * CF-2 (LOAD-BEARING): pg-harness MUST be the first import.
 *
 * Why services are instantiated directly rather than via NestJS app:
 *   The CI pg-harness has only Postgres (no SuperTokens core). We bypass the
 *   NestJS DI container and instantiate services with their real DB dependency
 *   by injecting a live AppendPrivacyEventService instance. This tests the
 *   ACTUAL DB writes that the hooks perform. Row assertions are mandatory per
 *   spec: each per-seam assertion proves the hook fired and wrote the row.
 *
 * Why AccountDeletionService needs Session.revokeAllSessionsForUser:
 *   The service calls Session.revokeAllSessionsForUser after the transaction
 *   commits. In CI (no supertokens-core) this throws. The service wraps the
 *   call in a best-effort try/catch so the deletion + audit log still succeed.
 *   The row assertion after deleteAccount verifies the audit log row IS written
 *   even when revocation fails (the hook fires after the revocation attempt,
 *   in its own independent try/catch).
 */

// CF-2 side-effect import: sets process.env.DATABASE_URL = DATABASE_URL_TEST
import './pg-harness';
import {
  harnessQuery,
  insertFixtureServer,
  insertFixtureUser,
  setupHarness,
  teardownHarness,
  truncateTables,
} from './pg-harness';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BlocksService } from '../../src/blocks/blocks.service';
import { AccountDataService } from '../../src/privacy/account-data.service';
import { AccountDeletionService } from '../../src/privacy/account-deletion.service';
import { AppendPrivacyEventService } from '../../src/privacy/append-privacy-event.service';
import { PrivacyService } from '../../src/privacy/privacy.service';

// Skip when DATABASE_URL_TEST is absent (local dev without test DB).
const SKIP = !process.env.DATABASE_URL_TEST;

// ---------------------------------------------------------------------------
// Fixture constants
// ---------------------------------------------------------------------------

const USER_A = 'pe-user-a'; // primary actor for most tests
const USER_B = 'pe-user-b'; // secondary user (block target + IDOR seed)

const SERVER_A = '00000000-0000-0000-0088-000000000001'; // owned by USER_B (not USER_A → no owner-block)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface PrivacyEventRow extends Record<string, unknown> {
  id: string;
  actor_id: string;
  event_type: string;
  target_type: string;
  target_id: string | null;
  context: Record<string, unknown> | null;
}

async function fetchPrivacyEvents(actorId: string): Promise<PrivacyEventRow[]> {
  return harnessQuery<PrivacyEventRow>(
    `SELECT id, actor_id, event_type, target_type, target_id,
            context::text::json AS context
     FROM privacy_events
     WHERE actor_id = $1
     ORDER BY created_at ASC`,
    [actorId],
  );
}

// ---------------------------------------------------------------------------
describe.skipIf(SKIP)('AppendPrivacyEventService + hook seams (wave-73 B-2)', () => {
  let appendService: AppendPrivacyEventService;
  let accountDeletionService: AccountDeletionService;
  let accountDataService: AccountDataService;
  let privacyService: PrivacyService;
  let blocksService: BlocksService;

  beforeAll(async () => {
    await setupHarness();
    appendService = new AppendPrivacyEventService();
    accountDeletionService = new AccountDeletionService(appendService);
    accountDataService = new AccountDataService(appendService);
    privacyService = new PrivacyService(appendService);
    blocksService = new BlocksService(appendService);
  });

  afterAll(async () => {
    await teardownHarness();
  });

  beforeEach(async () => {
    await truncateTables();

    // USER_A: non-owner member — can be deleted, can export, can update privacy,
    // can create/remove blocks.
    await insertFixtureUser(USER_A, 'pe-user-a@test.local', 'user-a');

    // USER_B: server owner (so USER_B cannot be deleted without owner-block;
    // but here USER_B is just the block target / IDOR seed).
    await insertFixtureUser(USER_B, 'pe-user-b@test.local', 'user-b');

    // Give USER_B a server (to be owner, even though we don't test deletion on B).
    await insertFixtureServer(SERVER_A, USER_B, 'PE-Test Server');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 1. deleteAccount seam
  // ─────────────────────────────────────────────────────────────────────────

  it('1. deleteAccount: privacy_events row written with event_type=account_deleted', async () => {
    // Deletion calls Session.revokeAllSessionsForUser (throws in CI — no ST core).
    // The service's best-effort try/catch swallows that; the audit hook fires
    // independently in its own try/catch. Both are non-fatal by design.
    await accountDeletionService.deleteAccount(USER_A);

    const events = await fetchPrivacyEvents(USER_A);
    const evt = events.find((e) => e.event_type === 'account_deleted');
    expect(evt).toBeDefined();
    expect(evt?.actor_id).toBe(USER_A);
    expect(evt?.target_type).toBe('self');
    expect(evt?.target_id).toBe(USER_A);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. exportAccountData seam
  // ─────────────────────────────────────────────────────────────────────────

  it('2. exportAccountData: privacy_events row written with event_type=data_exported', async () => {
    await accountDataService.exportAccountData(USER_A);

    const events = await fetchPrivacyEvents(USER_A);
    const evt = events.find((e) => e.event_type === 'data_exported');
    expect(evt).toBeDefined();
    expect(evt?.actor_id).toBe(USER_A);
    expect(evt?.target_type).toBe('self');
    expect(evt?.target_id).toBe(USER_A);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. updatePrivacy seam + no-PII assertion
  // ─────────────────────────────────────────────────────────────────────────

  it('3. updatePrivacy: privacy_events row written with event_type=privacy_settings_changed', async () => {
    await privacyService.updatePrivacy(USER_A, {
      profileVisibility: 'server-members',
      whoCanDm: 'server-members',
    });

    const events = await fetchPrivacyEvents(USER_A);
    const evt = events.find((e) => e.event_type === 'privacy_settings_changed');
    expect(evt).toBeDefined();
    expect(evt?.actor_id).toBe(USER_A);
    expect(evt?.target_type).toBe('self');
    expect(evt?.target_id).toBe(USER_A);
  });

  it('8. no-PII: privacy_settings_changed context has ONLY visibility/whoCanDm values — no email/display_name', async () => {
    // Give USER_A a display_name and confirm it does NOT appear in context.
    await harnessQuery('UPDATE users SET display_name = $1 WHERE id = $2', [
      'Alice Audited',
      USER_A,
    ]);

    await privacyService.updatePrivacy(USER_A, {
      profileVisibility: 'nobody',
      whoCanDm: 'nobody',
    });

    const events = await fetchPrivacyEvents(USER_A);
    const evt = events.find((e) => e.event_type === 'privacy_settings_changed');
    expect(evt).toBeDefined();

    const ctx = evt?.context as Record<string, unknown> | null;
    expect(ctx).not.toBeNull();

    // Must carry from/to visibility/whoCanDm values.
    expect(ctx).toHaveProperty('visibilityFrom');
    expect(ctx).toHaveProperty('visibilityTo');
    expect(ctx).toHaveProperty('whoCanDmFrom');
    expect(ctx).toHaveProperty('whoCanDmTo');

    // visibilityTo and whoCanDmTo must be the values we set.
    expect(ctx?.visibilityTo).toBe('nobody');
    expect(ctx?.whoCanDmTo).toBe('nobody');

    // NO PII: context must not contain email or display_name.
    const ctxStr = JSON.stringify(ctx);
    expect(ctxStr).not.toContain('pe-user-a@test.local');
    expect(ctxStr).not.toContain('Alice Audited');

    // Only the known non-PII keys should be present.
    const keys = Object.keys(ctx ?? {});
    for (const key of keys) {
      expect(['visibilityFrom', 'visibilityTo', 'whoCanDmFrom', 'whoCanDmTo']).toContain(key);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. createBlock seam
  // ─────────────────────────────────────────────────────────────────────────

  it('4. createBlock: privacy_events row written with event_type=user_blocked', async () => {
    await blocksService.createBlock(USER_A, USER_B);

    const events = await fetchPrivacyEvents(USER_A);
    const evt = events.find((e) => e.event_type === 'user_blocked');
    expect(evt).toBeDefined();
    expect(evt?.actor_id).toBe(USER_A);
    expect(evt?.target_type).toBe('user');
    expect(evt?.target_id).toBe(USER_B);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 5. removeBlock seam
  // ─────────────────────────────────────────────────────────────────────────

  it('5. removeBlock: privacy_events row written with event_type=user_unblocked', async () => {
    // Block first so there is something to remove.
    await blocksService.createBlock(USER_A, USER_B);
    await blocksService.removeBlock(USER_A, USER_B);

    const events = await fetchPrivacyEvents(USER_A);
    const evt = events.find((e) => e.event_type === 'user_unblocked');
    expect(evt).toBeDefined();
    expect(evt?.actor_id).toBe(USER_A);
    expect(evt?.target_type).toBe('user');
    expect(evt?.target_id).toBe(USER_B);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 6. no-IDOR: listForActor returns ONLY the caller's own events
  // ─────────────────────────────────────────────────────────────────────────

  it("6. no-IDOR: listForActor returns ONLY the calling user's events (B's events excluded)", async () => {
    // Seed USER_A's events
    await accountDataService.exportAccountData(USER_A);

    // Seed USER_B's events (USER_B exports data)
    await accountDataService.exportAccountData(USER_B);

    // USER_A reads their own events — must not see USER_B's
    const aResult = await appendService.listForActor(USER_A);
    const aActorIds = aResult.events.map((e) => e.actorId);
    expect(aActorIds.every((id) => id === USER_A)).toBe(true);
    expect(aActorIds).not.toContain(USER_B);

    // USER_B reads their own events — must not see USER_A's
    const bResult = await appendService.listForActor(USER_B);
    const bActorIds = bResult.events.map((e) => e.actorId);
    expect(bActorIds.every((id) => id === USER_B)).toBe(true);
    expect(bActorIds).not.toContain(USER_A);

    // Both users have at least one event each
    expect(aResult.events.length).toBeGreaterThanOrEqual(1);
    expect(bResult.events.length).toBeGreaterThanOrEqual(1);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 7. best-effort non-blocking: append failure does NOT fail the underlying action
  //
  // Approach: inject a spy/stub that throws when append is called. Then call
  // exportAccountData (which wraps the hook in try/catch) and assert it does
  // NOT throw and returns valid data. We verify the try/catch swallows the error.
  // ─────────────────────────────────────────────────────────────────────────

  it('7. best-effort non-blocking: append failure does NOT throw from exportAccountData', async () => {
    // Create a stub appendService that always throws.
    const throwingAppend = new AppendPrivacyEventService();
    vi.spyOn(throwingAppend, 'append').mockRejectedValue(new Error('simulated append failure'));

    // Create accountDataService with the throwing append stub.
    const sutWithThrowingAppend = new AccountDataService(throwingAppend);

    // exportAccountData must NOT throw even though the audit hook fails.
    await expect(sutWithThrowingAppend.exportAccountData(USER_A)).resolves.toBeDefined();

    // The underlying data is valid (has profile).
    const result = await sutWithThrowingAppend.exportAccountData(USER_A);
    expect(result.profile).toBeDefined();
    expect(result.profile.userId).toBe(USER_A);

    // Restore mock
    vi.restoreAllMocks();
  });

  it('7b. best-effort non-blocking: append failure does NOT throw from updatePrivacy', async () => {
    const throwingAppend = new AppendPrivacyEventService();
    vi.spyOn(throwingAppend, 'append').mockRejectedValue(new Error('simulated append failure'));
    const sutWithThrowingAppend = new PrivacyService(throwingAppend);

    await expect(
      sutWithThrowingAppend.updatePrivacy(USER_A, {
        profileVisibility: 'nobody',
        whoCanDm: 'nobody',
      }),
    ).resolves.toBeDefined();

    vi.restoreAllMocks();
  });

  it('7c. best-effort non-blocking: append failure does NOT throw from createBlock', async () => {
    const throwingAppend = new AppendPrivacyEventService();
    vi.spyOn(throwingAppend, 'append').mockRejectedValue(new Error('simulated append failure'));
    const sutWithThrowingAppend = new BlocksService(throwingAppend);

    const block = await sutWithThrowingAppend.createBlock(USER_A, USER_B);
    expect(block.blocker_id).toBe(USER_A);
    expect(block.blocked_id).toBe(USER_B);

    vi.restoreAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Additional: listForActor DTO shape (camelCase mapping check)
  // ─────────────────────────────────────────────────────────────────────────

  it('listForActor: returns camelCase DTO (actorId/eventType/targetType/targetId/createdAt)', async () => {
    await appendService.append(USER_A, 'data_exported', {
      targetType: 'self',
      targetId: USER_A,
    });

    const result = await appendService.listForActor(USER_A);
    expect(result.events.length).toBeGreaterThanOrEqual(1);

    const evt = result.events[0];
    expect(evt).toBeDefined();

    // camelCase fields present
    expect(evt).toHaveProperty('id');
    expect(evt).toHaveProperty('actorId');
    expect(evt).toHaveProperty('eventType');
    expect(evt).toHaveProperty('targetType');
    expect(evt).toHaveProperty('targetId');
    expect(evt).toHaveProperty('createdAt');

    // Snake_case fields must NOT be present on the DTO
    expect(evt).not.toHaveProperty('actor_id');
    expect(evt).not.toHaveProperty('event_type');
    expect(evt).not.toHaveProperty('target_type');
    expect(evt).not.toHaveProperty('target_id');
    expect(evt).not.toHaveProperty('created_at');

    // Correct values
    expect(evt?.actorId).toBe(USER_A);
    expect(evt?.eventType).toBe('data_exported');
    expect(evt?.targetType).toBe('self');
    expect(typeof evt?.createdAt).toBe('string');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Additional: listForActor returns newest-first (DESC order)
  // ─────────────────────────────────────────────────────────────────────────

  it('listForActor: events are returned newest-first (DESC created_at)', async () => {
    // Insert two events sequentially so created_at timestamps differ.
    await appendService.append(USER_A, 'data_exported', { targetType: 'self', targetId: USER_A });
    // A tiny artificial gap to ensure deterministic ordering.
    await new Promise((r) => setTimeout(r, 5));
    await appendService.append(USER_A, 'privacy_settings_changed', {
      targetType: 'self',
      targetId: USER_A,
    });

    const result = await appendService.listForActor(USER_A);
    expect(result.events.length).toBeGreaterThanOrEqual(2);

    // Newest first: privacy_settings_changed should come before data_exported.
    const types = result.events.map((e) => e.eventType);
    const changedIdx = types.indexOf('privacy_settings_changed');
    const exportedIdx = types.indexOf('data_exported');
    expect(changedIdx).toBeLessThan(exportedIdx);
  });
});

// When DATABASE_URL_TEST is not set, emit a clear skip message.
if (SKIP) {
  describe('AppendPrivacyEventService + hook seams (wave-73 B-2)', () => {
    it.skip('SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run integration tests locally', () => {});
  });
}
