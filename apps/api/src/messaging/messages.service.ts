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
  ReactionToggleResponse,
  SendMessageInput,
} from '@studyhall/shared';
import { and, eq, inArray, lt, or, sql } from 'drizzle-orm';
import { db } from '../db/index';
import { channels, message_reactions, messages } from '../db/schema/index';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { RbacService } from '../rbac/rbac.service';

// ---------------------------------------------------------------------------
// MessagesService — wave-12 M3 REST data plane (task a0c322b4)
//                 + wave-13 M3 edit/delete/reactions (tasks e12886d7 + d78df376)
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
// rowToDto — map a DB row + aggregated reactions to MessageResponse
//
// Soft-deleted messages: content becomes null (tombstone), isDeleted=true.
// Reactions are always included (may be empty array).
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
  };
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
    const [channel] = await db
      .select({ id: channels.id })
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

    const dto = rowToDto(message, [], authorId);

    // Emit domain event for the Socket.IO gateway (@OnEvent('message.created'))
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

    const now = new Date();
    const [updated] = await db
      .update(messages)
      .set({ content, is_edited: true, edited_at: now })
      .where(eq(messages.id, messageId))
      .returning();

    if (!updated) {
      throw new Error('Message update failed unexpectedly');
    }

    // Fetch reactions for the updated message
    const reactions = await db
      .select({
        message_id: message_reactions.message_id,
        user_id: message_reactions.user_id,
        emoji: message_reactions.emoji,
      })
      .from(message_reactions)
      .where(eq(message_reactions.message_id, messageId));

    const dto = rowToDto(updated, reactions, userId);

    // Emit event for gateway fan-out
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

    return {
      messages: chronological.map((row) => rowToDto(row, reactionRows, viewerUserId)),
      nextCursor,
    };
  }
}
