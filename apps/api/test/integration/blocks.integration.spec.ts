/**
 * Integration test: wave-70 M14 user-to-user Block feature — real-Postgres.
 *
 * Covers:
 *   BlocksService:
 *     1. createBlock happy path — returns Block DTO, row persisted.
 *     2. self-block → 400 BadRequestException.
 *     3. block non-existent user → 404 NotFoundException.
 *     4. double-block idempotent — single row, same DTO returned (200).
 *     5. removeBlock happy path — row deleted (204 no-op upstream).
 *     6. removeBlock not-blocked → idempotent no-op (no error).
 *     7. listBlocks returns ONLY the caller's own list (no-IDOR: other user's
 *        blocks are not returned).
 *
 *   isBlockedBetween:
 *     8. A blocks B → isBlockedBetween(A,B) = true, isBlockedBetween(B,A) = true
 *        (bidirectional).
 *     9. No block → isBlockedBetween(A,B) = false.
 *
 *   DM HIDE — all 5 seams (bidirectional: A blocks B → B also blocked from A):
 *    10. createConversation: A blocks B → A cannot start DM with B (403).
 *    11. createConversation: A blocks B → B cannot start DM with A (403).
 *    12. sendMessage: A blocks B → A cannot message B in their 1:1 DM (403).
 *    13. sendMessage: A blocks B → B cannot message A in their 1:1 DM (403).
 *    14. getDmCandidates: A blocks B → B excluded from A's candidates.
 *    15. getDmCandidates: A blocks B → A excluded from B's candidates.
 *    16. listConversations: A blocks B → existing 1:1 DM hidden from A's list.
 *    17. listConversations: A blocks B → existing 1:1 DM hidden from B's list.
 *    18. listMessages: A blocks B → A gets 403 on message list for their 1:1 DM.
 *    19. listMessages: A blocks B → B gets 403 on message list for their 1:1 DM.
 *
 *   listBlocks enrichment (wave-71 FINDING-2 fix):
 *    20. listBlocks: each item carries blockedUser.{userId, displayName, username, avatarUrl};
 *        displayName is the real display_name, NOT the raw UUID.
 *    21. listBlocks: blocked user has no display_name → displayName falls back to username.
 *    22. listBlocks: blocked user has neither display_name nor username → displayName is
 *        'Unknown user' (LEFT JOIN fallback — unreachable via FK in production, covered
 *        structurally; simulated via direct harnessQuery DELETE of the user row after block).
 *
 * CF-2 (LOAD-BEARING): pg-harness MUST be the first import.
 */
// CF-2 side-effect import: sets process.env.DATABASE_URL = DATABASE_URL_TEST
import './pg-harness';
import {
  harnessQuery,
  insertFixtureMembership,
  insertFixtureServer,
  insertFixtureUser,
  setupHarness,
  teardownHarness,
  truncateTables,
} from './pg-harness';

import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BlocksService } from '../../src/blocks/blocks.service';
import { DmService } from '../../src/dm/dm.service';
import type { AppendPrivacyEventService } from '../../src/privacy/append-privacy-event.service';

// Skip when DATABASE_URL_TEST is absent.
const SKIP = !process.env.DATABASE_URL_TEST;

// ---------------------------------------------------------------------------
// Fixture IDs
// ---------------------------------------------------------------------------

// Primary test users — text IDs matching the users table PK type.
const USER_A = 'blk-user-a';
const USER_B = 'blk-user-b';
const USER_C = 'blk-user-c'; // neutral third user for IDOR assertions

// Server shared by A and B (for getDmCandidates to find them as co-members).
const SERVER_AB = '00000000-0000-0000-0099-000000000001';

describe.skipIf(SKIP)('Blocks + DM HIDE — real-Postgres (wave-70 M14)', () => {
  let blocksService: BlocksService;
  let dmService: DmService;

  beforeAll(async () => {
    await setupHarness();
    // BlocksService now requires AppendPrivacyEventService — pass a no-op stub
    // since these tests exercise block/DM HIDE semantics, not the audit log.
    const noopAppend = {
      append: vi.fn().mockResolvedValue(undefined),
    } as unknown as AppendPrivacyEventService;
    blocksService = new BlocksService(noopAppend);
    const emitter = new EventEmitter2();
    dmService = new DmService(emitter, blocksService);
  });

  afterAll(async () => {
    await teardownHarness();
  });

  beforeEach(async () => {
    await truncateTables();

    // Insert users
    await insertFixtureUser(USER_A, 'blk-user-a@test.local', 'user-a');
    await insertFixtureUser(USER_B, 'blk-user-b@test.local', 'user-b');
    await insertFixtureUser(USER_C, 'blk-user-c@test.local', 'user-c');

    // Shared server so A and B are co-members (needed for getDmCandidates)
    await insertFixtureServer(SERVER_AB, USER_A, 'Block-Test Server');
    await insertFixtureMembership(SERVER_AB, USER_A);
    await insertFixtureMembership(SERVER_AB, USER_B);
    // USER_C is NOT in the server — disjoint
  });

  // -----------------------------------------------------------------------
  // 1. createBlock happy path
  // -----------------------------------------------------------------------
  it('1. createBlock: inserts row and returns Block DTO', async () => {
    const block = await blocksService.createBlock(USER_A, USER_B);

    expect(block.blocker_id).toBe(USER_A);
    expect(block.blocked_id).toBe(USER_B);
    expect(block.id).toBeTruthy();
    expect(block.created_at).toBeTruthy();

    // Cross-check DB
    const rows = await harnessQuery<{ blocker_id: string; blocked_id: string }>(
      'SELECT blocker_id, blocked_id FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2',
      [USER_A, USER_B],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.blocker_id).toBe(USER_A);
    expect(rows[0]?.blocked_id).toBe(USER_B);
  });

  // -----------------------------------------------------------------------
  // 2. self-block → 400
  // -----------------------------------------------------------------------
  it('2. createBlock: self-block → BadRequestException (400)', async () => {
    await expect(blocksService.createBlock(USER_A, USER_A)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  // -----------------------------------------------------------------------
  // 3. block non-existent user → 404
  // -----------------------------------------------------------------------
  it('3. createBlock: blocked user does not exist → NotFoundException (404)', async () => {
    await expect(blocksService.createBlock(USER_A, 'non-existent-user-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // -----------------------------------------------------------------------
  // 4. double-block idempotent — single row, 200
  // -----------------------------------------------------------------------
  it('4. createBlock: double-block is idempotent — single row, no error', async () => {
    const first = await blocksService.createBlock(USER_A, USER_B);
    const second = await blocksService.createBlock(USER_A, USER_B);

    // Same DTO shape (id matches)
    expect(second.id).toBe(first.id);
    expect(second.blocker_id).toBe(USER_A);
    expect(second.blocked_id).toBe(USER_B);

    // Only one row in DB
    const rows = await harnessQuery<{ count: string }>(
      'SELECT count(*)::text AS count FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2',
      [USER_A, USER_B],
    );
    expect(rows[0]?.count).toBe('1');
  });

  // -----------------------------------------------------------------------
  // 5. removeBlock happy path
  // -----------------------------------------------------------------------
  it('5. removeBlock: deletes the block row', async () => {
    await blocksService.createBlock(USER_A, USER_B);
    await blocksService.removeBlock(USER_A, USER_B);

    const rows = await harnessQuery<{ count: string }>(
      'SELECT count(*)::text AS count FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2',
      [USER_A, USER_B],
    );
    expect(rows[0]?.count).toBe('0');
  });

  // -----------------------------------------------------------------------
  // 6. removeBlock not-blocked → idempotent no-op
  // -----------------------------------------------------------------------
  it('6. removeBlock: not-blocked → no error, no row deleted', async () => {
    // No block exists — should not throw
    await expect(blocksService.removeBlock(USER_A, USER_B)).resolves.toBeUndefined();
  });

  // -----------------------------------------------------------------------
  // 7. listBlocks IDOR: only returns caller's own list
  // -----------------------------------------------------------------------
  it("7. listBlocks: returns ONLY the caller's own blocks (no-IDOR)", async () => {
    // USER_A blocks USER_B; USER_C blocks USER_B
    await blocksService.createBlock(USER_A, USER_B);
    await blocksService.createBlock(USER_C, USER_B);

    const aBlocks = await blocksService.listBlocks(USER_A);
    const cBlocks = await blocksService.listBlocks(USER_C);
    const bBlocks = await blocksService.listBlocks(USER_B);

    // A's list: only (A→B)
    expect(aBlocks).toHaveLength(1);
    expect(aBlocks[0]?.blocker_id).toBe(USER_A);

    // C's list: only (C→B)
    expect(cBlocks).toHaveLength(1);
    expect(cBlocks[0]?.blocker_id).toBe(USER_C);

    // B has blocked nobody
    expect(bBlocks).toHaveLength(0);
  });

  // -----------------------------------------------------------------------
  // 8. isBlockedBetween bidirectional
  // -----------------------------------------------------------------------
  it('8. isBlockedBetween: A blocks B → true in both directions', async () => {
    await blocksService.createBlock(USER_A, USER_B);

    expect(await blocksService.isBlockedBetween(USER_A, USER_B)).toBe(true);
    expect(await blocksService.isBlockedBetween(USER_B, USER_A)).toBe(true);
  });

  // -----------------------------------------------------------------------
  // 9. isBlockedBetween no block → false
  // -----------------------------------------------------------------------
  it('9. isBlockedBetween: no block → false', async () => {
    expect(await blocksService.isBlockedBetween(USER_A, USER_B)).toBe(false);
  });

  // -----------------------------------------------------------------------
  // DM HIDE — seam setup helper:
  //   Create a real 1:1 DM conversation between A and B by bypassing the
  //   DmService.createConversation block-check (we need the conv for
  //   sendMessage / listConversations / listMessages tests). We insert it
  //   directly via harnessQuery to avoid the block-check which is what we're
  //   testing. We create the conversation BEFORE the block is set.
  // -----------------------------------------------------------------------

  async function seedConversation(): Promise<string> {
    // Insert a DM conversation directly (no block check at seed time)
    const convRows = await harnessQuery<{ id: string }>(
      'INSERT INTO dm_conversations (is_group, created_by) VALUES (false, $1) RETURNING id',
      [USER_A],
    );
    const convId = convRows[0]?.id;
    if (!convId) throw new Error('seed conversation insert failed');

    await harnessQuery(
      'INSERT INTO dm_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)',
      [convId, USER_A, USER_B],
    );
    return convId;
  }

  // -----------------------------------------------------------------------
  // 10. createConversation: A blocks B → A cannot start DM with B (403)
  // -----------------------------------------------------------------------
  it('10. createConversation: A blocks B → A gets ForbiddenException starting DM with B', async () => {
    await blocksService.createBlock(USER_A, USER_B);

    await expect(
      dmService.createConversation(USER_A, { participantIds: [USER_B] }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  // -----------------------------------------------------------------------
  // 11. createConversation: A blocks B → B cannot start DM with A (403)
  // -----------------------------------------------------------------------
  it('11. createConversation: A blocks B → B also gets ForbiddenException starting DM with A', async () => {
    await blocksService.createBlock(USER_A, USER_B);

    await expect(
      dmService.createConversation(USER_B, { participantIds: [USER_A] }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  // -----------------------------------------------------------------------
  // 12. sendMessage: A blocks B → A cannot message in the existing 1:1 DM
  // -----------------------------------------------------------------------
  it('12. sendMessage: A blocks B → A gets ForbiddenException sending to the 1:1 DM', async () => {
    const convId = await seedConversation();
    await blocksService.createBlock(USER_A, USER_B);

    await expect(
      dmService.sendMessage(convId, USER_A, {
        content: 'hello after block',
        idempotencyKey: 'idem-a-blocked-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  // -----------------------------------------------------------------------
  // 13. sendMessage: A blocks B → B cannot message in the existing 1:1 DM
  // -----------------------------------------------------------------------
  it('13. sendMessage: A blocks B → B gets ForbiddenException sending to the 1:1 DM', async () => {
    const convId = await seedConversation();
    await blocksService.createBlock(USER_A, USER_B);

    await expect(
      dmService.sendMessage(convId, USER_B, {
        content: 'reply after block',
        idempotencyKey: 'idem-b-blocked-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  // -----------------------------------------------------------------------
  // 14. getDmCandidates: A blocks B → B excluded from A's candidates
  // -----------------------------------------------------------------------
  it("14. getDmCandidates: A blocks B → B excluded from A's candidate list", async () => {
    await blocksService.createBlock(USER_A, USER_B);

    const candidates = await dmService.getDmCandidates(USER_A);
    const ids = candidates.map((c) => c.userId);
    expect(ids).not.toContain(USER_B);
  });

  // -----------------------------------------------------------------------
  // 15. getDmCandidates: A blocks B → A excluded from B's candidates
  // -----------------------------------------------------------------------
  it("15. getDmCandidates: A blocks B → A excluded from B's candidate list", async () => {
    await blocksService.createBlock(USER_A, USER_B);

    const candidates = await dmService.getDmCandidates(USER_B);
    const ids = candidates.map((c) => c.userId);
    expect(ids).not.toContain(USER_A);
  });

  // -----------------------------------------------------------------------
  // 16. listConversations: A blocks B → existing 1:1 DM hidden from A's list
  // -----------------------------------------------------------------------
  it("16. listConversations: A blocks B → 1:1 DM hidden from A's list", async () => {
    const convId = await seedConversation();

    // Before block: conversation is visible
    const beforeBlock = await dmService.listConversations(USER_A);
    expect(beforeBlock.conversations.map((c) => c.id)).toContain(convId);

    // Apply block
    await blocksService.createBlock(USER_A, USER_B);

    // After block: conversation is hidden
    const afterBlock = await dmService.listConversations(USER_A);
    expect(afterBlock.conversations.map((c) => c.id)).not.toContain(convId);
  });

  // -----------------------------------------------------------------------
  // 17. listConversations: A blocks B → existing 1:1 DM hidden from B's list
  // -----------------------------------------------------------------------
  it("17. listConversations: A blocks B → 1:1 DM hidden from B's list", async () => {
    const convId = await seedConversation();

    // Before block: conversation is visible to B
    const beforeBlock = await dmService.listConversations(USER_B);
    expect(beforeBlock.conversations.map((c) => c.id)).toContain(convId);

    // Apply block (A blocks B)
    await blocksService.createBlock(USER_A, USER_B);

    // After block: conversation is hidden from B too (bidirectional)
    const afterBlock = await dmService.listConversations(USER_B);
    expect(afterBlock.conversations.map((c) => c.id)).not.toContain(convId);
  });

  // -----------------------------------------------------------------------
  // 18. listMessages: A blocks B → A gets 403 accessing the blocked conversation
  // -----------------------------------------------------------------------
  it('18. listMessages: A blocks B → A gets ForbiddenException on message list', async () => {
    const convId = await seedConversation();
    await blocksService.createBlock(USER_A, USER_B);

    await expect(dmService.listMessages(convId, USER_A)).rejects.toBeInstanceOf(ForbiddenException);
  });

  // -----------------------------------------------------------------------
  // 19. listMessages: A blocks B → B gets 403 accessing the blocked conversation
  // -----------------------------------------------------------------------
  it('19. listMessages: A blocks B → B gets ForbiddenException on message list', async () => {
    const convId = await seedConversation();
    await blocksService.createBlock(USER_A, USER_B);

    await expect(dmService.listMessages(convId, USER_B)).rejects.toBeInstanceOf(ForbiddenException);
  });

  // -----------------------------------------------------------------------
  // 20. listBlocks enrichment: blockedUser.displayName is the real display_name,
  //     NOT the raw UUID.
  // -----------------------------------------------------------------------
  it('20. listBlocks: each item carries blockedUser display fields; displayName is real display_name not UUID', async () => {
    // Give USER_B a display_name and avatar_url via direct UPDATE
    await harnessQuery('UPDATE users SET display_name = $1, avatar_url = $2 WHERE id = $3', [
      'Bob Blocked',
      'https://cdn.example.com/bob.png',
      USER_B,
    ]);

    await blocksService.createBlock(USER_A, USER_B);
    const items = await blocksService.listBlocks(USER_A);

    expect(items).toHaveLength(1);
    const item = items[0];
    expect(item).toBeDefined();

    // Bare block fields still present
    expect(item?.blocker_id).toBe(USER_A);
    expect(item?.blocked_id).toBe(USER_B);
    expect(item?.id).toBeTruthy();
    expect(item?.created_at).toBeTruthy();

    // Enriched blockedUser — displayName must be the real name, never the UUID
    expect(item?.blockedUser.userId).toBe(USER_B);
    expect(item?.blockedUser.displayName).toBe('Bob Blocked');
    expect(item?.blockedUser.displayName).not.toBe(USER_B); // never a raw UUID
    expect(item?.blockedUser.username).toBe('user-b'); // seeded in beforeEach
    expect(item?.blockedUser.avatarUrl).toBe('https://cdn.example.com/bob.png');
  });

  // -----------------------------------------------------------------------
  // 21. listBlocks enrichment: no display_name → displayName falls back to username.
  // -----------------------------------------------------------------------
  it('21. listBlocks: no display_name → displayName falls back to username', async () => {
    // USER_B is seeded with username 'user-b' and no display_name (beforeEach default)
    await blocksService.createBlock(USER_A, USER_B);
    const items = await blocksService.listBlocks(USER_A);

    expect(items).toHaveLength(1);
    const item = items[0];
    expect(item?.blockedUser.displayName).toBe('user-b');
    expect(item?.blockedUser.username).toBe('user-b');
    expect(item?.blockedUser.avatarUrl).toBeNull();
  });

  // -----------------------------------------------------------------------
  // 22. listBlocks enrichment: 'Unknown user' fallback when both display_name
  //     and username are NULL on the joined user row.
  //
  // The truly "missing row" case (LEFT JOIN producing all-NULL columns) is
  // unreachable in production because the blocked_id FK prevents orphan block
  // rows; the LEFT JOIN is a defensive structural guarantee. Here we exercise
  // the identical code path — display_name NULL + username NULL → 'Unknown user'
  // — by clearing both columns on the blocked user via a direct UPDATE.
  // -----------------------------------------------------------------------
  it('22. listBlocks: display_name NULL + username NULL → displayName is "Unknown user"', async () => {
    // Clear both nullable display fields on USER_B
    await harnessQuery('UPDATE users SET display_name = NULL, username = NULL WHERE id = $1', [
      USER_B,
    ]);

    await blocksService.createBlock(USER_A, USER_B);
    const items = await blocksService.listBlocks(USER_A);

    expect(items).toHaveLength(1);
    const item = items[0];
    expect(item?.blocked_id).toBe(USER_B);
    expect(item?.blockedUser.userId).toBe(USER_B);
    expect(item?.blockedUser.displayName).toBe('Unknown user');
    expect(item?.blockedUser.username).toBeNull();
    expect(item?.blockedUser.avatarUrl).toBeNull();
  });
});

// When DATABASE_URL_TEST is not set, emit a clear skip message.
if (SKIP) {
  describe('Blocks + DM HIDE — real-Postgres (wave-70 M14)', () => {
    it.skip('SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run integration tests locally', () => {});
  });
}
