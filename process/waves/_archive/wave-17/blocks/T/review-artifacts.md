# Wave 17 — T-block review artifacts

**Block:** T (Test)
**Wave topic:** Real-Postgres `createServer` transaction-rollback integration test + reusable PG harness (TEST-INFRA wave; the deliverable IS a test)
**Block exit gate:** T-9
**Status:** gate-passed

## Block-exit handoff state

```yaml
test_block_status:    complete
stages_run:           [T-1, T-2, T-4, T-8, T-9]
stages_skipped:       [T-3 (no contract surface), T-5 (no UI/browser flow change), T-6 (non-UI wave), T-7 (not heavy)]
findings_total:       0   # new in T-block; B-6 carried M1/M2/L1-L3 + biome + 02fa8011 tracked for V-2
findings_critical:    0
findings_aggregate:   process/waves/wave-17/blocks/T/findings-aggregate.md
journey_map_commit:   0150b9a
ready_for_verify:     true
```

## Stage deliverables

| Stage | Deliverable file | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | process/waves/wave-17/stages/T-1-static.md | ci-verified | done | lint 0-err + typecheck green at C-1 (merge commit b0d8d22 → dfb65ca) |
| T-2 | process/waves/wave-17/stages/T-2-unit.md | ci-verified | done | 292 unit pass in CI; unchanged by this wave |
| T-3 | process/waves/wave-17/stages/T-3-contract.md | n/a | skipped | no API/SDK/contract surface (test-infra wave) |
| T-4 | process/waves/wave-17/stages/T-4-integration.md | ci-verified | done | THE layer for this wave — real-PG rollback test, 3/3 in CI; RATIFIED real |
| T-5 | process/waves/wave-17/stages/T-5-e2e.md | n/a | skipped | no UI/browser flow change (create-server flow structurally unchanged) |
| T-6 | process/waves/wave-17/stages/T-6-layout.md | n/a | skipped | non-UI wave |
| T-7 | process/waves/wave-17/stages/T-7-perf.md | n/a | skipped | not a heavy wave; no perf-sensitive surface |
| T-8 | process/waves/wave-17/stages/T-8-security.md | ci-verified | done | light — no auth surface; credential-hygiene confirmed (throwaway test DB) |
| T-9 | process/waves/wave-17/stages/T-9-journey.md | active | pending | block-exit gate stage |

## Block-specific context

- **Wave topic:** Real-Postgres `createServer` rollback integration test + reusable PG harness (single task `25523fb0`, merge `dfb65ca`, PR#29).
- **wave_type:** infra / test (NOT ui; backend integration test; no product code, schema, or dependency change).
- **Stages skipped (with reasons):** T-3 (no contract surface), T-5 (no UI/browser flow change), T-6 (non-UI wave), T-7 (not heavy, no perf surface).
- **Cumulative findings count:** 0 new in T-block (B-6 carried Medium/Low + pre-existing biome warnings tracked as known non-blocking).

## Findings aggregation

Findings written incrementally to `process/waves/wave-17/blocks/T/findings-aggregate.md`. Aggregate is the canonical V-2 input.

## Open escalations carried into gate

none

## Gate verdict log

<appended by fresh head-tester spawn at T-9 Action 1; one entry per attempt>
