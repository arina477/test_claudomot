# T-9 — Journey (wave-51)

## Phase 1 — head-tester gate
**APPROVED** (attempt 1, head-tester a658d42a). Crux verified live (DmThread 632/888px measured, ChannelSidebar absent on DM / present server view); B-6 backdrop fix solid; T-1/T-2 CI-verified genuine; T-3/T-4/T-7/T-8 skips defensible (single client component, no contract/schema/service/auth surface). **F-1 confirmed PRE-EXISTING** (source-verified: ServerRail selectServer/Home don't clear dmHomeActive; unmodified by this wave; pre-wave 01399a5^ renders the same ternary) → V-2, no rework. V-2 fix target: ServerRail selectServer/Home should setDmHomeActive(false).

## Phase 2 — journey regen (REQUIRED — UI wave)
- Action 2: regen required (UI wave). Not skipped.
- Action 3-4: last_updated_wave51 annotation added to user-journey-map.md (commit b535b401f9f887af6e8d4bc027d7dafcc0059700, pushed) — DM 3-panel fix, measured geometry, F-1. No new route/screen (annotation on existing DM surface).
- Action 5 scenario smoke: no user-scenarios/ → none.
- Action 6 cross-wave regression: additive gate; server view unchanged (T-5 S3); no journey broke.

## Findings triage (Action 7)
F-1 (Medium, pre-existing) carried to V-2 (already in findings-aggregate).

```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: false
crawl_routes_visited: 1
regen_diff: {routes_added: [], routes_removed: [], coverage_gaps: []}
scenarios_run: 0
regressions_critical: 0
journey_map_commit: b535b401f9f887af6e8d4bc027d7dafcc0059700
findings: [{id: F-1, severity: medium, note: pre-existing DM↔server return race → V-2}]
```
