# Wave 14 — T-block review artifacts

**Block:** T (Test)
**Wave topic:** M3 real-time presence layer — /presence Socket.IO namespace (online/offline ref-count, snapshot-on-join), typing indicators (throttled/aggregated/channel-scoped), member-list panel (grouped/live/responsive)
**Block exit gate:** T-9
**Status:** gate-passed

## Stage deliverables

| Stage | Deliverable file | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | process/waves/wave-14/stages/T-1-static.md | ci-verified | done | APPROVED — 0 ts-bypasses, both static jobs green |
| T-2 | process/waves/wave-14/stages/T-2-unit.md | ci-verified + GAP-fill | done | APPROVED — gap closed +31 tests; mutation-sane; 251 green |
| T-3 | process/waves/wave-14/stages/T-3-contract.md | ci-verified | done | APPROVED — +37 Zod contract tests; 100% schema cov; gap closed |
| T-4 | process/waves/wave-14/stages/T-4-integration.md | mixed | done | APPROVED — boot-probe+e2e real-stack; integration-tier gap (MED) deferred; live proof @T-8 |
| T-5 | process/waves/wave-14/stages/T-5-e2e.md | active | done | APPROVED — member-list grouped Online/Offline, 2 real members, dots; live-consume @T-8 |
| T-6 | process/waves/wave-14/stages/T-6-layout.md | active | done | APPROVED — panel renders all breakpoints; collapses <1024; no token violations |
| T-7 | process/waves/wave-14/stages/T-7-perf.md | skipped | done | SKIPPED — not heavy (in-memory, no schema, small diff) |
| T-8 | process/waves/wave-14/stages/T-8-security.md | active | done | APPROVED-WITH-FINDING — scoping sound (fan-out+no-leak proven); F-4 HIGH typing-correctness for V-2 |
| T-9 | process/waves/wave-14/stages/T-9-journey.md | active | done | GATE PASS — journey regen (5390cb4); fresh head-tester APPROVED |

## Block-specific context

- **Wave topic:** M3 real-time presence layer (presence + typing + member-list panel)
- **wave_type:** ui + backend + auth (multi-valued — spec security carry: every presence/typing event membership-scoped; WS-upgrade auth reused from /messaging)
- **Stages skipped (with reasons):** T-7 perf (not heavy — in-memory presence state, no new schema, small diff)
- **Cumulative findings count:** 4 (F-1 closed, F-2 closed, F-3 MED open, F-3b LOW open) + 3 carried-in

## Findings aggregation

Findings written incrementally to `process/waves/wave-14/blocks/T/findings-aggregate.md`. Aggregate is the canonical V-2 input.

## Open escalations carried into gate

- B-6 accepted debt carried into the aggregate as known non-blocking items (M-1 perf scan, M-3 email '', M-4 schema wrapper) — to be confirmed against this wave's surface at T-9.

## Gate verdict log

<appended by fresh head-tester spawn at T-9 Action 1; one entry per attempt>


## Block-exit handoff (T-9)

```yaml
test_block_status:    complete
stages_run:           [T-1, T-2, T-3, T-4, T-5, T-6, T-8, T-9]
stages_skipped:       [T-7 (not heavy — in-memory presence, no schema, small diff)]
findings_total:       9   # F-1..F-6 + 3 carried-in KI
findings_critical:    0   # F-4 is HIGH (not critical); V-2 decides blocking
findings_high:        1   # F-4 typing structurally non-functional → V-2
findings_aggregate:   process/waves/wave-14/blocks/T/findings-aggregate.md
journey_map_commit:   5390cb4
gate_verdict:         PASS
ready_for_verify:     true
```
