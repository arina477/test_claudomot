import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

// ---------------------------------------------------------------------------
// user_blocks table — wave-70 M14 Block feature (B-0 schema)
//
// Records a directional block relationship: blocker_id has blocked blocked_id.
// Blocks are cross-server — no server_id column. The block hides DMs and
// presence everywhere, not scoped to any single server.
//
// FKs:
//   blocker_id → users.id (text, no cascade — block record persists if user soft-deletes)
//   blocked_id → users.id (text, no cascade — same)
//
// UNIQUE(blocker_id, blocked_id) — idempotency backbone; a user cannot block
//   the same person twice. Enforced at DB layer; app layer returns 409.
//
// INDEX(blocker_id) — named user_blocks_blocker_idx
//   Backs GET /blocks (fetch my blocklist) and the HIDE-predicate JOIN that
//   filters blocked users from DM lists / presence queries.
// ---------------------------------------------------------------------------

export const userBlocks = pgTable(
  'user_blocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    blocker_id: text('blocker_id')
      .notNull()
      .references(() => users.id),
    blocked_id: text('blocked_id')
      .notNull()
      .references(() => users.id),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // UNIQUE(blocker_id, blocked_id) — prevents duplicate block rows
    unique('user_blocks_blocker_blocked_uniq').on(table.blocker_id, table.blocked_id),
    // INDEX(blocker_id) — GET /blocks + HIDE-predicate read path
    index('user_blocks_blocker_idx').on(table.blocker_id),
  ],
);

export type UserBlock = InferSelectModel<typeof userBlocks>;
export type NewUserBlock = InferInsertModel<typeof userBlocks>;
