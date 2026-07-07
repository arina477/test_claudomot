import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { messages } from './messages';
import { servers } from './servers';
import { users } from './users';

// ---------------------------------------------------------------------------
// reports table — wave-69 M14 moderation bundle #1 (B-0 schema)
//
// Captures user-filed reports against three target types:
//   'server'  — report about the server itself          (target_server_id only)
//   'member'  — report about a member in a server       (target_server_id + target_user_id)
//   'message' — report about a specific message         (target_server_id + target_message_id)
//
// target_server_id is set for ALL three types — it is the routing context
// (server owner receives the report queue; GET /servers/:serverId/reports).
//
// FKs:
//   reporter_id  → users.id (text, no cascade — reporter's account persist)
//   target_server_id → servers.id (uuid, no cascade — report survives server delete)
//   target_user_id   → users.id (text, nullable — member reports only)
//   target_message_id → messages.id (uuid, nullable — message reports only)
//     messages are soft-deleted (is_deleted flag; row never physically removed),
//     so SET NULL is a defensive guard matching the notifications table pattern.
//   resolved_by  → users.id (text, nullable — the moderator who acted on it)
//
// target_type: text NOT NULL — 'server' | 'member' | 'message'
//   No pg enum per codebase convention (app-layer Zod validation).
//
// status: text NOT NULL DEFAULT 'open' — 'open' | 'resolved' | 'dismissed'
//   No pg enum per codebase convention (app-layer Zod validation).
//   Transitions: open → resolved | dismissed.
//   resolved_at / resolved_by populated together on status change.
//
// INDEX(target_server_id, status) — backs GET /servers/:serverId/reports?status=open
// ---------------------------------------------------------------------------

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reporter_id: text('reporter_id')
      .notNull()
      .references(() => users.id),
    // 'server' | 'member' | 'message' — validated at Zod/app layer; no pg enum
    target_type: text('target_type').notNull(),
    target_server_id: uuid('target_server_id')
      .notNull()
      .references(() => servers.id),
    target_user_id: text('target_user_id').references(() => users.id),
    target_message_id: uuid('target_message_id').references(() => messages.id, {
      onDelete: 'set null',
    }),
    reason: text('reason').notNull(),
    // 'open' | 'resolved' | 'dismissed' — validated at Zod/app layer; no pg enum
    status: text('status').notNull().default('open'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    resolved_at: timestamp('resolved_at', { withTimezone: true }),
    resolved_by: text('resolved_by').references(() => users.id),
  },
  (table) => [
    // INDEX(target_server_id, status) — server owner report-queue read
    index('reports_target_server_status_idx').on(table.target_server_id, table.status),
  ],
);

export type Report = InferSelectModel<typeof reports>;
export type NewReport = InferInsertModel<typeof reports>;
