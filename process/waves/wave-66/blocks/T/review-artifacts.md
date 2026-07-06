# Wave-66 T-block manifest
Wave type: single-spec, ui (presentation-only copy split in ChannelSidebar). Merge d094f9c; web deployed SUCCESS + 200.
| Stage | Layer | Pattern | Evidence | Status |
|---|---|---|---|---|
| T-1 | static | A (CI) | CI lint+typecheck green (PR #81) | pass |
| T-2 | unit | A (CI) | CI test green; web 565/565 incl 3 deterministic ChannelSidebar error-branch cases (offline→neutral, reconnecting→neutral, online→error, mutual-exclusion asserts) | pass |
| T-3 | contract | — | SKIP: no API/SDK/contract change | skipped |
| T-4 | integration | — | SKIP: no server/schema change | skipped |
| T-5 | e2e | B (active) | light live confirm on prod (open never-synced server offline → neutral copy) OR unit-covered (3 deterministic cases assert exact copy per connection state) | pending (head-tester judges) |
| T-6 | layout | — | SKIP: no layout change (copy string only, same markup) | skipped |
| T-7 | perf | — | SKIP: not heavy | skipped |
| T-8 | security | — | SKIP: no auth/session surface | skipped |
| T-9 | journey+gate | B (gate) | head-tester gate; NAMED: online-error-copy preserved (AC2) + offline-neutral copy | pending |
## Status
test_block_status:    gate-passed
stages_run:           [T-1, T-2, T-5, T-9]
stages_skipped:       [T-3 (no API/contract change), T-4 (no server/schema change), T-6 (copy string, no layout delta), T-7 (not heavy), T-8 (no auth/session surface)]
t5_disposition:       unit-covered (live probe declined; 3 deterministic cases sufficient for presentation-only copy)
findings_total:       0
findings_critical:    0
findings_aggregate:   process/waves/wave-66/blocks/T/findings-aggregate.md
journey_regen_skipped: true
journey_map_commit:   ""
ready_for_verify:     true
