# Wave 19 — P-2 Spec (pointer)
**Source of truth:** tasks.description of seed 20db0c16. wave_type multi-spec (3 blocks). design_gap TRUE.
- 20db0c16 data plane: presign (content-type allowlist) → client PUT → confirm (HeadObject ≤10MB→413) → attachment row (message_id FK, uploader, key, filename, content_type, size); message send associates 0-N; DTO attachments[]; channel-derived authz (rule 4, non-member 403); /messaging fan-out. Migration 0009 (attachments table). REUSE FilesService + Railway Buckets, no new SDK/cred.
- 7c39c9e3 composer: picker + preview (image thumb/file chip) + client ≤10MB/type guard + upload-then-send + progress/retry.
- cf1ae370 render: inline image preview (click-to-full) + file chip (icon+name+size); 0-N; tombstone-safe.
**Scope:** ≤10MB, image+file, allowlist; video/CDN/transcode/virus-scan/PDF-render OUT.
