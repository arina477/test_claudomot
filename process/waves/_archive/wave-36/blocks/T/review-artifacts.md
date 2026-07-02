# Wave 36 — T-block review artifacts
**Block:** T (Test) · **Wave topic:** M7 test-hardening — regression tests for the wave-35 privacy boundary (ran in CI) + states-AC docs + stub-date · **Block exit gate:** T-9 · **Status:** gate-passed

## Stage deliverables
| Stage | Deliverable | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | stages/T-1-static.md | ci-verified | done | lint+typecheck green |
| T-2 | stages/T-2-unit.md | ci-verified | done | 507 api + web units green in CI |
| T-3 | stages/T-3-contract.md | ci-verified | done | new controller/enum-400 contract tests ran |
| T-4 | stages/T-4-integration.md | ci-verified | done | **12 real-PG integration tests PROVABLY RAN (0 skipped) — the wave's success criterion** |
| T-5 | stages/T-5-e2e.md | active | done | date 2026 served-verified (C-2); /settings/privacy 200 |
| T-6 | stages/T-6-layout.md | active | done | stub pages unchanged except date |
| T-7 | stages/T-7-perf.md | — | skipped | not heavy |
| T-8 | stages/T-8-security.md | active | done | no auth-surface change; boundary enforcement unchanged (live 401) + now regression-covered |
| T-9 | stages/T-9-journey.md | active | pending | gate |

## Block-specific context
- **wave_type:** the deliverable IS the tests; they ran + passed in CI (C-1 evidence).
- **live:** web https://web-production-bce1a8.up.railway.app · api https://api-production-b93e.up.railway.app
- **Cumulative findings:** see findings-aggregate.md (expected ~0 — confirmatory wave).

## Open escalations carried into gate
none

## Gate verdict log
head-tester at T-9 (fresh spawn) — **APPROVED** (attempt 1). Verdict: `blocks/T/gate-verdict.md`. Load-bearing T-4 claim independently re-verified against CI test job 84845085352 (DATABASE_URL_TEST set, 12 integration tests ran with green ✓, 0 skipped, no false-green decoy). Spec files read = real SUT + real-PG + bidirectional IDOR + transition-table, no coverage theater. Journey-regen SKIPPED (date-string-only on already-inventoried pages; prior canonical map authoritative). No `user-scenarios/` dir.

```yaml
test_block_status:    complete
stages_run:           [T-1, T-2, T-3, T-4, T-5, T-6, T-8, T-9]
stages_skipped:       [T-7 (perf — not heavy)]
findings_total:       0
findings_critical:    0
findings_aggregate:   process/waves/wave-36/blocks/T/findings-aggregate.md
journey_map_commit:   ""   # journey-regen skipped per T-9 Action 2
ready_for_verify:     true
```
