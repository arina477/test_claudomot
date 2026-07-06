# B-0 — wave-67
Branch wave-67-server-discovery. 3 tasks claimed → in_progress. No env, no deps. SCHEMA ran (database-administrator, a1a4530b):
- apps/api/src/db/schema/servers.ts += is_public(boolean NOT NULL DEFAULT false)/description(text null)/topic(text null) + btree index servers_is_public_idx.
- Migration GENERATED: apps/api/drizzle/migrations/0024_cold_baron_zemo.sql (ALTER TABLE ADD COLUMN x3 + CREATE INDEX; no destructive, no backfill). Journal + snapshot committed. Commit 7cdf2c0. api typecheck clean.
- DEVIATION (accepted): local migration apply SKIPPED — no local Postgres in this env (5432/5433 refused, DATABASE_URL unset). Migration applies at C-2 deploy (head-ci-cd sequences migrations) + in CI test DB. SQL verified by inspection. B-2/B-5 DB-dependent tests are CI-gated (C-1).
```yaml
branch: wave-67-server-discovery
deps_added: []
env_vars_added: []
schema_skipped: false
migrations: [apps/api/drizzle/migrations/0024_cold_baron_zemo.sql]
orm_models_changed: [apps/api/src/db/schema/servers.ts]
backfill_ran: false
deviations: ["local migration apply skipped — no local DB; applies at C-2/CI"]
```
