# Wave 86 — P-1 Decompose

## Maximum-size rubric (split when over)
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | > 60 | ~3 (apps/api/src/auth/supertokens.config.ts [explicit antiCsrf + doc comment]; a regression integration/e2e test; possibly ws-auth.ts doc comment) | no |
| New primitives | > 60 | 0-1 (an antiCsrf config value; a forged-POST test) | no |
| Estimated net LOC | > 5,000 | ~60 (1 config line + doc comments + a cookie-only-forged-POST regression test) | no |
| Stage-4 working set | > 350K | small | no |
No maximum threshold trips.

## Wave type
`claimed_task_ids.length == 1` (f8fb8023) → **single-spec**. wave_type: [auth] (security-scope).

## Minimum floor
- single-spec floor: net LOC > 1,500. Estimate ~60 → **BELOW FLOOR (trips)**.
- RESCOPE-AUTO-MERGE un-runnable (roadmap complete → no active milestone).
- **Floor WAIVED** per PRODUCT-PRINCIPLES #5 (floor targets wasteful greenfield micro-waves; a security-hardening/legibility bug-fix wave with no valid merge candidate is exempt). At natural coherent size (an explicit config value + its regression guard + documentation). No BOARD (PRODUCT-5).

## Verdict
**PROCEED** (floor_waived: true; REFRAMED scope — explicit header-correct antiCsrf + regression-lock + docs; NOT VIA_TOKEN).

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []   # backend/auth-config only (SuperTokens Session.init antiCsrf + a regression test + doc comments). No UI. D-block skips.
```

## Footer
```yaml
wave_type: single-spec (auth)
verdict: PROCEED
floor_merge_attempt: 0
floor_waived: true
siblings_created: []
design_gap_flag: false
security_scope: true (P-4 security-scope-tightened gate applies; antiCsrf value = supertokens-integration call at B-block)
```
