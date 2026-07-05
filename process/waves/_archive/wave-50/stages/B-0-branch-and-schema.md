# B-0 — Branch & schema (wave-50)

- **Branch:** wave-50-timer-durations (from main).
- **Tasks claimed:** f4b3659e + ffd98a36 → in_progress (UPDATE 2).
- **Env/deps:** none added.
- **Schema (node-specialist a752b9b0, commit 43a7c2b):** `server_study_timer` += `work_duration_ms` int NOT NULL DEFAULT 1500000, `break_duration_ms` int NOT NULL DEFAULT 300000 (additive; UNIQUE(server_id) + anchors-only model preserved; defaults backfill 25/5 → backward-compatible).
- **Migration:** `apps/api/drizzle/migrations/0023_lush_iron_fist.sql` (2 pure ADD COLUMN, no drops/rewrites; journal idx 23; 0022 prior head). tsc + biome clean. **NOT applied locally** — deferred to C-2 (local dev DB unreachable; Railway public proxy at C-2, per wave-49 0022 pattern).

```yaml
branch: wave-50-timer-durations
deps_added: []
env_vars_added: []
schema_skipped: false
migrations: [apps/api/drizzle/migrations/0023_lush_iron_fist.sql]
orm_models_changed: [apps/api/src/db/schema/study-timer.ts]
backfill_ran: false   # column defaults backfill; local apply deferred to C-2
deviations: []
```
