# Wave 83 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn)
**Reviewed against:** process/waves/wave-83/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale

Independent review of the four production files + spec passes on every load-bearing axis. The CORS-preservation risk — the whole point of the wave — holds: helmet is registered via `app.use(securityHeaders())` at main.ts:119, AFTER `app.set('trust proxy', true)` and strictly BEFORE `app.enableCors()` (main.ts:129). helmet only SETS flat response headers and REMOVES X-Powered-By; it never writes/strips `Access-Control-Allow-*` and does not short-circuit OPTIONS. I confirmed this at runtime, not just by reading: the vitest integration run's express:router debug trace shows `helmetMiddleware` then `corsMiddleware` firing in that order on GET, on the 429-tripping `/limited`, AND on the `OPTIONS /ping` preflight — and the preflight test asserts `access-control-allow-origin === WEB_ORIGIN` and `access-control-allow-credentials === 'true'` survive with a 200/204. The credentialed cross-origin flow is genuinely intact.

The fence is real and the option names are correct for the installed helmet@8.2.0 (verified against the package's own `index.d.cts`): `contentSecurityPolicy:false`, `crossOriginResourcePolicy:false`, `crossOriginEmbedderPolicy:false` are all set, and three dedicated tests assert those three headers are ABSENT (not merely that others are present) — so a silently-dropped `false` would fail CI. HSTS is `max-age=15552000` + `includeSubDomains` + no `preload` (asserted incl. the negative `not.toContain('preload')`); `noSniff:true`, `xFrameOptions:{action:'deny'}` (correct v8 key — v8 renamed frameguard→xFrameOptions, and both are valid but xFrameOptions is the canonical one), `referrerPolicy` strict, X-Powered-By removed — each asserted. The GenericThrottlerGuard override is minimal (only `throwThrottlingException`), emits `{statusCode:429, message:'Too Many Requests'}` with no class name, and preserves 429 + Retry-After — I confirmed in `@nestjs/throttler` v6 dist that the base `handleRequest` sets the `Retry-After` header (line 121) BEFORE calling `throwThrottlingException` (line 123), so the override cannot drop it; the test asserts `retry-after` truthy + no `"ThrottlerException"` substring anywhere in the body. Test honesty is high: the spec imports the REAL exported `securityHeaders()` and `GenericThrottlerGuard` (no re-declared copy), is DB-free (fetch over a real `app.listen(0)`, no pg-harness), proves RESOLUTION via actual response headers rather than "helmet was called", and carries no `.skip`/`.only`.

AC9 (Express `authRateLimiter` untouched) holds: the wave diff (94f17489..HEAD) adds only the helmet import + registration block to main.ts — the authRateLimiter middleware, its store, and its 429 body are byte-for-byte unchanged. The WS/auth flow is safe: helmet registers on the Express HTTP pipeline via `app.use()`, while Socket.IO gateways are handled by the separately-wired `IoAdapter` on WS upgrade, which helmet never sees — consistent with the spec's `p4-enrichment-ws` note.

Gates run green, executed myself (not trusted from the report): security-headers spec 10/10 pass via the integration config; full api unit suite 820/820 across 47 files (no regression); `tsc --noEmit` clean; `pnpm biome ci apps packages` clean (404 files, no fixes). BUILD-PRINCIPLES conformant — config-only, shared exported config asserted against, minimal-footprint override, no gold-plating. No critical or high findings.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
