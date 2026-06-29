# Wave 4 — B-block review artifacts
**Block:** B · **Wave topic:** Profile customization (username+avatar presign+accent) · **Gate:** B-6 · **Status:** in-progress
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | in-progress | branch+deps+migration(users 3 cols)+storage provisioning |
| B-1 | pending | | shared profile contract extend + AvatarPresign Zod |
| B-2 | pending | | profile API extend + username uniqueness + FilesModule presign |
| B-3 | pending | | settings-profile wiring (username/avatar/accent) + shell render |
| B-4..B-6 | pending | | |
## Context
- claimed [2a655960]. Storage: attempt Railway Buckets via project token; else founder S3 creds (rule 6). B-advisories: AWS_ENDPOINT_URL+AWS_REGION=auto exact; username 3-20 [a-z0-9_] (spec wins vs mockup counter); accent_color naming. Orphan-object cleanup deferred.
