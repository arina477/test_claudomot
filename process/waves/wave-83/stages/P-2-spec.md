# Wave 83 — P-2 Spec (pointer)

**Source of truth:** `tasks.description` of `875b97f4-bbae-4f1d-99b8-f1f26a876a3f` (YAML head + `---` + prose). This is a convenience copy.

**spec-id:** wave-83-spec · **wave_type:** single-spec · **claimed_task_ids:** [875b97f4-bbae-4f1d-99b8-f1f26a876a3f] · **design_gap_flag:** false

## Acceptance criteria (copy)
1. Every API response carries `Strict-Transport-Security: max-age=15552000; includeSubDomains` (no preload).
2. Every API response carries `X-Content-Type-Options: nosniff`.
3. Every API response carries `X-Frame-Options: DENY` (or frame-ancestors 'none').
4. Every API response carries a strict `Referrer-Policy`.
5. No API response carries `X-Powered-By`.
6. No API response carries `Content-Security-Policy` / `Cross-Origin-Resource-Policy` / `Cross-Origin-Embedder-Policy` (fenced off — cross-origin safety).
7. NestJS ThrottlerGuard 429 body does NOT leak "ThrottlerException"; generic message + 429 + Retry-After.
8. **LOAD-BEARING:** deployed web→api credentialed flow (SuperTokens login + authed request, CORS w/ credentials) STILL succeeds after helmet lands.
9. Express authRateLimiter 429 path (already generic) unchanged.

Headers-only / config wave (main.ts helmet + app.module ThrottlerGuard override). No UI, no schema, no contract-type change.
