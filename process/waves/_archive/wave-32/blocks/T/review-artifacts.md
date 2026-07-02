# Wave 32 — T-block review artifacts

**Block:** T (Test)
**Wave topic:** M6 voice occupancy — GET /channels/:channelId/voice/participants + pre-join occupancy indicator
**Block exit gate:** T-9
**Status:** gate-passed

```yaml
test_block_status:    complete
stages_run:           [T-1, T-2, T-3, T-4, T-5, T-6, T-8, T-9]
stages_skipped:       [{stage: T-7, reason: "not heavy — perf layer N/A for a read-only GET"}]
findings_total:       2
findings_critical:    0
findings_aggregate:   process/waves/wave-32/blocks/T/findings-aggregate.md
journey_map_commit:   23893bf
ready_for_verify:     true
```

## Stage deliverables
| Stage | Deliverable file | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | process/waves/wave-32/stages/T-1-static.md | ci-verified | done | C-1 lint+typecheck green on 45b08c3 |
| T-2 | process/waves/wave-32/stages/T-2-unit.md | ci-verified | done | C-1 test:ci green (api 449 + web 296) |
| T-3 | process/waves/wave-32/stages/T-3-contract.md | ci-verified | done | new endpoint contract; controller spec (6) in test:ci |
| T-4 | process/waves/wave-32/stages/T-4-integration.md | ci-verified | done | service spec (18) w/ mocked RoomServiceClient + Postgres v16 in test:ci |
| T-5 | process/waves/wave-32/stages/T-5-e2e.md | active | done | prod fail-soft: Join reachable, no white-screen, graceful LiveKit-connect fail |
| T-6 | process/waves/wave-32/stages/T-6-layout.md | active | done | indicator states match adopted design; zero token violations @1440/1280/1024 |
| T-7 | process/waves/wave-32/stages/T-7-perf.md | n/a | skipped | not heavy |
| T-8 | process/waves/wave-32/stages/T-8-security.md | active | done | LIVE authz matrix PROVEN: 401/403-uniform-no-leak/400/503; rate-limit active; secrets clean; 1 finding F-32-T-8-1 |
| T-9 | process/waves/wave-32/stages/T-9-journey.md | active | pending | journey regen (move occupancy into F4) + gate |

## Block-specific context
- **Wave topic:** pre-join voice occupancy (who's-in-room) — endpoint + client indicator.
- **wave_type:** backend + ui + auth (membership-gated endpoint + occupancy UI; auto-promoted for T-8).
- **Stages skipped (with reasons):** T-7 perf (not heavy).
- **Cumulative findings count:** 2 (F-32-T-8-1 non-UUID→500 LOW-MED; + T-1 test-cast/T-4 deferred-leg info).
- **LiveKit-creds boundary:** LIVEKIT_* unset in Railway → populated occupancy not live-verifiable; the SECURITY gate (401/403/400/503) IS fully verifiable (RBAC + type check run before RoomServiceClient). Populated-occupancy live-verify deferred to founder-supplies-keys.
- **Prod URLs:** api + web public domains (head-tester to discover via railway status or wave-31 C-2 archive). Fixtures: studyhallfixturea/b (gitignored command-center/testing/test-accounts.md).

## Findings aggregation
Incremental at process/waves/wave-32/blocks/T/findings-aggregate.md (canonical V-2 input).

## Open escalations carried into gate
- LiveKit creds absent → populated occupancy deferred (N-1 tripwire: 3rd cred-blocked M6 wave → park-or-key fork). Standing, non-blocking for the security gate.

## Gate verdict log

**T-9 gate (attempt 1) — head-tester fresh spawn — verdict: APPROVED.** Full verdict: `process/waves/wave-32/blocks/T/gate-verdict.md`. Independently reviewed all T-1..T-8 deliverables (read directly, not via aggregate). Security surface PROVEN LIVE (non-member→403 byte-identical across exist/nil/random → no enumeration leak; gate order canViewChannelById→403→400→503; rate-limit active; secret-grep clean, 2 matches = fake fixtures). Fail-soft PROVEN LIVE (Join CTA visible+enabled while occupancy=error; graceful degrade on Join). CI tier honest (RoomServiceClient mocked at outermost SDK boundary only; RBAC/db NOT mocked; gate-order asserted as transition not call-count). Credential boundary (populated occupancy deferred, LiveKit creds unset) is honest + documented — security gate runs before RoomServiceClient so full RBAC/type/creds surface provable without keys. 1 finding F-32-T-8-1 (non-UUID→500, no leak, missing ParseUUIDPipe) correctly surfaced-not-fixed → V-2 (non-blocking; V-2 also to check wave-31 voice-token endpoint for the same :channelId gap). 0 flakes, 0 fix-up cycles. rework_attempt_cap_remaining: 3.
