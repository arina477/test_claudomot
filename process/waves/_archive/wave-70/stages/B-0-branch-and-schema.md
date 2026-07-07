# B-0 — Branch & schema (wave-70)
Branch: wave-70-user-block (pushed). Deps: none. Env: none.
Schema (RAN): postgres-pro. Created apps/api/src/db/schema/user-blocks.ts (user_blocks: id uuid pk, blocker_id/blocked_id text FK users.id, created_at timestamptz, UNIQUE(blocker_id,blocked_id), index user_blocks_blocker_idx; NO server_id — cross-server). Migration 0026_quick_thunderbird.sql (db:generate; table + 2 FKs + UNIQUE + index; no CREATE TYPE). index.ts export. tsc + biome clean. No deviation.
```yaml
branch: wave-70-user-block
deps_added: []
env_vars_added: []
schema_skipped: false
migrations: [apps/api/drizzle/migrations/0026_quick_thunderbird.sql]
orm_models_changed: [apps/api/src/db/schema/user-blocks.ts, apps/api/src/db/schema/index.ts]
backfill_ran: false
deviations: []
```
