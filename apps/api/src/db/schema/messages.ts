import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { channels } from './servers';
import { users } from './users';

// ---------------------------------------------------------------------------
// messages table — wave-12 M3 messaging (task a0c322b4)
// ---------------------------------------------------------------------------

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    channel_id: uuid('channel_id')
      .notNull()
      .references(() => channels.id, { onDelete: 'cascade' }),
    author_id: text('author_id')
      .notNull()
      .references(() => users.id),
    content: text('content').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    idempotency_key: text('idempotency_key'),
  },
  (table) => [
    // UNIQUE(channel_id, idempotency_key) — deduplication constraint
    unique('messages_channel_idempotency_key').on(table.channel_id, table.idempotency_key),
    // INDEX(channel_id, created_at) — efficient cursor pagination
    index('messages_channel_created_at_idx').on(table.channel_id, table.created_at),
  ],
);

export type Message = InferSelectModel<typeof messages>;
export type NewMessage = InferInsertModel<typeof messages>;
