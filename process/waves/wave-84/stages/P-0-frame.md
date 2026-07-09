# Wave 84 — P-0 Frame

## Discover
- **wave_db_id:** a0b4723c-0c33-4369-ae1b-917413c790ad (wave_number 84)
- **Prior-work:** wave-72 T-8 + jenny FINDING-1/F2 (source of the seed). No prior wave fixed it. wave-83 (just shipped) DISABLED helmet's default CSP for cross-origin safety — relevant: this wave must enable an EXPLICIT cross-origin-safe CSP, not re-enable helmet's default.
- **Roadmap milestone:** unassigned (roadmap complete). waves.milestone_id NULL.
- **Spec-contract short-circuit:** no-prior-spec → full P-1..P-3.
- **Product decision:** TIER-3, resolved by BOARD (see Reframe).

## Reframe
- **Original seed framing:** switch tokenTransferMethod to 'cookie' (httpOnly) OR document header mode. Fork with security + reliability consequences.
- **problem-framer:** ESCALATE — Option A (cookie switch) is a symptom-layer fix trading MEDIUM XSS for HIGH auth-reliability risk (cross-SITE SameSite=None cookies blocked by Safari ITP / degraded by Chrome 3p-cookie deprecation); header mode is architecturally correct for cross-origin SPA; the real XSS fix is CSP. Routes to BOARD.
- **ceo-reviewer:** SCOPE-REDUCTION + BOARD — Option A is "3/10 that looks like 9/10"; disciplined 9/10 = keep header + document + compensate.
- **mvp-thinner:** n/a (not a product-feature milestone).
- **BOARD (Tier-3, automatic mode, 6+/7 strict):** 7/7 unanimous **APPROVE Option B**. No hard-stops. founder-proxy found strong recorded precedent (product-decisions line-73 item (6) JWT-cross-origin-fallback + item (10) SameSite=Lax = exactly B). Full votes: escalations/board-wave-84-session-token-transport.md.
- **Disposition:** PROCEED with **Option B** (BOARD-ratified).
- **Final framing (reframed wave scope):** "Session-token XSS-hardening — keep header transport, ship compensating controls." Deliverables:
  1. Explicitly set `tokenTransferMethod:'header'` on both Session.init() (make the accepted cross-origin posture unambiguous, not a reliance on the 'any' default).
  2. **Enable a cross-origin-SAFE explicit CSP** on the api (and/or web) — allow the api origin in connect-src + the app's own script/style/img; MUST NOT break the SPA, the cross-origin credentialed fetch, or the 4 Socket.IO WS namespaces (the wave-83 cross-origin risk class). This is the meaty/risky piece — needs its own careful T-8 cross-origin + WS proof.
  3. Short access-token TTL (SuperTokens accessTokenValidity) + confirm refresh rotation enforced.
  4. (DONE at P-0) Recorded the accepted posture + config-drift + pre-GA migration trigger in product-decisions.md.
  **T-8 must prove:** CSP present + correct, SPA loads with 0 CSP-violation console errors, cross-origin credentialed fetch + all 4 WS namespaces still work, header transport confirmed, short TTL in effect.
