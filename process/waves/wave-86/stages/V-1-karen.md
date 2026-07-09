# V-1 Karen — wave-86 source-claim verification

**Wave:** SuperTokens antiCsrf made EXPLICIT ('NONE', header transport) + strengthened CSRF regression guard. Spec task f8fb8023.
**Scope:** Truth-of-claims only. Merged main (PR #106 squash `83c308a6`) + deployed state (`a9556248`, deployment `0f38d1fe`).

## Verdict: APPROVE

All six load-bearing claims VERIFIED TRUE on merged `main` and the deployed surface. No WRONG, no UNVERIFIED.

---

## Per-claim findings

### 1. antiCsrf explicit on main — VERIFIED
`apps/api/src/auth/supertokens.config.ts` (confirmed on `main` via `git show main:...`):
- Shared const at top of file, `apps/api/src/auth/supertokens.config.ts:27-30`:
  ```
  export const CSRF_POSTURE = {
    tokenTransferMethod: 'header',
    antiCsrf: 'NONE',
  } as const;
  ```
- `getTokenTransferMethod: () => CSRF_POSTURE.tokenTransferMethod` — `supertokens.config.ts:148`.
- `antiCsrf: CSRF_POSTURE.antiCsrf` — `supertokens.config.ts:215`.
- Value is `'NONE'` (NOT `VIA_TOKEN`), sourced from the shared const, not a hand-copy. `as const` pins the literal. **VERIFIED.**

### 2. Regression test on main + is a REAL tripwire — VERIFIED
`apps/api/test/integration/csrf-posture.spec.ts` (confirmed on `main`):
- Imports the shared const, not a mirror: `import { CSRF_POSTURE } from '../../src/auth/supertokens.config';` — `csrf-posture.spec.ts:75`; used at `:168` (`antiCsrf: CSRF_POSTURE.antiCsrf`) and `:185` (`initSuperTokensWith(CSRF_POSTURE.tokenTransferMethod)`).
- Forged cookie is a **structurally-valid** access-token JWT (v3 header/payload/sig), `buildStructurallyValidAccessTokenJwt()` — `csrf-posture.spec.ts:116-129`; reused as `FORGED_COOKIE_VALUE` — `:134`.
- `'any'`-transport CONTROL block proves the same cookie IS read under `'any'` (reaches verification → `TRY_REFRESH_TOKEN`) but rejected under `'header'` (transport gate → `UNAUTHORISED`) — `csrf-posture.spec.ts:272-300` (control), contrasted with header block `:193-220`. A transport-pin flip to `'any'`/`'cookie'` therefore FLIPS the header-block outcome and breaks the assertions (`:208-219`). Genuine tripwire, not stale-green.
- No `.skip` / `.only` present (grep on `main` returned only `describe(`/`it(`). 4 `it` blocks, 14 `expect` assertions. **VERIFIED.**

### 3. Doc accuracy — VERIFIED
antiCsrf rationale block in `supertokens.config.ts`:
- Prior UNSET default resolved to VIA_CUSTOM_HEADER (cross-origin prod `cookieSameSite='none'`) + NONE inertness CONDITIONAL on the header pin: `supertokens.config.ts:172-185` ("'NONE' is INERT today ONLY BECAUSE the 'header' transport pin above makes antiCsrf unreachable — NOT because the previous UNSET default was already NONE... resolves the UNSET default to VIA_CUSTOM_HEADER... THE INERTNESS IS CONDITIONAL ON THE HEADER PIN").
- "do NOT set VIA_TOKEN": `supertokens.config.ts:187-191` ("WHY NOT 'VIA_TOKEN'... A future reviewer must NOT \"fix\" this back to VIA_TOKEN"). **VERIFIED.**

### 4. Deploy live — VERIFIED
- `https://api-production-b93e.up.railway.app/health` → **HTTP 200** (live check this session).
- T-8 deliverable (`process/waves/wave-86/stages/T-8-security.md:1`) records LIVE deploy `0f38d1fe`; C-1 commit chain ties deploy to `a9556248` (git log). T-8 confirms live forged-POST rejection: `forged_cookie_only_post: PASS` — cookie-only cross-site POST (`Cookie:sAccessToken=<valid>`, `Origin:evil`, no Authorization/anti-CSRF header) → 401; airtight same-route control (Bearer→201, cookie-only→401, no-auth→401) — `T-8-security.md:7`. **VERIFIED.**

### 5. Tests green — VERIFIED
- csrf-posture spec has 4 `it` assertions across 2 describe blocks (3 header-block + 1 control), 14 `expect()` calls. Matches the claimed "4/4". T-block gate closed APPROVED (commit `2a0cecc7` "antiCsrf posture live-proven"). The 821 api-unit figure is a CI/B-6 count outside this file; file-level 4/4 confirmed here. **VERIFIED.**

### 6. Antipatterns — VERIFIED
- "config-only backend, no schema/UI/contract": accurate. Change is a shared const + two Session.init references + one integration spec; no migration, no DTO/contract, no UI touched. **Accurate.**
- antiCsrf value correct (`NONE` for header transport): SDK-grounded rationale (`supertokens-node@24.0.2`) is coherent and matches the test's demonstrated behaviour (transport gate rejects cookie-only before antiCsrf is consulted; `VIA_CUSTOM_HEADER`/`VIA_TOKEN` are cookie-mode values, inert-or-harmful under the header pin). B-6 verified vs SDK; T-8 live-proved the resulting posture. **Correct.**

---

## Notes (non-blocking, do not affect verdict)
T-8 filed two out-of-scope operational findings to backlog (`T-8-security.md:14-16`): PATCH /servers/:id returns 500 on malformed body (should be 400) + no server-delete route; and a benign leftover e2e test row needing out-of-band DB cleanup. Both correctly scoped OUT of this CSRF wave and backlogged — not wave-86 regressions.
