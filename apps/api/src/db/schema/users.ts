import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    display_name: text('display_name'),
    username: text('username'),
    avatar_url: text('avatar_url'),
    accent_color: text('accent_color'),
    profile_visibility: text('profile_visibility').notNull().default('everyone'),
    who_can_dm: text('who_can_dm').notNull().default('everyone'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('users_username_lower_idx').on(sql`lower(${table.username})`)],
);

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
