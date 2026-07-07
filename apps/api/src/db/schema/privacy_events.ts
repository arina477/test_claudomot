import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

// ---------------------------------------------------------------------------
// privacy_events table — wave-73 M? account-deletion / privacy audit log (B-0 schema)
//
// Append-only audit trail for privacy-relevant actor actions.
// Rows are NEVER updated or deleted — the table is a ledger.
//
// event_type: text NOT NULL — e.g. 'account_deletion_initiated', 'visibility_changed'
//   No pg enum per codebase convention (app-layer Zod validation).
//
// target_type: text NOT NULL — 'self' | 'user' | 'server'
//   No pg enum per codebase convention (app-layer Zod validation).
//
// target_id: text, NULLABLE — the affected user / entity id.
//   NULL for self-actions where actor == target is implicit.
//
// context: jsonb, NULLABLE — minimal non-PII deltas only.
//   e.g. { visibilityFrom: 'everyone', visibilityTo: 'friends' }
//   No shape constraint at the DB layer; service layer validates.
//
// FKs:
//   actor_id → users.id (text, NO cascade — actor may be soft-deleted;
//     the event row must persist as evidence of the action)
//
// INDEX(actor_id, created_at DESC) — backs GET /profile/privacy-events
//   (own-scoped reverse-chronological read query)
// ---------------------------------------------------------------------------

export const privacyEvents = pgTable(
  'privacy_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actor_id: text('actor_id')
      .notNull()
      .references(() => users.id),
    // e.g. 'account_deletion_initiated' | 'visibility_changed' — validated at Zod/app layer; no pg enum
    event_type: text('event_type').notNull(),
    // 'self' | 'user' | 'server' — validated at Zod/app layer; no pg enum
    target_type: text('target_type').notNull(),
    // nullable: null for self-actions where actor == target is implicit
    target_id: text('target_id'),
    // minimal non-PII deltas only; no shape constraint at DB layer
    context: jsonb('context'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // INDEX(actor_id, created_at DESC) — GET /profile/privacy-events reverse-chron read
    index('privacy_events_actor_created_idx').on(table.actor_id, table.created_at),
  ],
);

export type PrivacyEvent = InferSelectModel<typeof privacyEvents>;
export type NewPrivacyEvent = InferInsertModel<typeof privacyEvents>;
