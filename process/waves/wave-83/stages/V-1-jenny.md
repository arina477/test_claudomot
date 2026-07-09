# Wave 83 — V-1 jenny (semantic-spec verification)

**Verdict: APPROVE** — all 9 ACs + the p4-enrichment-ws note conform to DEPLOYED behavior on the hardened live API.

Method: spec-conformance only (deployed behavior vs spec-contract INTENT; not source-claim truth — that is karen). All findings are from live probes against `https://api-production-b93e.up.railway.app` (curl -D -) plus a credentialed cross-origin flow using Fixture A. Playwright was unavailable (shared-profile lock held by a parallel instance — never browser_close'd); the load-bearing AC8 flow was proven equivalently via a real credentialed curl login + authed requests carrying httpOnly cookies with `Origin: web`.

## AC-by-AC (INTENT vs deployed)

| AC | Intent | Deployed evidence | Result |
|----|--------|-------------------|--------|
| AC1 HSTS | `max-age=15552000; includeSubDomains`, NO preload | Present on GET / , /healthz, 404, 429 (both throttlers), preflight, authed /me,/servers. Exact string `strict-transport-security: max-age=15552000; includeSubDomains` — **no `preload`** (reversibility honored). | CONFORM |
| AC2 nosniff | `X-Content-Type-Options: nosniff` | Present on all probed responses incl. 401/404/429. | CONFORM |
| AC3 X-Frame-Options | `DENY` | `x-frame-options: DENY` present on all responses. | CONFORM |
| AC4 Referrer-Policy | strict (no-referrer OR strict-origin-when-cross-origin) | `referrer-policy: strict-origin-when-cross-origin` (spec-allowed strict value) on all responses. | CONFORM |
| AC5 X-Powered-By removed | absent | Grep for `x-powered-by` across GET/, 404, 401, 429, preflight → NONE. Express fingerprint gone. | CONFORM |
| AC6 fence OFF | CSP, CORP, COEP, COOP, Origin-Agent-Cluster ALL absent | Case-insensitive grep for all five across every probed response → NONE present. Fence holds; the three cross-origin-breaking defaults are off. | CONFORM |
| AC7 ThrottlerGuard 429 generic | HTTP 429 + Retry-After + generic body, no class name | Triggered live NestJS `GenericThrottlerGuard` on `/servers` (default 10/60s): body exactly `{"statusCode":429,"message":"Too Many Requests"}`, `retry-after: 60`, no `ThrottlerException`/framework class. All helmet headers also present on the 429. | CONFORM |
| AC8 **LOAD-BEARING** cross-origin credentialed flow survives helmet | preflight + credentialed login + authed request preserve ACAO(web)+ACAC:true | Preflight OPTIONS /auth/signin (Origin=web) → 204, ACAO=web, ACAC=true. Credentialed POST /auth/signin (Fixture A) → 200 `status:OK`, sets `sAccessToken`/`sRefreshToken` (HttpOnly; Secure; SameSite=None). Authed GET /me (cookies+Origin=web) → 200 correct user; GET /servers → 200 data. No CORS/CORP/COEP breakage. | CONFORM |
| AC9 Express authRateLimiter unchanged | already-generic 429, not double-fixed | `/auth/signin` burst → 429 body `{"statusCode":429,"error":"Too Many Requests","message":"Rate limit exceeded — maximum 10 auth requests per minute."}`, NO Retry-After, no class name. This is distinctly the Express path (message wording + no Retry-After) vs the NestJS guard (generic message + Retry-After) — proving it was left untouched and not double-fixed. Helmet headers correctly present on it too (helmet global, runs before Express limiter). | CONFORM |
| p4-enrichment-ws | Socket.IO cross-origin WS-upgrade auth still works post-helmet (4 namespaces) | Live spot check: engine.io handshake at `/socket.io/?EIO=4&transport=polling` (Origin=web, auth cookie) → HTTP 200, sid issued, `upgrades:["websocket"]`, ACAO=web + ACAC=true. Corroborated by T-8 deliverable (`ws_cross_origin: PASS` — all 4 namespaces /messaging /presence /study-timer /study-room authenticate + connect over cross-origin wss://, native upgrade readyState OPEN). Helmet (Express-stack) does not touch the IoAdapter WS handshake, as P-4 predicted. | CONFORM |

## Journey / no user-visible surface regressed
Backend response-headers only — no route/schema/UI change. Deployed web→api credentialed flow (login + /me + /servers) succeeds end-to-end with no CORS/CSP breakage, so no journey surface is regressed. T-9 correctly skipped journey-regen (config-only, no frontend diff). T-5 live smoke reported 0 security console errors.

## Drift / gap
None. No spec drift (deployed behavior matches intent on every AC). No spec gap (deployed reality revealed no case the spec missed). The Express-vs-NestJS 429 distinction (AC7 vs AC9) is correctly realized on deployed state: two separate limiters, one fixed (NestJS, now generic + Retry-After), one deliberately untouched (Express, already generic).

**Emit: APPROVE**
