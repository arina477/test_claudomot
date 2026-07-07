# Wave 72 — B-0 Branch & schema

## Branch
- Created `wave-72-account-deletion` from `main` (rebased clean); pushed to origin with tracking.

## Env
- No new env vars (SuperTokens SDK + session secrets already present). Action 3 no-op.

## Deps
- No new deps. Action 4 no-op.

## Schema (ran — not skipped)
- **Column added:** `users.deleted_at` (timestamptz, nullable, no default) — soft-delete marker for account erasure.
- **Schema source:** `apps/api/src/db/schema/users.ts:19` — `deleted_at: timestamp('deleted_at', { withTimezone: true }),` (mirrors nullable-timestamp idiom, e.g. reports.ts resolved_at).
- **Migration:** `apps/api/drizzle/migrations/0027_cold_mikhail_rasputin.sql` — single statement `ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp with time zone;`. No drift (generator reported users 11→12 columns, nothing else). Meta journal + 0027_snapshot.json committed per Drizzle convention.
- **postgres-pro** authored via B-0 Action 5 spawn.

## Local apply
- **DB-unreachable in this worker** — no `.env` / `DATABASE_URL` provisioned for the app dev DB (same environment condition as every prior wave; the brain DB `$CLAUDOMAT_DB_URL` is reachable and separate). Migration file is generated, deterministic, and typecheck-verified. Per established pattern, the migration is applied against the prod DB public proxy at C-2 via `pnpm --filter @studyhall/api db:migrate` BEFORE the api deploy. Not an infra-readiness pause trigger (app DB, not brain DB).

## Typecheck
- `pnpm --filter @studyhall/api typecheck` → passed, zero errors.

## Task claim
- Bundle claimed to `in_progress` + attached to wave 72: 9658fb0b (erasure API seed), e11f8746 (DTO), 898490b1 (Danger-Zone UI). All 3 RETURNING'd (were todo).

## Deviations
- Local migration apply deferred to C-2 (DB-unreachable in build worker) — established pattern, not a defect.

```yaml
branch: wave-72-account-deletion
deps_added: []
env_vars_added: []
schema_skipped: false
migrations: [apps/api/drizzle/migrations/0027_cold_mikhail_rasputin.sql]
orm_models_changed: [apps/api/src/db/schema/users.ts]
backfill_ran: false
deviations: [local-migration-apply-deferred-to-C-2-db-unreachable]
```
