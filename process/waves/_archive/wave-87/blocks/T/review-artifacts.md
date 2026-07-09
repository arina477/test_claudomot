# Wave 87 — T-block review artifacts

**Block:** T (Test) · **Wave topic:** default-role stamping on server-member joins (behavior-preserving) · **Block exit gate:** T-9 · **Status:** gate-passed

## Stage deliverables
| Stage | Deliverable | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | stages/T-1-static.md | ci-verified | in-progress | seeded |
| T-2 | stages/T-2-unit.md | ci-verified | pending | |
| T-3 | stages/T-3-contract.md | — | pending | expect SKIP (no contract surface change) |
| T-4 | stages/T-4-integration.md | active | pending | add pg-harness join→default-role test |
| T-5 | stages/T-5-e2e.md | — | pending | expect SKIP (no user-visible change) |
| T-6 | stages/T-6-layout.md | — | pending | expect SKIP (non-UI) |
| T-7 | stages/T-7-perf.md | — | pending | expect SKIP (not heavy) |
| T-8 | stages/T-8-security.md | — | pending | expect SKIP (not-a-security-change, verified) |
| T-9 | stages/T-9-journey.md | active | pending | gate; retire F67-T5-2 + analytics note |

## Block-specific context
- **wave_type:** backend (single-spec)
- **Stages skipped:** <populated as block runs>
- **Cumulative findings:** 0

## Gate verdict log
<T-9 head-tester>

## Block-exit handoff
```yaml
test_block_status:    complete
stages_run:           [T-1, T-2, T-4, T-9]
stages_skipped:       [T-3 (no contract surface), T-5 (no user-visible change), T-6 (non-UI), T-7 (not heavy), T-8 (not-a-security-change, verified)]
findings_total:       2
findings_critical:    0
findings_aggregate:   process/waves/wave-87/blocks/T/findings-aggregate.md
ready_for_verify:     true
```
