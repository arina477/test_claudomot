# Wave 37 — B-0 Branch & schema
Branch wave-37-notifications (pushed). claimed_task_ids [0b33df33, f3f52d9a, edac03e0] → in_progress. No deps, no env.
Schema (postgres-pro): notifications table + migration 0015_majestic_scarlet_spider.sql. user_id ON DELETE CASCADE (deliberate); message/channel/server_id SET NULL (preserve notif when source gone); assignment_id CASCADE. Index (user_id,read_at,created_at DESC). Partial-unique (user_id,message_id) WHERE type='mention' (dedup). pg-harness truncate += notifications (+assignment_reminder/assignments explicit). Typecheck+Biome clean. NOT applied locally (no local DB — applies at C-2). No deviation.
```yaml
branch: wave-37-notifications
schema_skipped: false
migrations: [apps/api/drizzle/migrations/0015_majestic_scarlet_spider.sql]
deps_added: []
```
