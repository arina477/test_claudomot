# Wave 84 — P-1 Decompose

## Maximum-size rubric (split when over)
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | > 60 | ~6 (apps/api/src/auth/supertokens.config.ts, apps/web/src/auth/supertokens.ts, apps/api/src/common/security-headers.ts [CSP], possibly a CSP-policy module, + tests) | no |
| New primitives | > 60 | ~2 (an explicit CSP policy; token-TTL config) | no |
| Estimated net LOC | > 5,000 | ~200 (CSP policy + directives + Session.init tokenTransferMethod:header + accessTokenValidity + T-8 cross-origin/WS/CSP assertions) | no |
| Stage-4 working set | > 350K | small | no |
No maximum threshold trips.

## Wave type
`claimed_task_ids.length == 1` (9535895f) → **single-spec**.

## Minimum floor
- single-spec floor: net LOC > 1,500. Estimate ~200 → **BELOW FLOOR (trips)**.
- RESCOPE-AUTO-MERGE un-runnable (roadmap complete → no active milestone to author expansion siblings from).
- **Floor WAIVED** per PRODUCT-PRINCIPLES #5 (floor targets wasteful greenfield micro-waves; a bug-fix/hardening wave with no valid merge candidate is exempt). This is a BOARD-ratified, coherent security-hardening bundle at its natural size. Override-ship-anyway per P-1 step 2b recursion guard; logged (see product-decisions BOARD entry). No BOARD needed for the floor-waive itself (PRODUCT-5).

## Verdict
**PROCEED** (floor_waived: true; scope = BOARD Option B).

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []   # backend/config: SuperTokens Session.init transport + TTL, an explicit CSP response-header policy. No NEW UI surface (CSP affects the existing web app but adds no page/component/flow). D-block skips.
```
Note: CSP is the load-bearing/risky item (like wave-83's helmet-CORS) — an over-strict policy could break the SPA/cross-origin-fetch/WS. P-2 pins the exact directives + the T-8 cross-origin+WS+CSP-violation proof; P-3 routes it to supertokens-integration (owns main.ts/CSP + Session.init).

## Footer
```yaml
wave_type: single-spec
verdict: PROCEED
floor_merge_attempt: 0
floor_waived: true
board_decision: wave-84-session-token-transport (7/7 Option B)
siblings_created: []
design_gap_flag: false
```
