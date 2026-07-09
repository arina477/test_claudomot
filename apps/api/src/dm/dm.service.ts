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
  DmCandidate,
  DmConversation as DmConversationDto,
  DmConversationListResponse,
  DmMessage as DmMessageDto,
  DmMessageListResponse,
  SendDmMessageInput,
} from '@studyhall/shared';
import { and, asc, count, desc, eq, getTableColumns, inArray, ne, or, sql } from 'drizzle-orm';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { BlocksService } from '../blocks/blocks.service';
import { db } from '../db/index';
import {
  dm_conversations,
  dm_messages,
  dm_participants,
  server_members,
  userBlocks,
  user_encryption_keys,
  users,
} from '../db/schema/index';

// ---------------------------------------------------------------------------
// Cursor helpers — base64url(epochMicros|id)
// epochMicros preserves full DB timestamptz microsecond precision, avoiding
// the ms-truncation boundary re-emission bug (F-I4).
// ---------------------------------------------------------------------------

function encodeCursor(createdAtStr: string, id: string): string {
  return Buffer.from(`${createdAtStr}|${id}`).toString('base64url');
}

function decodeCursor(cursor: string): { createdAtStr: string; id: string } | null {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const sep = raw.indexOf('|');
    if (sep === -1) return null;
    const createdAtStr = raw.slice(0, sep);
    const id = raw.slice(sep + 1);
    if (!createdAtStr) return null;
    return { createdAtStr, id };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// DM candidates cap — defensive upper bound on getDmCandidates Drizzle query.
// Exported so tests can reference the constant without hard-coding it.
// ---------------------------------------------------------------------------
export const DM_CANDIDATES_LIMIT = 500;

// ---------------------------------------------------------------------------
// Row → DTO helpers
// ---------------------------------------------------------------------------

function dmMessageRowToDto(row: {
  id: string;
  conversation_id: string;
  author_id: string;
  content: string | null;
  ciphertext: string | null;
  sender_key_ref: string | null;
  envelope_version: number | null;
  created_at: Date;
}): DmMessageDto {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    authorId: row.author_id,
    // wave-79: content is NULL for an encrypted row (envelope carries payload).
    content: row.content,
    // wave-79 server-blind envelope — passed through verbatim, never decrypted.
    ciphertext: row.ciphertext,
    senderKeyRef: row.sender_key_ref,
    envelopeVersion: row.envelope_version,
    createdAt: row.created_at.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// DmService
// ---------------------------------------------------------------------------

@Injectable()
export class DmService {
  private readonly logger = new Logger(DmService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly blocksService: BlocksService,
  ) {}

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
  // canDm — REUSABLE who_can_dm seam (wave-79 task 60bda5be).
  //
  // Non-throwing boolean check of whether `viewerId` is permitted to DM
  // `targetId` under the target's who_can_dm policy:
  //
  //   everyone       → true
  //   server-members → true only if viewerId and targetId share ≥1 server
  //   nobody         → false
  //   target missing → false (fail-closed: cannot DM a user that isn't there)
  //
  // This is the single source of truth for the DM-ability decision. Both
  // enforceWhoCanDm (create/send path, throws) and the peer-key-fetch gate in
  // ProfileController (GET /profile/:userId/encryption-key, uniform-404)
  // delegate to it — a key-fetch leak would be a who_can_dm-visibility leak,
  // so both surfaces MUST enforce the identical rule. (P-4 karen correction 1.)
  // -------------------------------------------------------------------------

  async canDm(viewerId: string, targetId: string): Promise<boolean> {
    // Fetch target's who_can_dm setting
    const [target] = await db
      .select({ who_can_dm: users.who_can_dm })
      .from(users)
      .where(eq(users.id, targetId))
      .limit(1);

    if (!target) {
      // Target user not found — fail closed (cannot DM / cannot fetch key).
      return false;
    }

    const policy = target.who_can_dm;

    if (policy === 'nobody') {
      return false;
    }

    if (policy === 'server-members') {
      // Permitted only if viewer and target share at least one server.
      // Single round-trip EXISTS check against server_members.
      const sharedResult = await db
        .select({ server_id: server_members.server_id })
        .from(server_members)
        .where(
          and(
            eq(server_members.user_id, viewerId),
            sql`${server_members.server_id} IN (
              SELECT server_id FROM server_members WHERE user_id = ${targetId}
            )`,
          ),
        )
        .limit(1);

      return sharedResult.length > 0;
    }

    // policy === 'everyone' → permitted
    return true;
  }

  // -------------------------------------------------------------------------
  // enforceWhoCanDm — who_can_dm enforcement for a single target user.
  //
  // Delegates to canDm() (the shared seam) and throws ForbiddenException when
  // the target's policy blocks the creator, preserving the previous 403
  // behaviour of the create/send paths.
  // -------------------------------------------------------------------------

  private async enforceWhoCanDm(creatorId: string, targetId: string): Promise<void> {
    const allowed = await this.canDm(creatorId, targetId);
    if (!allowed) {
      throw new ForbiddenException(
        'Cannot start a direct message: recipient does not allow direct messages from you',
      );
    }
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

    // Block HIDE (seam 1 — createConversation): if the caller is in a block
    // relation with ANY target participant, reject the whole create (403).
    // Bidirectional: A blocks B OR B blocks A → both are refused.
    //
    // Group-DM note (P-4 spec-gap 5a): For group DMs (>2 participants), a block
    // between the creator and any invitee prevents creating the conversation.
    // We do NOT crash existing group DMs that already contain a blocked pair —
    // the block check here applies only at creation time. Retroactive group-block
    // enforcement (hiding messages per-participant in an existing group DM) is a
    // documented follow-on and is out of scope for wave-70. This is the minimal
    // safe behaviour: no crash, no silent bypass.
    for (const targetId of participantIds) {
      const blocked = await this.blocksService.isBlockedBetween(callerId, targetId);
      if (blocked) {
        throw new ForbiddenException(
          'Cannot create a conversation: a block relationship exists between participants',
        );
      }
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
        ciphertext: dm_messages.ciphertext,
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
      // wave-79 (P-4 correction 3): an encrypted last message has content NULL
      // and ciphertext present. The preview MUST NOT crash on NULL and MUST NOT
      // surface blank — show a fixed "Encrypted message" placeholder. There is
      // no plaintext to leak (server-blind), so the placeholder leaks nothing.
      const preview = m.content ?? 'Encrypted message';
      lastMessageByConv.set(m.conversation_id, {
        content: preview,
        createdAt: m.created_at.toISOString(),
        authorId: m.author_id,
      });
    }

    // Block HIDE (seam 4 — listConversations): exclude conversations where ANY
    // other participant is in a block relation with the caller. Bidirectional.
    //
    // Batch strategy: collect all OTHER participant user IDs across all convs,
    // then fetch all block rows involving the caller in either direction for
    // those users. No N+1 (single query covers all conversations).
    //
    // Group-DM note (P-4 spec-gap 5a): For group DMs, if ANY other participant
    // has a block relation with the caller, the whole conversation is hidden from
    // the caller's list. This is the minimal safe behaviour per the wave-70 spec.
    const otherParticipantUserIds = [
      ...new Set(participantRows.filter((p) => p.user_id !== callerId).map((p) => p.user_id)),
    ];

    const blockedConvIds = new Set<string>();

    if (otherParticipantUserIds.length > 0) {
      // Fetch all bidirectional block rows between the caller and any other participant.
      const blockRows = await db
        .select({
          blocker_id: userBlocks.blocker_id,
          blocked_id: userBlocks.blocked_id,
        })
        .from(userBlocks)
        .where(
          or(
            and(
              eq(userBlocks.blocker_id, callerId),
              inArray(userBlocks.blocked_id, otherParticipantUserIds),
            ),
            and(
              inArray(userBlocks.blocker_id, otherParticipantUserIds),
              eq(userBlocks.blocked_id, callerId),
            ),
          ),
        );

      if (blockRows.length > 0) {
        // Build a set of blocked user IDs (either direction).
        const blockedUserIds = new Set<string>();
        for (const row of blockRows) {
          // The "other" side of the block relation (not the caller).
          blockedUserIds.add(row.blocker_id === callerId ? row.blocked_id : row.blocker_id);
        }

        // Mark conversation IDs that have any blocked participant.
        for (const p of participantRows) {
          if (p.user_id !== callerId && blockedUserIds.has(p.user_id)) {
            blockedConvIds.add(p.conversation_id);
          }
        }
      }
    }

    // Sort conversations by last-message recency (most recent first).
    // Conversations with no messages are sorted by created_at (already in order).
    const sorted = [...convRows]
      .filter((c) => !blockedConvIds.has(c.id))
      .sort((a, b) => {
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

    // Block HIDE (seam 2 — sendMessage): if the sender is in a block relation
    // with ANY other participant, reject the message (403). Bidirectional.
    //
    // Group-DM note (P-4 spec-gap 5a): For group DMs we check all other
    // participants. If the sender has ANY block relation with any participant,
    // we refuse the message. This is the minimal safe behaviour — no crash,
    // no silent delivery. Full per-message-author filtering in group DMs is a
    // documented follow-on out of scope for wave-70.
    const otherParticipantIds = (await this.getConversationParticipantIds(conversationId)).filter(
      (id) => id !== callerId,
    );
    for (const otherId of otherParticipantIds) {
      const blocked = await this.blocksService.isBlockedBetween(callerId, otherId);
      if (blocked) {
        throw new ForbiddenException(
          'Cannot send message: a block relationship exists between participants',
        );
      }
    }

    // wave-79 server-blind envelope: a send carries EITHER plaintext content
    // OR an encrypted envelope, never both (SendDmMessageSchema enforces the
    // XOR at the request boundary). For the envelope path we persist the
    // ciphertext + key ref + version and leave content NULL — the server
    // stores NO readable plaintext for an encrypted DM. For the plaintext
    // path (backward-compatible / keyless-peer fallback) content is stored and
    // the three envelope columns stay NULL.
    const isEncrypted = input.ciphertext !== undefined;

    // Defense-in-depth (encrypted path only): reject a send whose senderKeyRef
    // does not match the sender's registered public key. Fail OPEN — a sender
    // with NO registered key row is allowed through (covers keyless senders and
    // the register-then-send race). Server-blind: compares public-key strings
    // only, never touching ciphertext or any private material.
    if (isEncrypted) {
      const [registeredKey] = await db
        .select({ publicKey: user_encryption_keys.public_key })
        .from(user_encryption_keys)
        .where(eq(user_encryption_keys.user_id, callerId))
        .limit(1);
      if (registeredKey && registeredKey.publicKey !== input.senderKeyRef) {
        throw new BadRequestException('senderKeyRef does not match your registered encryption key');
      }
    }

    const insertValues = isEncrypted
      ? {
          conversation_id: conversationId,
          author_id: callerId,
          content: null,
          ciphertext: input.ciphertext,
          sender_key_ref: input.senderKeyRef,
          envelope_version: input.envelopeVersion,
          idempotency_key: input.idempotencyKey,
        }
      : {
          conversation_id: conversationId,
          author_id: callerId,
          content: input.content,
          idempotency_key: input.idempotencyKey,
        };

    // INSERT with ON CONFLICT DO NOTHING for idempotency — applies identically
    // to plaintext and ciphertext rows (UNIQUE(conversation_id, idempotency_key)).
    const insertReturning = await db
      .insert(dm_messages)
      .values(insertValues)
      .onConflictDoNothing({
        target: [dm_messages.conversation_id, dm_messages.idempotency_key],
      })
      .returning();

    const isNewInsert = insertReturning.length > 0;

    let messageRow: typeof dm_messages.$inferSelect;

    if (isNewInsert) {
      const first = insertReturning[0];
      if (!first) throw new Error('INSERT ... RETURNING returned empty array unexpectedly');
      messageRow = first;
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

    // Block HIDE (seam 5 — listMessages): if the caller is in a block relation
    // with ANY other participant, return 403 (can't read messages in a hidden
    // conversation). Consistent with seam 4 (listConversations hides blocked
    // convs from the list; listMessages must not allow a direct-URL bypass).
    //
    // Group-DM note (P-4 spec-gap 5a): same as seam 4 — if any other participant
    // has a block relation with the caller, the whole message list is refused.
    const allParticipantIds = await this.getConversationParticipantIds(conversationId);
    const otherIds = allParticipantIds.filter((id) => id !== callerId);
    for (const otherId of otherIds) {
      const blocked = await this.blocksService.isBlockedBetween(callerId, otherId);
      if (blocked) {
        throw new ForbiddenException(
          'Cannot read messages: a block relationship exists between participants',
        );
      }
    }

    const safeLimit = Math.min(Math.max(1, limit), 100);

    const selectShape = {
      ...getTableColumns(dm_messages),
      created_at_text: sql<string>`${dm_messages.created_at}::text`.as('created_at_text'),
    };
    type RowWithText = typeof dm_messages.$inferSelect & { created_at_text: string };
    let rows: RowWithText[];

    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (!decoded) {
        // Invalid cursor — treat as first page
        rows = await db
          .select(selectShape)
          .from(dm_messages)
          .where(eq(dm_messages.conversation_id, conversationId))
          .orderBy(sql`${dm_messages.created_at} ASC, ${dm_messages.id} ASC`)
          .limit(safeLimit + 1);
      } else {
        rows = await db
          .select(selectShape)
          .from(dm_messages)
          .where(
            and(
              eq(dm_messages.conversation_id, conversationId),
              or(
                sql`${dm_messages.created_at} > ${decoded.createdAtStr}`,
                and(
                  sql`${dm_messages.created_at} = ${decoded.createdAtStr}`,
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
        .select(selectShape)
        .from(dm_messages)
        .where(eq(dm_messages.conversation_id, conversationId))
        .orderBy(sql`${dm_messages.created_at} ASC, ${dm_messages.id} ASC`)
        .limit(safeLimit + 1);
    }

    const hasMore = rows.length > safeLimit;
    if (hasMore) rows.pop();

    const lastRow = rows[rows.length - 1];
    const nextCursor =
      hasMore && lastRow !== undefined ? encodeCursor(lastRow.created_at_text, lastRow.id) : null;

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

  // -------------------------------------------------------------------------
  // getDmCandidates — GET /dm/candidates
  //
  // Returns DISTINCT co-members of every server the caller belongs to,
  // excluding the caller and excluding users whose who_can_dm='nobody'.
  //
  // who_can_dm policy at candidate time:
  //   everyone      → included (unrestricted)
  //   server-members → included (co-members satisfy the shared-server condition)
  //   nobody        → excluded
  //
  // Query strategy: single JOIN chain (no N+1).
  //   caller_rows  = server_members WHERE user_id = callerId   (caller's servers)
  //   co_rows      = server_members WHERE server_id IN (caller_rows.server_id)
  //                  AND user_id != callerId                    (co-members)
  //   users        = joined to get displayName / avatarUrl / who_can_dm
  //
  // Dedup via DISTINCT ON (users.id) ordered by (users.id, display_name ASC)
  // — picks one row per user; final ORDER BY display_name for stable output.
  //
  // Caller in no servers / no co-members → 200 [].
  // -------------------------------------------------------------------------

  async getDmCandidates(
    callerId: string,
    limit: number = DM_CANDIDATES_LIMIT,
  ): Promise<DmCandidate[]> {
    // Step 1: get caller's server IDs (mirrors presence.getServerIdsForUser)
    const callerServerRows = await db
      .select({ server_id: server_members.server_id })
      .from(server_members)
      .where(eq(server_members.user_id, callerId));

    if (callerServerRows.length === 0) return [];

    const callerServerIds = callerServerRows.map((r) => r.server_id);

    // Step 2: fetch co-members (mirrors presence.getCoMemberUserIds) joined to
    // users for DTO fields + who_can_dm filter.
    // DISTINCT ON (users.id) dedups users shared across multiple servers.
    //
    // Block HIDE (seam 3 — getDmCandidates): exclude users in an either-direction
    // block relation with the caller. Uses NOT EXISTS subquery against user_blocks
    // so no additional round-trip is needed. Bidirectional: exclude if
    // (caller blocks user) OR (user blocks caller).
    const alias = server_members;
    const rows = await db
      .selectDistinctOn([users.id], {
        userId: users.id,
        displayName: users.display_name,
        email: users.email,
        avatarUrl: users.avatar_url,
        who_can_dm: users.who_can_dm,
      })
      .from(alias)
      .innerJoin(users, eq(alias.user_id, users.id))
      .where(
        and(
          inArray(alias.server_id, callerServerIds),
          ne(alias.user_id, callerId),
          ne(users.who_can_dm, 'nobody'),
          // Bidirectional block exclusion: exclude if either direction is blocked.
          sql`NOT EXISTS (
            SELECT 1 FROM user_blocks ub
            WHERE (ub.blocker_id = ${callerId} AND ub.blocked_id = ${alias.user_id})
               OR (ub.blocker_id = ${alias.user_id} AND ub.blocked_id = ${callerId})
          )`,
        ),
      )
      .orderBy(users.id, asc(users.display_name))
      .limit(limit);

    // Final stable sort by displayName (DISTINCT ON orders by the key first)
    const candidates: DmCandidate[] = rows
      .map((r) => ({
        userId: r.userId,
        displayName: r.displayName ?? r.email.split('@')[0] ?? r.userId,
        avatarUrl: r.avatarUrl,
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    return candidates;
  }
}
