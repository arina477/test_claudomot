# Wave 47 — T-9 Journey (block-exit gate)

**Block:** T · **Stage:** T-9 · **Pattern:** B (active) · **Mode:** automatic

## Phase 1 — Fresh head-tester gate verdict
Fresh head-tester spawned (agentId a7bbaae57bb9982b3) → verdict written to process/waves/wave-47/blocks/T/gate-verdict.md.
**Verdict: APPROVED.** Independent source spot-checks confirmed honesty: no mock-the-SUT (T-4 WHERE clause matches source 1:1), real DTO-strip (email/who_can_dm not returned), real IDOR fence (callerId session-derived), T-5 headline is real UI clicks (not API shortcut). Declared coverage limits (nobody-exclusion + negative-isolation not live-proven; 2-member fixture gap) correctly low/info. Cascade: none.

## Phase 2 — Journey regen (UI wave → regen REQUIRED, Action 2)
Regen scope: annotation-update, NOT a full crawl-regen — no new route/screen this wave (new endpoint + rewired data source on the EXISTING DM surface). Per Action 4, updated the Direct Messages section of command-center/artifacts/user-journey-map.md:
- Retitled "LIVE + now STARTABLE via UI"; added last_updated_wave47 annotation.
- Routes/endpoints: added `GET /dm/candidates` (wave-47 NEW) as first-class entry.
- Flow: rewritten to the now-startable end-to-end path (open picker → lists candidates → select → Open DM → thread).
- T-9 verified: added the wave-47 startable-via-UI headline + privacy fence.
- Known defects: marked F-A CRITICAL + F7 MAJOR RESOLVED wave-47; kept F4/F6/F1/F3 open; added wave-47 low/info findings.

### regen diff vs prior map
- routes_added: [GET /dm/candidates]
- routes_removed: []
- coverage_gaps: [] (StartDmPicker's prior GET /servers/:id/members path removed from the picker but that endpoint still exists for server-member UI elsewhere — not a gap)

## Action 5 — Scenario smoke
user-scenarios/ directory ABSENT → scenario smoke N/A. Core-journey liveness smoke: web / 200, api /health 200, /dm/candidates unauth 401 (guarded). All primary flows (F1–F9) route-live; DM flow (the wave's flow) fully T-5-verified startable.

## Action 6 — Cross-wave regression check
No regression: the wave INTENTIONALLY changes the picker's data source (declared in spec seed 10967558). It RESOLVES a prior broken journey (unstartable DM entry), which is the opposite of a regression. F7 "Unknown user" resolved. No previously-working journey broke.

## Action 7 — Findings triage
All wave-47 findings low/info → V-2 (none critical, none block the map). Aggregated in findings-aggregate.md.

```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: false
journey_regen_skip_reason: ""
crawl_routes_visited: 0
regen_diff:
  routes_added: ["GET /dm/candidates"]
  routes_removed: []
  coverage_gaps: []
scenarios_run: 0
scenarios_failed: 0
regressions_critical: 0
regressions_significant: 0
journey_map_commit: "73824ac"
findings: []
```
