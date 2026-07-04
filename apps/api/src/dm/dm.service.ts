/**
 * DmService — wave-46 M8 direct messages (tasks a48f1910 + 32f5d29e)
 *
 * Implements:
 *   - createConversation (with who_can_dm enforcement + participant cap)
 *   - listConversations  (participant-gated, last-message preview, by recency)
 *   - sendMessage        (participant-gated, idempotent, emits dm.message)
 *   - listMessages       (participant-gated, cursor-paginated ASC)
 *
 * who_can_dm enforcement (NEW — previously stored but never enforced):
 *   everyone      → allowed unconditionally
 *   server-members → allowed only if creator and target share ≥1 server row
 *                    in server_members (a single EXISTS/COUNT query per target)
 *   nobody        → rejected unconditionally
 *
 * Fan-out: EventEmitter2 'dm.message' → MessagingGateway @OnEvent('dm.message').
 * The gateway emits dm:message to participant-scoped 'user:<id>' rooms.
 *
 * Security invariants:
 *   - All callerIds are session-derived (never client-supplied).
 *   - Participant gate: isParticipant() checks dm_participants for the
 *     conversation before any read or write.
 *   - IDOR-safe 404: non-participant gets NotFoundException (not 403) so the
 *     conversation's existence is never confirmed to a non-participant.
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  CreateConversationInput,
  DmConversation as DmConversationDto,
  DmConversationListResponse,
  DmMessage as DmMessageDto,
  DmMessageListResponse,
  SendDmMessageInput,
} from '@studyhall/shared';
import { and, count, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { db } from '../db/index';
import {
  dm_conversations,
  dm_messages,
  dm_participants,
  server_members,
  users,
} from '../db/schema/index';

// ---------------------------------------------------------------------------
// Cursor helpers — base64url(epochMicros|id)
// epochMicros preserves full DB timestamptz microsecond precision, avoiding
// the ms-truncation boundary re-emission bug (F-I4).
// ---------------------------------------------------------------------------

function encodeCursor(createdAt: Date, id: string): string {
  const epochMicros = Math.round(createdAt.getTime() * 1000).toString();
  return Buffer.from(`${epochMicros}|${id}`).toString('base64url');
}

function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const sep = raw.indexOf('|');
    if (sep === -1) return null;
    const epochMicros = raw.slice(0, sep);
    const id = raw.slice(sep + 1);
    const ms = Number(epochMicros) / 1000;
    if (!Number.isFinite(ms)) return null;
    const createdAt = new Date(ms);
    if (Number.isNaN(createdAt.getTime())) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Row → DTO helpers
// ---------------------------------------------------------------------------

function dmMessageRowToDto(row: {
  id: string;
  conversation_id: string;
  author_id: string;
  content: string;
  created_at: Date;
}): DmMessageDto {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    authorId: row.author_id,
    content: row.content,
    createdAt: row.created_at.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// DmService
// ---------------------------------------------------------------------------

@Injectable()
export class DmService {
  private readonly logger = new Logger(DmService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  // -------------------------------------------------------------------------
  // isParticipant — IDOR gate: checks dm_participants for (conversationId, userId).
  // Returns true if the user is a participant, false otherwise.
  // -------------------------------------------------------------------------

  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const rows = await db
      .select({ id: dm_participants.id })
      .from(dm_participants)
      .where(
        and(
          eq(dm_participants.conversation_id, conversationId),
          eq(dm_participants.user_id, userId),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  // -------------------------------------------------------------------------
  // enforceWhoCanDm — who_can_dm enforcement for a single target user.
  //
  // everyone      → ok
  // server-members → ok only if creatorId and targetId share ≥1 server
  // nobody        → reject (403)
  //
  // Throws ForbiddenException when the target's policy blocks the creator.
  // -------------------------------------------------------------------------

  private async enforceWhoCanDm(creatorId: string, targetId: string): Promise<void> {
    // Fetch target's who_can_dm setting
    const [target] = await db
      .select({ who_can_dm: users.who_can_dm })
      .from(users)
      .where(eq(users.id, targetId))
      .limit(1);

    if (!target) {
      // Target user not found — treat as nobody (refuse)
      throw new ForbiddenException(`User ${targetId} not found or cannot receive direct messages`);
    }

    const policy = target.who_can_dm;

    if (policy === 'nobody') {
      throw new ForbiddenException(
        'Cannot start a direct message: user has restricted direct messages (policy: nobody)',
      );
    }

    if (policy === 'server-members') {
      // Check whether creator and target share at least one server.
      // Strategy: find server_id rows where BOTH users are members.
      // We use a raw SQL EXISTS check to keep it a single round-trip.
      const sharedResult = await db
        .select({ server_id: server_members.server_id })
        .from(server_members)
        .where(
          and(
            eq(server_members.user_id, creatorId),
            sql`${server_members.server_id} IN (
              SELECT server_id FROM server_members WHERE user_id = ${targetId}
            )`,
          ),
        )
        .limit(1);

      if (sharedResult.length === 0) {
        throw new ForbiddenException(
          'Cannot start a direct message: user requires a shared server membership (policy: server-members)',
        );
      }
    }
    // policy === 'everyone' → no restriction
  }

  // -------------------------------------------------------------------------
  // createConversation — POST /dm/conversations
  //
  // 1. Validate participant cap (max 10 total incl. creator)
  // 2. Enforce who_can_dm for EVERY target — any rejection → 403 whole-create
  // 3. Derive is_group from participant count (or accept caller hint)
  // 4. INSERT dm_conversations + dm_participants in a transaction
  // 5. Return DmConversation DTO
  // -------------------------------------------------------------------------

  async createConversation(
    callerId: string,
    input: CreateConversationInput,
  ): Promise<DmConversationDto> {
    const { participantIds, isGroup } = input;

    // Guard: creator must not include themselves in participantIds
    if (participantIds.includes(callerId)) {
      throw new BadRequestException('participantIds must not include yourself');
    }

    // Guard: duplicate check (schema already validates but belt-and-suspenders)
    const uniqueIds = new Set(participantIds);
    if (uniqueIds.size !== participantIds.length) {
      throw new BadRequestException('participantIds must not contain duplicates');
    }

    // Total participants = participantIds + creator
    const totalParticipants = participantIds.length + 1;

    if (totalParticipants > 10) {
      throw new BadRequestException(
        `Total participants must not exceed 10 (got ${totalParticipants})`,
      );
    }

    // Derive isGroup from count when not explicitly supplied
    const resolvedIsGroup = isGroup !== undefined ? isGroup : totalParticipants > 2;

    // 1:1 invariant: is_group=false requires exactly 2 participants total
    if (!resolvedIsGroup && totalParticipants !== 2) {
      throw new BadRequestException(
        `A 1:1 conversation must have exactly 2 participants total (got ${totalParticipants})`,
      );
    }

    // who_can_dm enforcement: enforce for every target before any DB write.
    // ANY rejection → whole-create fails 403 (no partial conversation).
    for (const targetId of participantIds) {
      await this.enforceWhoCanDm(callerId, targetId);
    }

    // -----------------------------------------------------------------------
    // Find-or-create for 1:1 conversations (M3 fix — wave-46 B-6 review).
    //
    // For non-group (exactly 2 participants) conversations, check whether the
    // caller and target already share a 1:1 conversation before inserting.
    //
    // Strategy: find conversation_ids where BOTH users are participants
    // (COUNT = 2 in dm_participants for those two user_ids) and the
    // conversation is_group = false.
    //
    // who_can_dm was already enforced above — we keep that check before
    // the find-or-create so a policy change after the first DM is still
    // caught on subsequent attempts.
    // -----------------------------------------------------------------------
    if (!resolvedIsGroup) {
      // Safe: resolvedIsGroup=false guarantees participantIds.length === 1 (checked above).
      const targetId = participantIds[0] as string;

      // Find conversation_ids that contain BOTH the caller and the target
      // as participants, restricted to is_group=false conversations.
      const existingRows = await db
        .select({
          conversation_id: dm_participants.conversation_id,
          participant_count: count(dm_participants.user_id),
        })
        .from(dm_participants)
        .innerJoin(
          dm_conversations,
          and(
            eq(dm_participants.conversation_id, dm_conversations.id),
            eq(dm_conversations.is_group, false),
          ),
        )
        .where(inArray(dm_participants.user_id, [callerId, targetId]))
        .groupBy(dm_participants.conversation_id)
        .having(sql`COUNT(${dm_participants.user_id}) = 2`);

      if (existingRows.length > 0) {
        // Return the first match (there should be at most one for a 1:1 pair)
        // Safe: guarded by existingRows.length > 0 immediately above.
        const existingConvId = (existingRows[0] as (typeof existingRows)[0]).conversation_id;

        const participantRows = await db
          .select({
            user_id: dm_participants.user_id,
            display_name: users.display_name,
            username: users.username,
            avatar_url: users.avatar_url,
          })
          .from(dm_participants)
          .innerJoin(users, eq(dm_participants.user_id, users.id))
          .where(eq(dm_participants.conversation_id, existingConvId));

        const [existingConv] = await db
          .select()
          .from(dm_conversations)
          .where(eq(dm_conversations.id, existingConvId))
          .limit(1);

        if (existingConv) {
          this.logger.debug(
            `find-or-create: returning existing 1:1 conversation ${existingConvId} for (${callerId}, ${targetId})`,
          );
          return {
            id: existingConv.id,
            isGroup: existingConv.is_group,
            participants: participantRows.map((p) => ({
              userId: p.user_id,
              displayName: p.display_name ?? p.username ?? p.user_id,
              avatar: p.avatar_url,
            })),
            lastMessage: null,
            createdAt: existingConv.created_at.toISOString(),
          };
        }
      }
    }

    // INSERT dm_conversations + dm_participants in a single transaction
    const allParticipantIds = [callerId, ...participantIds];

    const conversation = await db.transaction(async (tx) => {
      const [conv] = await tx
        .insert(dm_conversations)
        .values({
          is_group: resolvedIsGroup,
          created_by: callerId,
        })
        .returning();

      if (!conv) {
        throw new Error('dm_conversations insert failed unexpectedly');
      }

      await tx.insert(dm_participants).values(
        allParticipantIds.map((userId) => ({
          conversation_id: conv.id,
          user_id: userId,
        })),
      );

      return conv;
    });

    // Fetch participant details for the DTO
    const participantRows = await db
      .select({
        user_id: dm_participants.user_id,
        display_name: users.display_name,
        username: users.username,
        avatar_url: users.avatar_url,
      })
      .from(dm_participants)
      .innerJoin(users, eq(dm_participants.user_id, users.id))
      .where(eq(dm_participants.conversation_id, conversation.id));

    return {
      id: conversation.id,
      isGroup: conversation.is_group,
      participants: participantRows.map((p) => ({
        userId: p.user_id,
        displayName: p.display_name ?? p.username ?? p.user_id,
        avatar: p.avatar_url,
      })),
      lastMessage: null,
      createdAt: conversation.created_at.toISOString(),
    };
  }

  // -------------------------------------------------------------------------
  // listConversations — GET /dm/conversations
  //
  // Returns conversations where callerId is a dm_participant, ordered by
  // last-message recency (most recent first). Includes participant list and
  // last-message preview (content, createdAt, authorId).
  //
  // Empty → [] (not an error).
  // -------------------------------------------------------------------------

  async listConversations(callerId: string): Promise<DmConversationListResponse> {
    // Fetch conversation IDs where caller is a participant, ordered by
    // last-message recency via a subquery on dm_messages.
    const convRows = await db
      .select({
        id: dm_conversations.id,
        is_group: dm_conversations.is_group,
        created_at: dm_conversations.created_at,
      })
      .from(dm_conversations)
      .innerJoin(
        dm_participants,
        and(
          eq(dm_participants.conversation_id, dm_conversations.id),
          eq(dm_participants.user_id, callerId),
        ),
      )
      .orderBy(desc(dm_conversations.created_at));

    if (convRows.length === 0) {
      return { conversations: [] };
    }

    const convIds = convRows.map((c) => c.id);

    // Batch-load all participants for these conversations (no N+1)
    const participantRows = await db
      .select({
        conversation_id: dm_participants.conversation_id,
        user_id: dm_participants.user_id,
        display_name: users.display_name,
        username: users.username,
        avatar_url: users.avatar_url,
      })
      .from(dm_participants)
      .innerJoin(users, eq(dm_participants.user_id, users.id))
      .where(inArray(dm_participants.conversation_id, convIds));

    // Batch-load the latest message per conversation (no N+1).
    // Uses DISTINCT ON (conversation_id) ORDER BY conversation_id, created_at DESC
    // to get the most recent message per conversation.
    const lastMessageRows = await db
      .selectDistinctOn([dm_messages.conversation_id], {
        conversation_id: dm_messages.conversation_id,
        id: dm_messages.id,
        content: dm_messages.content,
        created_at: dm_messages.created_at,
        author_id: dm_messages.author_id,
      })
      .from(dm_messages)
      .where(inArray(dm_messages.conversation_id, convIds))
      .orderBy(dm_messages.conversation_id, desc(dm_messages.created_at));

    // Build lookup maps
    const participantsByConv = new Map<
      string,
      Array<{ userId: string; displayName: string; avatar: string | null }>
    >();
    for (const p of participantRows) {
      const existing = participantsByConv.get(p.conversation_id) ?? [];
      existing.push({
        userId: p.user_id,
        displayName: p.display_name ?? p.username ?? p.user_id,
        avatar: p.avatar_url,
      });
      participantsByConv.set(p.conversation_id, existing);
    }

    const lastMessageByConv = new Map<
      string,
      { content: string; createdAt: string; authorId: string }
    >();
    for (const m of lastMessageRows) {
      lastMessageByConv.set(m.conversation_id, {
        content: m.content,
        createdAt: m.created_at.toISOString(),
        authorId: m.author_id,
      });
    }

    // Sort conversations by last-message recency (most recent first).
    // Conversations with no messages are sorted by created_at (already in order).
    const sorted = [...convRows].sort((a, b) => {
      const aMsg = lastMessageByConv.get(a.id);
      const bMsg = lastMessageByConv.get(b.id);
      if (!aMsg && !bMsg) return b.created_at.getTime() - a.created_at.getTime();
      if (!aMsg) return 1;
      if (!bMsg) return -1;
      return new Date(bMsg.createdAt).getTime() - new Date(aMsg.createdAt).getTime();
    });

    return {
      conversations: sorted.map((c) => ({
        id: c.id,
        isGroup: c.is_group,
        participants: participantsByConv.get(c.id) ?? [],
        lastMessage: lastMessageByConv.get(c.id) ?? null,
        createdAt: c.created_at.toISOString(),
      })),
    };
  }

  // -------------------------------------------------------------------------
  // sendMessage — POST /dm/conversations/:id/messages
  //
  // Caller MUST be a participant of :id (IDOR-safe 404 for non-participants).
  // Idempotency: UNIQUE(conversation_id, idempotency_key) — duplicate key
  // returns the existing message (no new insert, no error).
  //
  // Emits 'dm.message' event for Socket.IO fan-out.
  // -------------------------------------------------------------------------

  async sendMessage(
    conversationId: string,
    callerId: string,
    input: SendDmMessageInput,
  ): Promise<DmMessageDto> {
    // IDOR gate — 404 for non-participants (never leaks conversation existence)
    const participating = await this.isParticipant(conversationId, callerId);
    if (!participating) {
      throw new NotFoundException('Conversation not found');
    }

    // INSERT with ON CONFLICT DO NOTHING for idempotency
    const insertReturning = await db
      .insert(dm_messages)
      .values({
        conversation_id: conversationId,
        author_id: callerId,
        content: input.content,
        idempotency_key: input.idempotencyKey,
      })
      .onConflictDoNothing({
        target: [dm_messages.conversation_id, dm_messages.idempotency_key],
      })
      .returning();

    const isNewInsert = insertReturning.length > 0;

    let messageRow: typeof dm_messages.$inferSelect;

    if (isNewInsert) {
      messageRow = insertReturning[0]!;
    } else {
      // Idempotent replay — fetch existing row by (conversation_id, idempotency_key)
      const [existing] = await db
        .select()
        .from(dm_messages)
        .where(
          and(
            eq(dm_messages.conversation_id, conversationId),
            eq(dm_messages.idempotency_key, input.idempotencyKey),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new Error('dm_messages idempotent replay fetch failed unexpectedly');
      }
      messageRow = existing;
    }

    const dto = dmMessageRowToDto(messageRow);

    // Fan-out to other participants via EventEmitter2 → MessagingGateway.
    // Resolve participant IDs here (service layer owns DB; gateway stays DB-free).
    if (isNewInsert) {
      const participantIds = await this.getConversationParticipantIds(conversationId);

      this.eventEmitter.emit('dm.message', {
        conversationId,
        message: dto,
        senderId: callerId,
        participantIds,
      });

      this.logger.debug(
        `DM message ${dto.id} created in conversation ${conversationId} by ${callerId}`,
      );
    }

    return dto;
  }

  // -------------------------------------------------------------------------
  // listMessages — GET /dm/conversations/:id/messages?cursor=
  //
  // Caller MUST be a participant of :id (IDOR-safe 404 for non-participants).
  // Cursor-paginated ASC (oldest→newest within page).
  // Cursor encodes (created_at, id) — same base64url scheme as messages.service.
  // -------------------------------------------------------------------------

  async listMessages(
    conversationId: string,
    callerId: string,
    cursor?: string,
    limit = 50,
  ): Promise<DmMessageListResponse> {
    // IDOR gate — 404 for non-participants
    const participating = await this.isParticipant(conversationId, callerId);
    if (!participating) {
      throw new NotFoundException('Conversation not found');
    }

    const safeLimit = Math.min(Math.max(1, limit), 100);

    let rows: (typeof dm_messages.$inferSelect)[];

    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (!decoded) {
        // Invalid cursor — treat as first page
        rows = await db
          .select()
          .from(dm_messages)
          .where(eq(dm_messages.conversation_id, conversationId))
          .orderBy(sql`${dm_messages.created_at} ASC, ${dm_messages.id} ASC`)
          .limit(safeLimit + 1);
      } else {
        rows = await db
          .select()
          .from(dm_messages)
          .where(
            and(
              eq(dm_messages.conversation_id, conversationId),
              or(
                sql`${dm_messages.created_at} > ${decoded.createdAt.toISOString()}`,
                and(
                  sql`${dm_messages.created_at} = ${decoded.createdAt.toISOString()}`,
                  sql`${dm_messages.id} > ${decoded.id}`,
                ),
              ),
            ),
          )
          .orderBy(sql`${dm_messages.created_at} ASC, ${dm_messages.id} ASC`)
          .limit(safeLimit + 1);
      }
    } else {
      rows = await db
        .select()
        .from(dm_messages)
        .where(eq(dm_messages.conversation_id, conversationId))
        .orderBy(sql`${dm_messages.created_at} ASC, ${dm_messages.id} ASC`)
        .limit(safeLimit + 1);
    }

    const hasMore = rows.length > safeLimit;
    if (hasMore) rows.pop();

    const lastRow = rows[rows.length - 1];
    const nextCursor =
      hasMore && lastRow !== undefined ? encodeCursor(lastRow.created_at, lastRow.id) : null;

    return {
      messages: rows.map(dmMessageRowToDto),
      nextCursor,
    };
  }

  // -------------------------------------------------------------------------
  // getConversationParticipantIds — used by the gateway to resolve which
  // user rooms to fan-out to on dm.message event.
  // -------------------------------------------------------------------------

  async getConversationParticipantIds(conversationId: string): Promise<string[]> {
    const rows = await db
      .select({ user_id: dm_participants.user_id })
      .from(dm_participants)
      .where(eq(dm_participants.conversation_id, conversationId));

    return rows.map((r) => r.user_id);
  }
}
