# Wave 77 — T-block review artifacts

**Block:** T (Test)
**Wave topic:** M13 leg-2 — cross-server portable academic identity (self API + PublicProfile visibility endpoint + editor & member profile card)
**Block exit gate:** T-9
**Status:** gate-passed

## Stage deliverables

| Stage | Deliverable file | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | process/waves/wave-77/stages/T-1-static.md | ci-verified | done | seeded at T-1 Action 0 |
| T-2 | process/waves/wave-77/stages/T-2-unit.md | ci-verified | done | |
| T-3 | process/waves/wave-77/stages/T-3-contract.md | active | done | GET/PATCH /profile + GET /profile/:userId live probes |
| T-4 | process/waves/wave-77/stages/T-4-integration.md | ci-verified | done | 13-case visibility matrix ran in CI (postgres:16) |
| T-5 | process/waves/wave-77/stages/T-5-e2e.md | active | done | academic editor round-trip + member card |
| T-6 | process/waves/wave-77/stages/T-6-layout.md | active | done | member profile card vs design/member-profile-card.html |
| T-7 | process/waves/wave-77/stages/T-7-perf.md | active | skipped | SKIP — read-only profile + card, not heavy |
| T-8 | process/waves/wave-77/stages/T-8-security.md | active | done | PRIVACY crown jewel — visibility x block x soft-delete |
| T-9 | process/waves/wave-77/stages/T-9-journey.md | active | done | gate + journey regen |

## Block-specific context

- **Wave topic:** cross-server portable academic identity
- **wave_type:** backend + ui + auth(privacy) — declared multi-spec; treat as {backend, ui, auth}
- **Stages skipped (with reasons):** T-7 (perf) — read-only endpoints + a card, no heavy diff, no perf-sensitive path
- **Cumulative findings count:** 4 low + 1 info; 0 critical; 0 blocking
- **Live URLs:** web https://web-production-bce1a8.up.railway.app · api https://api-production-b93e.up.railway.app (merge commit 633f362e)
- **Fixtures:** A studyhall-e2e-fixture (userId 21984eb2-8029-4c1b-9e73-bc586a0be4d2); B studyhall-e2e-fixture-b (userId da74148e-132e-4faf-a526-a34c28e7481b). A+B co-members of server ad62cd12.

## Findings aggregation

Findings written incrementally to `process/waves/wave-77/blocks/T/findings-aggregate.md`. Aggregate is the canonical V-2 input.

## Open escalations carried into gate

none

## Gate verdict log

<appended by fresh head-tester spawn at T-9 Action 1>


## Block-exit handoff (T-9)

```yaml
test_block_status:    complete
stages_run:           [T-1, T-2, T-3, T-4, T-5, T-6, T-8, T-9]
stages_skipped:       [T-7 (not heavy; read-only endpoints + small card)]
findings_total:       5
findings_critical:    0
findings_aggregate:   process/waves/wave-77/blocks/T/findings-aggregate.md
journey_map_commit:   52ddaa745b94501a4e9b82b65b562f81ed35c0f5
ready_for_verify:     true
```
