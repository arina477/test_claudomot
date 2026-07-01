import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { assignments } from './assignments';
import { users } from './users';

// ---------------------------------------------------------------------------
// assignment_reminder table — wave-30 M? assignment reminders (task c5c30363)
//
// Send-once idempotency substrate for the reminder cron.
// assignment_id → assignments.id ON DELETE CASCADE
// user_id → users.id (text — matches users PK type)
//
// UNIQUE(assignment_id, user_id) — one reminder row per user per assignment;
// enables idempotent INSERT ON CONFLICT DO NOTHING.
// ---------------------------------------------------------------------------

export const assignment_reminder = pgTable(
  'assignment_reminder',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    assignment_id: uuid('assignment_id')
      .notNull()
      .references(() => assignments.id, { onDelete: 'cascade' }),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id),
    sent_at: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // UNIQUE(assignment_id, user_id) — send-once arbiter; mirrors assignment_status UNIQUE precedent
    unique('assignment_reminder_assignment_user').on(table.assignment_id, table.user_id),
  ],
);

export type AssignmentReminder = InferSelectModel<typeof assignment_reminder>;
export type NewAssignmentReminder = InferInsertModel<typeof assignment_reminder>;
