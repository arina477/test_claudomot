# Wave 38 — T-9 Journey (gate)

## Phase 1 — head-tester gate: APPROVED
Suite honest: all 7 ACs have live verdicts; crux proven by real network capture + image decode (not asserted); integration on real Postgres; security carries genuine 401/IDOR/presigned negatives. F1 (dead settings button → avatar UI unreachable) correctly surfaced (not hidden) + is pre-existing/out-of-scope → routes to V-2, NOT a T-block REWORK. Verdict file: blocks/T/gate-verdict.md.

## Phase 2 — journey regen
- **Action 2 skip-eval:** wave_type=backend+auth (no ui/heavy), D-block did not fire (design_gap_flag=false), B-3 Frontend skipped (zero frontend files). → full crawl-regen SKIPPED per Action 2.
- **Targeted content update applied** (jenny P-4 carry-forward): flipped map avatar nodes Deferred/503 → LIVE; added new `GET /users/:userId/avatar` endpoint; added wave-38 annotation + F1 UI-unreachable caveat; version 0.24 → 0.25. (Factual node-status update for a documented journey node whose status materially changed; not a re-crawl.)

```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: true
journey_regen_skip_reason: "backend+auth wave; no ui/heavy, D-block absent, B-3 skipped — no crawl. Targeted node-status update applied for the avatar go-live."
crawl_routes_visited: 0
regen_diff:
  routes_added: ["GET /users/:userId/avatar (render redirect)"]
  routes_removed: []
  coverage_gaps: ["F1: avatar upload UI unreachable (dead settings entry button, pre-existing)"]
scenarios_run: 0
scenarios_failed: 0
regressions_critical: 0
regressions_significant: 0
journey_map_commit: pending-this-commit
findings:
  - {severity: major, journey: avatar-upload-ui, description: "F1 profile-settings entry button dead → avatar UI unreachable by real users (pre-existing) → V-2"}
```
