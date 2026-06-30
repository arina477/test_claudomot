# Wave 15 — B-0 Branch & schema
```yaml
branch: wave-15-m3-mentions
deps_added: []
env_vars_added: []
schema_skipped: false
migrations: [apps/api/drizzle/migrations/0007_massive_chamber.sql]
orm_models_changed: [apps/api/src/db/schema/messages.ts]
backfill_ran: false
deviations: ["message_mentions index emitted ASC not DESC (drizzle DSL has no .desc(); Postgres backward-scans at negligible cost) — accepted"]
```
- Tasks 3d238446/cd585f04/c3f3f62a → in_progress. message_mentions (uuid pk, message_id FK→messages ON DELETE CASCADE, mentioned_user_id FK→users, created_at, UNIQUE(message_id,mentioned_user_id), idx(mentioned_user_id,created_at)) — mirrors message_reactions. drizzle-kit generated (per P-4 carry). No destructive ops. No new dep.
