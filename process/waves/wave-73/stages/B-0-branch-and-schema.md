# Wave 73 — B-0 Branch & schema

## Branch
- `wave-73-privacy-audit-log` from main (rebased clean).

## Env / Deps
- No new env vars, no new deps.

## Schema (ran)
- **Table:** `privacy_events` (`apps/api/src/db/schema/privacy_events.ts`) — mirrors reports.ts: id uuid PK defaultRandom; actor_id text FK users.id (NO cascade — event persists after soft-delete); event_type text (NO pgEnum; service-layer Zod); target_type text; target_id text nullable; context jsonb nullable (minimal non-PII); created_at timestamptz defaultNow notNull. Index `privacy_events_actor_created_idx` on (actor_id, created_at) for the own-scoped reverse-chron read.
- **Registered:** schema barrel index.ts (`export * from './privacy_events'`).
- **Migration:** `0028_overjoyed_black_queen.sql` — CREATE TABLE + FK (ON DELETE no action) + index. No drift (26 tables; privacy_events the only new object). postgres-pro authored.
- **Local apply:** DB-unreachable in worker → applied at C-2 (established pattern).
- **Typecheck:** clean.

## Task claim
- Bundle → in_progress + wave 73: 156aa2ee (backend), 03940edd (DTO), 5a2521bc (read UI). All 3 RETURNING'd.

## Deviations
- jsonb import added (reports.ts has no jsonb) — required, not a deviation.
- Local migration apply deferred to C-2 (DB-unreachable).

```yaml
branch: wave-73-privacy-audit-log
deps_added: []
env_vars_added: []
schema_skipped: false
migrations: [apps/api/drizzle/migrations/0028_overjoyed_black_queen.sql]
orm_models_changed: [apps/api/src/db/schema/privacy_events.ts, apps/api/src/db/schema/index.ts]
backfill_ran: false
deviations: [local-migration-apply-deferred-to-C-2-db-unreachable]
```
