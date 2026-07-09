# P-4 Karen — Phase-2 Claim Verification (wave-83)

**Wave:** API security-headers hardening (config-only) — helmet SAFE flat headers + X-Powered-By removal + generic NestJS ThrottlerGuard 429 body.
**Spec:** task `875b97f4` description. **Plan:** `process/waves/wave-83/stages/P-3-plan.md`.
**Method:** spot-check via Read/Grep on the actual repo. No fixes attempted (read-only reality check).

---

## VERDICT: APPROVE

All 6 load-bearing claim clusters VERIFIED against the real codebase. Zero WRONG, zero UNVERIFIED. The plan and spec are factually grounded, correctly scoped (config-only, no schema/UI), and the SDK checklist is a real concern, not decoration.

---

## Per-claim results

### Claim 1 — main.ts owns credentialed-CORS + SuperTokens middleware order — **VERIFIED**
`apps/api/src/main.ts`:
- **CORS with credentials:** `app.enableCors({ origin, credentials: true, allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()] })` — `apps/api/src/main.ts:111-115`.
- **SuperTokens wiring:** `initSuperTokens(new UsersService(), new EmailService())` at bootstrap (`main.ts:88`); `supertokens.getAllCORSHeaders()` merged into the CORS allowlist (`main.ts:114`); SuperTokensMiddleware registered in `AuthModule.configure()` (referenced in the header comment, `main.ts:15-18`), plus `SupertokensExceptionFilter` global filter (`main.ts:119`).
- **Middleware order is real and ordering-sensitive:** `trust proxy` → `enableCors` → global filter → `app.use(authRateLimiter)` → `app.listen()` (`main.ts:105-135`). The plan's claim that helmet must register without clobbering this credentialed-CORS/SuperTokens order is grounded, and the routing of B-3 to `supertokens-integration` (owns this exact order) is justified. **VERIFIED.**

### Claim 2 — no helmet/HSTS currently wired (x-powered-by/HSTS premise holds) — **VERIFIED**
`grep -niE "helmet|hsts|strict-transport" apps/api/src/main.ts` → **no matches** (empty). No helmet middleware, no HSTS, no `disable('x-powered-by')` anywhere in main.ts. Express default `x-powered-by: Express` therefore ships, and no HSTS is emitted — the spec's live-verified premise holds in source. **VERIFIED.**

### Claim 3 — ThrottlerGuard 429 is the real leak target; Express authRateLimiter is separate + already-generic — **VERIFIED**
- **NestJS Throttler present + wired:** `@nestjs/throttler` dep at `apps/api/package.json` (`^6.5.0`); `ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }])` at `apps/api/src/app.module.ts:33-38`; `ThrottlerGuard` registered as `APP_GUARD` at `app.module.ts:66-69`.
- **429 currently leaks "ThrottlerException":** installed `@nestjs/throttler@6.5.0` defines `throttlerMessage = "ThrottlerException: Too Many Requests"` (`throttler.exception.d.ts:2` / `throttler.exception.js:5`); the guard sets `this.errorMessage = throttlerMessage` (`throttler.guard.js:29`) and throws it via `throwThrottlingException` → `getErrorMessage` (`throttler.guard.js:152-161`). The class name is literally in the default 429 message. **Leak confirmed.**
- **Express authRateLimiter is SEPARATE + already generic:** `authRateLimiter` in `main.ts:31-67` is a hand-rolled Express middleware for `/auth/*` only, emitting `{ statusCode: 429, error: 'Too Many Requests', message: 'Rate limit exceeded — maximum 10 auth requests per minute.' }` (`main.ts:56-60`) — no framework class name. It is a distinct path from the NestJS guard (the code comments at `main.ts:14-18` explain SuperTokens `/auth/*` never reaches the Nest guard). Plan's "leave it untouched, no double-fix" is correct. **VERIFIED.**

### Claim 4 — helmet is NOT already a dependency (dep-add claim) — **VERIFIED**
`grep -niE helmet apps/api/package.json` → **absent**. `grep -cniE helmet pnpm-lock.yaml` → **0**. helmet is genuinely not installed; the plan's B-0 dep-add is a real addition, not a no-op. **VERIFIED.**

### Claim 5 — SDK checklist (helmet v7→v8 option renames, e.g. xFrameOptions) is a real concern — **VERIFIED**
Real helmet API concern, not decorative. helmet v8 did rename/restructure options (v7 `frameguard` → v8 `xFrameOptions`, and the `hsts` / `crossOriginResourcePolicy` / `crossOriginEmbedderPolicy` / `referrerPolicy` / `noSniff` / `hidePoweredBy` / `contentSecurityPolicy` option keys the spec uses are the v8 names). The plan pins `^8` and correctly makes B-3 verify option names against the *installed* major before coding — the exact right discipline for a config-only header wave where an omitted `false` silently re-enables a default (CSP/CORP/COEP) that breaks cross-origin. **VERIFIED as a genuine checklist item.**

### Claim 6 — Antipatterns: config-only accurate; no claimed-but-fake / decorative / wrong-layer — **VERIFIED (clean)**
- **"config-only, no schema, no UI" accurate:** plan touches only `apps/api/src/main.ts`, `apps/api/src/app.module.ts` (+ optional `apps/api/src/common/throttler-*.ts`), and one integration spec. No migration, no Drizzle/Dexie file, no `apps/web` frontend file, no `.env`/data-model change. `## Data model: None`, `design_gap_flag: false`. Matches reality. **Accurate.**
- **No wrong-layer fix:** the leak is at the app layer (helmet middleware + Nest guard), and the fix is at the app layer. The rejected alternative (Railway-edge HSTS) is correctly rejected precisely because it is the wrong layer (can't fix x-powered-by or the 429 body). **Right layer.**
- **No claimed-but-fake:** every premise the plan leans on (CORS+credentials, SuperTokens order, absent helmet, present Throttler, leaking 429, separate generic authRateLimiter) is present in source as claimed.
- **PRODUCT-PRINCIPLES §Antipatterns cross-checks:** Rule 1 (verify seed absent/present claims) — the "no helmet wired" absent-claim and "Throttler leaks class name" present-claim both hold. Rule 2 (named entity is the real boundary) — ThrottlerGuard is the actual 429 leak source, not a wrong target. Rule 6 (no live no-op security toggle) — helmet ships headers that are actually enforced (HSTS honored over https at the Railway edge), not a decorative toggle. **Clean.**

---

## Notes / non-blocking observations (not verdict-affecting)
- The plan's ordering claim ("register helmet early, preserve CORS + preflight") is a correct *risk flag*, but is only provable at build/test time — the load-bearing T-8 deployed cross-origin proof (AC8) is the right place to catch a regression. Spec correctly marks AC8 as load-bearing and requires deployed-state proof, not just a green unit test. Good.
- Two viable throttler-override shapes are named (guard subclass overriding `throwThrottlingException`/`errorMessage`, or a global exception filter). The installed v6.5.0 exposes both `errorMessage` (overridable field, `throttler.guard.d.ts:11`) and `throwThrottlingException`/`getErrorMessage` (`throttler.guard.d.ts:25-26`) — so both cited approaches are real. B-3 picks the smaller footprint. Non-blocking.

**Bottom line:** APPROVE — spec + plan are load-bearing-accurate against the real repo. No claimed-but-fake, decorative, or wrong-layer content found.
