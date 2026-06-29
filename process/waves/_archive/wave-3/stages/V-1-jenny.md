# V-1 Semantic-Spec Verification — Wave 3 (Auth + profile frontend)

**Agent:** jenny (spec-compliance auditor)
**Date:** 2026-06-29
**Spec:** task `9aae8255-34b3-4f63-bdd4-97f39cf1d842` (wave-3-spec, 9 ACs) + folded `a3328023`
**Targets:** web `https://web-production-bce1a8.up.railway.app` · api `https://api-production-b93e.up.railway.app`
**Method:** live curl against api `/auth/*`, `/me`, `/profile`; inspection of the served SPA `index.html` + JS bundle (`/assets/index-fjfJ8CA0.js`, 624 KB); source review of `apps/web/src`, `apps/api/src`, `packages/shared`. Live-browser (Playwright) confirmation attempted but the chrome channel is absent in this env (consistent with the journey-map note) — browser E2E remains deferred to `c51589cd`.

---

## VERDICT: REJECT

**One Critical deployment-config defect breaks every browser-side backend flow.** The code is spec-faithful and the live backend behaves per spec when called directly, but **the deployed web bundle never received `VITE_API_ORIGIN` at build time**, so the live SPA sends all auth/`/me`/`/profile` requests to its own (web) origin — a static file server that returns `index.html`, not the API. In a real browser, signup, login, verify, reset, profile, and the verify-banner `/me` fetch all hit the wrong host. The source is correct; the *deployment as shipped* does not satisfy the "wired to the LIVE backend" / "works end-to-end against the live backend" clauses of the spec (AC2/3/4/5/6/8/9).

This is spec-**drift introduced at deploy**, not a spec-gap and not an intentional deferral. It is a one-line Dockerfile/env fix; once corrected and redeployed, the implementation appears to meet all 9 ACs.

---

## CRITICAL FINDING (C1) — Deployed SPA points at the wrong origin for all backend calls

**Severity: Critical.** Blocks AC2, AC3, AC4, AC5, AC6, AC8, AC9 in the browser.

**Evidence chain (all independently verified against the live deployment):**

1. `apps/web/src/auth/supertokens.ts:15` — `apiDomain = import.meta.env.VITE_API_ORIGIN ?? window.location.origin`
   `apps/web/src/auth/api.ts:9` — `BASE = import.meta.env.VITE_API_ORIGIN ?? ''` (relative → resolves against page origin).
   Vite inlines `import.meta.env.VITE_*` **at build time**; if unset during `pnpm build`, both fall back to the web origin.

2. `apps/web/Dockerfile` runs `RUN pnpm build` with **no `ARG VITE_API_ORIGIN` and no `ENV VITE_API_ORIGIN`**. Docker build args must be explicitly declared to reach the build step, so even a Railway service variable would not be inlined. `grep -i "ARG|ENV VITE" apps/web/Dockerfile` → empty.

3. The only place the correct value is written is `apps/web/.env.example:5` (`VITE_API_ORIGIN=https://api-production-b93e.up.railway.app`). `.env.example` is **not** loaded by Vite, and no `.env` / `.env.production` exists in `apps/web/`.

4. **Served-bundle proof:** the deployed `index-fjfJ8CA0.js` contains **zero** occurrences of `api-production` / `b93e` (`grep -c b93e` → `0`); `apiBasePath:"/auth"` is inlined but `apiDomain` is the compiled `window.location.origin` fallback (`location.origin` present in bundle).

5. **Live web-origin proof:** `GET https://web-production-bce1a8.../me`, `POST .../auth/signin`, `GET .../profile` all return **HTTP 200 `text/html`** (the SPA `index.html` fallback from `serve -s`). The web origin is a static server with **no proxy** to the API — so the SDK's session/auth/profile requests receive HTML, not JSON.

**Net effect in a browser:** SuperTokens `signUp`/`signIn`/`verifyEmail`/`sendPasswordResetEmail`/`submitNewPassword` and the `api.getMe`/`getProfile`/`patchProfile` fetches all target the wrong host → JSON-parse / status failures → the pages render but no flow completes. AC1 (pure-static landing) is unaffected.

**Recommended fix (route to @head-ci-cd / deployment-engineer):** add to `apps/web/Dockerfile` before `pnpm build`:
```dockerfile
ARG VITE_API_ORIGIN
ENV VITE_API_ORIGIN=$VITE_API_ORIGIN
```
and set `VITE_API_ORIGIN=https://api-production-b93e.up.railway.app` as a Railway **build** variable for the web service; redeploy; re-confirm `b93e` appears in the new bundle. (CORS/cookie note for V-2: cross-origin cookie auth requires the API to send `Access-Control-Allow-Origin: <web origin>` + `Allow-Credentials: true` and `SameSite=None; Secure` session cookies — verify post-fix, since the SDK uses `credentials:"include"`.)

**Important corollary (I1, High):** the user-journey-map (`command-center/artifacts/user-journey-map.md` §"Deployment status — wave-3") marks `/login /signup /forgot-password /verify-email`, `/settings/profile`, the verify-banner, and the first-run flow all **✅ Live / ✅ Wired "curl-verified"**. Those curls verified the **backend in isolation**, never the SPA→API path, so the map overstates live status. Correct to 🟠 (coded but blocked in browser) until C1 is fixed and re-verified.

**Observation (not scored):** the api `/health` + all `/auth`/`/me`/`/profile` endpoints went into a sustained **HTTP 502 "Application failed to respond"** spree partway through verification (after initially responding correctly), and had not recovered after ~2 min of polling. This is an api availability/stability concern (cold-start or crash-loop) independent of C1 — flag for @head-ci-cd to confirm the api service is healthy; my backend-behavior findings below were captured during the window it was responding.

---

## Per-AC findings

| AC | Result | Notes |
|----|--------|-------|
| **AC1 — Landing renders, CTAs to signup/login** | **MATCHES** | `/` → 200, dark SPA shell served; `LandingPage.tsx` has nav "Create free account"→`/signup`, "Sign in"→`/login`, hero "Get started for free"→`/signup`, footer→`/login`. Bundle contains the copy ("replaces / Notion", "Create your account", etc.). Pure-static; unaffected by C1. Mirrors `design/landing.html`. |
| **AC2 — Signup → account+session → routes to verify state** | **DRIFTS (C1)** | Code correct: `SignupPage.tsx` calls `signUp()`, on `OK`→`navigate('/verify-email')`, `FIELD_ERROR`→inline (duplicate-email via ST FIELD_ERROR per the comment). Backend correct in isolation (api was responding earlier; duplicate-email/signup not re-confirmable during the 502 window, but signin path proved `/auth/*` live). **But** the deployed SPA posts `/auth/signup` to the **web** origin (C1) → HTML response, flow cannot complete in-browser. |
| **AC3 — Email-verify consumes token; invalid/used → handled error + resend** | **DEFERRED (full-flow) + DRIFTS (C1) on negative path** | Full token consumption legitimately DEFERRED (domain `a1299e88` + inbox). Page + wiring present and deployed: `EmailVerifyPage.tsx` uses `getEmailVerificationTokenFromURL` + `verifyEmail`, success→`/settings/profile`, invalid-token→error+resend (no crash). Negative/resend path is correctly coded but, like all `/auth/*` calls, mis-targeted in the browser by C1. Render + state machine: MATCHES. |
| **AC4 — Login correct→session+route; wrong→inline error, no leak** | **PARTIAL (backend MATCHES; frontend DRIFTS via C1)** | Backend verified live: `POST /auth/signin` wrong creds → `{"status":"WRONG_CREDENTIALS_ERROR"}` (200, no stack trace, no enumeration leak). `LoginPage.tsx` maps `WRONG_CREDENTIALS_ERROR`→"Wrong email or password." banner (string in bundle), `OK`→`/app`, `FIELD_ERROR`→inline. Correct-credential session round-trip not exercisable in-browser due to C1. |
| **AC5 — Forgot-password → reset email (no enumeration); reset page token+new pw** | **PARTIAL (backend MATCHES; full DEFERRED; frontend DRIFTS via C1)** | Backend verified live: `POST /auth/user/password/reset/token` with unregistered email → `{"status":"OK"}` (no enumeration). `ForgotPasswordPage.tsx` treats `OK`+`PASSWORD_RESET_NOT_ALLOWED` identically as success (no-enumeration, matches spec). `ResetPasswordPage.tsx` reads token from URL, validates match, maps `RESET_PASSWORD_INVALID_TOKEN_ERROR`→handled error, bare-nav→"request new link". Full reset round-trip DEFERRED (domain/inbox `a1299e88`). Send/submit calls mis-targeted in-browser by C1. |
| **AC6 — Settings-profile: display_name via GET/PATCH /profile; others 'coming soon'** | **PARTIAL (contract MATCHES; live persist NOT confirmable due to C1 + api 502)** | Contract correct: `GET /profile`+`/me` return 401 `{"message":"unauthorised"}` unauth (consistent; one transient 502 only). `ProfilePage.tsx` loads via `api.getProfile`, saves via `patchProfile`, reflects saved name; username/avatar/accent rendered `disabled`/"coming soon" (strings "Upload photo — coming soon", "Colour picker — coming soon" in bundle) — split `2a655960` honored. `profile.controller.ts` GET→`{displayName}`, PATCH validates `UpdateProfileSchema` (1–50 chars, empty→400). **Authenticated GET/PATCH round-trip could not be exercised live** (api entered 502 during the session attempt), and in-browser the calls are mis-targeted by C1. Code + contract: MATCHES; live persistence UNVERIFIED. |
| **AC7 — Routing/guards: unauth→login; authed on /login→app; session persists** | **MATCHES (logic) — but session detection depends on C1** | `router.tsx` wires public/guest/auth routes correctly; `AuthGuard` = `SessionAuth requireAuth overrideGlobalClaimValidators=()=>[]` (unverified allowed, per AC8); `GuestGuard` redirects `doesSessionExist`→`/app`; `*`→`/`. Logic is spec-correct and deployed. Caveat: guard session checks call SuperTokens session endpoints, which are mis-targeted by C1 — so in practice `doesSessionExist` will be wrong in the browser until C1 is fixed. Route map matches journey-map. |
| **AC8 — Verify-gating UX: unverified reaches shell + banner; /me 200 emailVerified:false** | **PARTIAL (backend design MATCHES; live 200 NOT confirmable; frontend DRIFTS via C1)** | Backend design verified by code + unauth probe: `me.controller.ts` + `profile.controller.ts` use `SessionNoVerifyGuard` (`verifySession({overrideGlobalClaimValidators:()=>[]})`) → per-route exemption; `EmailVerification.init({mode:'REQUIRED'})` unchanged globally (fail-closed default preserved) — exactly the a3328023 decision. `/me` returns `emailVerified = claimValue ?? false`. `AppHome.tsx` fetches `/me`, shows `VerifyEmailBanner` when `!emailVerified` (amber, resend). **The `/me`→200 `{emailVerified:false}` for an unverified session could not be exercised live** (no verified-vs-unverified session obtainable during the api 502 window; unauth `/me`=401 as expected). In-browser the `/me` fetch is mis-targeted by C1 → banner logic never receives real data. Design + wiring: MATCHES; live behavior UNVERIFIED. |
| **AC9 — First-run end-to-end: signup→(verify)→profile→app-home** | **DRIFTS (C1) + browser-E2E DEFERRED (`c51589cd`)** | All five components are coded and deployed and chain correctly in source (signup→`/verify-email`→`verifyEmail` OK→`/settings/profile`→`/app`). End-to-end **cannot complete in the live browser** because every backend hop is mis-targeted by C1. Full click-through legitimately deferred to `c51589cd`, but the spec's "works end-to-end against the live backend" is currently false as deployed. |

---

## Drift vs gap vs deferral (as requested)

- **Spec-drift (deploy-introduced):** C1 — the SPA→API origin misconfiguration. The code satisfies the spec; the deployed artifact does not. This is the sole blocker.
- **Spec-gap:** none found. Every AC has corresponding, contract-correct, deployed code (all route components, copy, recipes, and guards present in the live bundle; Zod `ProfileResponse`/`UpdateProfile` present in `packages/shared`).
- **Intentional deferrals (correctly scoped, NOT counted against the verdict):**
  - Email delivery to arbitrary recipients / full verify + reset token round-trips → domain `a1299e88` (Resend sandbox).
  - Full browser click-through E2E → `c51589cd` (and chrome channel absent in this env).
  - Profile customization (username/avatar/accent) → `2a655960` — correctly rendered as disabled "coming soon".

---

## Recommendations (ordered)

1. **Fix C1 (blocking):** declare `ARG/ENV VITE_API_ORIGIN` in `apps/web/Dockerfile` before `pnpm build`, set the Railway **build** variable, redeploy, and confirm `api-production-b93e` is inlined in the new bundle. Route to **@head-ci-cd** (deploy/env scoping) → **deployment-engineer**.
2. **Verify api stability:** the api `/health` 502 crash/cold-start needs confirmation it is healthy and not crash-looping before re-test. **@head-ci-cd**.
3. **Re-run V-1 post-fix** to confirm the authenticated `/me` (emailVerified:false) + `/profile` GET/PATCH round-trip live (AC6, AC8 currently UNVERIFIED-live), ideally with a browser session once chrome is available — coordinate with **@task-completion-validator**.
4. **Correct the journey-map** wave-3 status rows from ✅ Live/Wired to 🟠 until C1 + re-test pass (avoids overstating shipped state at the next T-9).
5. **V-2 CORS/cookie check:** confirm cross-origin `SameSite=None; Secure` cookies + CORS allow-credentials once the SPA correctly targets the api origin.

**Bottom line:** implementation is spec-faithful and the backend honors the contract when reached directly; a single deploy-time env omission (C1) currently breaks every browser auth flow. **REJECT** until C1 is fixed and the authenticated round-trips are re-verified live.

---

## Re-verify (post PR#9)

**Agent:** jenny · **Date:** 2026-06-29 · **Fix-forward:** PR #9 (merged `04244de`), deployed
**Targets (unchanged):** web `https://web-production-bce1a8.up.railway.app` · api `https://api-production-b93e.up.railway.app`
**Method:** independent live curl against the deployed web bundle + api; full auth contract exercised with a fresh cookie-mode session.

### VERDICT: APPROVE

C1 and both related cross-origin defects (the SameSite=Lax cookie drop, and the exception-filter 502 crash-loop seen as the api outage) are **genuinely resolved in the live deployment**. Every claim in the fix was independently confirmed by curl, not taken on report.

### Evidence (all captured this session against live)

**C1 — bundle now points at the api origin (RESOLVED).**
- Served SPA `index.html` references `/assets/index-Bwvmyycs.js` (new bundle, replaces the `index-fjfJ8CA0.js` that had 0 refs).
- `curl <bundle> | grep -c api-production-b93e` → **2** (was 0). The api origin is now inlined at build time, so SuperTokens `apiDomain` + the `api.ts` `BASE` resolve to the api host, not `window.location.origin`. The remaining `location.origin` occurrences in the bundle are unrelated SDK internals.
- Confirms the `apps/web/Dockerfile` `ARG/ENV VITE_API_ORIGIN` + Railway web build var took effect.

**Cross-origin cookies — SameSite=None; Secure (RESOLVED).**
- Signup response `Set-Cookie` for **both** `sAccessToken` and `sRefreshToken` carries `HttpOnly; Secure; SameSite=None` (was `Lax`, which the browser drops cross-subdomain).
- CORS confirmed for credentialed XHR: `access-control-allow-credentials: true` + `access-control-allow-origin: https://web-production-bce1a8.up.railway.app` (exact web origin, not `*`) + `access-control-expose-headers: front-token`. This is exactly what the SDK's `credentials:"include"` requires; the V-1 corollary CORS/cookie concern is closed.

**Defect A — api stability / no 502 crash-loop (RESOLVED).**
- Sequence `GET /health` (200) → CSRF-rejected `PATCH /profile` no-rid (**401**, clean reject) → `GET /health` (200) → `GET /health` (200), and a final `/health` after the full authed flow → **200**. No `ERR_HTTP_HEADERS_SENT` crash, no sustained 502 — the filter now guards `res.headersSent` and lets the SDK own session-error responses. The exception-filter outage I flagged as an unscored observation in the original pass is gone.

**Auth contract — still holds end-to-end against the live backend.**
| Check | Result |
|---|---|
| `GET /me` no session | **401** |
| Signup (`rid: emailpassword`, `st-auth-mode: cookie`) | **200**, user object returned (`recipeUserId` `3dc8960f…`, `verified:false`) — user persisted in core-backed Postgres |
| `GET /me` w/ session | **200** `{userId, email, emailVerified:false}` |
| `GET /profile` w/ session (`rid: session`) | **200** `{displayName:null}` |
| `PATCH /profile` valid (`displayName:"Reverify User"`) | **200**, persisted (echoes new value) |
| `PATCH /profile` empty `displayName` | **400** Zod `String must contain at least 1 character(s)` |

(Direct `users`-table SELECT not run — the app DB URL is not exposed in this env, only the brain DB. Persistence is evidenced transitively: the cookie-mode session minted at signup authenticated `/me` + `/profile` against the same `userId`, and the PATCH round-trip read-back confirms the profile row.)

### Per-AC status after fix
- **AC1** MATCHES (unchanged; pure-static landing).
- **AC2** MATCHES — signup creates account + session; cookie-mode Set-Cookie now usable in-browser.
- **AC3** Render + negative-path wiring MATCHES; full token consumption still legitimately DEFERRED to `a1299e88` (email domain) — unchanged, not counted.
- **AC4** MATCHES — backend reject is clean (no enumeration); frontend now reaches the api origin.
- **AC5** Backend no-enumeration MATCHES; full reset round-trip DEFERRED `a1299e88` — unchanged.
- **AC6** MATCHES — GET/PATCH `/profile` round-trip now confirmed **live** (was UNVERIFIED-live in the original pass); empty→400, "coming soon" fields honored.
- **AC7** MATCHES — guards depend on session endpoints, which now reach the api host with cross-origin cookies; `doesSessionExist` will resolve correctly in-browser.
- **AC8** MATCHES — `/me` w/ unverified session returns 200 `{emailVerified:false}` **confirmed live** (was UNVERIFIED-live); banner logic now receives real data.
- **AC9** First-run chain (signup→verify-state→profile→app-home) now functional in-browser modulo the two standing deferrals.

### Standing deferrals (unchanged, not counted against verdict)
- Full browser click-through E2E → `c51589cd`.
- Email delivery to arbitrary recipients / full verify + reset token round-trips → `a1299e88` (Resend sandbox/domain).
- Profile customization (username/avatar/accent) → `2a655960` (rendered disabled "coming soon").

### Net answer
With the bundle pointing at the api origin, cross-origin `SameSite=None; Secure` cookies + credentialed CORS enabled, and the api stable (no crash-loop), the wave's first-run auth flow now works in-browser for a real user — modulo the two explicitly-deferred items above. The sole Critical blocker (C1) and both related cross-origin issues are resolved. **APPROVE.**
