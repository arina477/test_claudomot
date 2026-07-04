# Wave 42 — T-9 Journey (gate)

## Phase 1 — head-tester: APPROVED
Authz-critical surface genuinely proven (CI run 28689560816 independently verified — 14 submission integration cases PASS on real Postgres, not skipped; T-8 live IDOR anti-spoof). No test-honesty defects. Both accepted gaps (student-submit-button UI blocked on broken fixture B → task c50f3040; attachment-presign not integration-covered → verified live at T-8) correctly non-blocking LOW findings backed by behavior proven at the right layer. Verdict at blocks/T/gate-verdict.md.

## Phase 2 — journey regen (UI wave, D-block fired → required)
Submission collect/return is an in-page extension of the Assignments panel (page-14, /servers/:id/assignments) — NO new route → targeted annotation (T-5/T-6 crawled the deployed submission surfaces; not a full re-crawl). Added the wave-42 submission lifecycle (4 endpoints + roster/return affordances + no-grading) to user-journey-map.md; version 0.28 → 0.29.

```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: false
journey_regen_note: "ui wave; in-page extension of page-14 assignments panel → targeted annotation (T-5/T-6 live-crawled the affordances, not a full crawl)"
crawl_routes_visited: 1
regen_diff:
  routes_added: []
  routes_removed: []
  coverage_gaps: ["student submit-button UI E2E (needs non-organizer fixture c50f3040)"]
scenarios_run: 0
scenarios_failed: 0
regressions_critical: 0
regressions_significant: 0
journey_map_commit: pending-commit-below
findings: []
```
