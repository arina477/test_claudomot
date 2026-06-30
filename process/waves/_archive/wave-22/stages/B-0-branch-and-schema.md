# Wave 22 — B-0 Branch & schema
```yaml
branch: wave-22-m5-assignments
deps_added: []
schema_changed: true
migrations: [0010_typical_harry_osborn.sql]
backfill_ran: false   # new tables
```
- Migration 0010 (additive, 3 new tables): assignments (server_id uuid FK→servers CASCADE, organizer_id text FK→users, title, description, due_date NOT NULL, is_deleted, created/updated_at; idx server_id,due_date) + assignment_status (assignment_id uuid FK→assignments CASCADE, user_id text FK→users, state, UNIQUE(assignment_id,user_id); idx) + assignment_attachments (assignment_id uuid FK→assignments CASCADE, object_key/filename/content_type/size_bytes; idx). organizer_id/user_id = text (matches users.id text PK). Journal idx 10. typecheck+biome clean. Not applied. Claimed: 01fcefb8 + 916ecff7 + a5f25f9b.
