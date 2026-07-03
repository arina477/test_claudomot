# Wave 41 — B-0 Branch & schema
- Branch: wave-41-educator-moderation (pushed). Tasks 6cf06f99 + 6ddddc2d claimed → in_progress.
- Schema: roles +moderate_members (boolean NOT NULL default false); server_members +muted_until (timestamptz NULL). Migration 0018_daffy_miracleman.sql (drizzle-kit generate; applies at C-2). Additive nullable/defaulted — no backfill.
```yaml
branch: wave-41-educator-moderation
schema_skipped: false
migrations: [apps/api/drizzle/migrations/0018_daffy_miracleman.sql]
orm_models_changed: [apps/api/src/db/schema/servers.ts]
deviations: []
```
