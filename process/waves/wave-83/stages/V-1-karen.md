# V-1 Source-Claim Verification — karen — wave-83

**Wave:** API security-headers hardening (helmet safe-headers + 5-header cross-origin fence + X-Powered-By removal + generic ThrottlerGuard 429).
**Scope of this review:** truth-of-claims only (not spec conformance — that is jenny). Are the wave's LOAD-BEARING claims TRUE in the merged (`main` @ `d87b2211`) + deployed (`api-production-b93e`, deployment `2ac4fd16`) state?
**Method:** Read/Grep on the merged `main` tree + live `curl` against the deployed API.

## VERDICT: APPROVE

All 7 load-bearing claims VERIFIED. Code is real, on `main`, tracked (not just working-tree), and the deployed binary serves the exact header profile claimed. Tests are real (import the shipped export) with no `.skip`/`.only`. No claimed-but-fake, decorative-test, or wrong-layer findings.

---

## Per-claim status

### Claim 1 — `security-headers.ts` exists + full helmet config — VERIFIED
`apps/api/src/common/security-headers.ts` exists on `main` (git-tracked), exports `securityHeaders()`.
- HSTS `{ maxAge: 15_552_000, includeSubDomains: true, preload: false }` — `security-headers.ts:45` (15_552_000 = 180d = the claimed 15552000).
- `noSniff: true` — `:47`
- `xFrameOptions: { action: 'deny' }` — `:49`
- `referrerPolicy: { policy: 'strict-origin-when-cross-origin' }` — `:51`
- The five fences all `false`: `contentSecurityPolicy` `:55`, `crossOriginResourcePolicy` `:56`, `crossOriginEmbedderPolicy` `:57`, `crossOriginOpenerPolicy` `:58`, `originAgentCluster` `:59`.
- X-Powered-By removal left implicit (helmet default) — `:60` comment; proven absent live (Claim 6).

### Claim 2 — `generic-throttler.guard.ts` exists + wired via APP_GUARD — VERIFIED
`apps/api/src/common/generic-throttler.guard.ts` exists on `main`.
- `GenericThrottlerGuard extends ThrottlerGuard` — `generic-throttler.guard.ts:26`.
- Overrides `throwThrottlingException` → throws `HttpException({ statusCode: 429, message: 'Too Many Requests' }, 429)` — `:27-35`. No `"ThrottlerException"` string in the body.
- Wired via `APP_GUARD` → `useClass: GenericThrottlerGuard` in `apps/api/src/app.module.ts:69-72`, imported `:10`. This is the ONLY `APP_GUARD` throttler provider — it replaces the stock `ThrottlerGuard` (the stock class is never provided as a guard; `ThrottlerModule.forRoot` at `:34-39` supplies config only). Replacement confirmed.

### Claim 3 — `main.ts` registers `securityHeaders()` without clobbering credentialed CORS — VERIFIED
- `app.use(securityHeaders())` — `apps/api/src/main.ts:119`, placed BEFORE `app.enableCors(...)` (`:129-133`). helmet only sets flat response headers + strips X-Powered-By; it never writes `Access-Control-Allow-*` and does not answer OPTIONS preflight, and the CSP/CORP/COEP/COOP set that would restrict cross-origin is fenced off — so it cannot clobber the credentialed CORS. Ordering is the helmet-recommended position. Live curl confirms both helmet headers AND `access-control-allow-credentials: true` + `access-control-allow-origin` coexist (Claim 6).
- Express `authRateLimiter` still present + untouched: defined `:31-66`, mounted `app.use(authRateLimiter)` `:146` (after CORS, per the SuperTokens-middleware ordering comment). Sliding-window 10 req/60s on `/auth/*`, keyed on XFF[0]. Intact.

### Claim 4 — helmet is a real dep @ ^8.2.0 — VERIFIED
- `apps/api/package.json:36` → `"helmet": "^8.2.0"`.
- `pnpm-lock.yaml:3384` (`helmet@8.2.0:` importer entry) + `:8605` (`helmet@8.2.0: {}` resolved package). Real resolved dependency, not a phantom. Module docstring also self-documents v8.2.0 option-name verification.

### Claim 5 — tests real, not decorative — VERIFIED
`apps/api/test/integration/security-headers.spec.ts` exists on `main`.
- Imports the REAL shipped exports: `securityHeaders` from `../../src/common/security-headers` (`:33`) and `GenericThrottlerGuard` from `../../src/common/generic-throttler.guard` (`:32`) — NOT a re-declared copy. It mirrors the production bootstrap ordering (helmet then CORS, `:76-81`).
- **12 `it(` cases** (grep count = 12): 4 safe-header-present (HSTS/nosniff/X-Frame/Referrer, `:97-121`), 1 X-Powered-By absent (`:127`), **5 fenced-header absence assertions** — CSP `:136`, CORP `:141`, COEP `:146`, COOP `:151`, Origin-Agent-Cluster `:156` — 1 generic-429 (`:165`, asserts no `"ThrottlerException"`, 429 status, Retry-After present, generic body), 1 CORS-preflight-survival (`:187`).
- No `.skip` / `.only` anywhere (grep = NONE).

### Claim 6 — deploy serves the headers LIVE — VERIFIED
`curl -sS -D - -o /dev/null https://api-production-b93e.up.railway.app/health` → `HTTP/2 200`, `server: railway-hikari`:
- PRESENT: `strict-transport-security: max-age=15552000; includeSubDomains` (no preload), `x-frame-options: DENY`, `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`.
- ABSENT: `x-powered-by` (not in response).
- ABSENT (the load-bearing fence): `content-security-policy`, `cross-origin-resource-policy`, `cross-origin-embedder-policy`, `cross-origin-opener-policy`, `origin-agent-cluster` — none present.
- CORS survived: `access-control-allow-credentials: true` + `access-control-allow-origin: https://web-production-bce1a8.up.railway.app` present alongside helmet headers.
This proves the deployed binary carries the fix, matching `main`. (The deployed HEAD file-history tip for these files is `594338b6`, the B-6 COOP/OAC fence fix — the exact commit whose fence Claim 6 confirms live.)

### Claim 7 — antipatterns — NONE FOUND
- No claimed-but-fake: every claimed file exists, is git-tracked on `main`, and the live curl matches.
- No decorative test: spec imports the real production exports (not a copy), asserts both presence AND the 5 absence cases + generic-429 behaviorally over real HTTP.
- No wrong-layer: header-emission + throttler override are exactly at the Express/Nest middleware+guard layer where they belong.
- "config-only, no schema/UI" is ACCURATE: no schema/migration/`.tsx`/UI references in the new files; wave-83's `apps/api` changes are confined to `security-headers.ts` + its spec (git history). No DB or frontend surface touched.

**Note (non-blocking, not a defect):** live response also carries helmet's other safe on-by-default headers (`x-dns-prefetch-control: off`, `x-download-options: noopen`, `x-permitted-cross-domain-policies: none`, `x-xss-protection: 0`). These are outside the spec's named set, are harmless flat headers, and are NOT among the 5 fenced cross-origin headers — no impact on any claim.
