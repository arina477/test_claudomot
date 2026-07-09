# Wave 83 — P-1 Decompose

## Maximum-size rubric (split when over)
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | > 60 | ~5 (apps/api/src/main.ts, apps/api/src/app.module.ts, a ThrottlerGuard/exception override, package.json for `helmet`, + tests) | no |
| New primitives | > 60 | ~2 (helmet middleware config; custom ThrottlerGuard 429-body override) | no |
| Estimated net LOC | > 5,000 | ~150 (helmet safe-header config + throttler override + T-8 header/body assertions) | no |
| Stage-4 working set | > 350K | small (single infra config file + app.module + tests) | no |
No maximum threshold trips.

## Wave type
`claimed_task_ids.length == 1` (875b97f4) → **single-spec**.

## Minimum floor
- single-spec floor: net LOC > 1,500. Estimate ~150 LOC → **BELOW FLOOR (trips)**.
- RESCOPE-AUTO-MERGE protocol CANNOT run: it requires an active milestone's `## Scope` prose to author expansion siblings — roadmap is COMPLETE (14/14 done, no in_progress/todo milestone). No pre-authored pool, no milestone to decompose from.
- **Floor WAIVED** per PRODUCT-PRINCIPLES #5 rationale: "The floor targets wasteful greenfield micro-waves; a feature with no valid split is exempt." This is a live-verified defense-in-depth bug fix in the founder's bug-fix phase, already at its natural coherent size (the P-0 reviewers' flat-header baseline slice), with NO valid merge candidate (no active milestone; bundling unrelated security tasks would contradict the P-0 framing + raise blast radius). Override-ship-anyway path per P-1 step 2b recursion guard; logged to product-decisions.md. No BOARD required (PRODUCT-5: floor-waive with no split candidate is exempt from escalation).

## Verdict
**PROCEED** (floor_waived: true — greenfield-micro-wave floor is inapplicable to a bug-fix wave with no merge candidate).

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []   # backend/infra-only: HTTP response headers + 429 body config in main.ts/app.module; no UI surface touched. D-block skips.
```

## Footer
```yaml
wave_type: single-spec
verdict: PROCEED
floor_merge_attempt: 0        # merge protocol un-runnable (no active milestone); floor waived per PRODUCT-5
floor_waived: true
siblings_created: []
design_gap_flag: false
```
