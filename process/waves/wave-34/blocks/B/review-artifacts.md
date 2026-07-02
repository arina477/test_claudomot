# Wave 34 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** voice finish — screen-share (2-layer grant+client) + audio-only fallback (client)
**Block exit gate:** B-6
**Status:** gate-passed

## Stage deliverables
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| B-0 | B-0-branch-and-schema.md | done | branch wave-34-voice-screenshare-fallback; schema SKIP; both tasks claimed |
| B-1 | B-1-contracts.md | skipped | no shared Zod/OpenAPI; token shape unchanged |
| B-2 | B-2-backend.md | pending | livekit-integration: extend canPublishSources += SCREEN_SHARE[+_AUDIO] + update voice-token.service.spec.ts:156 |
| B-3 | B-3-frontend.md | pending | livekit-integration: screen-share publish/tile + audio-fallback hook + audio-only UI, to adopted designs |
| B-4 | B-4-wiring.md | pending | |
| B-5 | B-5-verify.md | pending | |
| B-6 | B-6-review.md | pending | |

## Block-specific context
- **Spec:** e9cd341a (multi-spec, 2 blocks) + sibling 61e52c3e. Branch: wave-34-voice-screenshare-fallback.
- **claimed_task_ids:** [e9cd341a, 61e52c3e]
- **Deps:** none (@livekit/components-react + livekit-server-sdk installed w31). **Schema:** none.
- **Adopted designs:** design/screen-share-tile.html + design/audio-only-state.html (D-3).
- **Mechanism (P-4 APPROVED):** screen-share TWO-LAYER — (B-2) voice-token.service.ts canPublishSources += TrackSource.SCREEN_SHARE (+SCREEN_SHARE_AUDIO) + UPDATE voice-token.service.spec.ts:156; (B-3) VoiceStudyRoom.tsx screen-share publish (setScreenShareEnabled) + subscribe/render prominent tile (useTracks ScreenShare) + clean revert. audio-fallback (B-3) — ConnectionQuality→Poor OR manual toggle → unsubscribe inbound video (setSubscribed false), keep audio, audio-only-state UI + restore.
- **Carries:** [karen/jenny] update :156 in the SAME change as the grant; sweep stale voice-token.service.ts header comments (:19/:30 "microphone only") → post-widen; livekit-integration append ConnectionQuality/setSubscribed to livekit.md. [D-block BF-1..BF-9 build-fold nits]. [ceo] LIVE-VERIFY NON-NEGOTIABLE (T-block 2-participant real). [security] token capability widen → T-8 re-probe (members get screen_share, non-member 403).
- **LiveKit keys LIVE** → build + live-verifiable.

## Open escalations carried into gate
- N-block: close M6 (metric met after this) → M7.

## Gate verdict log
<appended by head-builder at B-6>

## Block-exit handoff
```yaml
build_block_status: complete
branch: wave-34-voice-screenshare-fallback
stages_run: [B-0,B-2,B-3,B-4,B-5,B-6]
stages_skipped: [B-1]
review_verdict: APPROVE
last_commit_sha: 36018ad
ready_for_ci: true
```
