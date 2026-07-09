# Wave 83 — P-3 Plan

## Approach

### Architecture deltas
- **apps/api/src/main.ts (bootstrap) — ADD global `helmet` middleware.** Emits SAFE flat headers only: HSTS (maxAge 15552000, includeSubDomains, preload:false), X-Content-Type-Options nosniff, X-Frame-Options DENY, Referrer-Policy. **Explicitly disable** `contentSecurityPolicy`, `crossOriginResourcePolicy`, `crossOriginEmbedderPolicy` (helmet defaults for these break the cross-origin credentialed web→api fetch + SuperTokens CORS). Remove `X-Powered-By` (helmet.hidePoweredBy is on by default, OR `httpAdapter.getInstance().disable('x-powered-by')`).
  - **Ordering (LOAD-BEARING):** helmet must register WITHOUT clobbering the existing credentialed-CORS + SuperTokens middleware already wired in main.ts. Register helmet early (before routes) but confirm the CORS `Access-Control-Allow-*` + credentials config is preserved and preflight (OPTIONS) still succeeds. This is why B-3 is owned by supertokens-integration (knows the existing main.ts middleware order + SuperTokens CORS), not a generic backend edit.
  - **Alternative considered:** platform-level HSTS at the Railway edge. REJECTED — not portable/in-repo/testable, and it would NOT fix x-powered-by or the 429 body (still needs an app change), so a single app-level `helmet` dep is strictly simpler + covers all flat headers at once.
- **apps/api/src/app.module.ts (+ possibly a small custom guard/filter) — OVERRIDE the NestJS ThrottlerGuard 429 response** to a generic body ({statusCode:429, message:'Too Many Requests'}) that does NOT leak "ThrottlerException"; keep 429 status + Retry-After. **Alternative:** a global exception filter catching ThrottlerException. Either works; prefer the smaller footprint (a custom ThrottlerGuard subclass overriding `throwThrottlingException`, or the guard's `errorMessage`/response hook per installed @nestjs/throttler version).
  - **Leave the Express `authRateLimiter` path untouched** (already emits a generic body — AC9; do NOT double-fix).
- **Failure-domain impact:** global middleware; the ONLY real risk is breaking cross-origin CORS/CORP. Mitigated by fencing CSP/CORP/COEP off + the load-bearing T-8 deployed cross-origin proof.

### Data model
None (config-only wave).

### API contracts
No endpoint path/method/request/response-schema change. Deltas: (a) new global response headers on ALL responses; (b) ThrottlerGuard 429 envelope body becomes generic (still 429 + Retry-After).

### New deps
- **helmet** (npm), pin `^8` (current stable; B-3 confirms installed version's option names: `hsts`, `contentSecurityPolicy`, `crossOriginResourcePolicy`, `crossOriginEmbedderPolicy`, `xFrameOptions`, `referrerPolicy`, `noSniff`, `hidePoweredBy`). MIT license (compatible). Runtime cost negligible (sets response headers). Battle-tested Express/Nest middleware.
- No new dep for the throttler fix (`@nestjs/throttler` already present).

### SDK pre-build checklist (helmet)
B-3 MUST verify against the INSTALLED helmet version before coding: exact option names + that disabling CSP/CORP/COEP is done via `false` (not omission — some defaults are on). helmet v7→v8 renamed a couple options (e.g. `xFrameOptions`); confirm the installed major. Do not code against assumed API.

## Plan

### File-level steps
**B-0 (branch + dep):**
- `apps/api/package.json` — add `helmet` dep. [orchestrator/supertokens-integration] — no schema/env.

**B-3 Backend (no B-1 schema, no B-2 contracts, no B-4 frontend — config-only):**
- `apps/api/src/main.ts` — modify: register helmet (safe headers, fence CSP/CORP/COEP), disable x-powered-by, preserve CORS+SuperTokens order. **Specialist: supertokens-integration.** Order: FIRST (understand existing middleware order).
- `apps/api/src/app.module.ts` (+ optional `apps/api/src/common/throttler-*.ts`) — modify/create: generic ThrottlerGuard 429 body. **Specialist: supertokens-integration** (same coherent change; consult backend-developer if throttler override is non-trivial). Order: independent of main.ts.
- `apps/api/test/integration/security-headers.spec.ts` (or unit on the bootstrap) — create: assert each header present, CSP/CORP/COEP ABSENT, 429 body generic, CORS preflight intact. **Specialist: supertokens-integration** (authors alongside per BUILD-9 — integration spec for the new boundary). Order: after main.ts + app.module.

**B-5 Verify:** run CI-identical (lint, typecheck, full test, build, boot-probe).

### Specialist routing (validated against AGENTS.md)
- **supertokens-integration** — owns main.ts middleware order + SuperTokens CORS + the throttler override + tests (single coherent config change; used successfully in wave-82). Exists in AGENTS.md.
- backend-developer — consult only if the ThrottlerGuard override needs deeper NestJS work.

### Parallelization map
- main.ts and app.module.ts edits are independent (parallel-safe) but small enough that supertokens-integration does them in one pass. Tests serialize after both.

### Self-consistency sweep
1. All 9 P-2 ACs map to steps: AC1-6 → main.ts helmet; AC7 → app.module throttler; AC8 → T-8 deployed cross-origin proof (+ B-3 preflight test); AC9 → "leave authRateLimiter untouched" explicit. ✓
2. Every step has a specialist. ✓
3. No file in multiple parallel batches. ✓
4. design_gap_flag: false (referenced). ✓
5. Architecture deltas have alternative trade-offs (edge-HSTS rejected; filter-vs-guard-subclass). ✓
6. Contracts concrete, no TBD. ✓
7. New dep (helmet) justified + license. ✓
8. SDK checklist present (verify installed helmet version option names). ✓
Sweep clean.
