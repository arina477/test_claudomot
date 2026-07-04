# Wave 43 — T-9 Journey (gate)

## Phase 1 — head-tester: APPROVED
Suite honest: T-4 22/22 real-PG authz cases green in CI (run 28693093402 at deployed e7f1f7a); IDOR/serverId-derivation + two-user 403 proven; T-4 caught+fixed a real defense-in-depth gap (createSession guard); T-6 major responsive is compressed-not-broken (1280/1440 clean) → non-blocking V-2; T-5 student-BLOCK honestly marked (RBAC at T-4); T-7 skip legitimate. Verdict at blocks/T/gate-verdict.md.

## Phase 2 — journey regen (UI wave, D-block fired → required)
New in-shell "Schedule" surface on /servers/:id — no new top-level route → targeted annotation (T-5/T-6 live-crawled the surfaces). Added the wave-43 class scheduling flow (5 endpoints + calendar/authoring/detail + recurrence) to user-journey-map.md; version 0.29 → 0.30.

```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: false
journey_regen_note: "ui wave; new in-shell Schedule surface (no new route) → targeted annotation (T-5/T-6 live-crawled)"
crawl_routes_visited: 1
regen_diff:
  routes_added: []
  routes_removed: []
  coverage_gaps: ["student read-only calendar view E2E (needs non-organizer fixture c50f3040)"]
scenarios_run: 0
scenarios_failed: 0
regressions_critical: 0
regressions_significant: 0
journey_map_commit: pending-commit-below
findings: []
```
