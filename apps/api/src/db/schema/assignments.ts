import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { servers } from './servers';
import { users } from './users';

// ---------------------------------------------------------------------------
// assignments table — wave-22 M5 assignments (task 01fcefb8)
//
// organizer_id → users.id (text — matches users PK type, no cascade)
// server_id → servers.id (uuid) ON DELETE CASCADE
//
// INDEX(server_id, due_date) — efficient per-server assignment listing by date.
// ---------------------------------------------------------------------------

export const assignments = pgTable(
  'assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    server_id: uuid('server_id')
      .notNull()
      .references(() => servers.id, { onDelete: 'cascade' }),
    organizer_id: text('organizer_id')
      .notNull()
      .references(() => users.id),
    title: text('title').notNull(),
    description: text('description'),
    due_date: timestamp('due_date', { withTimezone: true }).notNull(),
    is_deleted: boolean('is_deleted').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // INDEX(server_id, due_date) — per-server assignment listing ordered by due date
    index('assignments_server_id_due_date_idx').on(table.server_id, table.due_date),
  ],
);

export type Assignment = InferSelectModel<typeof assignments>;
export type NewAssignment = InferInsertModel<typeof assignments>;

// ---------------------------------------------------------------------------
// assignment_status table — wave-22 M5 assignments (task 01fcefb8)
//
// Tracks per-user completion state for each assignment.
// user_id → users.id (text — matches users PK type, no cascade)
// assignment_id → assignments.id ON DELETE CASCADE
//
// UNIQUE(assignment_id, user_id) — one status row per user per assignment;
// enables idempotent upsert (INSERT ON CONFLICT DO UPDATE).
// ---------------------------------------------------------------------------

export const assignment_status = pgTable(
  'assignment_status',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    assignment_id: uuid('assignment_id')
      .notNull()
      .references(() => assignments.id, { onDelete: 'cascade' }),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id),
    state: text('state').notNull(), // 'todo' | 'done' — app-enforced
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // UNIQUE(assignment_id, user_id) — one status row per user per assignment
    unique('assignment_status_assignment_user').on(table.assignment_id, table.user_id),
    // INDEX(assignment_id, user_id) — fast status lookup (the UNIQUE index serves this,
    // but an explicit named index makes query planning explicit)
    index('assignment_status_assignment_user_idx').on(table.assignment_id, table.user_id),
  ],
);

export type AssignmentStatus = InferSelectModel<typeof assignment_status>;
export type NewAssignmentStatus = InferInsertModel<typeof assignment_status>;

// ---------------------------------------------------------------------------
// assignment_attachments table — wave-22 M5 assignments (task 01fcefb8)
//
// Mirrors the messages `attachments` table column shape exactly.
// assignment_id → assignments.id ON DELETE CASCADE
// No uploader_id this wave (attachment is organizer-scoped at create time;
// organizer_id lives on the parent assignment row).
//
// INDEX(assignment_id) — per-assignment attachment fetch.
// ---------------------------------------------------------------------------

export const assignment_attachments = pgTable(
  'assignment_attachments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    assignment_id: uuid('assignment_id')
      .notNull()
      .references(() => assignments.id, { onDelete: 'cascade' }),
    object_key: text('object_key').notNull(),
    filename: text('filename').notNull(),
    content_type: text('content_type').notNull(),
    size_bytes: integer('size_bytes').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // INDEX(assignment_id) — per-assignment attachment fetch
    index('assignment_attachments_assignment_id_idx').on(table.assignment_id),
  ],
);

export type AssignmentAttachment = InferSelectModel<typeof assignment_attachments>;
export type NewAssignmentAttachment = InferInsertModel<typeof assignment_attachments>;
