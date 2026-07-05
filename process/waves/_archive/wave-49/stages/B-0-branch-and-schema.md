# Wave 49 — B-0 Branch & schema
- Claim: 4 tasks in_progress. Branch: wave-49-study-timer.
- Schema (node-specialist): apps/api/src/db/schema/study-timer.ts server_study_timer (ANCHORS ONLY: id, server_id UNIQUE FK->servers cascade, phase, run_state, started_at, ends_at, paused_remaining_ms, updated_by FK->users, created/updated_at) + index export + migration 0022_unusual_clint_barton.sql. NO decrementing counter (binding model). Durations hardcoded in B-2 service (not columns; custom deferred to f4b3659e). tsc+biome clean. Committed a7ceff5. Local apply deferred to C-2 (no dev DB).
```yaml
branch: wave-49-study-timer
schema_skipped: false
migrations: [apps/api/drizzle/migrations/0022_unusual_clint_barton.sql]
orm_models_changed: [apps/api/src/db/schema/study-timer.ts, apps/api/src/db/schema/index.ts]
local_apply: deferred-to-c2
