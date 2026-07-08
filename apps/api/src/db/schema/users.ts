import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    display_name: text('display_name'),
    username: text('username'),
    avatar_url: text('avatar_url'),
    avatar_key: text('avatar_key'),
    accent_color: text('accent_color'),
    profile_visibility: text('profile_visibility').notNull().default('everyone'),
    who_can_dm: text('who_can_dm').notNull().default('everyone'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
    pronouns: text('pronouns'),
    bio: text('bio'),
    institution: text('institution'),
    program: text('program'),
    academic_role: text('academic_role'),
    academic_year: text('academic_year'),
  },
  (table) => [uniqueIndex('users_username_lower_idx').on(sql`lower(${table.username})`)],
);

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

// ---------------------------------------------------------------------------
// user_encryption_keys table — wave-79 E2E DM encryption (task 60bda5be)
//
// Server-blind design: the server stores ONLY public key material. There is
// NO private-key column — private keys never leave the client device.
//
// user_id: text UNIQUE, FK → users.id (opaque SuperTokens id — MUST be text,
//   NOT uuid; a uuid column fails the FK. P-4 karen correction.) NO cascade,
//   matching the dominant users-FK convention (privacy_events / user-blocks):
//   the public key persists even if the user soft-deletes, so already-sent
//   encrypted messages remain decryptable by peers holding the ref.
//
// algorithm: text NOT NULL — e.g. 'ecdh-p256-aes-gcm'. No pg enum; validated
//   by a shared Zod z.enum at the app boundary, per codebase convention.
//
// public_key: text NOT NULL — base64/PEM-encoded public key material.
//
// UNIQUE(user_id) — one active key record per user (rotation UPDATEs the row).
// ---------------------------------------------------------------------------

export const user_encryption_keys = pgTable('user_encryption_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id),
  public_key: text('public_key').notNull(),
  // e.g. 'ecdh-p256-aes-gcm' — validated at Zod/app layer; no pg enum
  algorithm: text('algorithm').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UserEncryptionKey = InferSelectModel<typeof user_encryption_keys>;
export type NewUserEncryptionKey = InferInsertModel<typeof user_encryption_keys>;
