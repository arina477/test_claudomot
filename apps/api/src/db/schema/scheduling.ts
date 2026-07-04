import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { servers } from './servers';
import { users } from './users';

// ---------------------------------------------------------------------------
// scheduled_sessions table — wave-43 class-scheduling (task 535bdb8c)
//
// organizer_id → users.id (text — matches users PK type, no cascade)
// server_id → servers.id (uuid) ON DELETE CASCADE
//
// recurrence: app-enforced text enum { 'none' | 'weekly' } — no CHECK
// constraint, matching the assignment_status.state convention.
//
// INDEX(server_id, starts_at) — efficient per-server session listing by start.
// ---------------------------------------------------------------------------

export const scheduled_sessions = pgTable(
  'scheduled_sessions',
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
    starts_at: timestamp('starts_at', { withTimezone: true }).notNull(),
    ends_at: timestamp('ends_at', { withTimezone: true }).notNull(),
    recurrence: text('recurrence').notNull().default('none'),
    recurrence_until: timestamp('recurrence_until', { withTimezone: true }),
    is_deleted: boolean('is_deleted').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // INDEX(server_id, starts_at) — per-server session listing ordered by start time
    index('scheduled_sessions_server_id_starts_at_idx').on(table.server_id, table.starts_at),
  ],
);

export type ScheduledSession = InferSelectModel<typeof scheduled_sessions>;
export type NewScheduledSession = InferInsertModel<typeof scheduled_sessions>;
