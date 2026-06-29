import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { servers } from './servers';
import { users } from './users';

export const invites = pgTable('invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  server_id: uuid('server_id')
    .notNull()
    .references(() => servers.id, { onDelete: 'cascade' }),
  code: text('code').unique().notNull(),
  created_by: text('created_by')
    .notNull()
    .references(() => users.id),
  max_uses: integer('max_uses'),
  uses: integer('uses').notNull().default(0),
  expires_at: timestamp('expires_at', { withTimezone: true }),
  revoked: boolean('revoked').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Invite = InferSelectModel<typeof invites>;
export type NewInvite = InferInsertModel<typeof invites>;
