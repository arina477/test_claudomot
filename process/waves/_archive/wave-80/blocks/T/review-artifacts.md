# Wave 80 — T-block review artifacts

**Block:** T (Test)
**Wave topic:** M13 leg-3b — presence (online-status) privacy toggle (showPresence)
**Block exit gate:** T-9
**Status:** gate-passed

## Stage deliverables

| Stage | Deliverable file | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | process/waves/wave-80/stages/T-1-static.md | ci-verified | done | seeded at T-1 Action 0 |
| T-2 | process/waves/wave-80/stages/T-2-unit.md | ci-verified | done | |
| T-3 | process/waves/wave-80/stages/T-3-contract.md | active | done | live PUT/GET partial probes |
| T-4 | process/waves/wave-80/stages/T-4-integration.md | ci-verified | done | honor two-subject + privacy-events specs |
| T-5 | process/waves/wave-80/stages/T-5-e2e.md | active | done | two-client presence toggle (MAKE-OR-BREAK) |
| T-6 | process/waves/wave-80/stages/T-6-layout.md | active | done | presence toggle DS tokens |
| T-7 | process/waves/wave-80/stages/T-7-perf.md | active | skipped | SKIP (light wave) |
| T-8 | process/waves/wave-80/stages/T-8-security.md | active | done | CROWN JEWEL — honor + no-clobber + own-visibility + 401 |
| T-9 | process/waves/wave-80/stages/T-9-journey.md | active | done | gate + journey-map page-16 update |

## Block-specific context

- **Wave topic:** presence privacy toggle (showPresence only; read-receipts deferred)
- **wave_type:** ui + backend + auth (privacy) — single-spec (task 3038a4bc)
- **Merge SHA:** 4795638125301c0685864a3a5f58001373720059
- **Prod:** web https://web-production-bce1a8.up.railway.app · api https://api-production-b93e.up.railway.app
- **Stages skipped (with reasons):** T-7 (light wave, no heavy/perf-sensitive diff) — recorded at T-7.
- **Cumulative findings count:** 0 at start.

## Findings aggregation

Findings written incrementally to `process/waves/wave-80/blocks/T/findings-aggregate.md`. Aggregate is the canonical V-2 input.

## Open escalations carried into gate

none

## Gate verdict log

<appended by fresh head-tester spawn at T-9 Action 1>


## Block-exit handoff

```yaml
test_block_status:    complete
stages_run:           [T-1, T-2, T-3, T-4, T-5, T-6, T-8, T-9]
stages_skipped:       [{stage: T-7, reason: "not heavy; additive boolean + reused presence fan-out, no perf-sensitive surface"}]
findings_total:       2
findings_critical:    0
findings_aggregate:   process/waves/wave-80/blocks/T/findings-aggregate.md
journey_map_commit:   b03c657eebcf2a33423bed208f57105e412e6a3d
ready_for_verify:     true
```
