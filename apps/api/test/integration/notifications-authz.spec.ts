/**
 * Integration test: NotificationsService — owner-404 authz boundary + mention dedup invariant
 * (wave-37 regression).
 *
 * BUILD-PRINCIPLES rule 4 (authz negative-path reproduction):
 *   - owner-404 boundary: markRead called with a cross-user notification ID throws
 *     NotFoundException(404) and leaves the target notification unread. The conflation
 *     of "not found" and "forbidden" into a single 404 is deliberate — existence leakage
 *     prevention per NotificationsService comments.
 *   - mention dedup: double-emit of the mention.created handler for the same
 *     (user_id, message_id) pair produces exactly 1 notification row via the
 *     PARTIAL UNIQUE(user_id, message_id) WHERE type='mention' index + ON CONFLICT DO NOTHING.
 *
 * Wave-36 real-PG pattern (NO mock-the-SUT):
 *   NotificationsService is instantiated directly (no constructor-injected dependencies).
 *   All drizzle queries run against DATABASE_URL_TEST via the CF-2 redirect below.
 *   Row-count sanity guards prevent silent skips on vacuous passes.
 *
 * CF-2 (LOAD-BEARING): pg-harness MUST be the first import.
 * It sets process.env.DATABASE_URL = DATABASE_URL_TEST at module-eval time so the lazy
 * db singleton in apps/api/src/db/index.ts resolves to the test DB before any SUT module loads.
 */

// CF-2 side-effect import: sets process.env.DATABASE_URL = DATABASE_URL_TEST
// at module-eval time so the lazy db proxy resolves to the test DB.
import './pg-harness';
import {
  countRows,
  harnessQuery,
  insertFixtureChannel,
  insertFixtureMessage,
  insertFixtureServer,
  insertFixtureUser,
  setupHarness,
  teardownHarness,
  truncateTables,
} from './pg-harness';

// SUT + test framework imports AFTER harness (CF-2 ordering requirement).
import { NotFoundException } from '@nestjs/common';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { NotificationsService } from '../../src/notifications/notifications.service';

// Skip entire suite when DATABASE_URL_TEST is absent (CI supplies it; local dev opt-in).
const SKIP = !process.env.DATABASE_URL_TEST;

// ---------------------------------------------------------------------------
// Fixture constants — deterministic IDs for all seeded entities.
//
// User IDs use text PKs (match users.id schema).
// Server, channel, and message IDs use valid UUIDs (match uuid PK schemas).
// The 'd…' namespace avoids collisions with wave-36 specs that use 'a…' / 'b…'.
// ---------------------------------------------------------------------------

// User IDs (text PK on users table)
const USER_A_ID = 'notif-user-a'; // notification recipient in most cases
const USER_B_ID = 'notif-user-b'; // cross-user attacker / co-user in scoping tests

// UUID fixtures
const SERVER_ID = 'd0000000-0000-0000-0000-000000000001';
const CHANNEL_ID = 'd0000000-0000-0000-0000-000000000002';

// Messages authored by USER_B (USER_B mentions USER_A).
// Distinct message IDs are required for distinct notification rows (partial-unique dedup uses message_id).
const MESSAGE_1_ID = 'd0000000-0000-0000-0000-000000000010';
const MESSAGE_2_ID = 'd0000000-0000-0000-0000-000000000011';

// Message authored by USER_A (USER_A mentions USER_B — needed for markAllRead scoping test).
const MESSAGE_3_ID = 'd0000000-0000-0000-0000-000000000012';

describe.skipIf(SKIP)(
  'NotificationsService — owner-404 authz + mention dedup (wave-37 regression)',
  () => {
    let sut!: NotificationsService;

    beforeAll(async () => {
      await setupHarness();
      // NotificationsService has no constructor-injected dependencies.
      // The `private readonly logger = new Logger(...)` field is a class-field
      // initialiser (not injected), so no NestJS ApplicationContext is required.
      sut = new NotificationsService();
    });

    afterAll(async () => {
      await teardownHarness();
    });

    beforeEach(async () => {
      await truncateTables();

      // Users: both have a username so the enrichment join (messages → users → actorDisplayName)
      // resolves to a non-null value in listForUser assertions.
      await insertFixtureUser(USER_A_ID, 'notif-a@notif.test', 'usera');
      await insertFixtureUser(USER_B_ID, 'notif-b@notif.test', 'userb');

      // Server + channel — FK targets for notifications.server_id and notifications.channel_id.
      await insertFixtureServer(SERVER_ID, USER_A_ID, 'Notifications Test Server');
      await insertFixtureChannel(CHANNEL_ID, SERVER_ID, 'general');

      // Messages 1 + 2: authored by USER_B.
      // When handleMentionCreated fires with mentionedUserId=USER_A, the enrichment join
      // resolves messages.author_id → USER_B → username='userb' as actorDisplayName.
      await insertFixtureMessage(MESSAGE_1_ID, CHANNEL_ID, USER_B_ID, 'hey @usera check this out');
      await insertFixtureMessage(
        MESSAGE_2_ID,
        CHANNEL_ID,
        USER_B_ID,
        'another @usera mention here',
      );

      // Message 3: authored by USER_A. Used in the markAllRead and scoping tests
      // where USER_A mentions USER_B (notification recipient = USER_B).
      await insertFixtureMessage(MESSAGE_3_ID, CHANNEL_ID, USER_A_ID, 'hey @userb check this out');
    });

    // -----------------------------------------------------------------------
    // Sanity: real rows exist after seed.
    // Prevents silent-skip if fixture inserts are no-ops (e.g. ID collision
    // from a prior run absorbed by ON CONFLICT DO NOTHING).
    // -----------------------------------------------------------------------

    it('sanity: users table has 2 real rows after seed (non-trivial real-DB write proof)', async () => {
      const n = await countRows('users');
      expect(n).toBeGreaterThanOrEqual(2);
    });

    // -----------------------------------------------------------------------
    // 1. owner-404 (BUILD-PRINCIPLES rule 4 negative path)
    //
    // USER_B calling markRead on USER_A's notification must:
    //   (a) throw NotFoundException(404) — not 403, to avoid existence leakage.
    //   (b) leave USER_A's notification STILL unread (no partial mutation).
    //
    // USER_A calling markRead on their own notification must succeed and
    // set read_at (committed row visible on the separate harness pool).
    // -----------------------------------------------------------------------

    it('owner-404: B calling markRead on A notification → 404; ' +
      'A notification stays unread; A can then mark own read successfully', async () => {
      // Seed one unread notification for USER_A via the real mention-persist handler.
      await sut.handleMentionCreated({
        mentionedUserId: USER_A_ID,
        messageId: MESSAGE_1_ID,
        channelId: CHANNEL_ID,
        serverId: SERVER_ID,
      });

      // Sanity: row was actually inserted (swallowed-error guard — if this fails,
      // the FK setup above is broken, not the service under test).
      expect(await countRows('notifications')).toBeGreaterThanOrEqual(1);

      // Retrieve the real notification ID from the DB (separate harness pool).
      const rows = await harnessQuery<{ id: string; read_at: string | null }>(
        'SELECT id, read_at FROM notifications WHERE user_id = $1',
        [USER_A_ID],
      );
      expect(rows).toHaveLength(1);
      const notifId = rows[0]?.id ?? '';

      // ---- Negative path (rule 4 load-bearing assertion) ----
      // USER_B attempts to mark USER_A's notification read → NotFoundException(404).
      // The WHERE clause `AND user_id = $userId` means zero rows are updated when the
      // notification belongs to a different user; the service surfaces this as 404.
      await expect(sut.markRead(USER_B_ID, notifId)).rejects.toBeInstanceOf(NotFoundException);

      // Critical invariant: USER_A's notification must be STILL unread after B's rejection.
      // Proves that the failed UPDATE did not partially commit a mutation.
      const afterRejection = await harnessQuery<{ read_at: string | null }>(
        'SELECT read_at FROM notifications WHERE id = $1',
        [notifId],
      );
      expect(afterRejection[0]?.read_at).toBeNull();

      // ---- Positive path ----
      // USER_A marks their own notification read — must succeed.
      const result = await sut.markRead(USER_A_ID, notifId);
      expect(result.unreadCount).toBe(0);

      // Verify read_at is set (committed state visible on separate harness pool —
      // proves real DB commit, not just in-memory state).
      const afterMark = await harnessQuery<{ read_at: string | null }>(
        'SELECT read_at FROM notifications WHERE id = $1',
        [notifId],
      );
      expect(afterMark[0]?.read_at).not.toBeNull();
    });

    // -----------------------------------------------------------------------
    // 2. markRead idempotent
    //
    // Marking the same notification read twice: second call must not throw;
    // read_at remains set; unreadCount reported by listForUser stays at 0.
    // -----------------------------------------------------------------------

    it('markRead idempotent: double-mark on A notification — no error, still read, unreadCount stable', async () => {
      await sut.handleMentionCreated({
        mentionedUserId: USER_A_ID,
        messageId: MESSAGE_1_ID,
        channelId: CHANNEL_ID,
        serverId: SERVER_ID,
      });

      const rows = await harnessQuery<{ id: string }>(
        'SELECT id FROM notifications WHERE user_id = $1',
        [USER_A_ID],
      );
      const notifId = rows[0]?.id ?? '';

      // First mark — must succeed.
      const first = await sut.markRead(USER_A_ID, notifId);
      expect(first.unreadCount).toBe(0);

      // Second mark on the already-read notification — must also succeed.
      // The WHERE clause does NOT filter on read_at, so the UPDATE still matches
      // and overwrites read_at; callers receive 200 on a double-mark.
      const second = await sut.markRead(USER_A_ID, notifId);
      expect(second.unreadCount).toBe(0);

      // unreadCount via listForUser is stable (no phantom unread introduced).
      const list = await sut.listForUser(USER_A_ID);
      expect(list.unreadCount).toBe(0);
    });

    // -----------------------------------------------------------------------
    // 3. markAllRead — cross-user scoping
    //
    // USER_A has ≥2 unread notifications; USER_B has 1.
    // markAllRead(USER_A_ID) must:
    //   (a) return { unreadCount: 0 }.
    //   (b) set all of USER_A's notifications to read (listForUser confirms).
    //   (c) leave USER_B's notification untouched (unreadCount stays 1 for B).
    // -----------------------------------------------------------------------

    it('markAllRead: all A notifications become read; B notification untouched', async () => {
      // USER_A: 2 unread notifications (distinct message IDs — no dedup conflict).
      await sut.handleMentionCreated({
        mentionedUserId: USER_A_ID,
        messageId: MESSAGE_1_ID,
        channelId: CHANNEL_ID,
        serverId: SERVER_ID,
      });
      await sut.handleMentionCreated({
        mentionedUserId: USER_A_ID,
        messageId: MESSAGE_2_ID,
        channelId: CHANNEL_ID,
        serverId: SERVER_ID,
      });

      // USER_B: 1 unread notification (MESSAGE_3, authored by USER_A, mentions USER_B).
      await sut.handleMentionCreated({
        mentionedUserId: USER_B_ID,
        messageId: MESSAGE_3_ID,
        channelId: CHANNEL_ID,
        serverId: SERVER_ID,
      });

      // Sanity: 3 real rows across both users.
      expect(await countRows('notifications')).toBeGreaterThanOrEqual(3);

      // Pre-condition: USER_A has exactly 2 unread notifications.
      const listABefore = await sut.listForUser(USER_A_ID);
      expect(listABefore.unreadCount).toBe(2);

      // markAllRead for USER_A.
      const result = await sut.markAllRead(USER_A_ID);
      expect(result.unreadCount).toBe(0);

      // Post-condition: all of USER_A's notifications are read.
      const listAAfter = await sut.listForUser(USER_A_ID);
      expect(listAAfter.unreadCount).toBe(0);
      expect(listAAfter.items.every((item) => item.readAt !== null)).toBe(true);

      // Cross-user scoping: USER_B's notification is untouched by USER_A's markAllRead.
      const listB = await sut.listForUser(USER_B_ID);
      expect(listB.unreadCount).toBe(1);
    });

    // -----------------------------------------------------------------------
    // 4. @OnEvent mention dedup (partial-unique ON CONFLICT DO NOTHING)
    //
    // Calling handleMentionCreated twice with the same payload (same mentionedUserId
    // and messageId) must produce exactly 1 notification row.
    //
    // The PARTIAL UNIQUE INDEX notifications_user_message_mention_uidx on
    // (user_id, message_id) WHERE type='mention' absorbs the second INSERT
    // via ON CONFLICT DO NOTHING without error (swallowed gracefully).
    //
    // This reproduces the re-emitted event scenario: create + edit path or retry
    // both fire 'mention.created' for the same message — dedup is DB-level only.
    // -----------------------------------------------------------------------

    it('mention dedup: double-emit for same (user, message) yields exactly 1 notification row', async () => {
      const payload = {
        mentionedUserId: USER_A_ID,
        messageId: MESSAGE_1_ID,
        channelId: CHANNEL_ID,
        serverId: SERVER_ID,
      };

      // First emit — inserts the notification row.
      await sut.handleMentionCreated(payload);

      // Second emit — ON CONFLICT DO NOTHING on the partial unique index absorbs it.
      await sut.handleMentionCreated(payload);

      // Exactly 1 row must exist: the dedup index prevented the double-insert.
      expect(await countRows('notifications')).toBe(1);

      // Confirm the surviving row has the correct content.
      const rows = await harnessQuery<{ user_id: string; message_id: string; type: string }>(
        'SELECT user_id, message_id, type FROM notifications',
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]?.user_id).toBe(USER_A_ID);
      expect(rows[0]?.message_id).toBe(MESSAGE_1_ID);
      expect(rows[0]?.type).toBe('mention');
    });

    // -----------------------------------------------------------------------
    // 5. listForUser — self-scoping + unreadCount + enrichment joins
    //
    // USER_A's list must contain only USER_A's notifications (not USER_B's).
    // unreadCount must reflect real unread rows only.
    // Enrichment fields actorDisplayName and channelName must be populated
    // by the LEFT JOIN chain (notifications → messages → users → channels).
    // -----------------------------------------------------------------------

    it('listForUser: A list scoped to A only (not B), correct unreadCount, enrichment populated', async () => {
      // Seed 2 notifications for USER_A; 1 for USER_B.
      await sut.handleMentionCreated({
        mentionedUserId: USER_A_ID,
        messageId: MESSAGE_1_ID,
        channelId: CHANNEL_ID,
        serverId: SERVER_ID,
      });
      await sut.handleMentionCreated({
        mentionedUserId: USER_A_ID,
        messageId: MESSAGE_2_ID,
        channelId: CHANNEL_ID,
        serverId: SERVER_ID,
      });
      await sut.handleMentionCreated({
        mentionedUserId: USER_B_ID,
        messageId: MESSAGE_3_ID,
        channelId: CHANNEL_ID,
        serverId: SERVER_ID,
      });

      // Sanity: real rows exist across both users (silent-skip guard).
      expect(await countRows('notifications')).toBeGreaterThanOrEqual(3);

      // ---- USER_A list ----
      const listA = await sut.listForUser(USER_A_ID);

      // Exactly 2 items, both unread.
      expect(listA.items).toHaveLength(2);
      expect(listA.unreadCount).toBe(2);

      // Both of USER_A's message IDs are present; USER_B's message is absent.
      const msgIds = listA.items.map((item) => item.messageId);
      expect(msgIds).toContain(MESSAGE_1_ID);
      expect(msgIds).toContain(MESSAGE_2_ID);
      expect(msgIds).not.toContain(MESSAGE_3_ID); // belongs to USER_B's notification

      // All items are unread (no readAt contamination from other tests).
      expect(listA.items.every((item) => item.readAt === null)).toBe(true);

      // ---- Cross-user self-scoping proof ----
      // No notification ID from USER_A's list appears in USER_B's list.
      const listB = await sut.listForUser(USER_B_ID);
      const aNotifIds = new Set(listA.items.map((item) => item.id));
      expect(listB.items.map((item) => item.id).some((id) => aNotifIds.has(id))).toBe(false);

      // ---- USER_B list ----
      expect(listB.items).toHaveLength(1);
      expect(listB.unreadCount).toBe(1);

      // ---- Enrichment join assertions on USER_A's list ----
      // actorDisplayName: the actor is the message AUTHOR (not the recipient).
      // Messages 1 and 2 are authored by USER_B (username='userb', display_name=NULL).
      // Enrichment: notifications → messages.author_id → users.display_name ?? users.username
      // → null ?? 'userb' = 'userb'.
      expect(listA.items[0]?.actorDisplayName).toBe('userb');

      // channelName: from channels join via notifications.channel_id = CHANNEL_ID ('general').
      expect(listA.items[0]?.channelName).toBe('general');
    });
  },
);

// When DATABASE_URL_TEST is not set, emit a clear skip message (not a silent pass).
// This matches the describe title so the skip is traceable in CI output.
if (SKIP) {
  describe('NotificationsService — owner-404 authz + mention dedup (wave-37 regression)', () => {
    it.skip('SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run integration tests locally', () => {});
  });
}
