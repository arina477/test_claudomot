# V-1 Source-Claim Verification (Karen) — wave-38 avatar storage go-live

Scope: verify the wave's load-bearing claims are TRUE against the DEPLOYED production
state and the merge commit `8b590e1`. NOT spec conformance (jenny's lane).

Verdict: **APPROVE** (5 claims fully TRUE; 1 reasoning overclaim flagged as a Medium
finding — it does not falsify the deployed state, and the real gap it exposes is
legitimately deferred to T-5, head-tester's lane).

---

## Claim-by-claim findings

### Claim 1 — Files exist on merge commit `8b590e1` — TRUE
All five paths present on `8b590e1`, and each carries the claimed symbol:
- `apps/api/src/users/users.controller.ts:60` — `@Get(':userId/avatar')` public redirect endpoint (NEW; `@Controller('users')` at :34).
- `apps/api/src/files/files.service.ts:222` — `resolveAvatarUrl(key): Promise<string|null>` exported (presigned GET via `GetObjectCommand` + `getSignedUrl`, :233-234), mirroring `resolveAttachmentUrl` at :390.
- `apps/api/src/users/users.service.ts:110` — `setAvatar(id, avatarKey, avatarUrl)` persists `avatar_key` + `avatar_url` (:113); `findAvatarKey(id)` at :123.
- `apps/api/src/db/schema/users.ts:13` — `avatar_key: text('avatar_key')` (and `avatar_url` at :12).
- `apps/api/drizzle/migrations/0017_dapper_squadron_sinister.sql` — exists, contents `ALTER TABLE "users" ADD COLUMN "avatar_key" text;`.

### Claim 2 — Route registered / live — TRUE
- `GET https://api-production-b93e.up.railway.app/users/00000000-0000-0000-0000-000000000000/avatar` → **HTTP 404**, body `{"message":"User has no avatar","error":"Not Found","statusCode":404}`. This is a route-present 404 (bespoke body), not a route-missing 404 and not a 503.
- `GET .../health` → **HTTP 200**, body `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`.

### Claim 3 — Migration applied to prod — TRUE (stronger evidence than the deliverable cites)
- Migration file SQL re-confirmed: `ALTER TABLE "users" ADD COLUMN "avatar_key" text;` (additive, nullable).
- Independent proof it is applied: the live 404 is produced by `findAvatarKey()` (`users.controller.ts:67` → `users.service.ts:123-129`), which runs `SELECT avatar_key FROM users WHERE id=$1`. A query against a missing column throws 500, not 404. The 404 therefore confirms the `avatar_key` column exists in the deployed DB. Matches the C-2 post-check (`is_nullable=YES`).

### Claim 4 — Env vars set on `api` + the "404-not-503 proves storage-live" logic — PARTIAL / OVERCLAIM (Medium)
Env-var **names** are asserted set in C-2 (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY /
AWS_ENDPOINT_URL / STORAGE_BUCKET_NAME / PUBLIC_API_URL). These are not independently
verifiable from outside Railway, and I found no evidence they are unset.

**However, the deploy-time proof logic is false.** C-2:62 claims: "404 (not 503) →
Tigris creds are live... A 503 here would have meant creds didn't take." Reading the
controller (`users.controller.ts:67-77`):

```
const avatarKey = await this.usersService.findAvatarKey(userId);
if (!avatarKey) { throw new NotFoundException('User has no avatar'); }   // 404 here
const presignedUrl = await this.filesService.resolveAvatarUrl(avatarKey); // storage call
if (!presignedUrl) { throw new ServiceUnavailableException({code:'STORAGE_NOT_CONFIGURED'}); } // 503 only here
```

For the zero-UUID user (no avatar), `findAvatarKey` returns null and the **404 is thrown
BEFORE any storage code runs**. `resolveAvatarUrl` — the only place that can emit 503
(`files.service.ts:222-231`, returns null when client/bucket env is absent) — is never
reached. So a 503 is **structurally unreachable** at this endpoint for a no-avatar user
**regardless of whether creds are set**. The 404-not-503 smoke therefore proves the route
shipped + migration applied, but it does **NOT** prove Tigris creds are live.

Mitigating context (why this is Medium, not a REJECT): C-2:63 itself explicitly defers
the genuine storage proof — "full authenticated presign→PUT→confirm→anonymous-GET-200
round-trip is deferred to T-block (T-5 E2E)". The honest deferral is documented; only the
inline interpretation text overclaims. Since no row has a non-null `avatar_key` (no backfill;
`confirm` was previously unreachable per P-3), there is likely no deployed user with an
avatar to exercise the 302→200 path — so **storage-live remains unproven in the deployed
state and hinges entirely on T-5 actually performing the round-trip.**

### Claim 5 — Deploy serves the merge commit — TRUE
The live bespoke 404 body `{"message":"User has no avatar",...}` exists only in the merged
controller (`users.controller.ts:69`). Its presence on the live endpoint proves the new
revision (`f625a163`, commit `5d616f7` containing merge `8b590e1`) is the one serving
traffic — no stale-revision race. `/health` 200 corroborates the service is up.

### Claim 6 — 2MB cap "already-shipped verify-only" — TRUE (genuinely pre-existed, not faked)
- `checkAvatarSize` was introduced in **wave-5**, commit `0017331` ("feat(hardening):
  rate-limit + avatar-2MB..."), long before wave-38.
- It is present on the merge's first parent (`8b590e1^1`) at `files.service.ts:165` with
  `AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024` (:56) — i.e. wave-38 did not introduce or
  re-fake it. HeadObject → ContentLength comparison → throws `AVATAR_TOO_LARGE` (413).
  The "no code change, verify-only" claim in P-3 is accurate.

---

## Antipattern catalog
- **False / decorative proof (Medium)** — Claim 4: the C-2 "404-not-503 = storage-live"
  assertion is a false proof; the 503 branch is unreachable at that endpoint for a
  no-avatar user. Structural claims it accidentally proves (route + migration) are real;
  the storage-live conclusion is not earned.
- **Deferred-but-documented (acceptable)** — the real anonymous-GET-200 round trip is
  explicitly deferred to T-5. Documented, not hidden — acceptable, but it means the
  wave's crux (avatars render anonymously) is NOT verified anywhere I checked.
- No claimed-but-fake files, no decorative tests, no undocumented deferrals found.

## Recommendation to downstream gates
- **@head-tester (T-5)**: this is now load-bearing. T-5 MUST perform a real
  presign→PUT→confirm→**anonymous GET → 302 → 200** round trip against the deployed api
  with live Tigris creds. That is the ONLY evidence that proves storage creds are live;
  C-2 does not. If T-5 stubs, mocks, or skips the anonymous-GET-200, storage-live is
  unproven for the whole wave.
- **@head-ci-cd**: correct the C-2 interpretation text — 404-not-503 proves route+migration,
  not creds. Future storage-live smokes should hit a seeded-avatar user (exercising the
  302 path) or assert env presence directly.

Verdict: **APPROVE**
