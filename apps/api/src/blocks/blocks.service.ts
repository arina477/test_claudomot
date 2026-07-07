import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Block, BlockListItem } from '@studyhall/shared';
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
//     LEFT JOIN from user_blocks to users on blocked_id = users.id.
//     Projects display_name / username / avatar_url alongside block row.
//     LEFT (not INNER) JOIN: a block whose blocked user row is missing
//     (deleted account — currently unreachable via FK cascade, but defensive)
//     still appears in the list with displayName 'Unknown user'.
//     Returns BlockListItem[] (enriched — includes blockedUser nested object).
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

// rowToDto — bare Block DTO (used by createBlock, conflict-path fetch).
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

// rowToListItemDto — enriched BlockListItem DTO (used by listBlocks).
//
// The users join is a LEFT JOIN, so display_name / username / avatar_url may
// be null when the blocked user row is missing (defensive — FK makes this
// unreachable in practice). displayName falls back:
//   display_name → username → 'Unknown user'
function rowToListItemDto(row: {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: Date;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}): BlockListItem {
  return {
    id: row.id,
    blocker_id: row.blocker_id,
    blocked_id: row.blocked_id,
    created_at: row.created_at.toISOString(),
    blockedUser: {
      userId: row.blocked_id,
      displayName: row.display_name ?? row.username ?? 'Unknown user',
      username: row.username ?? null,
      avatarUrl: row.avatar_url ?? null,
    },
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
  //
  // wave-71 enrichment: LEFT JOIN to users on blocked_id = users.id to
  // project display_name / username / avatar_url. LEFT (not INNER) so a block
  // whose blocked user row is missing still appears (with fallback displayName).
  // -------------------------------------------------------------------------

  async listBlocks(blockerUserId: string): Promise<BlockListItem[]> {
    const rows = await db
      .select({
        id: userBlocks.id,
        blocker_id: userBlocks.blocker_id,
        blocked_id: userBlocks.blocked_id,
        created_at: userBlocks.created_at,
        display_name: users.display_name,
        username: users.username,
        avatar_url: users.avatar_url,
      })
      .from(userBlocks)
      .leftJoin(users, eq(userBlocks.blocked_id, users.id))
      .where(eq(userBlocks.blocker_id, blockerUserId));

    return rows.map(rowToListItemDto);
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
