import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { boolean, index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { channels } from './servers';
import { users } from './users';

// ---------------------------------------------------------------------------
// messages table — wave-12 M3 messaging (task a0c322b4)
//                 + wave-13 soft-delete + edit columns (task e12886d7)
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
    // wave-13: edit tracking
    is_edited: boolean('is_edited').notNull().default(false),
    edited_at: timestamp('edited_at', { withTimezone: true }),
    // wave-13: soft-delete (content cleared/tombstoned on delete)
    is_deleted: boolean('is_deleted').notNull().default(false),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
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

// ---------------------------------------------------------------------------
// message_reactions table — wave-13 M3 reactions (task d78df376)
//
// Named `message_reactions` (P-4-approved override of _library's `reactions`
// naming convention — scoped name avoids future collision with other reaction
// targets such as posts or threads; migration comment records this decision).
//
// UNIQUE(message_id, user_id, emoji) — idempotent toggle: INSERT ON CONFLICT
// deletes the existing row (toggle-off) instead of inserting a duplicate.
// INDEX(message_id) — fast aggregation per message.
// ---------------------------------------------------------------------------

export const message_reactions = pgTable(
  'message_reactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    message_id: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id),
    emoji: text('emoji').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // UNIQUE(message_id, user_id, emoji) — one reaction per user per emoji per message
    unique('message_reactions_message_user_emoji').on(table.message_id, table.user_id, table.emoji),
    // INDEX(message_id) — fast aggregation per message
    index('message_reactions_message_id_idx').on(table.message_id),
  ],
);

export type MessageReaction = InferSelectModel<typeof message_reactions>;
export type NewMessageReaction = InferInsertModel<typeof message_reactions>;

// ---------------------------------------------------------------------------
// message_mentions table — wave-15 M3 @mentions (task 3d238446)
//
// Mirrors message_reactions exactly (same id/timestamp convention, same FK
// pattern, same ON DELETE CASCADE on message_id).
//
// UNIQUE(message_id, mentioned_user_id) — one mention entry per user per
// message; prevents duplicate notification rows from multi-insert paths.
// INDEX(mentioned_user_id, created_at DESC) — efficient "my mentions" lookup
// ordered by recency without a full table scan.
// ---------------------------------------------------------------------------

export const message_mentions = pgTable(
  'message_mentions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    message_id: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    mentioned_user_id: text('mentioned_user_id')
      .notNull()
      .references(() => users.id),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // UNIQUE(message_id, mentioned_user_id) — one mention per user per message
    unique('message_mentions_message_user').on(table.message_id, table.mentioned_user_id),
    // INDEX(mentioned_user_id, created_at DESC) — fast my-mentions lookup
    index('message_mentions_user_created_at_idx').on(table.mentioned_user_id, table.created_at),
  ],
);

export type MessageMention = InferSelectModel<typeof message_mentions>;
export type NewMessageMention = InferInsertModel<typeof message_mentions>;
