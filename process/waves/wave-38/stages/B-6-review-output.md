# B-6 Review (Phase 2, post head-builder-APPROVED) — wave-38 avatar storage

Reviewer: code-reviewer (production-bug pass)
Scope: `git diff $(git merge-base origin/main HEAD)` on `wave-38-avatar-storage`
Focus: CRITICAL/HIGH runtime bugs a typecheck + 524 green unit tests would miss —
contract drift, null access, missing error handling, security posture.

## Verdict summary

No hard CRITICAL. Happy path is correct: route registers, URL builds correctly when
`PUBLIC_API_URL` is set, missing-env is handled with 503, key is parameterized (no SQLi),
and `users.id` is `text` so an arbitrary `:userId` returns a clean 404 (no uuid-cast 500).

One HIGH (acknowledged/accepted as T-8 follow-up, but the code comment misrepresents the
mitigation as active). Two MEDIUM (existing-avatar regression + zero cache/TTL margin).
Remainder LOW/informational.

---

## Findings

### [HIGH] users.controller.ts:47 — public avatar endpoint is BOTH unauthenticated AND `@SkipThrottle()`; the class doc claims app-wide throttle covers it, but it does not
Confidence: 0.9

`GET /users/:userId/avatar` has no session guard (by design — cross-origin `<img>`) and
carries `@SkipThrottle()`. The global `ThrottlerGuard` (`app.module.ts:26`, 10 req/60s) is
therefore fully bypassed on this route. Every hit runs a DB `SELECT` (`findAvatarKey`) plus
an HMAC presign. Unauthenticated + unthrottled + DB-per-hit is an availability/cost vector
on a single-pod MVP.

The class docstring (`users.controller.ts:29-32`) states: *"Rate limiting is coarse
(app-wide ThrottlerGuard, 10 req/60s) — enough for MVP."* This is **false** for this route —
`@SkipThrottle()` removes exactly that guard. The described mitigation is not in effect, which
hides the real exposure from a future reader.

Note this is called out in the task as an accepted T-8 follow-up, so it is not a *new* blocker;
but the misleading comment should not ship as-is.

Fix: replace `@SkipThrottle()` with a per-route `@Throttle({ default: { limit: 120, ttl: 60_000 } })`
(high enough that a roster page of avatars from one IP doesn't 429, low enough to cap abuse),
and correct the docstring to match reality.

### [MEDIUM] 0017_dapper_squadron_sinister.sql:1 — additive column with no backfill leaves every pre-wave-38 avatar permanently 404 after deploy
Confidence: 0.85

Migration adds `avatar_key` nullable with no backfill. Existing users who previously uploaded
an avatar have `avatar_url` = old raw S3 URL and `avatar_key = NULL`. Post-deploy,
`GET /users/:id/avatar` → `findAvatarKey` returns null → 404 for all of them until they
re-upload. The old raw URLs already 403'd (the reason for this wave), so it is not a *new*
regression, but it is a silent, permanent breakage of all existing avatars.

The old raw S3 URL embeds the key (`.../<bucket>/avatars/<userId>/<uuid>.<ext>`), so a backfill
is feasible. Recommend either a follow-up backfill migration (derive `avatar_key` from the
suffix of `avatar_url`) or an explicit product acceptance that existing avatars require re-upload.

### [MEDIUM] files.service.ts:56 + users.controller.ts / files.controller.ts comments — `Cache-Control: max-age=300` EQUALS presign TTL (300s), but both comments assert max-age must be strictly LESS than the TTL; zero margin → intermittent 403 at the boundary
Confidence: 0.75

`AVATAR_GET_EXPIRY_SECONDS = 300` and the redirect sets `Cache-Control: public, max-age=300`.
The service comment (files.service.ts:54-55) says *"The presign TTL must exceed max-age"* and
the controller comment (users.controller.ts) says max-age is *"intentionally < presign TTL"* —
but 300 is not `< 300`, it is `=`. With aligned expiries there is no safety margin: a browser or
public/CDN cache that follows the cached 302 near the window edge (or under clock skew) hits an
already-expired presigned URL → S3 403 → intermittently broken avatar around the 5-minute mark.

Fix: honor the stated invariant — set `max-age` below the TTL (e.g. 240) or raise
`AVATAR_GET_EXPIRY_SECONDS` (e.g. 600).

### [LOW] files.controller.ts:120 — `PUBLIC_API_URL` trailing slash not normalized → double slash in the stable URL
Confidence: 0.8

`` `${publicApiUrl}/users/${userId}/avatar?v=${vHash}` `` — if `PUBLIC_API_URL` is set with a
trailing `/` (e.g. `https://api.studyhall.com/`), the persisted `avatar_url` becomes
`https://api.studyhall.com//users/...`. `buildPublicUrl` strips trailing slashes elsewhere in
this service; the confirm handler does not. Most routers normalize `//`, but it is fragile and
gets baked into stored `avatar_url` for every confirm. Fix: `publicApiUrl.replace(/\/$/, '')`.

### [LOW] users.controller.ts:71 / files.service.ts:resolveAvatarUrl — `getSignedUrl` rejection propagates as 500, not the graceful 503 the null-path uses
Confidence: 0.6

`resolveAvatarUrl` returns `null` (→ 503) only for missing-config. If `getSignedUrl` itself
throws, it propagates uncaught from `redirectToAvatar` → 500. Presigning is local HMAC (rarely
throws), so low likelihood, but it is inconsistent with the deliberate 503 storage-unconfigured
path. Consider try/catch → 503.

### [LOW] users.controller.ts — `profile_visibility` not honored on the public avatar endpoint
Confidence: 0.55

A user with restricted `profile_visibility` still has their avatar served and enumerable
(302 vs 404 reveals avatar presence) via this unauthenticated route. This matches the
"avatars are public content" design stated in the docstring, so informational only — flagging
so the privacy tradeoff is a conscious decision, not an oversight.

### [LOW] files.controller.ts:105-120 — orphaned S3 object when `PUBLIC_API_URL` is unset at confirm
Confidence: 0.6

`checkAvatarSize` (which validates an already-uploaded object) runs before the `PUBLIC_API_URL`
guard. If the env is unset, the object is in the bucket but confirm 503s before persist → orphan.
Minor; consider validating `PUBLIC_API_URL` before `checkAvatarSize`, or a lifecycle/cleanup rule.

### [LOW / ops] .env.example:6 — ships a real-looking default `PUBLIC_API_URL=https://api.example.com`
Confidence: 0.5

A real-looking value (vs empty like `SENTRY_DSN=`) risks copy-paste into a live env, producing
avatar URLs pointing at `api.example.com`. Prefer leaving it empty (the confirm guard already
503s on unset) or an obvious placeholder token.

---

## Items explicitly checked and found CORRECT
- No `setGlobalPrefix` / versioning in `main.ts` → built `/users/:id/avatar` matches the real route.
- Missing-`PUBLIC_API_URL` handled: 503 `STORAGE_NOT_CONFIGURED`; no `undefined/users/...` interpolation.
- `users.id` is `text` PK → arbitrary `:userId` yields a clean 404, not a Postgres uuid-cast 500.
- `findAvatarKey` / `setAvatar` use parameterized Drizzle `eq(users.id, id)` — no SQL injection.
- `findAvatarKey` null-safe: `result[0]?.avatar_key ?? null`.
- Confirm returns the same stable `avatarUrl` it persists via `setAvatar(id, key, url)` — no confirm/DTO drift.
- `checkAvatarSize` (2MB) still runs before the DB write (test asserts order).
- forwardRef circular dep (Files↔Users) is symmetric; `FilesService` and `UsersService` both exported.
- `@Header` cache-control applies to the 302 only; thrown 404/503 are not cached (desirable).
- Migration 0017 is additive nullable — safe, no lock-heavy rewrite.
- CORS/`<img>` is fine — plain `<img>` is not subject to CORS; 302→presigned S3 loads normally.
