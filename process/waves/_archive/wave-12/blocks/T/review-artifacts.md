# Wave 12 — T-block review artifacts
**Block:** T · **Wave topic:** M3 real-time messaging (LIVE) · **Gate:** T-9 · **Status:** gate-passed
| Stage | Status | Notes |
|---|---|---|
| T-1 Static | done | CI lint/typecheck green (PR#23) |
| T-2 Unit | done | 316 tests (200 api: WS-auth/channel-guard/idempotency/fan-out; 116 web: msg UI/optimistic/dedup) |
| T-3 Contract | done | POST/GET /channels/:id/messages; Socket.IO message:new/join_channel; shared types |
| T-4 Integration | done | LIVE two-client real-time: message:new in 93ms (<1s); WS-auth rejects unauth; migration applied |
| T-5 E2E | done | CI playwright green (PR#23); boot-probe caught+fixed the DI crash |
| T-6 Layout | active | message UI (3-state rows + composer) per design/server-channel-view.html |
| T-7 Perf | done | real-time delivery 93ms (the <1s metric — well under) |
| T-8 Security | active | MANDATORY — the 4 invariants (channel-gate/WS-auth/no-leak/no-spoof) |
| T-9 Journey | active | gate + journey regen (messaging is a major new surface) |
## Context: security gate APPLIES. LIVE: two-client message:new 93ms; WS unauth rejected; no-leak (non-joined gets nothing); 401 boundary; 403 non-permitted. 4 invariants tested. FLAG→L: head-ci-cd added 2 CI-PRINCIPLES rules at C (bypass L-2). The boot-probe caught a real type-only-import DI crash (wave-6 investment).

## Block-exit handoff (T-9 gate-passed)
```yaml
test_block_status:    complete
stages_run:           [T-1, T-2, T-3, T-4, T-5, T-6, T-7, T-8, T-9]
stages_skipped:       []
findings_total:       3      # all info-severity, non-blocking
findings_critical:    0
findings_aggregate:   process/waves/wave-12/blocks/T/findings-aggregate.md
journey_map_commit:   a7e0fd5
ready_for_verify:     true
```

