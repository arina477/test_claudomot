# P-4 Phase-2 — Karen claim verification (wave-86)

**Wave (REFRAMED):** Make SuperTokens `antiCsrf` EXPLICIT (header-correct value, NOT VIA_TOKEN) + cookie-only-forged-POST regression test + CSRF-safety docs.
**Spec:** task f8fb8023. **Plan:** process/waves/wave-86/stages/P-3-plan.md.

**Verdict: APPROVE** — all 8 load-bearing claims VERIFIED. No WRONG / UNVERIFIED.

---

## Per-claim results

### 1. Header transport pinned + antiCsrf currently UNSET — VERIFIED
- `apps/api/src/auth/supertokens.config.ts:123` — `getTokenTransferMethod: () => 'header',` inside `Session.init` (block spans :108–:221). Matches the ~:123 cited coordinate exactly.
- `grep -n "antiCsrf" apps/api/src/auth/supertokens.config.ts` → NO MATCH. `antiCsrf` is absent from the entire Session.init block. Confirms the wave's premise: the posture is implicit (SDK default), and this wave makes it explicit. VERIFIED.

### 2. Seed's cited coordinate (`supertokens.config.ts:93`) is STALE — VERIFIED
- `sed -n '93p'` → `        mode: 'REQUIRED',` — line 93 is inside the `EmailVerification.init({...})` block (:92–:107), NOT the Session/antiCsrf config. The Session block is :108–:221. Matches P-0-frame.md:5 and P-0-problem-framer.md:12. VERIFIED.

### 3. Residual WS cookie surface is real — VERIFIED
- `apps/api/src/common/ws-auth.ts:50–54` reads the `sAccessToken` COOKIE first (`socket.handshake.headers.cookie` → `parseCookie` → `parsed.sAccessToken`), with a `socket.handshake.auth.accessToken` fallback at :58–63.
- `ws-auth.ts:72` documents the CSRF-safe-handshake reasoning: "antiCsrfToken is undefined: no CSRF risk on WS upgrade (the upgrade is a one-time authenticated handshake, not a form-submittable request)." Session verified via `getSessionWithoutRequestResponse(accessToken, undefined)` at :74. VERIFIED.

### 4. web pins header too — VERIFIED
- `apps/web/src/auth/supertokens.ts:36` — `Session.init({ tokenTransferMethod: 'header' }),`. Frontend selects header transport; backend `getTokenTransferMethod: () => 'header'` matches it. VERIFIED.

### 5. No existing antiCsrf/forged-POST regression test — VERIFIED
- `grep -rni "anticsrf|csrf|forged" apps/api/test apps/api/src` → only incidental hits: doc comments (ws-auth.ts:22/72, auth.exception.filter.ts:8, messages.service.ts:1033) and unrelated S3-"forged-key" assignment tests (assignments.service.ts:107/133, .spec.ts:754). NO test exercises antiCsrf config or a cookie-only forged cross-site POST. The wave adds the first one. VERIFIED.

### 6. supertokens-node@24 antiCsrf init option exists — VERIFIED
- Installed version: **24.0.2** (`apps/api/node_modules/supertokens-node/package.json`; single resolution `node_modules/.pnpm/supertokens-node@24.0.2`).
- `node_modules/.pnpm/supertokens-node@24.0.2/node_modules/supertokens-node/lib/build/recipe/session/types.d.ts` — `export type TypeInput = {` at :40; within it, **`:57 antiCsrf?: "VIA_TOKEN" | "VIA_CUSTOM_HEADER" | "NONE";`**. The init-level `antiCsrf` option exists with exactly the three enum values the plan cites. The plan's "set antiCsrf explicitly to NONE / VIA_CUSTOM_HEADER" is buildable. VERIFIED.

### 7. Antipatterns / REFRAME soundness — VERIFIED
- **"config-only backend, no schema/UI/contract" is accurate.** P-3 plan touches only `supertokens.config.ts` (Session.init edit) + a new test + an optional ws-auth.ts comment. No schema/migration, no DTO/Zod contract, no endpoint, no UI, no new deps (P-3 § "Data model / API contracts / deps: None"). Confirmed against the repo — the change is a single init-option addition.
- **The REFRAME (drop VIA_TOKEN) is SOUND.** VIA_TOKEN is the cookie-mode anti-CSRF value; it is only load-bearing when session tokens ride cookies. The PRIMARY session transport is header/bearer on BOTH ends (config:123 + web:36), so bearer tokens are not auto-attached cross-site — CSRF safety is structural and VIA_TOKEN would be moot-at-best config drift. The ONLY residual cookie read is the WS-upgrade path (ws-auth.ts:50-54), which is a one-time non-form-submittable handshake and is already documented CSRF-safe (ws-auth.ts:72); if defense-in-depth there is wanted the correct value is VIA_CUSTOM_HEADER, not VIA_TOKEN. No cookie transport remains in use for the primary session, so there is no reason VIA_TOKEN could be right. REFRAME confirmed sound.

### 8. wave-84 pre-GA cookie-migration trigger recorded — VERIFIED
- `command-center/product/product-decisions.md:910` — under "## 2026-07-09 — wave-84 BOARD: session-token transport stays header-mode": **"Recorded config-drift + migration trigger: ... Before GA / first real external users, revisit httpOnly-via-custom-domain-or-reverse-proxy (which would restore SameSite=Lax cookies WITHOUT cross-site fragility)."** This is the future scenario the regression test guards: if the app returns to cookie transport, anti-CSRF becomes load-bearing again and the test authored this wave makes that migration safe. VERIFIED.

---

## Summary
Every SPEC/PLAN load-bearing claim checks out against the codebase, the installed SDK types, and the decision log. The cited coordinates are accurate (config:123, ws-auth:50-54/:72, web:36), the stale seed coordinate is confirmed stale (:93 = EmailVerification), the SDK option is confirmed present in 24.0.2, no prior regression test exists, and the REFRAME dropping VIA_TOKEN is technically correct for the pinned header transport. The one open technical micro-decision (NONE vs VIA_CUSTOM_HEADER) is correctly deferred to supertokens-integration at B-block + the P-4 security-scope-tightened gate, as P-0-frame.md:14 specifies.

**APPROVE.**
