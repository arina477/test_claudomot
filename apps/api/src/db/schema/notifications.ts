import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { desc, sql } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { assignments } from './assignments';
import { messages } from './messages';
import { channels, servers } from './servers';
import { users } from './users';

// ---------------------------------------------------------------------------
// notifications table — wave-37 M7 in-app notifications (B-0 schema)
//
// Persistent notification rows for in-app delivery. One row per event per user.
//
// user_id → users.id ON DELETE CASCADE
//   Deliberate: a deleted user's notifications are meaningless — cascade clears
//   them. (assignment_reminder omits this; we want it here — spec requirement.)
//
// type: text NOT NULL — 'mention' | 'assignment_reminder'
//   No pg enum per codebase convention (app-layer Zod validation).
//
// Nullable source refs — ON DELETE choices:
//   message_id → messages.id  SET NULL
//     messages are soft-deleted (is_deleted flag; row never physically removed),
//     so this FK will never fire in practice. SET NULL is chosen over RESTRICT
//     as a defensive guard: if a message were ever hard-deleted in a future
//     refactor the notification survives with message_id cleared rather than
//     blocking the delete.
//
//   channel_id → channels.id  SET NULL
//     channels are hard-deleted (no is_deleted column; cascade from server delete).
//     SET NULL keeps the notification visible (user still sees "You were mentioned")
//     even if the source channel is gone. CASCADE would aggressively wipe
//     notifications on any channel deletion, which is user-hostile.
//
//   server_id → servers.id  SET NULL
//     servers are hard-deleted. Same rationale as channel_id above.
//
//   assignment_id → assignments.id  ON DELETE CASCADE
//     Mirrors assignment_reminder convention (explicit spec requirement).
//     assignments are soft-deleted in practice but the cascade matches the
//     existing pattern for assignment-linked rows in this codebase.
//
// Indexes:
//   INDEX(user_id, read_at, created_at DESC) — the primary list/unread query
//     path: WHERE user_id = $1 AND read_at IS NULL ORDER BY created_at DESC.
//
//   PARTIAL UNIQUE(user_id, message_id) WHERE type = 'mention' — dedup guard
//     for re-emitted mention.created events (create + edit + retry paths);
//     prevents double-insert without application-level dedup logic.
// ---------------------------------------------------------------------------

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // 'mention' | 'assignment_reminder' — validated at Zod/app layer; no pg enum
    type: text('type').notNull(),
    // Nullable source refs
    message_id: uuid('message_id').references(() => messages.id, { onDelete: 'set null' }),
    channel_id: uuid('channel_id').references(() => channels.id, { onDelete: 'set null' }),
    server_id: uuid('server_id').references(() => servers.id, { onDelete: 'set null' }),
    assignment_id: uuid('assignment_id').references(() => assignments.id, {
      onDelete: 'cascade',
    }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    read_at: timestamp('read_at', { withTimezone: true }),
  },
  (table) => [
    // INDEX(user_id, read_at, created_at DESC) — unread-first list query
    index('notifications_user_read_created_idx').on(
      table.user_id,
      table.read_at,
      desc(table.created_at),
    ),
    // PARTIAL UNIQUE(user_id, message_id) WHERE type = 'mention'
    // Dedup re-emitted mention.created events (create + edit + retry).
    uniqueIndex('notifications_user_message_mention_uidx')
      .on(table.user_id, table.message_id)
      .where(sql`type = 'mention'`),
    // PARTIAL UNIQUE(user_id, assignment_id) WHERE type = 'assignment_reminder'
    // Makes the ON CONFLICT DO NOTHING in createForReminder real — without this
    // index the ON CONFLICT clause can never fire, allowing duplicate in-app
    // notifications to accumulate if the upstream send-once guard is bypassed.
    uniqueIndex('notifications_user_assignment_reminder_uidx')
      .on(table.user_id, table.assignment_id)
      .where(sql`type = 'assignment_reminder'`),
  ],
);

export type Notification = InferSelectModel<typeof notifications>;
export type NewNotification = InferInsertModel<typeof notifications>;
