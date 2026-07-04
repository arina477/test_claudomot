# Wave 43 — B-0 Branch & schema

- **Branch:** wave-43-class-scheduling (from main, incl. P/D artifacts). Pushed.
- **Tasks claimed:** 535bdb8c, cdf81427, 1216146e → in_progress.
- **Env/deps:** none added.
- **Schema (sql-pro):** NEW `apps/api/src/db/schema/scheduling.ts` scheduled_sessions (id/server_id FK→servers cascade/organizer_id text FK→users/title/description NULL/starts_at/ends_at/recurrence default 'none'/recurrence_until NULL/is_deleted/timestamps; INDEX(server_id,starts_at)). Mirrors assignments conventions; app-enforced recurrence enum (no CHECK). Barrel export added.
- **Migration:** apps/api/drizzle/migrations/0020_graceful_cerebro.sql (+ meta). Not applied remote (C-2).
- **Typecheck:** api clean. Deviations: none.

```yaml
branch: wave-43-class-scheduling
deps_added: []
env_vars_added: []
schema_skipped: false
migrations: [apps/api/drizzle/migrations/0020_graceful_cerebro.sql]
orm_models_changed: [apps/api/src/db/schema/scheduling.ts, apps/api/src/db/schema/index.ts]
backfill_ran: false
deviations: []
```
