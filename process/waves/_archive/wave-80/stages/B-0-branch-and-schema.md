# Wave 80 — B-0 Branch & schema
- **Branch:** wave-80-presence-toggle. Task 3038a4bc → in_progress (UPDATE 1).
- **Env/deps:** none.
- **Schema (postgres-pro, commit c3f7bc6):** `0033_wave80_users_show_presence.sql` — `ALTER TABLE users ADD COLUMN show_presence boolean DEFAULT true NOT NULL`. Model: users.ts +show_presence alongside profile_visibility/who_can_dm. DEFAULT true = no backfill (existing users stay visible).
- **Local apply deferred** (no local pg server — known env limit); tsc clean. **Prod: db:migrate at C-2 before api deploy.**

```yaml
branch: wave-80-presence-toggle
deps_added: []
env_vars_added: []
schema_skipped: false
migrations: [apps/api/drizzle/migrations/0033_wave80_users_show_presence.sql]
orm_models_changed: [apps/api/src/db/schema/users.ts]
backfill_ran: false
deviations: ["local migrate deferred (no local pg); prod at C-2", "descriptive migration name matching wave-79 convention"]
```
