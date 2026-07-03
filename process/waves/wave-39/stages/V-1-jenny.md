# V-1 Semantic-Spec Verification (jenny) — wave-39 settings-doorway user menu

**Verdict: APPROVE** — all 7 ACs met against DEPLOYED production. 0 blocking findings.
**Spec:** task `c208e91e` YAML head (7 ACs). **Target:** web `https://web-production-bce1a8.up.railway.app` · api `https://api-production-b93e.up.railway.app`. **Date:** 2026-07-03.

## Method (independent — not source-claim, not T-5-report-as-truth)
Pulled the LIVE-served bundle `/assets/index-QN5fEltz.js` (matches C-2's claimed served bundle) and read the actual minified UserMenu render code; drove the live API myself (sign-in → /profile → signout → refresh) with the fixture; probed route reachability + avatar render endpoint directly. T-5 evidence used only to corroborate the browser-plane crux.

## Per-AC verdict

| AC | Verdict | Deployed evidence |
|---|---|---|
| AC1 button opens menu (was dead); aria-haspopup/expanded | MET | Served bundle: trigger button `aria-label="Your profile and settings"` + `"aria-haspopup":"menu"` + `"aria-expanded":y` (open-state-bound); menu under `y&&` guard |
| AC2 ≥3 role=menuitem (Profile/Privacy/Log out), reuse role=menu | MET | Bundle: `role="menu" aria-label="User menu"` maps items array → 3 `role="menuitem"` buttons Profile/Privacy/Log out |
| AC3 Profile → /settings/profile, closes menu | MET | Bundle `label:"Profile"…action:()=>{n("/settings/profile")}`; route HTTP 200; T-5 landed on avatar uploader |
| AC4 Privacy → /settings/privacy, closes menu | MET | Bundle `label:"Privacy"…action:()=>{n("/settings/privacy")}`; route HTTP 200 |
| AC5 Log out → signOut → login; protected bounce | MET | Bundle `action:async()=>{try{await NI.signOut()}catch{}finally{n("/login")}}`. Live: /profile authed→200; POST /auth/signout→200 (`front-token: remove`); refresh w/ revoked token→**401 "unauthorised"** = authoritative server-side session-handle revocation |
| AC6 Esc refocus / outside-click / close-on-select | MET | T-5 live: Esc closes + activeElement→trigger (2/2); outside-click closes (2/2); action wrapped `s(c)` act-then-close (B-6 HIGH fix). Client-side wiring present in served bundle |
| AC7 CRUX UI-only → button → Profile → upload → renders | MET | T-5 live: presign→PUT→confirm→render via UI only, naturalWidth=64, persists across fresh login. Independently corroborated: `GET /users/<fixtureA>/avatar` → 302 → presigned Tigris GET → 200 image/png (the persisted object). **wave-38 F1 CLOSED** |

## Journey map v0.26 continuity — accurate, no drift
- Avatar real-upload node flipped to "Live (fully reachable)" with honest UI-path detail (L93).
- NEW "Shell user menu" node added with correct AC-level detail (aria, close semantics, 3 items, logout now reachable) (L94).
- wave-39 annotation (L24) honest — records B-6 CRITICAL logout error-handling fix + served-bundle assertion.
- NO new dead-end: all 3 menu targets serve live (/settings/profile, /settings/privacy, /login all 200). Logout — previously NO UI at all — now live + genuinely server-side-revoking.

## Drift-vs-gap notes (non-blocking, informational)
- AC5 stateless-JWT nuance (GAP, not defect): a captured access-token JWT presented directly still 200s post-signout until ~1h TTL — expected SuperTokens stateless semantics. Signout revokes the session handle (refresh→401 confirmed) + clears client tokens (`front-token: remove`); a real logged-out browser can't retain/re-mint. AC5 intent holds. No action.
- T-5 logout bounce → `/` (public landing) not `/login` — correct app behavior; AC5 permits "landing/login route". The authed 200→401 transition (re-confirmed live) is the definitive check. Not a drift.
- Out-of-scope carries correctly deferred: a1299e88 (Resend domain, founder-blocked → M7 not fully closed), 7525b759 (avatar endpoint hardening, LOW). Neither a wave-39 gap.

**Recommendation:** proceed to V-2/V-3; no REWORK. head-verifier may APPROVE at V-3 on wave-39 spec.
