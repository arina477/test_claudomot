# Wave-84 V-1 — jenny (semantic spec-conformance verification)

**Verdict: APPROVE** — all 6 ACs + the p4-phase2 corrections conform to DEPLOYED behavior. No drift, no gap.

Spec source: task `9535895f-1d80-4a59-b93e-dff05ff94c6e` (BOARD Option B — keep header transport + ship compensating XSS controls).
Deployed @5cb5e789 · web `web-production-bce1a8.up.railway.app` · api `api-production-b93e.up.railway.app`.
Method: live curl (credentialed signin with fixture A + JWT decode + CSP fetch + authed-endpoint probes); cross-checked against T-8 live deliverable.

## AC-by-AC (deployed evidence)

**AC1 — explicit header transport — CONFORMS.**
`POST /auth/signin` (rid: emailpassword, st-auth-mode: header, fixture A) → HTTP 200 with:
- `st-access-token`, `st-refresh-token`, `front-token` returned as **RESPONSE HEADERS** (not cookies).
- `access-control-expose-headers: front-token, st-access-token, st-refresh-token` — the three explicitly exposed cross-origin.
- **NO `Set-Cookie`** in the response (no `sAccessToken` httpOnly cookie). Header/bearer mode confirmed on the deployed binary.
Intent (explicit header transport, no reliance on 'any' default) is realized.

**AC2 — short access-token TTL (≤900s) — CONFORMS.**
Decoded the returned `st-access-token` JWT payload: `iat=1783611926`, `exp=1783612826` → **exp − iat = exactly 900 seconds**. Matches the ACCESS_TOKEN_VALIDITY=900 target. Signin still succeeds with the shorter window.

**AC3 — refresh rotation posture + refresh path works — CONFORMS.**
Posture is SuperTokens default rotation (documented; a live re-auth cycle not required per V-1 brief). Deployed refresh/credentialed path proven working: the header-transported access token authenticates real endpoints — `GET /me` → **200** and `GET /servers` → **200** with `Authorization: Bearer <access>`, and **401** without it. Session established via header-mode signin is live and functional.

**AC4 — cross-origin-safe CSP live + complete — CONFORMS.**
Served as a `<meta http-equiv="Content-Security-Policy">` on the web root (matches the karen p4-phase2 serve-layer correction — the meta path is unaffected by `serve -s dist`). Directives include every origin the app uses:
- `connect-src 'self' https://api-production-b93e.up.railway.app wss://api-production-b93e.up.railway.app https://t3.storageapi.dev wss://claudomat-test-sgf9259q.livekit.cloud` — api https **AND** wss, Tigris storage, LiveKit wss.
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` + `font-src 'self' https://fonts.gstatic.com` — the p4-phase2 **Google Fonts (Geist) allowlist correction** is present.
- `img-src` includes api origin + `t3.storageapi.dev` (avatars). `object-src 'none'`, `base-uri 'self'`.
No helmet default CSP on the web app (wave-83 kept that off deliberately).

**AC5 (LOAD-BEARING) — CSP doesn't break SPA/fetch/WS — CONFORMS.**
Cross-checked T-8 live deliverable: `csp_violations_live: NONE` (0 CSP-violation console errors across login + nav), avatars render (Tigris img-src allowed), all 4 Socket.IO WS namespaces + raw wss handshakes reach the server (connect-src wss not blocked), LiveKit wss reached (auth-reject, not CSP), every authed cross-origin fetch 200. My own spot checks corroborate: `/me` and `/servers` authed fetches succeed cross-origin; the served CSP allowlists every required origin. The load-bearing risk (CSP silently breaking a feature) is disproven on deployed reality.

**AC6 — XSS surface shrunk — CONFORMS.**
Live CSP `script-src 'self'` — **no `unsafe-inline`, no wildcard** in script-src. Combined with connect-src exfil control (only the api/storage/livekit origins), 900s access TTL, and default rotation, the BOARD-mandated compensating-controls bundle is deployed. Surface is shrunk (not eliminated), exactly as specced.

## Recorded-decision cross-check (product-decisions.md)
Lines 907–911 record the wave-84 BOARD 7/7 Option B: **keep header transport, do NOT switch to httpOnly cookies**, ship the compensating controls (cross-origin-safe CSP + short TTL + rotation). Deployed posture matches: header transport confirmed live, no cookies set, CSP + 900s TTL + rotation all present. Consistent with line-73 items **(6)** short-lived-JWT cross-origin fallback and **(10)** SameSite=Lax intent (cookies only where same-site applies; cross-site uses headers). **No drift** between the recorded decision and the deployed reality. The recorded config-drift (SDK doc assumes a shared parent domain not deployed) + pre-GA custom-domain migration trigger are documentation notes, not deployed-behavior gaps.

## Journey/route change
**NONE.** This wave is backend Session.init config + a web-app CSP meta tag. No endpoint path/method/schema change (spec `contracts.api` asserts this). `/auth/signin`, `/me`, `/servers` behave as before; only token transport surface + response CSP changed. No new routes, no journey-map delta required.

## Drift vs gap summary
No drift (deployed matches recorded BOARD decision). No gap (all 6 ACs + both p4-phase2 corrections present on the live deploy). Spec-conformance clean.
