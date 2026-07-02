import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type {
  MentionEvent,
  NotificationListResponse,
  UnreadCountResponse,
} from '@studyhall/shared';
import { and, count, eq, isNull, lt, or, sql } from 'drizzle-orm';
import { db } from '../db/index';
import { assignments, channels, messages, notifications, users } from '../db/schema/index';

// ---------------------------------------------------------------------------
// NotificationsService — wave-37 M7 in-app notifications (B-2)
//
// Responsibilities:
//   1. Persist mention notifications via @OnEvent('mention.created')
//      (decoupled from MessagesService — in-process EventEmitter2).
//   2. Persist assignment_reminder notifications from ReminderScanService.
//   3. Serve the notification list with enrichment joins (no N+1).
//   4. Mark individual or all notifications read.
//
// Enrichment approach — single SELECT with LEFT JOINs per page:
//   mention rows       → messages (content excerpt + author_id)
//                      → users   (actorDisplayName = display_name ?? username)
//                      → channels (channelName)
//   assignment_reminder rows → assignments (assignmentTitle + dueDate)
//
// Because message_id is NULL for reminder rows and assignment_id is NULL for
// mention rows, the LEFT JOINs naturally produce NULLs for irrelevant columns
// per type — no conditional JOIN clauses needed.
// ---------------------------------------------------------------------------

const PAGE_SIZE = 30;
const EXCERPT_MAX = 150;

/** Opaque cursor: base64url(createdAt_iso|id) — mirrors messages.service.ts */
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

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // -------------------------------------------------------------------------
  // @OnEvent('mention.created') — persist in-app notification on mention.
  //
  // INSERT ... ON CONFLICT DO NOTHING: the (user_id, message_id) partial-unique
  // index WHERE type='mention' deduplicates re-emitted events (create / edit /
  // retry paths) without application-level dedup logic.
  //
  // NOTE: this handler is in-process (EventEmitter2) with no retry/outbox.
  // If this throws on a transient DB error the notification row is lost while
  // the originating message still commits. This loss is accepted at self-use
  // scale — notification delivery is best-effort, message delivery is not.
  // Errors are logged and swallowed so a persist failure can never propagate
  // back into the message create/edit flow.
  // -------------------------------------------------------------------------
  @OnEvent('mention.created')
  async handleMentionCreated(payload: MentionEvent): Promise<void> {
    try {
      await db
        .insert(notifications)
        .values({
          user_id: payload.mentionedUserId,
          type: 'mention',
          message_id: payload.messageId,
          channel_id: payload.channelId,
          server_id: payload.serverId,
        })
        .onConflictDoNothing();
    } catch (err) {
      // Swallow: notification loss is acceptable; message was already committed.
      this.logger.error(
        `NotificationsService: failed to persist mention notification for user=${payload.mentionedUserId} message=${payload.messageId}`,
        err,
      );
    }
  }

  // -------------------------------------------------------------------------
  // createForReminder — persist an assignment_reminder notification row.
  //
  // ON CONFLICT DO NOTHING is defensive; ReminderScanService's INSERT INTO
  // assignment_reminder already gates send-once at the email level. This call
  // mirrors that gate on the in-app side so duplicate notifications cannot
  // accumulate if the cron ever fires twice within a tight window.
  // -------------------------------------------------------------------------
  async createForReminder(userId: string, assignmentId: string): Promise<void> {
    await db
      .insert(notifications)
      .values({
        user_id: userId,
        type: 'assignment_reminder',
        assignment_id: assignmentId,
      })
      .onConflictDoNothing();
  }

  // -------------------------------------------------------------------------
  // listForUser — paginated notification list with enrichment joins.
  //
  // Keyset cursor on (created_at DESC, id DESC) — newest-first, page size 30.
  // Invalid or absent cursor falls back to first page (mirrors listMessages).
  //
  // unreadCount is computed in parallel with the item page query — it spans
  // all pages, not just the current window.
  // -------------------------------------------------------------------------
  async listForUser(userId: string, cursor?: string): Promise<NotificationListResponse> {
    const baseWhere = eq(notifications.user_id, userId);

    // Build cursor predicate: rows strictly older than the cursor position
    let cursorCondition: ReturnType<typeof and> | undefined;
    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (decoded) {
        cursorCondition = or(
          lt(notifications.created_at, decoded.createdAt),
          and(
            sql`${notifications.created_at} = ${decoded.createdAt.toISOString()}`,
            sql`${notifications.id} < ${decoded.id}`,
          ),
        );
      }
      // Invalid cursor → fall through with no cursor condition (first page)
    }

    const whereClause = cursorCondition ? and(baseWhere, cursorCondition) : baseWhere;

    // Run item page + total unread count in parallel
    const [rows, [countRow]] = await Promise.all([
      db
        .select({
          id: notifications.id,
          type: notifications.type,
          created_at: notifications.created_at,
          read_at: notifications.read_at,
          message_id: notifications.message_id,
          channel_id: notifications.channel_id,
          server_id: notifications.server_id,
          assignment_id: notifications.assignment_id,
          // mention enrichment
          actor_display_name: users.display_name,
          actor_username: users.username,
          channel_name: channels.name,
          message_content: messages.content,
          // assignment_reminder enrichment
          assignment_title: assignments.title,
          assignment_due_date: assignments.due_date,
        })
        .from(notifications)
        // mention: LEFT JOIN messages → users → channels
        .leftJoin(messages, eq(notifications.message_id, messages.id))
        .leftJoin(users, eq(messages.author_id, users.id))
        .leftJoin(channels, eq(notifications.channel_id, channels.id))
        // assignment_reminder: LEFT JOIN assignments
        .leftJoin(assignments, eq(notifications.assignment_id, assignments.id))
        .where(whereClause)
        .orderBy(sql`${notifications.created_at} DESC, ${notifications.id} DESC`)
        .limit(PAGE_SIZE + 1),

      db
        .select({ value: count() })
        .from(notifications)
        .where(and(eq(notifications.user_id, userId), isNull(notifications.read_at))),
    ]);

    const hasMore = rows.length > PAGE_SIZE;
    if (hasMore) rows.pop();

    const lastRow = rows[rows.length - 1];
    const nextCursor =
      hasMore && lastRow !== undefined ? encodeCursor(lastRow.created_at, lastRow.id) : null;

    const unreadCount = countRow?.value ?? 0;

    return {
      items: rows.map((row) => ({
        id: row.id,
        type: row.type as 'mention' | 'assignment_reminder',
        createdAt: row.created_at.toISOString(),
        readAt: row.read_at ? row.read_at.toISOString() : null,
        messageId: row.message_id ?? null,
        channelId: row.channel_id ?? null,
        serverId: row.server_id ?? null,
        assignmentId: row.assignment_id ?? null,
        // Prefer display_name; fall back to username; null when neither is set
        actorDisplayName: row.actor_display_name ?? row.actor_username ?? null,
        channelName: row.channel_name ?? null,
        // Truncate excerpt to avoid large payloads; null for reminder rows
        messageExcerpt: row.message_content ? row.message_content.slice(0, EXCERPT_MAX) : null,
        assignmentTitle: row.assignment_title ?? null,
        dueDate: row.assignment_due_date ? row.assignment_due_date.toISOString() : null,
      })),
      unreadCount,
      nextCursor,
    };
  }

  // -------------------------------------------------------------------------
  // markRead — SET read_at = now() for a single notification owned by userId.
  //
  // Owner-404 convention: if zero rows are affected (notification not found OR
  // belongs to a different user), throw NotFoundException(404). This deliberately
  // conflates "not found" and "forbidden" into a single 404 to avoid leaking
  // the existence of other users' notifications through timing or status codes.
  //
  // Idempotent: if the notification is already read the UPDATE still matches
  // (WHERE clause does NOT filter on read_at) and overwrites read_at; callers
  // receive 200 on a double-mark.
  // -------------------------------------------------------------------------
  async markRead(userId: string, id: string): Promise<UnreadCountResponse> {
    const updated = await db
      .update(notifications)
      .set({ read_at: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.user_id, userId)))
      .returning({ id: notifications.id });

    if (updated.length === 0) {
      // Zero rows: notification does not exist OR belongs to a different user.
      // Owner-404: surface as 404 (not 403) to avoid existence leakage.
      throw new NotFoundException('Notification not found');
    }

    const [countRow] = await db
      .select({ value: count() })
      .from(notifications)
      .where(and(eq(notifications.user_id, userId), isNull(notifications.read_at)));

    return { unreadCount: countRow?.value ?? 0 };
  }

  // -------------------------------------------------------------------------
  // markAllRead — SET read_at = now() WHERE read_at IS NULL for this user.
  //
  // Returns {unreadCount: 0}: after a bulk-mark all notifications are read;
  // re-running the COUNT would always return 0, so we return it directly
  // without an extra round-trip.
  // -------------------------------------------------------------------------
  async markAllRead(userId: string): Promise<UnreadCountResponse> {
    await db
      .update(notifications)
      .set({ read_at: new Date() })
      .where(and(eq(notifications.user_id, userId), isNull(notifications.read_at)));

    return { unreadCount: 0 };
  }
}
