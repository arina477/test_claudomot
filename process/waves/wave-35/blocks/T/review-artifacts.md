# Wave 35 — T-block review artifacts

**Block:** T (Test) · **Wave topic:** M7 privacy controls (profile-visibility enforced + who-can-DM persisted + data view/download + Sentry + stubs/states) · **Block exit gate:** T-9 · **Status:** in-progress

## Stage deliverables
| Stage | Deliverable file | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | stages/T-1-static.md | ci-verified | done | 0 TS bypasses |
| T-2 | stages/T-2-unit.md | ci-verified | done | CI 326/327 green; no NEW privacy tests (gap) |
| T-3 | stages/T-3-contract.md | ci-verified | done | new privacy endpoints untested (gap) |
| T-4 | stages/T-4-integration.md | ci-verified | done | migration+services; new endpoints untested (gap) |
| T-5 | stages/T-5-e2e.md | active | done | 6/6 flows PASS |
| T-6 | stages/T-6-layout.md | active | done | no regressions |
| T-7 | stages/T-7-perf.md | active | skipped | not heavy wave |
| T-8 | stages/T-8-security.md | active | done | authz+IDOR reproduced live PASS; 0 crit/high |
| T-9 | stages/T-9-journey.md | active | done | gate — APPROVED; journey regen v0.23 |

## Block-specific context
- **wave_type:** ui + backend + auth (user-data authz + data-export). T-7 skipped (not heavy).
- **live deploy:** web https://web-production-bce1a8.up.railway.app · api https://api-production-b93e.up.railway.app (C-2 verified, migration 0014 applied).
- **Cumulative findings:** see findings-aggregate.md.

## Open escalations carried into gate
none

## Gate verdict log
- **T-9 (attempt 1): APPROVED** by fresh head-tester. Core promise (enforced profile-visibility + IDOR-safe data-export) proven LIVE at T-8 with two verified fixtures; T-5 6/6 e2e PASS; T-6 no regressions; T-1..T-4 CI-green on 0c71585. MEDIUM no-dedicated-privacy-tests gap judged honest tracked debt → V-2 (not a gate-block). Journey regen v0.22→v0.23 (routes_added: /settings/privacy, /privacy, /terms; 0 removed; 0 regressions). Verdict: `process/waves/wave-35/blocks/T/gate-verdict.md`.

## Status
```yaml
test_block_status:    complete
stages_run:           [T-1, T-2, T-3, T-4, T-5, T-6, T-8, T-9]
stages_skipped:       [T-7 (not heavy wave)]
findings_total:       4
findings_critical:    0
findings_aggregate:   process/waves/wave-35/blocks/T/findings-aggregate.md
journey_map_commit:   9f857bf
ready_for_verify:     true
```
gate-passed
