import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  MessageList,
  MessageResponse,
  MyMentionsResponse,
  ReactionToggleResponse,
  SendMessageInput,
} from '@studyhall/shared';
import { and, eq, inArray, lt, or, sql } from 'drizzle-orm';
import { db } from '../db/index';
import {
  channels,
  message_mentions,
  message_reactions,
  messages,
  server_members,
  users,
} from '../db/schema/index';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { RbacService } from '../rbac/rbac.service';
import { parseMentions } from './mentions';

// ---------------------------------------------------------------------------
// MessagesService — wave-12 M3 REST data plane (task a0c322b4)
//                 + wave-13 M3 edit/delete/reactions (tasks e12886d7 + d78df376)
//                 + wave-15 M3 @mention parse/resolve/persist (task 3d238446)
// ---------------------------------------------------------------------------

/** Opaque cursor encoding: base64(createdAt_iso|id) */
function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`).toString('base64url');
}

function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const sep = raw.indexOf('|');
    if (sep === -1) return null;
    const iso = raw.slice(0, sep);
    const id = raw.slice(sep + 1);
    const createdAt = new Date(iso);
    if (Number.isNaN(createdAt.getTime())) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// ReactionRow — raw DB row from message_reactions
// ---------------------------------------------------------------------------

interface ReactionRow {
  message_id: string;
  user_id: string;
  emoji: string;
}

// ---------------------------------------------------------------------------
// MentionRow — raw DB row from message_mentions + joined username
// ---------------------------------------------------------------------------

interface MentionRow {
  message_id: string;
  mentioned_user_id: string;
  username: string | null;
}

// ---------------------------------------------------------------------------
// rowToDto — map a DB row + aggregated reactions + mentions to MessageResponse
//
// Soft-deleted messages: content becomes null (tombstone), isDeleted=true.
// Reactions are always included (may be empty array).
// Mentions are always included (may be empty array); soft-deleted messages
// still carry their mentions[] so the caller can reason about them, but
// my-mentions excludes soft-deleted rows at the query level.
// ---------------------------------------------------------------------------

function rowToDto(
  row: {
    id: string;
    channel_id: string;
    author_id: string;
    content: string;
    created_at: Date;
    is_edited: boolean;
    edited_at: Date | null;
    is_deleted: boolean;
    deleted_at: Date | null;
  },
  reactions: ReactionRow[],
  viewerUserId: string,
  mentionRows: MentionRow[] = [],
): MessageResponse {
  // Aggregate reactions for this message
  const emojiMap = new Map<string, { count: number; reactedByMe: boolean }>();
  for (const r of reactions) {
    if (r.message_id !== row.id) continue;
    const existing = emojiMap.get(r.emoji);
    if (existing) {
      existing.count += 1;
      if (r.user_id === viewerUserId) existing.reactedByMe = true;
    } else {
      emojiMap.set(r.emoji, {
        count: 1,
        reactedByMe: r.user_id === viewerUserId,
      });
    }
  }

  const reactionSummaries = Array.from(emojiMap.entries()).map(
    ([emoji, { count, reactedByMe }]) => ({
      emoji,
      count,
      reactedByMe,
    }),
  );

  // Aggregate mentions for this message (filter to this row's id, skip null usernames)
  const mentions = mentionRows
    .filter((m) => m.message_id === row.id && m.username !== null)
    .map((m) => ({ userId: m.mentioned_user_id, username: m.username as string }));

  return {
    id: row.id,
    channelId: row.channel_id,
    authorId: row.author_id,
    // Soft-deleted: content is null (tombstone); callers MUST NOT expose old content
    content: row.is_deleted ? null : row.content,
    createdAt: row.created_at.toISOString(),
    isEdited: row.is_edited,
    editedAt: row.edited_at ? row.edited_at.toISOString() : null,
    isDeleted: row.is_deleted,
    reactions: reactionSummaries,
    mentions,
  };
}

// ---------------------------------------------------------------------------
// resolveMentions — parse @username tokens, resolve to server members, return
// rows ready for message_mentions INSERT.
//
// Security invariant:
//   - Only users who are MEMBERS of the channel's server are resolved.
//   - username IS NOT NULL guard applied — prevents NULL username from
//     matching an unset-username user (P-4 carry-forward).
//   - @everyone/@here/@role are out of scope (parseMentions only captures
//     individual username tokens).
//
// Returns: array of { message_id, mentioned_user_id } ready for db.insert().
// ---------------------------------------------------------------------------

async function resolveMentions(
  messageId: string,
  body: string,
  serverId: string,
): Promise<Array<{ message_id: string; mentioned_user_id: string }>> {
  const tokens = parseMentions(body);
  if (tokens.length === 0) return [];

  // JOIN server_members ⋈ users WHERE lower(username) = ANY(tokens)
  // AND username IS NOT NULL AND server_id = serverId
  // Returns only users who are actual members of this server.
  const resolved = await db
    .select({
      user_id: server_members.user_id,
    })
    .from(server_members)
    .innerJoin(users, eq(server_members.user_id, users.id))
    .where(
      and(
        eq(server_members.server_id, serverId),
        sql`${users.username} IS NOT NULL`,
        inArray(sql`lower(${users.username})`, tokens),
      ),
    );

  return resolved.map((r) => ({
    message_id: messageId,
    mentioned_user_id: r.user_id,
  }));
}

// ---------------------------------------------------------------------------
// fetchMentionRows — batch-load mention rows for a set of message IDs,
// joined with username. Called once per page (no N+1).
// ---------------------------------------------------------------------------

async function fetchMentionRows(messageIds: string[]): Promise<MentionRow[]> {
  if (messageIds.length === 0) return [];

  return db
    .select({
      message_id: message_mentions.message_id,
      mentioned_user_id: message_mentions.mentioned_user_id,
      username: users.username,
    })
    .from(message_mentions)
    .innerJoin(users, eq(message_mentions.mentioned_user_id, users.id))
    .where(inArray(message_mentions.message_id, messageIds));
}

@Injectable()
export class MessagesService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly rbacService: RbacService,
  ) {}

  // -------------------------------------------------------------------------
  // createMessage — INSERT with idempotency
  //
  // Security invariant: authorId is always req.session.getUserId() —
  // never from the request body. Enforced in the controller.
  //
  // Idempotency: ON CONFLICT (channel_id, idempotency_key) DO NOTHING.
  // If a repeat idempotencyKey is submitted, the existing message is returned
  // without error (no duplicate insertion).
  //
  // Emits: 'message.created' (EventEmitter2) for the Socket.IO gateway.
  // -------------------------------------------------------------------------

  async createMessage(
    channelId: string,
    authorId: string,
    input: SendMessageInput,
  ): Promise<MessageResponse> {
    // Verify channel exists (guard already verified permission, but service
    // provides a clean 404 for a missing channel as defence-in-depth).
    // Also fetch server_id here — needed for mention resolution.
    const [channel] = await db
      .select({ id: channels.id, server_id: channels.server_id })
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Attempt insert; idempotency_key may be null (no dedup) or a client key
    const idempotencyKey = input.idempotencyKey ?? null;

    // INSERT ... ON CONFLICT (channel_id, idempotency_key) DO NOTHING
    // The UNIQUE constraint only fires when idempotency_key IS NOT NULL
    // (NULL values are never considered equal in a UNIQUE index).
    await db
      .insert(messages)
      .values({
        channel_id: channelId,
        author_id: authorId,
        content: input.content,
        idempotency_key: idempotencyKey,
      })
      .onConflictDoNothing({
        target: [messages.channel_id, messages.idempotency_key],
      });

    // Fetch the canonical message row (handles both fresh insert + replay).
    // For a replay, the UNIQUE constraint ensures only one row exists with
    // this (channel_id, idempotency_key) pair.
    let message: typeof messages.$inferSelect | undefined;

    if (idempotencyKey !== null) {
      const [existing] = await db
        .select()
        .from(messages)
        .where(
          and(eq(messages.channel_id, channelId), eq(messages.idempotency_key, idempotencyKey)),
        )
        .limit(1);
      message = existing;
    } else {
      // No idempotency key — fetch the most recently inserted row for this
      // author+channel+content within a small window (best-effort; non-idempotent path)
      const [latest] = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.channel_id, channelId),
            eq(messages.author_id, authorId),
            eq(messages.content, input.content),
            sql`${messages.idempotency_key} IS NULL`,
          ),
        )
        .orderBy(sql`${messages.created_at} DESC`)
        .limit(1);
      message = latest;
    }

    if (!message) {
      throw new Error('Message insert failed unexpectedly');
    }

    // Resolve @username tokens to server members and persist mention rows.
    // ON CONFLICT DO NOTHING — idempotent if this path is replayed.
    const mentionValues = await resolveMentions(message.id, input.content, channel.server_id);
    if (mentionValues.length > 0) {
      await db
        .insert(message_mentions)
        .values(mentionValues)
        .onConflictDoNothing({
          target: [message_mentions.message_id, message_mentions.mentioned_user_id],
        });
    }

    // Fetch persisted mention rows (with username) for the DTO
    const mentionRows = await fetchMentionRows([message.id]);

    const dto = rowToDto(message, [], authorId, mentionRows);

    // Emit domain event for the Socket.IO gateway (@OnEvent('message.created'))
    // mentions[] rides on the DTO — no new event needed (spec §contracts.api)
    this.eventEmitter.emit('message.created', dto);

    return dto;
  }

  // -------------------------------------------------------------------------
  // editMessage — PATCH /channels/:channelId/messages/:messageId
  //
  // Security:
  //   - AUTHOR-ONLY: userId must equal message.author_id → ForbiddenException(403)
  //   - Cannot edit a deleted message → ConflictException(409)
  //   - Message not found → NotFoundException(404)
  //
  // Sets is_edited=true, edited_at=now(), updates content.
  // Emits: 'message.updated' for the gateway fan-out.
  // -------------------------------------------------------------------------

  async editMessage(
    channelId: string,
    messageId: string,
    userId: string,
    content: string,
  ): Promise<MessageResponse> {
    const [message] = await db
      .select()
      .from(messages)
      .where(and(eq(messages.id, messageId), eq(messages.channel_id, channelId)))
      .limit(1);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Author-only gate
    if (message.author_id !== userId) {
      throw new ForbiddenException('Only the author can edit this message');
    }

    // Cannot edit a deleted message
    if (message.is_deleted) {
      throw new ConflictException('Cannot edit a deleted message');
    }

    // Resolve the channel's server_id for mention resolution
    const [channel] = await db
      .select({ server_id: channels.server_id })
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const now = new Date();
    const [updated] = await db
      .update(messages)
      .set({ content, is_edited: true, edited_at: now })
      .where(eq(messages.id, messageId))
      .returning();

    if (!updated) {
      throw new Error('Message update failed unexpectedly');
    }

    // -----------------------------------------------------------------------
    // Mention diff: compare previous mentions to new mentions from edited body.
    //
    // 1. Fetch existing mention rows for this message.
    // 2. Resolve new @username tokens from the updated content.
    // 3. Delete rows for users no longer mentioned.
    // 4. Insert rows for newly mentioned users (ON CONFLICT DO NOTHING).
    // -----------------------------------------------------------------------

    // Existing mentioned user IDs
    const existingMentions = await db
      .select({ mentioned_user_id: message_mentions.mentioned_user_id })
      .from(message_mentions)
      .where(eq(message_mentions.message_id, messageId));

    const existingIds = new Set(existingMentions.map((m) => m.mentioned_user_id));

    // Newly resolved mention values
    const newMentionValues = await resolveMentions(messageId, content, channel.server_id);
    const newIds = new Set(newMentionValues.map((m) => m.mentioned_user_id));

    // Removals: in existingIds but not in newIds
    const toRemove = [...existingIds].filter((id) => !newIds.has(id));
    if (toRemove.length > 0) {
      await db
        .delete(message_mentions)
        .where(
          and(
            eq(message_mentions.message_id, messageId),
            inArray(message_mentions.mentioned_user_id, toRemove),
          ),
        );
    }

    // Additions: in newIds but not in existingIds
    const toInsert = newMentionValues.filter((m) => !existingIds.has(m.mentioned_user_id));
    if (toInsert.length > 0) {
      await db
        .insert(message_mentions)
        .values(toInsert)
        .onConflictDoNothing({
          target: [message_mentions.message_id, message_mentions.mentioned_user_id],
        });
    }

    // Fetch updated mention rows (with username) for the DTO
    const mentionRows = await fetchMentionRows([messageId]);

    // Fetch reactions for the updated message
    const reactions = await db
      .select({
        message_id: message_reactions.message_id,
        user_id: message_reactions.user_id,
        emoji: message_reactions.emoji,
      })
      .from(message_reactions)
      .where(eq(message_reactions.message_id, messageId));

    const dto = rowToDto(updated, reactions, userId, mentionRows);

    // Emit event for gateway fan-out (mentions[] rides on the DTO)
    this.eventEmitter.emit('message.updated', dto);

    return dto;
  }

  // -------------------------------------------------------------------------
  // deleteMessage — DELETE /channels/:channelId/messages/:messageId
  //
  // Security:
  //   - author_id === userId → allowed (author deletes own message)
  //   - OR rbacService.can(userId, serverId, 'manage_channels') → allowed (moderator)
  //   - serverId resolved from channels.server_id (SELECT server_id FROM channels
  //     WHERE id = channelId) — NEVER trusted from request; channels.server_id notNull.
  //   - Neither → ForbiddenException(403)
  //
  // Soft-delete: is_deleted=true, deleted_at=now(), content cleared to empty string
  // (tombstoned — rowToDto() returns content:null for is_deleted rows).
  // Idempotent: double-delete returns 204 without error.
  //
  // Emits: 'message.deleted' for the gateway fan-out.
  // -------------------------------------------------------------------------

  async deleteMessage(channelId: string, messageId: string, userId: string): Promise<void> {
    const [message] = await db
      .select()
      .from(messages)
      .where(and(eq(messages.id, messageId), eq(messages.channel_id, channelId)))
      .limit(1);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Idempotent: already deleted → return without error
    if (message.is_deleted) {
      return;
    }

    // Resolve server_id from the channel (MUST be done before rbac can() call)
    const [channel] = await db
      .select({ server_id: channels.server_id })
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const serverId = channel.server_id;

    // Author may always delete their own message
    const isAuthor = message.author_id === userId;

    // Moderator path: can(userId, serverId, 'manage_channels')
    // serverId resolved from channel row above — never from request body
    const isModerator = isAuthor
      ? false
      : await this.rbacService.can(userId, serverId, 'manage_channels');

    if (!isAuthor && !isModerator) {
      throw new ForbiddenException('Insufficient permissions to delete this message');
    }

    const now = new Date();
    const [updated] = await db
      .update(messages)
      .set({ is_deleted: true, deleted_at: now, content: '' })
      .where(eq(messages.id, messageId))
      .returning();

    if (!updated) {
      throw new Error('Message delete failed unexpectedly');
    }

    // Emit event for gateway fan-out (content will be null in DTO due to is_deleted)
    const dto = rowToDto(updated, [], userId);
    this.eventEmitter.emit('message.deleted', dto);
  }

  // -------------------------------------------------------------------------
  // toggleReaction — POST /channels/:channelId/messages/:messageId/reactions
  //
  // Idempotent toggle via UNIQUE(message_id, user_id, emoji):
  //   - If the reaction does NOT exist → INSERT → reacted: true, emit reaction.added
  //   - If the reaction EXISTS → DELETE → reacted: false, emit reaction.removed
  //
  // userId ALWAYS from session (controller never accepts userId from body).
  // Message must exist and belong to channelId.
  // -------------------------------------------------------------------------

  async toggleReaction(
    channelId: string,
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<ReactionToggleResponse> {
    // Verify message exists and belongs to the channel
    const [message] = await db
      .select({ id: messages.id, is_deleted: messages.is_deleted })
      .from(messages)
      .where(and(eq(messages.id, messageId), eq(messages.channel_id, channelId)))
      .limit(1);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.is_deleted) {
      throw new ConflictException('Cannot react to a deleted message');
    }

    // Check if this reaction already exists
    const [existing] = await db
      .select({ id: message_reactions.id })
      .from(message_reactions)
      .where(
        and(
          eq(message_reactions.message_id, messageId),
          eq(message_reactions.user_id, userId),
          eq(message_reactions.emoji, emoji),
        ),
      )
      .limit(1);

    let reacted: boolean;

    if (existing) {
      // Toggle OFF: remove the reaction
      await db
        .delete(message_reactions)
        .where(
          and(
            eq(message_reactions.message_id, messageId),
            eq(message_reactions.user_id, userId),
            eq(message_reactions.emoji, emoji),
          ),
        );

      reacted = false;
      this.eventEmitter.emit('reaction.removed', {
        messageId,
        channelId,
        userId,
        emoji,
      });
    } else {
      // Toggle ON: add the reaction
      await db
        .insert(message_reactions)
        .values({
          message_id: messageId,
          user_id: userId,
          emoji,
        })
        .onConflictDoNothing({
          target: [
            message_reactions.message_id,
            message_reactions.user_id,
            message_reactions.emoji,
          ],
        });

      reacted = true;
      this.eventEmitter.emit('reaction.added', {
        messageId,
        channelId,
        userId,
        emoji,
      });
    }

    return { reacted };
  }

  // -------------------------------------------------------------------------
  // listMessages — cursor pagination
  //
  // Default: newest-first (DESC created_at, DESC id), return `limit` rows.
  // Cursor encodes (created_at, id) of the LAST item returned; next page
  // fetches rows strictly older than that cursor.
  //
  // Response is chronological (ASC) so the client can append from the bottom.
  //
  // Now includes:
  //   - is_edited, edited_at, is_deleted (wave-13)
  //   - reactions aggregated [{emoji, count, reactedByMe}] (wave-13)
  //   - is_deleted messages have content: null (tombstone)
  // -------------------------------------------------------------------------

  async listMessages(
    channelId: string,
    viewerUserId: string,
    cursor?: string,
    limit = 50,
  ): Promise<MessageList> {
    // Verify channel exists
    const [channel] = await db
      .select({ id: channels.id })
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const safeLimit = Math.min(Math.max(1, limit), 100);

    let rows: (typeof messages.$inferSelect)[];

    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (!decoded) {
        // Invalid cursor — treat as no cursor (first page)
        rows = await db
          .select()
          .from(messages)
          .where(eq(messages.channel_id, channelId))
          .orderBy(sql`${messages.created_at} DESC, ${messages.id} DESC`)
          .limit(safeLimit + 1);
      } else {
        // Fetch rows older than the cursor position (stable cursor pagination)
        rows = await db
          .select()
          .from(messages)
          .where(
            and(
              eq(messages.channel_id, channelId),
              or(
                lt(messages.created_at, decoded.createdAt),
                and(
                  sql`${messages.created_at} = ${decoded.createdAt.toISOString()}`,
                  sql`${messages.id} < ${decoded.id}`,
                ),
              ),
            ),
          )
          .orderBy(sql`${messages.created_at} DESC, ${messages.id} DESC`)
          .limit(safeLimit + 1);
      }
    } else {
      rows = await db
        .select()
        .from(messages)
        .where(eq(messages.channel_id, channelId))
        .orderBy(sql`${messages.created_at} DESC, ${messages.id} DESC`)
        .limit(safeLimit + 1);
    }

    // Determine if there is a next page
    const hasMore = rows.length > safeLimit;
    if (hasMore) rows.pop(); // remove the sentinel row

    // Return in chronological order (oldest → newest) for the client
    const chronological = [...rows].reverse();

    const lastRow = rows[rows.length - 1];
    const nextCursor =
      hasMore && lastRow !== undefined ? encodeCursor(lastRow.created_at, lastRow.id) : null;

    // Fetch reactions for all messages in the page (single query, not N+1)
    const messageIds = chronological.map((r) => r.id);
    let reactionRows: ReactionRow[] = [];
    if (messageIds.length > 0) {
      reactionRows = await db
        .select({
          message_id: message_reactions.message_id,
          user_id: message_reactions.user_id,
          emoji: message_reactions.emoji,
        })
        .from(message_reactions)
        .where(inArray(message_reactions.message_id, messageIds));
    }

    // Fetch mentions for all messages in the page (single query, not N+1)
    const mentionRows = await fetchMentionRows(messageIds);

    return {
      messages: chronological.map((row) => rowToDto(row, reactionRows, viewerUserId, mentionRows)),
      nextCursor,
    };
  }

  // -------------------------------------------------------------------------
  // getMyMentions — GET /me/mentions
  //
  // Returns the authed user's mentioned messages, most-recent-first, cursor-
  // paginated. Only returns messages from servers the viewer is a member of.
  // Excludes soft-deleted (is_deleted=true) messages.
  //
  // Security invariants:
  //   - viewerUserId is ALWAYS from session (req.session.getUserId()) —
  //     NEVER from a request param. The controller enforces this.
  //   - Server-membership scoped: JOIN server_members via channels.server_id.
  //     A user cannot see mentions in a server they have since left.
  //   - No cross-user read: WHERE mentioned_user_id = viewerUserId only.
  // -------------------------------------------------------------------------

  async getMyMentions(
    viewerUserId: string,
    cursor?: string,
    limit = 50,
  ): Promise<MyMentionsResponse> {
    const safeLimit = Math.min(Math.max(1, limit), 100);

    // Cursor encodes (createdAt, id) of the last message_mentions row returned.
    // We reuse the same opaque cursor scheme as listMessages.
    let cursorDecoded: { createdAt: Date; id: string } | null = null;
    if (cursor) {
      cursorDecoded = decodeCursor(cursor);
      // Invalid cursor: treat as no cursor (first page)
    }

    // Build the base WHERE clause for my-mentions:
    //   - mentioned_user_id = viewerUserId (auth: session-derived)
    //   - JOIN messages: is_deleted = false (exclude tombstones)
    //   - JOIN channels → server_members: viewer is member of the channel's server
    //
    // We use message_mentions as the driving table, join messages and channels
    // to filter and select, then join server_members to scope to servers the
    // viewer belongs to.

    // Base condition: this user's mention rows, scoped to server membership
    const baseWhere = and(
      eq(message_mentions.mentioned_user_id, viewerUserId),
      eq(messages.is_deleted, false),
      eq(server_members.user_id, viewerUserId),
    );

    // Cursor condition: fetch rows for message_mentions rows with message
    // created_at strictly before the cursor (DESC ordering)
    const whereClause = cursorDecoded
      ? and(
          baseWhere,
          or(
            lt(messages.created_at, cursorDecoded.createdAt),
            and(
              sql`${messages.created_at} = ${cursorDecoded.createdAt.toISOString()}`,
              sql`${messages.id} < ${cursorDecoded.id}`,
            ),
          ),
        )
      : baseWhere;

    // Fetch safeLimit + 1 rows to detect hasMore
    const mentionedMessages = await db
      .select({
        id: messages.id,
        channel_id: messages.channel_id,
        author_id: messages.author_id,
        content: messages.content,
        created_at: messages.created_at,
        is_edited: messages.is_edited,
        edited_at: messages.edited_at,
        is_deleted: messages.is_deleted,
        deleted_at: messages.deleted_at,
      })
      .from(message_mentions)
      .innerJoin(messages, eq(message_mentions.message_id, messages.id))
      .innerJoin(channels, eq(messages.channel_id, channels.id))
      .innerJoin(
        server_members,
        and(
          eq(channels.server_id, server_members.server_id),
          eq(server_members.user_id, viewerUserId),
        ),
      )
      .where(whereClause)
      .orderBy(sql`${messages.created_at} DESC, ${messages.id} DESC`)
      .limit(safeLimit + 1);

    const hasMore = mentionedMessages.length > safeLimit;
    if (hasMore) mentionedMessages.pop();

    const lastRow = mentionedMessages[mentionedMessages.length - 1];
    const nextCursor =
      hasMore && lastRow !== undefined ? encodeCursor(lastRow.created_at, lastRow.id) : null;

    // Batch-load reactions and mentions for the page (no N+1)
    const messageIds = mentionedMessages.map((r) => r.id);

    let reactionRows: ReactionRow[] = [];
    if (messageIds.length > 0) {
      reactionRows = await db
        .select({
          message_id: message_reactions.message_id,
          user_id: message_reactions.user_id,
          emoji: message_reactions.emoji,
        })
        .from(message_reactions)
        .where(inArray(message_reactions.message_id, messageIds));
    }

    const mentionRows = await fetchMentionRows(messageIds);

    return {
      items: mentionedMessages.map((row) => rowToDto(row, reactionRows, viewerUserId, mentionRows)),
      nextCursor,
    };
  }
}
