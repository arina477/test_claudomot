# Wave 19 — B-0 Branch & schema
```yaml
branch: wave-19-m3-attachments
deps_added: []   # @aws-sdk/client-s3 + s3-request-presigner already installed
schema_changed: true
migrations: [0009_narrow_carnage.sql]
backfill_ran: false   # new table
```
- Migration 0009 (additive new table): attachments (id, message_id uuid NOT NULL FK→messages CASCADE [row-at-send, never orphaned], uploader_id text FK→users, channel_id uuid FK→channels CASCADE, object_key, filename, content_type, size_bytes, created_at) + index (message_id). Journal idx 9. typecheck+biome clean. Not applied. Claimed: 20db0c16 + 7c39c9e3 + cf1ae370.
