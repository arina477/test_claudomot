import { Injectable, NotFoundException } from '@nestjs/common';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { MessageList, MessageResponse, SendMessageInput } from '@studyhall/shared';
import { and, eq, lt, or, sql } from 'drizzle-orm';
import { db } from '../db/index';
import { channels, messages } from '../db/schema/index';

// ---------------------------------------------------------------------------
// MessagesService — wave-12 M3 REST data plane (task a0c322b4)
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

function rowToDto(row: {
  id: string;
  channel_id: string;
  author_id: string;
  content: string;
  created_at: Date;
}): MessageResponse {
  return {
    id: row.id,
    channelId: row.channel_id,
    authorId: row.author_id,
    content: row.content,
    createdAt: row.created_at.toISOString(),
  };
}

@Injectable()
export class MessagesService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

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

    const dto = rowToDto(message);

    // Emit domain event for the Socket.IO gateway (@OnEvent('message.created'))
    this.eventEmitter.emit('message.created', dto);

    return dto;
  }

  // -------------------------------------------------------------------------
  // listMessages — cursor pagination
  //
  // Default: newest-first (DESC created_at, DESC id), return `limit` rows.
  // Cursor encodes (created_at, id) of the LAST item returned; next page
  // fetches rows strictly older than that cursor.
  //
  // Response is chronological (ASC) so the client can append from the bottom.
  // -------------------------------------------------------------------------

  async listMessages(channelId: string, cursor?: string, limit = 50): Promise<MessageList> {
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

    return {
      messages: chronological.map(rowToDto),
      nextCursor,
    };
  }
}
