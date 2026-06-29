# Wave 10 — T-block review artifacts
**Block:** T · **Wave topic:** M2 RBAC capstone (LIVE) · **Gate:** T-9 · **Status:** in-progress
| Stage | Status | Notes |
|---|---|---|
| T-1 Static | done | CI lint/typecheck green (PR#20) |
| T-2 Unit | done | 270 tests (173 api: 6 security conditions; 97 web: roles UI) |
| T-3 Contract | done | role CRUD + assign + channel-override + can(); shared rbac types |
| T-4 Integration | done | RBAC 401 boundary verified LIVE (C-2, all endpoints); migration+backfill applied |
| T-5 E2E | done | CI playwright green (PR#20) |
| T-6 Layout | done | roles UI per design/server-roles.html (fixed-flag, no matrix); 97 web tests; 5 a11y fixes |
| T-7 Perf | skip | not heavy |
| T-8 Security | done | MANDATORY — the 6 RBAC conditions all tested + live 401 boundary |
| T-9 Journey | gate-passed | head-tester APPROVED; journey map regen v0.7 (roles overlay + per-role channel visibility) |
## Context: security gate APPLIES (RBAC=access control). Live: 401 on all role/override/member endpoints (gate-re-confirmed). 403-non-permitted test-covered (no verified prod fixture; 0 servers). 6 conditions tested + load-bearing assertions verified in spec files. FLAG→L: verified-fixture 4a2ad286 escalation-critical (4 waves running).

## Status: gate-passed

```yaml
test_block_status:    complete
stages_run:           [T-1, T-2, T-3, T-4, T-5, T-6, T-8, T-9]
stages_skipped:       [T-7 (not heavy; no perf budget at risk)]
findings_total:       3
findings_critical:    0
findings_aggregate:   process/waves/wave-10/blocks/T/gate-verdict.md   # findings recorded inline (no standalone aggregate this block — hygiene note in verdict)
journey_map_commit:   89bb1201ca18d9238edcb4cbdad4bf43ba6d4dc4
ready_for_verify:     true
```
