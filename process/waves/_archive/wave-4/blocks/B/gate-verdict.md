# Wave 4 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn)
**Reviewed against:** process/waves/wave-4/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)

## Verdict
APPROVED

## Rationale
The profile-customization B-block satisfies every acceptance criterion in the embedded spec contract (task 2a655960) and clears all B-6 stage-exit checks. The Zod contract in `packages/shared/src/profile.ts` is the single source — `ProfileResponseSchema`, `UpdateProfileSchema` (username `^[a-z0-9_]{3,20}$`, lowercased), and `AvatarPresignResponseSchema` — and both the NestJS controllers and the React `auth/api.ts` client consume it without drift. The Drizzle migration `0001_graceful_vin_gonzales.sql` is generated, committed, and journaled (not auto-run at startup); it adds the three nullable columns plus a case-insensitive `UNIQUE INDEX users_username_lower_idx ON (lower(username))` that exactly matches `db/schema/users.ts`. Username uniqueness is correct end-to-end: the DB index is the guarantee, `UsersService.updateProfile` catches PG `23505` and throws `ConflictException` (→ 409, never a 500), and the value is lowercased on write. The avatar upload surface is sound on its load-bearing axes: the S3 key is **server-minted and user-scoped** (`avatars/${userId}/${randomUUID()}.${ext}` — no client-supplied path, so no traversal and no cross-user overwrite), `userId` is taken from the session only, the content-type allowlist (png/jpeg/webp) is enforced server-side on the presign, and the TTL is short (300s). Graceful no-creds is verified by reading `files.service.ts`: the S3 client is lazy (returns `null` + WARN when `AWS_*`/bucket env are absent, never throws at construction), presign returns a handled `503 STORAGE_NOT_CONFIGURED`, and the API boots without storage env — the wave-3 dynamic-import-throw crash pattern is absent (all imports static; `FilesModule` + `ProfileModule` wired into `app.module.ts`). The frontend flow is correct: presign → PUT (no `credentials:include` to storage) → confirm sets `avatar_url`; 503/400/409 are all handled without crashing; accent renders via the `--user-accent` CSS var and the avatar falls back to initials in the shell. Scope is held — no resize/transcode/CDN gold-plating; username and accent persist independently of the bucket. B-5 reports 63/63 green with typecheck/build/lint clean; live smoke is correctly deferred until the founder provisions the bucket. One non-blocking hardening gap (confirm-endpoint key prefix) is logged below for Phase 2 same-branch fix.

## Phase 2 carry-forward (non-blocking — medium)

- **Confirm-endpoint key scope:** `FilesController.confirm` validates only `key.startsWith('avatars/')`, not `avatars/${callerUserId}/`. This is NOT the firing-grade client-controlled-key / IDOR defect: the key is server-minted at presign, cross-user **overwrite is impossible** (each caller writes only their own `users` row; the storage object is written by the user-scoped presign+PUT), and the only residual action is a user pointing their own public `avatar_url` at another user's already-public avatar image — zero confidentiality or integrity escalation beyond what is public by design. The spec's stated harm ("path traversal / overwrite of another user's object") is fully prevented by the server-controlled presign key. Recommend a cheap defense-in-depth tightening in the Phase 2 `/review` fix-up: change the confirm guard to `key.startsWith(\`avatars/${userId}/\`)` so a user can only confirm their own minted key. Cheap, same-branch, no contract change. Route to backend-developer.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
