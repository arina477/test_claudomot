import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { servers } from './servers';
import { users } from './users';

// ---------------------------------------------------------------------------
// server_study_timer — wave-49 shared study timer (task 1387d845)
//
// ANCHORS ONLY: persist run_state, phase, started_at, ends_at,
// paused_remaining_ms.  Remaining time / current phase are ALWAYS derived
// compute-on-read (ends_at − now()).  NO stored decrementing counter.
//
// Durations are HARDCODED 25 min work / 5 min break in the B-2 service.
// Custom durations DEFERRED to seed f4b3659e — NOT columns this wave.
//
// phase:     app-enforced enum { 'work' | 'break' }  — no DB CHECK
// run_state: app-enforced enum { 'idle' | 'running' | 'paused' } — no DB CHECK
//
// UNIQUE(server_id) — one timer per server.
// FK server_id → servers(id) ON DELETE cascade.
// FK updated_by → users(id) — users.id is opaque text (no cascade).
// ---------------------------------------------------------------------------

export const server_study_timer = pgTable('server_study_timer', {
  id: uuid('id').primaryKey().defaultRandom(),
  server_id: uuid('server_id')
    .notNull()
    .unique()
    .references(() => servers.id, { onDelete: 'cascade' }),
  phase: text('phase').notNull().default('work'),
  run_state: text('run_state').notNull().default('idle'),
  started_at: timestamp('started_at', { withTimezone: true }),
  ends_at: timestamp('ends_at', { withTimezone: true }),
  paused_remaining_ms: integer('paused_remaining_ms'),
  updated_by: text('updated_by').references(() => users.id),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ServerStudyTimer = InferSelectModel<typeof server_study_timer>;
export type NewServerStudyTimer = InferInsertModel<typeof server_study_timer>;
