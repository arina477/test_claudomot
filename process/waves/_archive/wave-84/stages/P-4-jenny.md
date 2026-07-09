# P-4 Phase-2 Drift Verification — wave-84 (jenny)

**Agent:** jenny (spec-compliance / drift auditor)
**Scope:** Cross-reference SPEC (task `9535895f`) + PLAN (`P-3-plan.md`) against prior decisions (`product-decisions.md`) + journey map (`user-journey-map.md`) for DRIFT vs the recorded architecture. Per-item MATCHES / DRIFTS. Independent of karen.
**Verdict:** **APPROVE (with one required spec-gap fix — see Item 5).** No blocking *drift*. One *gap* the CSP directives must close before B-block, else the LOAD-BEARING CSP AC self-contradicts on the real built app.

---

## Item 1 — BOARD outcome consistent with recorded architecture posture → **MATCHES**

- product-decisions **lines 907–911** record this exact wave: keep SuperTokens **header** transport (NOT httpOnly-cookie switch), resolved **7/7 Option B**, with the ship-blocking compensating controls being (1) cross-origin-safe CSP, (2) short access-token TTL, (3) refresh rotation. The spec's 6 ACs are a 1:1 restatement of that recorded mandate. **No drift.**
- Continuity with pre-existing posture confirmed: recorded architecture line-73 item **(6)** "WS/LiveKit auth = SuperTokens session cookie on upgrade, **short-lived JWT fallback for cross-origin/PWA**" and item **(10)** "session cookie **SameSite=Lax**" are *consistent* with keeping header transport for the cross-SITE SPA — the BOARD entry (line 908) explicitly cites both items as the architecture it "continues." Header-mode is the recorded cross-origin fallback posture, not a reversal of it. **MATCHES.**
- The recorded config-drift + pre-GA migration trigger (line 910: revisit httpOnly-via-custom-domain before real external users) is already logged; this wave does not touch it and does not need to. **No drift.**

## Item 2 — CSP-vs-wave-83 consistency (web CSP added vs api CSP disabled) → **MATCHES (different layer, not a contradiction)**

- Verified `apps/api/src/common/security-headers.ts` (wave-83): `contentSecurityPolicy: false` is deliberately fenced OFF on the **api**, with the module docstring stating the api's default CSP (`default-src 'self'`) "blocks cross-origin" for the credentialed JSON fetch.
- This wave adds an explicit CSP to the **web app** (the HTML document). These are **different layers**: CSP is a control on the *document that executes scripts* (the SPA), not on the api's *JSON responses* (a JSON body has no script/style execution context; a CSP there only constrains the cross-origin fetch and buys nothing). The plan (P-3 line 8) and spec (AC4) both state this distinction explicitly ("CSP is an XSS control on the document, NOT on the api's JSON").
- Spec AC4 also explicitly says "**NO helmet default CSP** (wave-83 disabled that for good reason)" — the spec is aware of and preserves the wave-83 decision. product-decisions line 909 reinforces: "NOT helmet's default disabled in wave-83." **Consistent, not contradictory. MATCHES.**

## Item 3 — connect-src must not regress the wave-83-verified cross-origin flow → **MATCHES (load-bearing risk correctly specified — flag as T-8 must-prove)**

- Wave-83 proved the web→api credentialed fetch works cross-origin (helmet cross-origin defaults fenced off for exactly this). The 4 Socket.IO namespaces are confirmed in the api source: `/messaging`, `/presence`, `/study-timer`, `/study-room` (`apps/api/src/**/*.gateway.ts`) — matching the spec AC5 list exactly.
- Spec `contracts.sdk` + AC4/AC5 + edge-case #2 require connect-src to include the api origin over **BOTH** `https://api-production-b93e.up.railway.app` **AND** `wss://api-production-b93e.up.railway.app`, parameterized by `VITE_API_ORIGIN` for non-prod. Verified the web sockets + fetch all key off `import.meta.env.VITE_API_ORIGIN` (`messagingSocket.ts`, `presenceSocket.ts`, `studyTimerSocket.ts`, `studyRoomSocket.ts`, `auth/api.ts`, `auth/supertokens.ts`) — so a prod-only hardcode WOULD strand local/preview envs; the spec's env-parameterization requirement correctly protects that. **The connect-src requirement correctly protects the wave-83-verified flow. MATCHES.**
- **This is the load-bearing risk — flag as the T-8 must-prove:** AC5 already names it (0 CSP-violation console errors + credentialed fetch alive + all 4 WS namespaces connect live on the deploy; a CSP that breaks any is a REWORK). Missing `wss:` → the 4 namespaces silently break. Correctly specified; no drift. T-8 must live-prove all 4 namespaces + the fetch, not just one.

## Item 4 — no journey/route change claimed → **MATCHES**

- Spec `design_gap_flag: false`; plan "Data model / API contracts: None. No endpoint/schema/type change." This is a backend/config + a CSP header wave. The journey map's canonical route/screen inventory needs no new entry — consistent with the spec's claim. **No drift.**
- The only journey-relevant risk is a CSP that *breaks an existing* surface (not adds one) — covered by Items 3 and 5.

## Item 5 — SPEC-GAP (BLOCKING for B-block, non-blocking for the drift verdict): the web app loads EXTERNAL Google Fonts that a strict CSP will block

**This is a GAP, not a DRIFT** (the spec doesn't contradict a prior decision — it omits a case deployed reality reveals).

- **Evidence:** `apps/web/index.html` loads the Geist typeface from **external origins**:
  - `<link rel="preconnect" href="https://fonts.googleapis.com" />`
  - `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />`
  - `<link href="https://fonts.googleapis.com/css2?family=Geist:wght@...&family=Geist+Mono:wght@..." rel="stylesheet" />`
  Geist is the design-system canonical typeface (product-decisions v7/v8/v9 design entries).
- **Why it matters:** the spec's AC4 says connect-src + "any font/img sources the app uses" but does **not name** `fonts.googleapis.com` (needs `style-src`) or `fonts.gstatic.com` (needs `font-src`). A CSP with `style-src 'self'` / `font-src 'self'` (the obvious minimal derivation) would BLOCK the Google Fonts stylesheet + font files → the SPA silently falls back to system fonts, a real CSP-violation + brand-typeface regression. This directly threatens AC5's "ZERO CSP-violation console errors" — the app WILL emit CSP violations for the blocked font stylesheet unless the directives allowlist these two origins.
- **Required fix (name in the spec / B-block must implement):** the CSP MUST include:
  - `style-src 'self' https://fonts.googleapis.com` (+ whatever inline-style token Vite/Tailwind needs — `'unsafe-inline'` or hashes, derived empirically per the plan)
  - `font-src 'self' https://fonts.gstatic.com`
  - (`connect-src` is already correctly specified per Item 3.)
- **No other external resources found:** grep across `apps/web/src` + `index.html` for external `https://` hosts returned ONLY the two Google Fonts origins — no analytics script, no avatar/image CDN, no other external script/style/font. `apps/web/src/styles/globals.css` imports only `tailwindcss` (bundled, not external). So the allowlist gap is bounded to exactly Google Fonts. img-src `'self'` is safe (avatars are same-origin/api-origin, not a third-party CDN).

---

## Summary

- **Verdict: APPROVE.** No blocking drift. The BOARD Option-B outcome, the web-vs-api CSP-layer split, the connect-src https+wss requirement, and the no-journey-change claim all **MATCH** the recorded architecture (product-decisions lines 73, 907–911; wave-83 `security-headers.ts`).
- **One required spec-gap (Item 5):** the web app loads **Google Fonts** (`fonts.googleapis.com` stylesheet + `fonts.gstatic.com` font files) that a strict `'self'`-only CSP will block, violating AC5's "0 CSP-violation console errors." The CSP directives MUST allowlist `style-src …https://fonts.googleapis.com` + `font-src …https://fonts.gstatic.com`. This is a gap (omission), not a drift (contradiction); it does not change the APPROVE verdict but B-block MUST NOT derive `'self'`-only and MUST prove 0 violations against the real built app with the fonts loading.
- **T-8 must-prove (Item 3):** live-verify all 4 Socket.IO namespaces (`/messaging /presence /study-timer /study-room`) connect + the credentialed cross-origin fetch works + 0 CSP violations (fonts included) — on the deploy, not just locally.
