import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Block } from '@studyhall/shared';
import { and, eq, or } from 'drizzle-orm';
import { db } from '../db/index';
import { userBlocks, users } from '../db/schema/index';

// ---------------------------------------------------------------------------
// BlocksService — wave-70 M14 user-to-user block feature
//
// Implements:
//   createBlock(blockerUserId, blockedUserId)
//     Validates blocked user exists + no self-block. IDEMPOTENT via the
//     UNIQUE(blocker_id, blocked_id) constraint (onConflictDoNothing). Returns
//     the Block DTO (either newly inserted or the pre-existing row).
//
//   removeBlock(blockerUserId, blockedUserId)
//     DELETE (blocker, blocked). Not-blocked → idempotent no-op (204 upstream).
//
//   listBlocks(blockerUserId)
//     SELECT WHERE blocker_id = blockerUserId (own list only — no IDOR).
//     Returns Block[].
//
//   isBlockedBetween(userA, userB): Promise<boolean>
//     True if EITHER (A blocks B) OR (B blocks A). The bidirectional predicate
//     applied at every DM seam. Uses the blocker_id index via an OR filter.
//
// Security invariants:
//   - blocker_id ALWAYS from req.session.getUserId() (enforced in controller,
//     never from body/params — no IDOR).
//   - listBlocks returns ONLY the caller's own block list.
//   - No cross-user inspection: removeBlock and createBlock take blockerUserId
//     from session; they cannot act on another user's block list.
//
// Deferred (not in scope): bulk-block, block analytics, admin block-by-server.
// ---------------------------------------------------------------------------

function rowToDto(row: {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: Date;
}): Block {
  return {
    id: row.id,
    blocker_id: row.blocker_id,
    blocked_id: row.blocked_id,
    created_at: row.created_at.toISOString(),
  };
}

@Injectable()
export class BlocksService {
  // -------------------------------------------------------------------------
  // createBlock — POST /blocks
  //
  // 1. Self-block guard: blocker === blocked → 400.
  // 2. Validate blocked user exists → 404 if not.
  // 3. INSERT (blocker_id, blocked_id) with onConflictDoNothing for idempotency.
  // 4. If the conflict path fires (row already existed), fetch and return the
  //    existing row so callers always receive a Block DTO.
  // -------------------------------------------------------------------------

  async createBlock(blockerUserId: string, blockedUserId: string): Promise<Block> {
    // Guard: no self-block
    if (blockerUserId === blockedUserId) {
      throw new BadRequestException('Cannot block yourself');
    }

    // Validate blocked user exists
    const [blockedUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, blockedUserId))
      .limit(1);

    if (!blockedUser) {
      throw new NotFoundException(`User ${blockedUserId} not found`);
    }

    // INSERT with idempotency: UNIQUE(blocker_id, blocked_id) → no dup, no error.
    const insertReturning = await db
      .insert(userBlocks)
      .values({
        blocker_id: blockerUserId,
        blocked_id: blockedUserId,
      })
      .onConflictDoNothing({
        target: [userBlocks.blocker_id, userBlocks.blocked_id],
      })
      .returning();

    if (insertReturning.length > 0) {
      const row = insertReturning[0];
      if (!row) throw new Error('Block insert returned empty array unexpectedly');
      return rowToDto(row);
    }

    // Conflict path: row already existed — fetch and return it.
    const [existing] = await db
      .select()
      .from(userBlocks)
      .where(
        and(eq(userBlocks.blocker_id, blockerUserId), eq(userBlocks.blocked_id, blockedUserId)),
      )
      .limit(1);

    if (!existing) {
      // Should never happen: we just got a conflict on this exact pair.
      throw new Error('Block row vanished after conflict — unexpected');
    }

    return rowToDto(existing);
  }

  // -------------------------------------------------------------------------
  // removeBlock — DELETE /blocks/:blockedUserId
  //
  // DELETE (blocker, blocked). Not-blocked → idempotent no-op (caller returns 204).
  // -------------------------------------------------------------------------

  async removeBlock(blockerUserId: string, blockedUserId: string): Promise<void> {
    await db
      .delete(userBlocks)
      .where(
        and(eq(userBlocks.blocker_id, blockerUserId), eq(userBlocks.blocked_id, blockedUserId)),
      );
    // No error if no row matched — idempotent.
  }

  // -------------------------------------------------------------------------
  // listBlocks — GET /blocks
  //
  // Returns all blocks WHERE blocker_id = blockerUserId (own list only).
  // Uses the blocker_id index (user_blocks_blocker_idx).
  // -------------------------------------------------------------------------

  async listBlocks(blockerUserId: string): Promise<Block[]> {
    const rows = await db.select().from(userBlocks).where(eq(userBlocks.blocker_id, blockerUserId));

    return rows.map(rowToDto);
  }

  // -------------------------------------------------------------------------
  // isBlockedBetween — bidirectional block predicate
  //
  // Returns true if EITHER (userA blocks userB) OR (userB blocks userA).
  // Used by DmService at every DM seam.
  //
  // Query uses a single OR condition so the planner can use the blocker_id
  // index for both directions in one pass. Both directions reference the
  // indexed blocker_id column, keeping the plan efficient.
  // -------------------------------------------------------------------------

  async isBlockedBetween(userA: string, userB: string): Promise<boolean> {
    const rows = await db
      .select({ id: userBlocks.id })
      .from(userBlocks)
      .where(
        or(
          and(eq(userBlocks.blocker_id, userA), eq(userBlocks.blocked_id, userB)),
          and(eq(userBlocks.blocker_id, userB), eq(userBlocks.blocked_id, userA)),
        ),
      )
      .limit(1);

    return rows.length > 0;
  }
}
