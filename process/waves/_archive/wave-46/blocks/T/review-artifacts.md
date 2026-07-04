# Wave 46 — T-block review artifacts

**Block:** T (Test)
**Wave topic:** M8 direct messages slice 1 — DM schema (3 tables) + participant-gated backend (who_can_dm-enforced, IDOR-safe, idempotent) + Socket.IO dm:message fan-out + DM UI + offline outbox generalization
**Block exit gate:** T-9
**Status:** gate-passed

## Stage deliverables

| Stage | Deliverable file | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | process/waves/wave-46/stages/T-1-static.md | ci-verified | done APPROVED | lint+typecheck green on merge SHA; prod source bypass-clean |
| T-2 | process/waves/wave-46/stages/T-2-unit.md | ci-verified | done APPROVED | DM unit coverage honest (who_can_dm 3-policy, IDOR, idempotency same-row+no-refanout, find-or-create branch, outbox mixed-drain C1, gateway M1) |
| T-3 | process/waves/wave-46/stages/T-3-contract.md | active | done APPROVED | 4 /dm endpoints match shared Zod; all status codes 200/400/403/404 correct; dm:message deferred to T-5. F1 displayName MEDIUM |
| T-4 | process/waves/wave-46/stages/T-4-integration.md | active | done APPROVED | live PG: find-or-create/idempotency/who_can_dm/IDOR PASS; **F4 HIGH cursor ms-vs-µs dup** |
| T-5 | process/waves/wave-46/stages/T-5-e2e.md | active | done APPROVED | **2-client real-time fan-out PASS (real ws frame + DOM, both runs)**; F6/F7 MAJOR (self double-render, Unknown-user) |
| T-6 | process/waves/wave-46/stages/T-6-layout.md | active | done APPROVED | clean layout PASS 1440/1280/1024; tokens consumed; F9/F10 MINOR |
| T-7 | process/waves/wave-46/stages/T-7-perf.md | active | skipped-reasoned | no new deps, indexed+bounded queries, no render-critical route |
| T-8 | process/waves/wave-46/stages/T-8-security.md | active | done APPROVED | **all 4 DM authz invariants HELD under active exploitation**; secret-grep clean; F11/F12 LOW |
| T-9 | process/waves/wave-46/stages/T-9-journey.md | active | in-progress | block-exit gate; fresh head-tester Phase 1 + DM journey-map regen |

## Block-specific context

- **Wave topic:** M8 direct messages slice 1 (private messaging).
- **wave_type:** ui + backend + auth-adjacent (private messaging, sessions, authz, privacy).
- **Live URLs:** web https://web-production-bce1a8.up.railway.app ; api https://api-production-b93e.up.railway.app
- **Merge SHA:** 2a738f7bacfef9333a0d63702a036505bc4788dc (migration 0021 applied + verified).
- **Stages skipped (with reasons):** T-7 (candidate SKIP — moderate feature; confirm at stage).
- **Cumulative findings count:** 0 at start; bumped by each T-stage.

## Findings aggregation

Findings written incrementally to `process/waves/wave-46/blocks/T/findings-aggregate.md`. Aggregate is the canonical V-2 input.

## Open escalations carried into gate

none

## Gate verdict log

- **Attempt 1 (T-9 Phase 1):** fresh head-tester agentId aba4e5b5 → **APPROVED** (rework_attempt_cap_remaining: 2). Independently source-verified F4/F6/T-8-socket-correction. Verdict at `process/waves/wave-46/blocks/T/gate-verdict.md`.

## Block exit / handoff

```yaml
test_block_status:    complete
stages_run:           [T-1, T-2, T-3, T-4, T-5, T-6, T-8, T-9]
stages_skipped:       [T-7 (perf — no new deps, indexed+bounded queries, no render-critical route; reasoned skip with dep-diff + index confirmation)]
findings_total:       15   # F1,F2,F3,F4,F5,F6,F7,F8,F9,F10,F11,F12 + F3b/F3c dupes-of-F1 + secret-grep-clean
findings_critical:    0    # 0 CRITICAL; 1 HIGH (F4 cursor), 2 MAJOR (F6/F7), rest MEDIUM/LOW/INFO
findings_aggregate:   process/waves/wave-46/blocks/T/findings-aggregate.md
journey_map_commit:   <populated on commit>
ready_for_verify:     true
```

