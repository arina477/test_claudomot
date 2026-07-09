# Wave 86 — P-3 Plan

## Approach

### Architecture deltas
- **apps/api/src/auth/supertokens.config.ts (Session.init ~:108-221) — set `antiCsrf` EXPLICITLY.** supertokens-integration determines the correct value for header transport against installed supertokens-node@24:
  - **Likely `antiCsrf: 'NONE'`** — in header/bearer mode, CSRF protection is structural (bearer token not auto-attached cross-site; SuperTokens reads the token from the Authorization header, so a cookie-only request has no token). `NONE` is the CORRECT + safe explicit value for header transport, NOT a weakening.
  - **Alternative: `VIA_CUSTOM_HEADER`** — if defense-in-depth for the residual WS cookie surface (ws-auth.ts) is judged warranted. supertokens-integration decides + documents WHY.
  - **NEVER `VIA_TOKEN`** (cookie-mode value; the seed's wrong ask).
  - Add a doc comment (matching the existing wave-84 comment style in the same block) explaining the CSRF-safety-by-header-transport + the wave-84 cross-ref + the WS-handshake note.
  - **Alternative considered:** leave antiCsrf UNSET (rely on the SDK default). REJECTED — the whole point is LEGIBILITY (make the posture explicit so it can't silently regress); an unset value is exactly the "silent" state the seed flagged.
- **A regression test** (apps/api/test/integration/ or a DTO/e2e test) — the permanent guard: cookie-only forged cross-site POST (no bearer/anti-CSRF header) → 401/403. supertokens-integration constructs it realistically against how header mode + the sAccessToken cookie interact on the deployed/local api.
- **Failure domain:** auth config — the ONLY risk is breaking the legitimate bearer-authed flow or the WS handshake with a wrong antiCsrf value. Mitigated by AC3 (legit request still 200 + WS still auths) + the T-8 live verification.

### Data model / API contracts / deps
None. No endpoint/type/schema change. No new deps. SuperTokens Session.init antiCsrf option only.

### SDK pre-build checklist (SuperTokens)
supertokens-integration MUST verify against installed supertokens-node@24 types: the `antiCsrf` option name + valid enum values (`NONE`|`VIA_TOKEN`|`VIA_CUSTOM_HEADER`) + how antiCsrf interacts with header transport (whether it's even consulted for header-mode requests) + whether header mode sets an sAccessToken cookie at all (determines the regression-test construction). Do NOT code against assumed behavior — verify.

## Plan

### File-level steps
**B-0:** branch `wave-86-anticsrf-explicit`; no deps, no schema.
**B-2 Backend:**
- `apps/api/src/auth/supertokens.config.ts` — modify Session.init: explicit `antiCsrf` (value determined + documented) + the doc comment. **Specialist: supertokens-integration.**
- `apps/api/src/common/ws-auth.ts` (optional) — a one-line cross-ref comment if the WS CSRF-safety note should reference the new explicit posture. **supertokens-integration** (only if warranted; don't churn).
- Regression test (apps/api/test/integration/csrf-posture.spec.ts or similar) — cookie-only forged POST → rejected; legit bearer → 200. **Specialist: supertokens-integration** (authors alongside per BUILD-9). Prefer DB-free if feasible (a supertest/fetch against a bootstrapped app or a session-verify unit).
**B-5 Verify:** CI-identical (lint, typecheck, api test, build, boot-probe).

### Specialist routing (validated vs AGENTS.md)
- **supertokens-integration** — owns SuperTokens Session.init config + the CSRF/header-transport interaction + the auth regression test (used waves 82/84). Exists in AGENTS.md.
- **penetration-tester** (T-8, optional) — could construct the live forged-POST probe at T-8 (wave-49 used it). Exists in AGENTS.md.

### Parallelization map
- Single config file + a test; serial (test after config). No parallelism.

### Self-consistency sweep
1. All 4 ACs → steps: AC1 (explicit antiCsrf value) + AC4 (doc) → config edit; AC2 (regression test) → the test; AC3 (no regression) → covered by the legit-bearer test + T-8 WS check. ✓
2. Every step has a specialist. ✓
3. No file in multiple batches. ✓
4. design_gap_flag false referenced. ✓
5. Architecture delta has alternatives (NONE vs VIA_CUSTOM_HEADER; unset rejected). ✓
6. No contracts/deps. ✓
8. SDK checklist present (verify antiCsrf option + header-mode interaction + cookie-set behavior). ✓
Sweep clean. Security-scope: P-4 security-scope-tightened gate + T-8 live forged-POST verification.
