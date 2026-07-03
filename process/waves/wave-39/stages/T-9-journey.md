# Wave 39 — T-9 Journey (gate)
## Phase 1 — head-tester: APPROVED
Suite honest: crux proven by real live round-trip (not asserted); logout is genuine server-side revocation (401-after); T-3/T-4/T-7 skips correct (not mock-substituted); T-6 popover + keyboard coverage adequate; 0 flakes, no coverage theater.
## Phase 2 — journey regen (ui+auth wave → required, but shell-affordance = targeted annotation not full crawl; T-5 live-crawled the affordance)
- Flipped the "Avatar real-upload round-trip" node ⚠️UI-entry-unwired → ✅ fully reachable (UI-only proof).
- Added NEW "Shell user menu (ChannelSidebar footer)" node (role=menu popover, 3 items, logout now live).
- wave-39 annotation added; version 0.25 → 0.26.
```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: false
crawl_routes_visited: 0  # targeted annotation; T-5 live-verified the affordance + existing routes
regen_diff:
  routes_added: []  # no new route; new shell-overlay affordance + logout reachability
  routes_removed: []
  coverage_gaps: []
scenarios_run: 0
scenarios_failed: 0
regressions_critical: 0
regressions_significant: 0
journey_map_commit: pending-this-commit
findings: []
```
