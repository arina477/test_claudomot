# B-0 — Branch & schema (wave-69, M14 moderation bundle #1)

## Branch
`wave-69-moderation-reports` (from main). Pushed to origin.

## Env / deps
- New env vars: none.
- New deps: none (plan § New deps: none).

## Schema (RAN — new table)
Specialist: **postgres-pro** (AGENTS.md-registered Drizzle-schema specialist; swapped from the plan's "database-administrator" per always-on rule 11 — database-administrator is in the capability sheet but NOT in AGENTS.md, postgres-pro is in both and is the precise Drizzle+migrations match).

- Created `apps/api/src/db/schema/reports.ts` — `reports` table: id(uuid pk defaultRandom), reporter_id(text FK users.id), target_type(text), target_server_id(uuid FK servers.id), target_user_id(text FK users.id, null), target_message_id(uuid FK messages.id, null, ON DELETE set null), reason(text), status(text default 'open'), created_at(timestamptz defaultNow), resolved_at(timestamptz null), resolved_by(text FK users.id null). Index `reports_target_server_status_idx` on (target_server_id, status).
- Modified `apps/api/src/db/schema/index.ts` — `export * from './reports'`.
- Generated migration `apps/api/drizzle/migrations/0025_strong_gladiator.sql` (drizzle-kit generate). CREATE TABLE reports + 5 FKs + index. No CREATE TYPE.
- tsc --noEmit clean; biome clean on touched files.

## Adjudicated deviation (Action 9)
postgres-pro initially emitted two `pgEnum`s (report_target_type, report_status) per the spec's literal "enum" wording. Adjudicated → REVERT to plain `text` columns: the codebase has ZERO pgEnum across all 12 sibling schema tables (every status/type is text + app-layer Zod), the spec's own mandate is "REUSE, do not reinvent … mirror rbac.ts style", and pgEnum brings ALTER TYPE ADD VALUE migration friction for a moderation domain expected to gain values. Value domain (server|member|message, open|resolved|dismissed) enforced by Zod z.enum in packages/shared at B-1. Migration regenerated clean (0025_strong_gladiator, replacing the stale 0025_late_tomorrow_man); drizzle meta/journal consistent (enums:{}).

## Action 6 — local migration apply
Not applied to a remote DB (correct — prod apply is C-2 via head-ci-cd against the prod proxy, sequenced before the api deploy). Migration is drizzle-generated + tsc-validated; the real-Postgres CI integration tier (postgres:16, DATABASE_URL_TEST) runs it green at C-1, and C-2 applies it to prod. Local dev-DB apply deferred to the CI integration tier per the project's no-auto-migrate deploy model.

```yaml
branch: wave-69-moderation-reports
deps_added: []
env_vars_added: []
schema_skipped: false
migrations: [apps/api/drizzle/migrations/0025_strong_gladiator.sql]
orm_models_changed: [apps/api/src/db/schema/reports.ts, apps/api/src/db/schema/index.ts]
backfill_ran: false
deviations: [pgEnum→text convention fix (adjudicated, Action 9)]
```
