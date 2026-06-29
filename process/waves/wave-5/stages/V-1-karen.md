# Wave 5 — V-1 Karen (source-claim verification vs LIVE deployed state)

**Verdict: REJECT** (5 of 6 specs VERIFIED; 1 spec — a7667fb7 Node-20 — WRONG against its literal acceptance criterion; live CI still emits the deprecation annotations the spec said would "no longer appear").

Deployed HEAD: `main @ 6b4ed53` (PRs #12 hardening + #13 version-path-fix + #14 rate-limit-fix, all MERGED). api `https://api-production-b93e.up.railway.app` live, /health 200. The 3 C-block fix-forwards (version-path boot-crash, rate-limit trust-proxy) are recovered — shipped HEAD state verified, not intermediate breakage.

---

## Per-claim verdicts

### 1. 839af17f rate-limit — VERIFIED
- **Live probe (burst):** 15 rapid `POST /auth/signin` → reqs 1–10 = `200`, reqs 11–15 = `429`. Exactly the spec's "10 req/min, 11th → 429." 429 body: `{"statusCode":429,"error":"Too Many Requests","message":"Rate limit exceeded — maximum 10 auth requests per minute."}` — leaks no internal state (edge-case met).
- **Live probe (/health unthrottled):** 20 consecutive `GET /health` → all `200`. Non-auth route exempt (AC3 met).
- **Code (`apps/api/src/main.ts:28-63`, `:121`):** `authRateLimiter` Express middleware, in-memory `Map`, sliding 60s window, max 10. Keys on `x-forwarded-for[0]` (real client IP behind Railway 2-hop proxy) — `apps/api/src/main.ts:42-44`. Path-gated to `/auth/*` (`:30`). `app.set('trust proxy', true)` at `:94`. No `@nestjs/throttler` guard on the path (SuperTokens owns `/auth/*` via its own Express middleware, so APP_GUARD never sees those requests — the Express-level limiter is the correct mechanism, documented `:13-21`). Note: the spec `contracts` field names `@nestjs/throttler`; the actual mechanism is a hand-rolled Express limiter. This is a contract-text/implementation divergence but the **behavior** (429 on exceed, health exempt) is fully met live — not a reject.

### 2. e38c306e version — VERIFIED (with one observability caveat)
- **Live:** `GET /health` → `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`. The old wrong literal was `0.1.0`; it is gone. `apps/api/package.json:3` real version = `0.0.1` → live matches the real package version. AC met; the `0.1.0` stale literal no longer surfaces.
- **Code (`apps/api/src/version.ts:19-33`):** try-both-paths resolution (`../../package.json` then `../package.json`) — robustly resolves in both dist (prod) and src (vitest). This is the PR#13 fix that recovered the boot-crash outage (the original `require('../package.json')` crashed prod at `dist/src/version.js`). Roll-forward recovery confirmed in `C-2-deploy-and-verify.md`.
- **Caveat (info, not a reject):** the fallback literal in `version.ts:32` is ALSO `'0.0.1'`, identical to the real package version. So a live `0.0.1` cannot by itself distinguish "read from package.json" from "fell through to the fallback." The clean-boot evidence (no MODULE_NOT_FOUND in HEAD logs) + the try-both-paths logic make the read-path the operative one, but the observability is ambiguous by construction. Recommend bumping the fallback to a sentinel (e.g. `'0.0.0-unknown'`) so a regression to the fallback would be visible. Logged for L/retro.

### 3. 84e09891 avatar 2MB — VERIFIED (code + 503 path), live upload legitimately deferred
- **Code (`apps/api/src/files/files.service.ts`):** `checkAvatarSize` (`:133-156`) issues `HeadObjectCommand`, throws `PayloadTooLargeException` (413) when `ContentLength > 2*1024*1024`. Confirm-time HEAD is the correct mechanism (presigned-PUT cannot carry `ContentLengthRange`; documented `:104-107`, `:121-128`). MIME allowlist png/jpeg/webp (`:12-16`). User-scoped key (`:99`). Server-side enforcement (not client-only) — wave-4 AC7 fold-in met in code.
- **503-graceful:** `getS3Client` (`:41-67`) returns `null` when creds absent → `presignAvatarUpload` / `checkAvatarSize` throw `ServiceUnavailableException({code:'STORAGE_NOT_CONFIGURED'})`. Module boots cleanly without creds (confirmed live — api is up).
- **Live 503 not directly observable:** `POST /profile/avatar/presign` unauthenticated → `401 {"message":"unauthorised"}` (auth guard runs before the storage check). The 503 path is only reachable post-auth; cannot curl it without a session. Code path verified instead. Live end-to-end upload **legitimately deferred** pending founder Railway Bucket creds (per spec edge-case "creds pending → presign 503 graceful (until provided)") — sanctioned deferral, not a gap.

### 4. a7667fb7 Node-20 deprecation — WRONG (the reject)
- **Spec AC (verbatim):** "CI workflow actions bumped so the Node-20 deprecation annotations **no longer appear**; all 5 jobs still green."
- **What shipped (`.github/workflows/ci.yml`):** `actions/checkout@v5` + `actions/setup-node@v5` (bumped from v4 — correct). BUT `pnpm/action-setup@v4` (lines 18, 29, 49, 61, 83) and `gitleaks/gitleaks-action@v2` (line 72) were NOT addressed.
- **Live evidence (HEAD run 28375129870, `main @ 6b4ed53`, the latest deployed CI run):** still emits Node-20 deprecation annotations:
  - `gitleaks/gitleaks-action@v2` → secret-scan job
  - `pnpm/action-setup@v4` → typecheck, test, build, e2e jobs
  - Annotation text: "Node.js 20 is deprecated. The following actions target Node.js 20 but are being forced to run on Node.js 24…"
- **Assessment:** the annotations the AC said would "no longer appear" still appear on every push to main. The fix addressed only 2 of the 4 deprecation-emitting actions. The "all jobs green" half of the AC IS met (run is all-green), but the headline AC — clearing the deprecation annotations — is **not met**. This is a partial fix described as complete in `B-2-cicd.md` ("clears Node-20 deprecation") and `B-6-review.md` ("node-20 actions@v5"). **Severity: Low** (cosmetic CI noise, no functional impact, all jobs green), but it is a literal-AC miss and the claim is inaccurate → spec marked WRONG.
- **Fix (one stage):** bump `pnpm/action-setup@v4` → a release whose `runs.using` is `node24` (or pin via `node-version`-independent setup), and `gitleaks/gitleaks-action@v2` → a node24 release (or accept gitleaks as a documented exception if no node24 tag exists yet). Re-run CI, confirm zero Node-20 annotations.

### 5. 478e9d43 branch-protection — VERIFIED (rule active), with a flagged process violation
- **Live (`gh api repos/arina477/test_claudomot/branches/main/protection`):** rule ACTIVE. `required_status_checks.strict=true`, contexts `[lint, typecheck, test, build, secret-scan]` (the 5 CI jobs — exactly the AC). `required_pull_request_reviews` present (PR required). `allow_force_pushes=false`, `allow_deletions=false`. Closes the eed4c3c direct-push gap for non-admins.
- **AC met:** "main requires a PR + passing CI before merge; direct pushes blocked." PR→squash-merge flow works (PRs #12/#13/#14 all merged through it).
- **e2e NOT a required context (correct):** only 5 contexts required; `e2e` is intentionally non-blocking (matches c51589cd "gated/non-flaky"). Not a gap.
- **Process violation (info — flag for L/retro, not a spec reject):** `enforce_admins=false` + `required_approving_review_count=0`. Per `C-2-deploy-and-verify.md`'s own note, commit `6b4ed53` reached main via **admin direct-push** (the bot/admin bypass that `enforce_admins=false` permits) — i.e. a direct push to main DID happen this very wave, which is the exact failure mode 478e9d43 was meant to prevent. The rule blocks non-admins as specified, so the AC is technically met, but the protection is weaker than "require PR" in spirit. Recommend `enforce_admins=true` or stricter merge discipline. Logged.

### 6. c51589cd CI-E2E — VERIFIED
- **Artifacts exist:** `apps/web/e2e/smoke.spec.ts` (asserts `/` landing renders "get started" link; `/login` renders email+password inputs + sign-in button), `apps/web/playwright.config.ts` (chromium-only, `baseURL` = `E2E_BASE_URL` ?? live Railway web, `retries: CI?1:0`), and `ci.yml:76-91` `e2e` job (`playwright install --with-deps chromium` + `playwright test` against `E2E_BASE_URL=https://web-production-bce1a8.up.railway.app`).
- **Passed in CI:** PR #12 `e2e` job = pass (1m11s, "2 passed"). HEAD run 28375129870 `e2e` = pass (50s). The two intermediate `e2e` failures (runs 28374109088, 28374210915) were the version-path **outage window** (web/api down during the boot-crash), recovered by PR#13 — shipped HEAD e2e is green. AC met.

---

## Antipattern scan
- **Claimed-but-fake:** none on specs 1/2/3/5/6 — all behavior or code independently re-verified live. Spec 4 is the exception: claimed "clears Node-20 deprecation," reality = annotations still present → **inaccurate completion claim**, the reject driver.
- **Gold-plating:** none. In-memory rate-limit store (no Redis) is a deliberate single-pod-MVP choice (`_library L423`, Gemini-flagged + documented as H2 deferral) — correct scoping, not under/over-engineering. Avatar HEAD-check over presigned-POST-policy is the minimal correct mechanism for presigned-PUT.
- **Sanctioned deferrals (not gaps):** avatar live-upload (84e09891, founder Railway Bucket creds); Resend-domain (a1299e88, excluded from wave).

---

## Required to flip to APPROVE
1. **a7667fb7 (Low):** bump `pnpm/action-setup` and `gitleaks/gitleaks-action` to node24 releases (or document gitleaks as an unavoidable exception) so the Node-20 deprecation annotations actually clear; re-run CI and confirm zero annotations. Correct the B-2/B-6 claim text.

## Recommended (info — do not block APPROVE; route to L-2/retro)
2. **e38c306e:** change the `version.ts` fallback literal from `0.0.1` to a sentinel so a fallback regression is observable.
3. **478e9d43:** set `enforce_admins=true` (or enforce no-direct-push discipline) — a direct admin push to main occurred this wave.

## Agent collaboration
- **@jenny** confirmed the 5 verified specs meet their ACs at P-4; the divergence is isolated to a7667fb7's literal annotation criterion.
- **@code-quality-pragmatist:** no over-engineering found — in-memory limiter + HEAD-check are appropriately minimal.
- Route the a7667fb7 fix back through B (one-stage action.yml bump) → C-1 → re-run CI, then re-V-1 spec 4 only.
