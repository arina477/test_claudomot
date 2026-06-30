import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { messages } from './messages';
import { channels } from './servers';
import { users } from './users';

// ---------------------------------------------------------------------------
// attachments table — wave-19 M3 attachments (task 20db0c16)
//
// message_id is NOT NULL: the attachment row is created at message-send,
// never as an orphan (P-4 row-at-send decision).
//
// FK/cascade pattern mirrors message_reactions / message_mentions exactly:
//   message_id → messages.id ON DELETE CASCADE
//   channel_id → channels.id ON DELETE CASCADE
//   uploader_id → users.id (no cascade — user deletion handled separately)
//
// INDEX(message_id) — per-message attachment fetch.
// ---------------------------------------------------------------------------

export const attachments = pgTable(
  'attachments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    message_id: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    uploader_id: text('uploader_id')
      .notNull()
      .references(() => users.id),
    channel_id: uuid('channel_id')
      .notNull()
      .references(() => channels.id, { onDelete: 'cascade' }),
    object_key: text('object_key').notNull(),
    filename: text('filename').notNull(),
    content_type: text('content_type').notNull(),
    size_bytes: integer('size_bytes').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // INDEX(message_id) — per-message attachment fetch
    index('attachments_message_id_idx').on(table.message_id),
  ],
);

export type Attachment = InferSelectModel<typeof attachments>;
export type NewAttachment = InferInsertModel<typeof attachments>;
