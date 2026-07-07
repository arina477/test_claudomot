# Wave 72 — T-block review artifacts

**Block:** T (Test)
**Wave topic:** Account self-deletion / right-to-erasure (soft-delete + both re-auth doors + owner guard + Danger-Zone UI)
**Block exit gate:** T-9
**Status:** in-progress

## Stage deliverables

| Stage | Deliverable file | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | process/waves/wave-72/stages/T-1-static.md | ci-verified | done | 3 test-only `as unknown as` casts; no prod bypasses |
| T-2 | process/waves/wave-72/stages/T-2-unit.md | ci-verified | done | api 764 + web 663 green on e5bfba1 |
| T-3 | process/waves/wave-72/stages/T-3-contract.md | ci-verified | done | DeleteAccount DTO contract |
| T-4 | process/waves/wave-72/stages/T-4-integration.md | ci-verified | done | account-deletion.spec.ts pg-harness (4 security paths) |
| T-5 | process/waves/wave-72/stages/T-5-e2e.md | active | pending | delete flow live |
| T-6 | process/waves/wave-72/stages/T-6-layout.md | active | pending | Danger-Zone UI |
| T-7 | process/waves/wave-72/stages/T-7-perf.md | active | skipped | not a heavy wave |
| T-8 | process/waves/wave-72/stages/T-8-security.md | active | pending | CRITICAL: no-IDOR, both doors, owner-block, PII-scrub |
| T-9 | process/waves/wave-72/stages/T-9-journey.md | active | pending | gate |

## Block-specific context

- **Wave topic:** account self-deletion (right-to-erasure)
- **wave_type:** auth + backend + ui
- **Stages skipped (with reasons):** T-7 perf (not heavy; small additive diff)
- **Cumulative findings count:** 0 at start

## Findings aggregation

Findings written incrementally to `process/waves/wave-72/blocks/T/findings-aggregate.md`. Aggregate is V-2's canonical input.

## Open escalations carried into gate

none

## Gate verdict log

<appended by fresh head-tester spawn at T-9 Action 1>
