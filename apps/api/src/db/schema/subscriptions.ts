import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { servers } from './servers';

// ---------------------------------------------------------------------------
// subscriptions table — wave-74 M? monetization entitlements substrate (B-0 schema)
//
// Records the explicit tier assignment for a server.
// Resolve semantics: a server with NO row is treated as 'free' at the app layer.
// A row is only inserted when a server is explicitly assigned a non-default tier
// (or when a free-tier entitlement is explicitly persisted).
//
// tier: text NOT NULL — 'free' | 'server_pro' | 'school'
//   No pg enum per codebase convention (app-layer Zod validation).
//
// UNIQUE(server_id) — at most one subscription row per server.
//
// FKs:
//   server_id → servers.id (uuid, no explicit onDelete — mirrors reports.ts
//     target_server_id convention; report/subscription rows survive server delete
//     for audit / billing safety; physical cleanup handled at app layer).
//
// EXCLUDED (founder-reserved / later M9 slices):
//   stripe_customer_id, stripe_subscription_id, price columns, quota/limit columns.
// ---------------------------------------------------------------------------

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    server_id: uuid('server_id')
      .notNull()
      .references(() => servers.id),
    // 'free' | 'server_pro' | 'school' — validated at Zod/app layer; no pg enum
    tier: text('tier').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // UNIQUE(server_id) — one subscription row per server
    uniqueIndex('subscriptions_server_id_uidx').on(table.server_id),
  ],
);

export type Subscription = InferSelectModel<typeof subscriptions>;
export type NewSubscription = InferInsertModel<typeof subscriptions>;
