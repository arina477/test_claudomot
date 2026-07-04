# Wave 47 — T-block review artifacts

**Block:** T (Test)
**Wave topic:** M8 DMs STARTABLE — GET /dm/candidates (server co-members, who_can_dm-filtered, self+nobody-excluded, deduped) + StartDmPicker rewired to it + DmHome self-id fix. Cures wave-46 F-A (DMs shipped-but-unstartable) + F7 ("Unknown user").
**Block exit gate:** T-9
**Status:** gate-passed

## Stage deliverables

| Stage | Deliverable file | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | process/waves/wave-47/stages/T-1-static.md | ci-verified | done | PASS — 0 prod bypasses |
| T-2 | process/waves/wave-47/stages/T-2-unit.md | ci-verified | done | PASS — filters deferred to T-4/T-8 |
| T-3 | process/waves/wave-47/stages/T-3-contract.md | active | pending | GET /dm/candidates vs DmCandidateSchema, live api |
| T-4 | process/waves/wave-47/stages/T-4-integration.md | active | pending | getDmCandidates ↔ real Postgres via live api session |
| T-5 | process/waves/wave-47/stages/T-5-e2e.md | active | pending | HEADLINE — picker UI startable end-to-end |
| T-6 | process/waves/wave-47/stages/T-6-layout.md | active | pending | picker list + empty state @1280 dark |
| T-7 | process/waves/wave-47/stages/T-7-perf.md | active | pending | SKIP — small read-only endpoint |
| T-8 | process/waves/wave-47/stages/T-8-security.md | active | pending | candidate-privacy fence (co-members only), live |
| T-9 | process/waves/wave-47/stages/T-9-journey.md | active | pending | journey-map DM update + gate verdict |

## Block-specific context

- **Wave topic:** M8 DM entry-point completion — DMs now startable via picker
- **wave_type:** ui + backend + auth-adjacent (candidate-list privacy). No migration (read-only endpoint over existing tables).
- **Stages skipped (with reasons):** T-7 Perf (small read-only single-endpoint read; no perf-sensitive surface). T-6 layout conditional — decided at T-6 (picker chrome unchanged from wave-46; only data source changed).
- **Cumulative findings count:** 2 (both info)

## Findings aggregation

Findings written incrementally to `process/waves/wave-47/blocks/T/findings-aggregate.md`. Aggregate is the canonical V-2 input.

## Open escalations carried into gate

none

## Gate verdict log

<appended by head-tester at T-9 Action 1>


## Block-exit handoff

```yaml
test_block_status:    complete
stages_run:           [T-1, T-2, T-3, T-4, T-5, T-6, T-8, T-9]
stages_skipped:       ["T-7 (perf — wave_type not heavy; small read-only endpoint + data-source rename)"]
findings_total:       11
findings_critical:    0
findings_aggregate:   process/waves/wave-47/blocks/T/findings-aggregate.md
journey_map_updated:  true
ready_for_verify:     true
```
