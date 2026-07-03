# Wave 40 — T-9 Journey (gate)
## Phase 1 — head-tester: APPROVED
500→4xx + regression guard proven live (T-8/C-2, real prod responses); CI units assert status-code/state outcomes not mock counts; T-3/T-5/T-6/T-7 skips correct for a backend malformed-input-hardening wave; x-powered-by info correctly non-blocking (413-preservation observation handed to V).
## Phase 2 — journey regen SKIPPED (backend, no ui/heavy, no D-block, no B-3) → targeted annotation
- Added wave-40 annotation: F-T8-1/F-T8-2 RESOLVED (both 500s → 4xx, live-proven); noted the ParseUUIDPipe-avoidance design + regression guard. Version 0.26 → 0.27.
```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: true
journey_regen_skip_reason: "backend malformed-input-hardening; no ui/heavy, no D-block, no B-3. Targeted annotation (F-T8-1/2 resolved)."
regen_diff: {routes_added: [], routes_removed: [], coverage_gaps: []}
scenarios_run: 0
regressions_critical: 0
findings: []
```
