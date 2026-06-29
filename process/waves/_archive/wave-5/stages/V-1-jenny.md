# V-1 Semantic-Spec Verification (jenny) — Wave 5 (M1 hardening, multi-spec, 6 blocks)

**Verdict: APPROVE**

Reviewer: jenny (independent spec-vs-deployed-behavior verification)
Date: 2026-06-29
Deployed surface probed: api `https://api-production-b93e.up.railway.app` (live), CI `.github/workflows/ci.yml` + GitHub branch-protection API + last main CI run.
Method: live curl probes, GitHub API (`gh`), source inspection of the shipped tree, DB query of the claimed bundle. Findings keyed to the 6-spec contract in task `839af17f` and the C-2 fix-forward record.

---

## Summary

All 6 spec blocks MATCH deployed behavior or are an intentional, correctly-scoped deferral. The two C-block fix-forwards (version.ts boot-crash, rate-limit trust-proxy) are RESOLVED and verified in the live shipped state. The bundle is faithful to the founder "harden-then-core" ruling — the 6 = the named priorities (rate-limit + avatar) plus the four folded-in ops/CI items; the Resend-domain item is correctly excluded. No M2 pull-forward, no gold-plating. One LOW process note (admin-bypass on branch protection) for L/retro, not a spec failure.

---

## Per-block findings

### 839af17f — Auth rate limiting — MATCHES
- **AC ">10 rapid /auth/signin → 429":** Live burst of 14 `POST /auth/signin` (wrong-creds payload) returned 429 (window already tripped; C-2 canonical capture recorded the clean 200×10→429×8 boundary). The 429 fires. PASS.
- **/health unthrottled:** Live burst of 14 `GET /health` → 200×14. Non-auth route is exempt. PASS.
- **In-memory store (no Redis):** Confirmed against architecture mandate — `_library.md` L423 "No Redis at MVP … distributed rate-limit store" is an explicit H2 deferral; L113 specifies `@nestjs/throttler`, 10 req/min on auth. The single-pod in-memory store matches the locked architecture, not drift. T-8 records the in-memory single-pod limitation as `severity: info` (Gemini-flagged documented deferral).
- **429 body leaks no internal state / under-limit unaffected:** consistent with throttler default 429 + the auth path remaining functional below the limit (signin reached the WRONG_CREDENTIALS path before the window tripped). PASS.
- Verdict: MATCHES. This is the wave's headline security win and is live.

### e38c306e — API version alignment — MATCHES
- **AC "/health reports real package version, not hardcoded fallback":** Live `GET /health` → `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`. `apps/api/package.json` version = `0.0.1`. Reported version equals the package version, not a stale `0.1.0` literal. PASS.
- **Edge "env unset → still reports package version":** `apps/api/src/version.ts` `readPackageVersion()` prefers `npm_package_version`, then try-both-paths `require()` of `package.json` (`../../` prod, `../` src), fallback literal corrected to `0.0.1`. The env-unset prod path now resolves the real package.json. PASS.
- Verdict: MATCHES. (See fix-forward #1 below — this block caused the boot-crash and is now resolved.)

### 84e09891 — Avatar storage completion — DEFERRED (correctly), code MATCHES
- **Server-side 2MB enforcement (wave-4 AC7 fold-in):** Built. `apps/api/src/files/files.service.ts` enforces `AVATAR_MAX_SIZE_BYTES = 2*1024*1024` at confirm time via `HeadObjectCommand` → `PayloadTooLargeException` (413) before persisting `avatar_url`. Doc-commented as the confirm-HEAD strategy (presigned-PUT cannot carry ContentLengthRange — correct AWS reasoning). Code MATCHES.
- **Presign 503 graceful (creds pending):** Built. `presignAvatarUpload` and `checkAvatarSize` throw `ServiceUnavailableException({code:'STORAGE_NOT_CONFIGURED'})` when AWS_* env unset; unit-tested in `files.service.spec.ts`. Live unauthenticated `POST /profile/avatar/presign` returned 401 (auth guard fires first — expected, no session); the 503-on-missing-creds path is code+unit confirmed, not live-exercisable without a session AND with creds still pending. 
- **Full live upload end-to-end:** DEFERRED — reason: founder-provided Railway Bucket creds (AWS_ACCESS_KEY_ID/SECRET/ENDPOINT/REGION/BUCKET) still pending (per spec AC1, T-8, C-2, and the N-1 reconciliation log). This is the spec's own `edge-cases: "creds pending → presign 503 graceful (until provided)"`. Legitimate intentional-deferral, surfaced to founder on the wave-5 checklist.
- Verdict: DEFERRED-with-reason (founder creds). Code-built portion (2MB + 503) MATCHES.

### a7667fb7 — Clear CI Node-20 deprecation warnings — MATCHES
- **AC "CI actions bumped, deprecation annotations gone, all 5 jobs green":** `ci.yml` uses `actions/checkout@v5`, `actions/setup-node@v5`, `pnpm/action-setup@v4`, `gitleaks/gitleaks-action@v2` — current major versions, clearing the Node-20 runtime deprecation. The 5 pre-existing jobs (lint, typecheck, test, build, secret-scan) are all `success` on the latest main run (`6b4ed53`). PASS.
- Note: the "5 jobs" wording predates the e2e addition (c51589cd); the workflow now has 6 jobs and all 6 are green. No conflict — a7667fb7 is about the pre-existing 5.
- Verdict: MATCHES.

### 478e9d43 — Branch protection on main — MATCHES
- **AC "main requires PR + passing CI; direct pushes blocked":** GitHub branch-protection API on `main` is active: `required_status_checks.strict=true` with contexts `[lint, typecheck, test, build, secret-scan]` (the 5 CI jobs); `required_pull_request_reviews` present; `allow_force_pushes=false`, `allow_deletions=false`. The eed4c3c direct-push gap is closed for non-admins. PASS.
- **Edge "brain's own PR→merge flow still works":** PR#12/#13/#14 merged successfully under the rule (squash). PASS — rule does not lock the bot's PR flow.
- Note: e2e is intentionally NOT in required contexts (gated/non-blocking), consistent with c51589cd's "gated/non-flaky" edge case.
- Verdict: MATCHES.

### c51589cd — CI browser E2E job (Playwright chromium) — MATCHES
- **AC "job installs chromium + runs minimal Playwright E2E asserting login page renders":** `ci.yml` `e2e` job runs `playwright install --with-deps chromium` then `playwright test` against `E2E_BASE_URL=https://web-production-bce1a8.up.railway.app` (the live web). Real browser smoke. PASS.
- **Smoke spec:** `apps/web/e2e/smoke.spec.ts` asserts `/` landing renders (get-started link visible) and `/login` renders (email + password inputs + sign-in button visible). Shallow-by-design public-route checks — matches "minimal smoke." PASS.
- **Live evidence:** `e2e` job = `success` on the latest main CI run (`6b4ed53`, run 28375129870). Targets the live URL, 15-min timeout, non-blocking (not a required check) → gated/non-flaky. PASS.
- Verdict: MATCHES.

---

## C-block fix-forwards (verify shipped state) — both RESOLVED

1. **version.ts boot-crash (e38c306e):** `require('../package.json')` resolved wrong from compiled `dist/src/version.js` → `MODULE_NOT_FOUND` → api CRASHED, all routes down. Fixed PR#13 (`5364a32`) via try-both-paths. **Verified live:** api boots clean, `/health` 200 with version `0.0.1`. RESOLVED.
2. **rate-limit not firing (839af17f):** Railway 2-hop XFF keyed the throttler on the varying LB IP, so the limit never tripped on attempt-1. Fixed PR#14 (`cd0ec69`+`6b4ed53`) keying on XFF[0] = real client IP. **Verified live:** burst → 429; `/health` unthrottled. RESOLVED.

(Note: CI run `5364a32` shows `failure` in history — that is the in-flight fix commit superseded by the later green `cd0ec69`/`6b4ed53` runs; latest main is green.)

---

## Bundle faithfulness — MATCHES the founder ruling

- The 6 claimed tasks = the two named hardening priorities (839af17f rate-limit, 84e09891 avatar) + the four explicitly folded-in follow-ups (e38c306e version, a7667fb7 node-20 CI, 478e9d43 branch-protection, c51589cd browser-E2E) named in the 2026-06-29 "hardening-then-core" decision log. Exact match.
- **Resend-domain (a1299e88) correctly EXCLUDED:** DB shows it `status='todo'`, NOT in the wave-5 bundle — a pure founder-DNS item, non-blocking, still tracked under M1. Correct.
- **No M2 pull-forward:** nothing servers/channels/messaging in scope. **No gold-plating:** rate-limit stays in-memory (no speculative Redis), avatar uses the minimal confirm-HEAD check (no presigned-POST rebuild), e2e smoke is shallow-by-design. Clean.

---

## Distinguishing spec-drift / spec-gap / intentional-deferral

- **spec-drift:** none found.
- **spec-gap:** none found.
- **intentional-deferral (legitimate):** (a) avatar full live upload — founder Railway Bucket creds pending (84e09891 edge-case, code shipped); (b) Resend-domain a1299e88 — founder DNS, out of bundle; (c) distributed/Redis rate-limit store — H2 per `_library.md` L423.

## Findings table

| Severity | Block | Finding |
|---|---|---|
| Info | 839af17f | In-memory single-pod rate-limit store; distributed store H2 (L423) — matches locked architecture, not drift |
| Info | 84e09891 | Live avatar upload deferred pending founder bucket creds; 2MB(413)+presign(503) code-built + unit-tested |
| Low (process) | 478e9d43 | `enforce_admins=false` — admin/bot can bypass the rule (6b4ed53 reached main via admin direct-push). Spec AC met for non-admins; flag for L/retro re: enforce_admins or stricter merge discipline. Not a spec failure. |

---

## Recommendation

**APPROVE.** All 6 spec blocks are satisfied against live deployed behavior or are correctly-scoped intentional deferrals; both C-block fix-forwards are resolved and verified in the shipped state; the bundle faithfully matches the founder ruling with no drift, gap, pull-forward, or gold-plating.

- Carry forward to V-2/V-3 triage as informational only: the `enforce_admins=false` process note (Low) — orchestrator/CI to decide enforce_admins for L/retro; does not block this wave.
- Avatar live-upload re-verify is gated on founder creds (already surfaced) — not a V-block blocker.
- Suggest @karen at L-block to confirm the realistic "M1 engineering complete" claim (only Resend-DNS remains) before the M2 pivot.
