# Wave 74 — B-0 Branch & schema
## Branch
- `wave-74-entitlements-substrate` from main.
## Env / Deps
- No new env vars, no new deps (Stripe fenced).
## Schema (ran)
- **Table:** `subscriptions` (`apps/api/src/db/schema/subscriptions.ts`) — id uuid PK; **server_id UUID FK → servers.id** (the binding P-4/karen carry — servers.id is uuid, not text); tier text (NO pgEnum; app-Zod-validated); created_at + updated_at timestamptz; UNIQUE(server_id). NO Stripe/price/quota columns (fenced). Server resolves 'free' when no row (default-when-absent).
- **Migration:** `0029_clammy_the_fallen.sql` — CREATE subscriptions + uuid FK (ON DELETE no action) + unique index. No drift (27 tables; subscriptions the only new one). postgres-pro authored.
- **Registered:** schema barrel index.ts.
- **Local apply:** DB-unreachable → applied at C-2 (established pattern).
- **Typecheck:** clean.
## Task claim
- Bundle → in_progress + wave 74: 53d18d7f (schema/seed), e34642ef (service/DTO), 2f61a317 (gate). All 3 RETURNING'd.
## Deviations
- uniqueIndex over table-level .unique() (named-index codebase convention). Local apply deferred to C-2.
```yaml
branch: wave-74-entitlements-substrate
deps_added: []
env_vars_added: []
schema_skipped: false
migrations: [apps/api/drizzle/migrations/0029_clammy_the_fallen.sql]
orm_models_changed: [apps/api/src/db/schema/subscriptions.ts, apps/api/src/db/schema/index.ts]
backfill_ran: false
deviations: [local-migration-apply-deferred-to-C-2]
```
