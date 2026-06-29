import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { boolean, integer, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

export const servers = pgTable('servers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  owner_id: text('owner_id')
    .notNull()
    .references(() => users.id),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const server_members = pgTable(
  'server_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    server_id: uuid('server_id')
      .notNull()
      .references(() => servers.id, { onDelete: 'cascade' }),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id),
    role_id: uuid('role_id'),
    joined_at: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique().on(table.server_id, table.user_id)],
);

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  server_id: uuid('server_id')
    .notNull()
    .references(() => servers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  position: integer('position').default(0).notNull(),
});

export const channels = pgTable('channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  server_id: uuid('server_id')
    .notNull()
    .references(() => servers.id, { onDelete: 'cascade' }),
  category_id: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  type: text('type').default('text').notNull(),
  is_private: boolean('is_private').default(false).notNull(),
  position: integer('position').default(0).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Server = InferSelectModel<typeof servers>;
export type NewServer = InferInsertModel<typeof servers>;
export type ServerMember = InferSelectModel<typeof server_members>;
export type NewServerMember = InferInsertModel<typeof server_members>;
export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;
export type Channel = InferSelectModel<typeof channels>;
export type NewChannel = InferInsertModel<typeof channels>;
