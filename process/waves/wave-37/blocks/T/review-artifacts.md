# Wave 37 — T-block review artifacts
**Block:** T · **Wave topic:** persistent in-app notifications (model + owner-404 API + web bell/panel) · **Gate:** T-9 · **Status:** gate-passed
| Stage | Pattern | Status | Notes |
|---|---|---|---|
| T-1 | ci-verified | done | lint+typecheck green |
| T-2 | ci-verified | done | api 521 + web 333 units green in CI |
| T-3 | ci-verified | done | controller.spec method-drift + contract tests ran |
| T-4 | ci-verified | done | **notifications-authz integration RAN in CI (6 tests, 0 skipped, real-DB latencies) — owner-404 + dedup** |
| T-5 | active | done | bell/panel e2e PASS (4/4 flows, two-client mention) |
| T-6 | active | done | bell + panel layout PASS |
| T-7 | — | skipped | not heavy |
| T-8 | active | done | owner-404 IDOR reproduced LIVE + self-scoping + 401 + HIGH-1 verb-fix |
| T-9 | gate | done | APPROVED; journey regen committed (bell/panel + 3 endpoints + two-read-model annotation) |
- live: web https://web-production-bce1a8.up.railway.app · api https://api-production-b93e.up.railway.app

## Status
```yaml
test_block_status:    complete
stages_run:           [T-1, T-2, T-3, T-4, T-5, T-6, T-8, T-9]
stages_skipped:       [T-7 (not heavy)]
findings_total:       2
findings_critical:    0
findings_aggregate:   process/waves/wave-37/blocks/T/findings-aggregate.md
journey_map_commit:   2bfa3f7594ac4669381b8f835d6c12fee3082379
ready_for_verify:     true
```
