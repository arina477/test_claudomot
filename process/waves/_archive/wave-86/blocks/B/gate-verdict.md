# B-6 Gate Verdict — wave-86 (antiCsrf explicit)

- **Wave:** wave-86 — make SuperTokens `antiCsrf` EXPLICIT for the header-transport posture + cookie-only-forged-POST regression test + CSRF-safety docs.
- **Scope:** SECURITY (auth CSRF posture). Single-spec, backend auth-config. NO live vuln — a legibility + regression-lock.
- **Branch:** `wave-86-anticsrf-explicit`  •  **Head commit under review:** `85b270de` (B-2), records `3867d6b8`.
- **Spec task:** `f8fb8023` (REFRAMED — seed's VIA_TOKEN was wrong post header-transport pin).
- **Reviewer:** head-builder (fresh independent review, SDK source read directly — not trusting the B-2 report).

## VERDICT: **APPROVED**

The load-bearing security claim is TRUE and independently verified against `supertokens-node@24.0.2` source. `antiCsrf: 'NONE'` is correct and non-weakening under the pinned header transport. Gate green (821 unit + 3 csrf, tsc 0, biome 0). One MINOR robustness gap in the regression test's tripwire strength is documented below as a non-blocking follow-up — it does not weaken the shipped posture and does not justify REWORK for a legibility-only wave.

---

## Q1 — Is `antiCsrf: 'NONE'` genuinely correct + NON-WEAKENING? (load-bearing)

**YES — verified in source, not from the B-2 report.**

Path read: `recipe/session/sessionRequestFunctions.js` `getSessionFromRequest` + `getAccessTokenFromRequest`, `cookieAndHeaders.js` `getToken`, `recipeImplementation.js` `getSession`, `utils.js` antiCsrf default derivation (all under `node_modules/.pnpm/supertokens-node@24.0.2/.../lib/build/recipe/session/`).

**(a) A cookie-only request cannot authenticate under header transport — CONFIRMED, with a mechanism correction.**
- `getAccessTokenFromRequest` loops over BOTH transfer methods and DOES call `getToken(cookie)`, which returns the raw cookie value (`cookieAndHeaders.js:84-86`). So the B-2 comment's phrasing "the cookie is never read" is imprecise: the cookie value IS read and structure-parsed.
- The actual gate is the **selection** step (`sessionRequestFunctions.js:130-152`): with `allowedTransferMethod === "header"`, the header branch requires `accessTokens["header"]` (undefined for a cookie-only request → skip), and the cookie branch is guarded by `allowedTransferMethod === "any" || "cookie"` — which is `"header"`, so it is **never entered even if a structurally-valid cookie token exists**. Result: `accessToken = undefined`, `requestTransferMethod = undefined`.
- `recipeImplementation.getSession` with `accessTokenString === undefined` + `sessionRequired` (default true) throws `UNAUTHORISED "Session does not exist..."` **before any core call** (`recipeImplementation.js:71-88`). Optional session returns `undefined` (`:72-77`). Both happen with NO core/DB contact.
- Net: the security conclusion (cookie-only forged POST → rejected) holds. The B-2 doc reaches the right answer; only the "never read" wording is loose (the token is read then **not selected**). Not a defect — the posture is sound.

**(b) antiCsrf is genuinely not consulted for header-mode requests — CONFIRMED.**
- `sessionRequestFunctions.js:56-57`: `if (requestTransferMethod === "header") doAntiCsrfCheck = false;` — forced false for header transport.
- `:61-62`: `if (accessToken === undefined) doAntiCsrfCheck = false;` — a second independent force-false for the cookie-only (no selected token) case.
- So for BOTH a legit header request AND a cookie-only forged request, `doAntiCsrfCheck` is false regardless of the `antiCsrf` value. NONE vs VIA_CUSTOM_HEADER vs VIA_TOKEN produce identical behaviour today.

**Non-weakening — but note the real SDK default is NOT NONE in this topology.** `utils.js:128-140`: when `antiCsrf` is unset, the SDK computes it dynamically from `cookieSameSite`; with `cookieSameSite === 'none'` (this project's cross-origin prod path) the **default would have been `VIA_CUSTOM_HEADER`, not NONE**. So the explicit `'NONE'` IS a change from the implicit default in prod. It is nevertheless non-weakening **because antiCsrf is force-disabled under header transport** (the two force-false lines above) — the change is behaviourally inert today. Worth recording that the doc frames NONE as "the correct value" without noting the SDK default it displaces would have been VIA_CUSTOM_HEADER; this strengthens rather than undercuts the wave's own cookie-migration-trigger rationale (VIA_CUSTOM_HEADER is exactly the value to restore on a cookie reversion).

## Q2 — Is the VIA_CUSTOM_HEADER footgun claim TRUE? — **YES, verified twice.**
- `recipeImplementation.js:65-69`: `getSession` **throws** `"Since the anti-csrf mode is VIA_CUSTOM_HEADER getSession can't check the CSRF token. Please either use VIA_TOKEN or set antiCsrfCheck to false"` whenever `antiCsrfCheck !== false` AND `antiCsrf === "VIA_CUSTOM_HEADER"`.
- `sessionRequestFunctions.js:71-83`: with a selected token + non-GET + `VIA_CUSTOM_HEADER`, a missing `rid` header throws `TRY_REFRESH_TOKEN`.
- Under header transport this never fires (doAntiCsrfCheck forced false), but if transport ever reverts to cookie/'any' with a token present, VIA_CUSTOM_HEADER becomes a live footgun. Choosing NONE over VIA_CUSTOM_HEADER is justified. Claim accurate.

## Q3 — Does the regression test genuinely PROVE the guard? — **Mostly yes; one honest limitation.**
- **Real recipe, not a mock:** CONFIRMED. `beforeAll` calls the real `supertokens.init` with `Session.init` and drives real `Session.getSession()` on hand-built `PreParsedRequest`s. `framework: 'custom'` + unreachable `connectionURI` means every assertion resolves in the SDK transport/parse layer before any core call. Genuinely exercises shipped `supertokens-node@24.0.2` code — verified by running it (3/3 pass via `vitest.integration.config.ts`).
- **Assertion 1 (cookie-only forged → UNAUTHORISED):** passes for the right reason (undefined selected token → `"Session does not exist"`), verified against source.
- **Assertion 3 (legit bearer unregressed):** GENUINE and the strongest assertion. A structurally-valid v3 JWT in the Authorization header CLEARS the transport gate and reaches verification, failing with `TRY_REFRESH_TOKEN` (bad signature / unreachable core) — a DISTINCT error from the transport-gate `UNAUTHORISED`, and it explicitly asserts the message is NOT the transport rejection. This proves the header path is live and un-regressed by `antiCsrf: 'NONE'`. Strong.
- **LIMITATION (non-blocking) — the tripwire is weaker than the docstring claims.** The docstring says the test "will fail loudly the moment a cookie-only forged request can authenticate." I empirically probed this: mutating the test's `getTokenTransferMethod` from `'header'` to `'any'` (a regression toward cookie-acceptance) leaves **assertion 1 still GREEN**, because the forged cookie value (`'forged.prior.sAccessToken.value'`) is structurally-invalid and fails JWT parsing in EVERY transport mode — so it never demonstrates that the *header pin* is what rejects it. A separate probe with a structurally-VALID cookie JWT under `'any'` transport showed the SDK DOES select and verify the cookie token (`getInfoFromAccessToken: Returning TRY_REFRESH_TOKEN`), i.e. the cookie was accepted as a session token. So the true tripwire — a cookie that WOULD authenticate if the pin were removed — is not exercised. Also, the test config is a hand-copied mirror of prod `Session.init`, not an import of the production initializer, so it can silently drift from `src/auth/supertokens.config.ts`.
  - Why non-blocking: the test still correctly guards the `NONE` + header-transport combination it declares, all 3 assertions pass for sound reasons, and the wave ships a legibility/regression-LOCK with no live vuln. The gap is tripwire *sensitivity*, not a false posture.
  - Recommended follow-up (L-2 / a future hardening task, NOT a REWORK): (i) add an assertion using a structurally-VALID cookie JWT that passes under `'any'` but is rejected under the pinned `'header'` — this makes removing the header pin fail the suite; (ii) import the production `Session.init` config (or assert the test mirror equals prod) so config drift is caught.

## Q4 — Is the doc accurate + does it prevent regression? — **YES (with the Q1 default nuance).**
The ~52-line comment in `supertokens.config.ts:125-175` is accurate on every SDK claim I verified: the two force-false lines, the cookie-only rejection, the VIA_CUSTOM_HEADER footgun, and the "do NOT fix back to VIA_TOKEN" instruction with reasons. It correctly ties the value to wave-84's header-transport pin and names the pre-GA cookie-migration trigger + the regression test as the tripwire. The only accuracy gap is cosmetic: it does not mention that the SDK's implicit default in this cross-origin topology would have been VIA_CUSTOM_HEADER (not an absent/NONE default) — which, if anything, reinforces the doc's own migration guidance. Sufficient to prevent an uninformed "fix." Accurate.

## Q5 — BUILD-PRINCIPLES + risk to the live auth flow (WS handshake / header flow)?
- **No risk.** `common/ws-auth.ts:76` authenticates via `Session.getSessionWithoutRequestResponse(accessToken, undefined)` — it passes the token directly with `antiCsrfToken=undefined`, entirely bypassing the request-level transport-gate + antiCsrf pipeline. `antiCsrf: 'NONE'` cannot change WS behaviour. The `:71-75` cross-ref comment added by B-2 is accurate.
- The header (bearer) flow is unaffected — force-false on `doAntiCsrfCheck` for header transport means the value is never consulted there. Assertion 3 proves the header path still reaches verification.
- 821 unit tests pass (includes WS-auth + session-guard specs), confirming no live-flow regression.
- BUILD-PRINCIPLES: change is minimal, well-commented, single-purpose, no gold-plating; the doc comment length is justified by its regression-lock intent. Compliant.

## Checks (run by reviewer this turn)
- `pnpm --filter @studyhall/api test` → **821 passed (48 files).** (Note: the standard `test`/`vitest.config.ts` EXCLUDES `test/integration/**`, so the csrf spec is NOT in this count — expected.)
- `vitest run --config vitest.integration.config.ts test/integration/csrf-posture.spec.ts` → **3 passed** (DB-free, resolves before any core call).
- `tsc --noEmit` (apps/api) → **exit 0.**
- `pnpm biome ci apps packages` → **409 files checked, 0 errors.**
- DB-backed integration specs fail locally on ECONNREFUSED (no local Postgres) — expected and out of scope; the new spec is DB-free.

## Decision rationale
All five gate questions resolve in favour. The security-scope load-bearing question (Q1) is verified TRUE at the source level, including the subtle selection-vs-read mechanism and the non-weakening argument (with the VIA_CUSTOM_HEADER-default nuance surfaced). The one finding — the regression test's tripwire is less sensitive than its docstring claims (garbage forged cookie can't detect header-pin removal; config is a hand-mirror, not an import) — is a robustness improvement, not a posture defect, and is inappropriate to gate a legibility/no-live-vuln wave on. Logged as a follow-up for L-2 distill or a future hardening seed.

---

verdict_complete
rework_attempt_cap_remaining: 3
