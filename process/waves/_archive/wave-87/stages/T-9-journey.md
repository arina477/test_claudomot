# Wave 87 — T-9 Journey (gate)

## Phase 1 — head-tester (fresh spawn): APPROVED
Independently verified against primary sources: T-4 integration test genuinely EXECUTED green in CI against live Postgres (PR #108 required `test` job SUCCESS on 509aae84; CI provisions postgres:16 so skipIf did not skip); AC unit tests assert captured insert values (not mock counts); T-8 not-a-security-change skip holds (all-false default role ≤ NULL at RBAC layer, zero privilege delta); T-3/T-5/T-6/T-7 skips legitimate. Zero critical/high. Verdict at blocks/T/gate-verdict.md.

## Phase 2 — journey regen + scenario smoke
- **Regen SKIP evaluation (Action 2):** all three conditions hold → regen skipped. wave_type=backend (not ui/heavy); D-block did not fire (design_gap_flag=false); B-3 frontend skipped (the only web file touched was study-timer.test.tsx, a test-only flake fix — no rendered surface changed). Canonical journey map remains prior wave's.
- **Targeted map update (finding retirement):** F67-T5-2 (NULL-role-on-join, open since wave-67) marked **RESOLVED** at user-journey-map.md:303 — wave-87 converged new joins onto the default role; NULL confirmed intended-safe; verified by the PR #108 integration test. (The separate open finding F67-T5-1 memberCount-always-0 left untouched — different defect.)
- **Scenario smoke (Action 4/5):** no `user-scenarios/` directory exists — none to run.
- **Cross-wave regression check:** N/A (regen skipped; no UI crawl). No behavior change to regress (behavior-preserving).

```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: true
journey_regen_skip_reason: "backend wave_type; design_gap_flag=false; B-3 skipped (only web change was a test-only flake fix)"
crawl_routes_visited: 0
regen_diff: { routes_added: [], routes_removed: [], coverage_gaps: [] }
scenarios_run: 0
scenarios_failed: 0
regressions_critical: 0
regressions_significant: 0
journey_map_commit: 3e7315fa3dac4867f4f64251cc929e589d64ad24
findings:
  - {severity: none, journey: "join server", description: "F67-T5-2 retired (resolved); no new regressions"}
```
