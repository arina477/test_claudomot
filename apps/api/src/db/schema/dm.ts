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
import { users } from './users';

// ---------------------------------------------------------------------------
// dm_conversations table — wave-46 M8 direct messages (task a48f1910)
//
// Separate entity from server channels: no channel_id FK, no server roles.
// is_group distinguishes 1:1 (false, exactly 2 participants) from small-group
// (true, 3..10 total). created_by references the initiating user.
// ---------------------------------------------------------------------------

export const dm_conversations = pgTable('dm_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  is_group: boolean('is_group').notNull().default(false),
  created_by: text('created_by')
    .notNull()
    .references(() => users.id),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type DmConversation = InferSelectModel<typeof dm_conversations>;
export type NewDmConversation = InferInsertModel<typeof dm_conversations>;

// ---------------------------------------------------------------------------
// dm_participants table — wave-46 M8 direct messages (task a48f1910)
//
// JOIN table between dm_conversations and users. Cascade-deleted when the
// conversation is deleted. UNIQUE(conversation_id, user_id) prevents duplicate
// membership. INDEX(user_id) powers "my conversations" queries.
// ---------------------------------------------------------------------------

export const dm_participants = pgTable(
  'dm_participants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversation_id: uuid('conversation_id')
      .notNull()
      .references(() => dm_conversations.id, { onDelete: 'cascade' }),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id),
    joined_at: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // UNIQUE(conversation_id, user_id) — one membership row per user per conversation
    unique('dm_participants_conversation_user').on(table.conversation_id, table.user_id),
    // INDEX(user_id) — efficient "my conversations" lookup
    index('dm_participants_user_id_idx').on(table.user_id),
  ],
);

export type DmParticipant = InferSelectModel<typeof dm_participants>;
export type NewDmParticipant = InferInsertModel<typeof dm_participants>;

// ---------------------------------------------------------------------------
// dm_messages table — wave-46 M8 direct messages (task a48f1910)
//
// Mirrors messages.ts idempotency and pagination index conventions:
//   UNIQUE(conversation_id, idempotency_key) — deduplication (idempotent send)
//   INDEX(conversation_id, created_at) — efficient cursor pagination
// author_id uses opaque text (SuperTokens) matching messages.author_id.
// Cascade-deleted when the parent conversation is deleted.
//
// wave-79 E2E encryption (task 491cb85d):
//   content is relaxed to NULLABLE — E2E-encrypted messages carry no server-
//     readable plaintext; legacy/plaintext rows still populate it.
//   ciphertext / sender_key_ref / envelope_version (all nullable) hold the
//     server-blind encrypted envelope. Exactly one of {content, ciphertext}
//     is populated per row (enforced at the app/Zod boundary, not the DB).
//   deleted_at (nullable timestamptz) — soft-delete tombstone, mirroring
//     messages.ts's deleted_at column (the plaintext-channel analog).
// ---------------------------------------------------------------------------

export const dm_messages = pgTable(
  'dm_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversation_id: uuid('conversation_id')
      .notNull()
      .references(() => dm_conversations.id, { onDelete: 'cascade' }),
    author_id: text('author_id')
      .notNull()
      .references(() => users.id),
    // wave-79: nullable — NULL for E2E-encrypted rows (envelope carries the payload)
    content: text('content'),
    // wave-79 E2E envelope (server-blind): opaque ciphertext + key ref + version
    ciphertext: text('ciphertext'),
    sender_key_ref: text('sender_key_ref'),
    envelope_version: integer('envelope_version'),
    idempotency_key: text('idempotency_key').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    // wave-79: soft-delete tombstone (mirrors messages.deleted_at)
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    // UNIQUE(conversation_id, idempotency_key) — deduplication constraint
    unique('dm_messages_conversation_idempotency_key').on(
      table.conversation_id,
      table.idempotency_key,
    ),
    // INDEX(conversation_id, created_at) — efficient cursor pagination
    index('dm_messages_conversation_created_at_idx').on(table.conversation_id, table.created_at),
  ],
);

export type DmMessage = InferSelectModel<typeof dm_messages>;
export type NewDmMessage = InferInsertModel<typeof dm_messages>;
