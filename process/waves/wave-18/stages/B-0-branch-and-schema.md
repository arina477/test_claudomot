# Wave 18 — B-0 Branch & schema
```yaml
branch: wave-18-m3-threads
deps_added: []
env_vars_added: []
schema_changed: true
migrations: [0008_dazzling_bushwacker.sql]
backfill_ran: false   # additive — defaults cover existing rows
```
- Migration 0008 (additive, 3-part): messages += thread_parent_id uuid NULL self-FK REFERENCES messages(id), reply_count int NOT NULL DEFAULT 0, last_reply_at timestamptz NULL; index messages_thread_parent_created_idx (thread_parent_id, created_at). Journal idx 8. Self-FK via AnyPgColumn. typecheck+biome clean. Not applied (CI/prod run migrations). Claimed: 497c2ae6 + 6c008dd6 + 0b728319.
