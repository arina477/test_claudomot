# Wave 86 — P-0 Frame

## Discover
- **wave_db_id:** e3988df2-8b1b-4565-9efa-cbe483805959 (wave_number 86)
- **Prior-work:** wave-49 T-8 F-2 (source; pen-tester confirmed NO live CSRF vuln). Seed's cited coord supertokens.config.ts:93 is STALE (now EmailVerification.init; Session config at 108-221). wave-84 (last wave) pinned tokenTransferMethod:'header' — the interaction the seed predates.
- **Roadmap milestone:** unassigned (roadmap complete). waves.milestone_id NULL.
- **Spec-contract short-circuit:** no-prior-spec → full P-1..P-3.
- **Product decisions:** relates to the wave-84 BOARD decision (header transport + pre-GA cookie-migration trigger).

## Reframe
- **problem-framer: REFRAME** (antipatterns: symptom-vs-cause/wrong-layer + config-drift). `antiCsrf: VIA_TOKEN` is the WRONG value — a cookie-mode setting contradicting wave-84's header transport (structurally CSRF-safe: browser doesn't auto-attach the bearer token cross-site). Header transport confirmed pinned both ends (config:123 getTokenTransferMethod:()=>'header'; web:36). Premise NOT fully evaporated: a REAL residual cookie surface remains — `apps/api/src/common/ws-auth.ts:50-54` reads the sAccessToken COOKIE first (fallback handshake.auth.accessToken); all 4 socket clients connect withCredentials:true. That WS upgrade path is where anti-CSRF reasoning lives — and ws-auth.ts:72 ALREADY documents why it's CSRF-safe (one-time handshake, not form-submittable). Corrected: a legibility + regression-lock task, NOT a config-value change. If antiCsrf is set for the WS cookie surface, use VIA_CUSTOM_HEADER, NEVER VIA_TOKEN.
- **ceo-reviewer: PROCEED (SCOPE-REDUCTION).** The seed's INTENT (permanent regression-guard on the auth CSRF posture) IS worth doing: wave-84 recorded a pre-GA migration trigger (revisit cookies via custom domain before real users); if the app returns to cookie transport, anti-CSRF becomes load-bearing again + the regression test authored now makes that migration safe. Strip the wrong mechanism (drop VIA_TOKEN), keep the outcome. Correct value likely NONE (header mode). NOT BOARD (live-vuln settled wave-49; no new exposure; no transport decision reopened).
- **mvp-thinner:** n/a (not a product-feature milestone).
- **Merge:** both AGREE — REFRAME to the corrected scope. The NONE-vs-VIA_CUSTOM_HEADER value choice is technical-correctness (a genuine security-architecture micro-decision) → resolved by supertokens-integration at B-block, security-scope-tightened gate at P-4. NOT a blocking ESCALATE/BOARD.
- **Disposition:** PROCEED (REFRAMED; single-spec).
- **Final framing (corrected wave scope):** Auth CSRF-posture legibility + regression-lock (NOT the seed's literal antiCsrf:VIA_TOKEN):
  1. Set `antiCsrf` EXPLICITLY on Session.init to the value CORRECT for the pinned header transport (supertokens-integration determines: likely `NONE` since header transport is structurally CSRF-safe, OR `VIA_CUSTOM_HEADER` if defense-in-depth for the residual WS cookie surface warrants it — with a documented rationale). Do NOT set VIA_TOKEN.
  2. Add a REGRESSION TEST asserting a cookie-only forged cross-site state-changing POST (no bearer/custom-header) is REJECTED (401) — the permanent guard that survives a future cookie-transport migration.
  3. DOCUMENT (code comment + the wave-84 migration cross-ref) WHY header transport is structurally CSRF-safe + that the WS-upgrade cookie path (ws-auth.ts) is CSRF-safe by handshake design. 
  **P-4 security-scope-tightened gate applies (auth surface).** T-8 verifies the forged-POST rejection live + the explicit antiCsrf value.
