# Wave 38 — P-2 Spec (pointer)

**Canonical spec:** `tasks.description` of task `84e09891-2b2f-4b68-b6e2-e2ef340ef32a` (YAML head + `---` + prose).
**wave_type:** single-spec · **claimed_task_ids:** [84e09891] · **design_gap_flag:** false

## Acceptance criteria (copy for P-3/P-4 reference)
1. With creds set, `POST /profile/avatar/presign` → 200 {uploadUrl,key} (not 503).
2. PUT ≤2MB image to uploadUrl → 2xx; `POST /profile/avatar/confirm {key}` → 200, persists `users.avatar_url`.
3. **CRUX:** persisted `avatar_url` fetched anonymously → **200 + image bytes** (403 = FAIL → resolve via public-read policy on `avatars/` OR presigned-GET migration).
4. Confirm of >2MB object → 413 AVATAR_TOO_LARGE, no persist (verify shipped `checkAvatarSize` live).
5. Non-allowlist content-type at presign → 400.
6. Attachment activation-verify (bounded): channel attachment presign→PUT→confirm→send → DTO url = presigned GET 200; >10MB → 413 at send.
7. Deployed api: no storage endpoint returns 503 after creds live.

**Key risk:** avatars use static-public-URL render; codebase documents Railway/Tigris buckets are PRIVATE → likely 403. P-3 picks fix (public-read policy vs presigned-GET migration).
