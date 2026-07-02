# Wave 32 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** M6 voice occupancy — GET /channels/:channelId/voice/participants + pre-join client occupancy indicator
**Block exit gate:** B-6
**Status:** gate-passed

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | process/waves/wave-32/stages/B-0-branch-and-schema.md | done | branch wave-32-voice-occupancy; schema SKIP (no migration); task claimed |
| B-1 | process/waves/wave-32/stages/B-1-contracts.md | skipped | inline {count,participants} DTO — no shared Zod/OpenAPI/SDK contract change (fast-path B-2/B-3 NOT parallel: B-3 depends on B-2 endpoint) |
| B-2 | process/waves/wave-32/stages/B-2-backend.md | done | livekit-integration; 449 tests green; uniform-403 + RoomServiceClient + `||` fallback + TwirpError→empty |
| B-3 | process/waves/wave-32/stages/B-3-frontend.md | done | livekit-integration; 27 tests; 4 states to adopted design; bounded poll + AbortController coalescing; simplify removed dead ref |
| B-4 | process/waves/wave-32/stages/B-4-wiring.md | done | repo typecheck PASS; route registered both sides; B-3 drift (dead api method) reconciled |
| B-5 | process/waves/wave-32/stages/B-5-verify.md | done | lint+build clean; api 449 + web 296 green; smoke 401 missing_bearer; 1 flake documented |
| B-6 | process/waves/wave-32/stages/B-6-review.md | done | Phase1 head-builder APPROVED + Phase2 /review no crit/high → APPROVE |

## Block-specific context
- **Spec contract:** tasks row 78f51968-2c48-4368-93d4-7d3f02111a7b (DB); spec at process/waves/wave-32/stages/P-2-spec.md
- **Branch name:** wave-32-voice-occupancy
- **claimed_task_ids:** [78f51968-2c48-4368-93d4-7d3f02111a7b]
- **New deps added this wave:** none (livekit-server-sdk 2.15.5 already installed wave-31)
- **New env vars added this wave:** none (LIVEKIT_API_KEY/SECRET/URL already referenced wave-31; still unset in Railway — build credential-independent)
- **Schema changes this wave:** none (schema_skipped: true)
- **B-1 fast-path approved:** false (B-1 skipped as no-op, but B-2→B-3 stays sequential: B-3 consumes B-2's endpoint)
- **Files implemented (cumulative):** <updated B-2, B-3, B-4>
- **Deviations from plan logged this block:** none
- **Adopted design:** design/voice-occupancy-indicator.html (D-3 canonicalized)
- **P-4/karen B-2 carries:** (1) wave-31 gate is INLINE in mintToken → mirror it (watch drift); (2) display fallback uses `||` NOT `??` (empty-string display_name must fall through to email-local/userId). RoomServiceClient EXPLICIT creds (gotcha #3), empty/absent room→{count:0,[]} (TwirpError gotcha #11).
- **D-3 B-block build-polish carries (non-gating):** snap off-grid -space-x-[10px]/py-[9px]; optional desktop "studying now" cue; skeleton avatar-count parity.

## Open escalations carried into gate
- LiveKit creds NOT in Railway → live occupancy verify deferred to T/C-2 (standing; not blocking build). N-1 tripwire: 3rd cred-blocked M6 wave → park-or-key fork.

## Gate verdict log
<appended by fresh head-builder spawn at B-6 Action 1>

## Block-exit handoff
```yaml
build_block_status:    complete
branch:                wave-32-voice-occupancy
stages_run:            [B-0, B-2, B-4, B-5, B-6]
stages_skipped:        [B-1 (inline DTO, no contract change), B-0-schema (no migration)]
review_verdict:        APPROVE
deviations_logged:     [process.env-not-ConfigService (L-1 reconcile), isTwirpError-classname, dead-api-method-reconciled, wave31-test-stub-fix]
last_commit_sha:       7297661
ready_for_ci:          true
```
