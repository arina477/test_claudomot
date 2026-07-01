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

export const servers = pgTable('servers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  owner_id: text('owner_id')
    .notNull()
    .references(() => users.id),
  invite_code: text('invite_code').unique(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// RBAC: roles table (wave-10)
// ---------------------------------------------------------------------------

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  server_id: uuid('server_id')
    .notNull()
    .references(() => servers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  position: integer('position').default(0).notNull(),
  manage_server: boolean('manage_server').default(false).notNull(),
  manage_roles: boolean('manage_roles').default(false).notNull(),
  manage_channels: boolean('manage_channels').default(false).notNull(),
  manage_members: boolean('manage_members').default(false).notNull(),
  manage_assignments: boolean('manage_assignments').default(false).notNull(),
  is_default: boolean('is_default').default(false).notNull(),
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
    role_id: uuid('role_id').references(() => roles.id, { onDelete: 'set null' }),
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

// ---------------------------------------------------------------------------
// RBAC: channel_permission_overrides table (wave-10)
// UNIQUE(channel_id, role_id) + INDEX(channel_id)
// ---------------------------------------------------------------------------

export const channel_permission_overrides = pgTable(
  'channel_permission_overrides',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    channel_id: uuid('channel_id')
      .notNull()
      .references(() => channels.id, { onDelete: 'cascade' }),
    role_id: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    can_view: boolean('can_view').notNull(),
  },
  (table) => [
    unique().on(table.channel_id, table.role_id),
    index('cpo_channel_id_idx').on(table.channel_id),
  ],
);

export type Server = InferSelectModel<typeof servers>;
export type NewServer = InferInsertModel<typeof servers>;
export type Role = InferSelectModel<typeof roles>;
export type NewRole = InferInsertModel<typeof roles>;
export type ServerMember = InferSelectModel<typeof server_members>;
export type NewServerMember = InferInsertModel<typeof server_members>;
export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;
export type Channel = InferSelectModel<typeof channels>;
export type NewChannel = InferInsertModel<typeof channels>;
export type ChannelPermissionOverride = InferSelectModel<typeof channel_permission_overrides>;
export type NewChannelPermissionOverride = InferInsertModel<typeof channel_permission_overrides>;
