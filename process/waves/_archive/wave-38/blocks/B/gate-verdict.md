# Wave 38 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, agentId head-builder-w38-b6)
**Reviewed against:** process/waves/wave-38/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale
The implementation faithfully executes the P-3-approved presigned-GET redirect migration and the crux render AC. The confirm→persist→redirect chain is correct and correctly ordered: `POST /profile/avatar/confirm` runs `checkAvatarSize` (413 before any DB write, so oversized avatars never persist — AC4 satisfied), scopes the client key to the requesting user (`key.startsWith('avatars/${userId}/')`, IDOR-safe), then persists both `avatar_key` and the stable app URL `${PUBLIC_API_URL}/users/:id/avatar?v=<8-char SHA-256(key)>` in a single UPDATE via `setAvatar`. The new public `GET /users/:userId/avatar` looks up the key (null-safe `?? null` → 404), resolves a fresh presigned GET via `resolveAvatarUrl` (a faithful mirror of the proven `resolveAttachmentUrl`; null → 503), and 302-redirects with `Cache-Control: public, max-age=300` (correctly < the 300s presign TTL so browsers never cache a stale target). `<img src={avatarUrl}>` follows the 302 transparently → zero frontend and zero DTO-consumer change, which is why B-1 (no-op) and B-3 (skip) are legitimate. On the security posture: I verified the app has NO global auth guard — only `ThrottlerGuard` is `APP_GUARD`, and auth is per-route opt-in via `@UseGuards(SessionNoVerifyGuard)`. So the new unauthenticated endpoint is a deliberate, architecturally-consistent public route (public content, server-derived key, no client-controlled path, 404 for no-avatar) — NOT an accidentally-exposed door; and `presign`/`confirm` correctly retain their session guard. Migration 0017 is a committed, additive-nullable `ALTER TABLE users ADD COLUMN avatar_key text` with journal + snapshot, applied via `drizzle-kit migrate` at C-2 (no startup auto-migrate) — no schema-drift or data-loss risk, and the no-backfill claim is sound (storage was never wired, so no row ever held a non-null avatar_url). The three deviations are all sound: forwardRef is the canonical fix for the genuine Files↔Users cycle; `@Redirect()` with a dynamic `{url, statusCode}` return keeps NestJS in the response path (better than raw `@Res`); `@SkipThrottle()` is functionally necessary because a profile page renders many avatars and would instantly exhaust the 10-req/60s global limit. No idempotency/pagination/realtime/offline-outbox surface applies to this backend-only avatar wave, and no scale infrastructure was added. Two minor, non-blocking notes recorded below; neither affects correctness or the crux AC. The remaining crux verification (live 302→200 anonymous fetch against the real bucket) is correctly a C-2/T-block job — the implementation is contract-faithful and production-sound.

## Non-blocking notes (accepted-debt / follow-up — NOT rework)
- **N1 (doc inaccuracy, cosmetic):** `users.controller.ts` lines 30–32 state the route is "coarse (app-wide ThrottlerGuard, 10 req/60s)" but `@SkipThrottle()` on the same handler fully disables that throttle. The *choice* to skip is correct (avatars must not be throttled); only the comment is self-contradictory. Cheap same-branch fix optional; not a gate blocker.
- **N2 (semantic overload):** `confirm` reuses `code: STORAGE_NOT_CONFIGURED` for a missing `PUBLIC_API_URL` (distinct from missing S3 creds). The message field differentiates and C-2 sets the var, so it won't fire in prod. Acceptable.
- **T-8 follow-up (already scoped in P-3 + P-4):** per-IP anti-enumeration / rate-limit on the public avatar endpoint. Low risk (userIds are non-sequential SuperTokens IDs; per-hit cost is one indexed PK lookup + a local presign signing op — no S3 round-trip; content is public by design). Legitimate T-8 work, not a B-6 blocker.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---
## Phase 2 — /review (code-reviewer, autonomous-equivalent) + fix-up
- No CRITICAL. 1 HIGH (@SkipThrottle bypass + misleading docstring on public GET /users/:id/avatar) → FIXED (commit 1780b75: @Throttle 120/60s per IP + accurate docstring). This also resolves the T-8 anti-enumeration follow-up.
- 1 MEDIUM (Cache-Control max-age==presign TTL boundary) → FIXED (max-age 240 < TTL 300).
- 1 MEDIUM (no avatar_key backfill) → ACCEPTED: zero avatar_url rows (storage never wired). LOWs documented in B-6-review-output.md.
- Re-verify post-fix: typecheck exit 0, 524 unit tests pass.
## B-6 verdict: APPROVE → B-block EXIT → C-block
