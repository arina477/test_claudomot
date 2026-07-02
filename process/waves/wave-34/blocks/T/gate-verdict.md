# Wave 34 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, T-9 block-exit gate)
**Reviewed against:** process/waves/wave-34/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale
The ceo-mandated non-negotiable — a live 2-participant voice verification against real LiveKit — genuinely PASSED for screen-share and is the load-bearing proof of this wave. Two DISTINCT prod users (`21984eb2` A, `da74148e` B — separate userIds, not one client's echo) reached `connected` in one SFU room (`RM_6mXtfPMddChR`) on the live `wss://claudomat-test-sgf9259q.livekit.cloud` endpoint, corroborated by SERVER-TRUTH `RoomServiceClient.listParticipants` returning 2 participants — the first StudyHall wave to establish a live LiveKit connection (w31/w32/w33 could not). Screen-share is PROVEN-LIVE end-to-end: A's server-side track set gained `SCREEN_SHARE/VIDEO` (`3/1`) on publish and lost it on stop (proving the grant widening is accepted AT THE SFU, not merely present in the JWT), while B (the receiver, distinct from the sender) rendered the prominent tile and reverted cleanly with no orphan. This is honest two-client verification with a mutation-sanity floor: a broken grant would have been server-rejected and the track set would not have changed.

The HIGH finding (audio-only fallback has NO user-reachable trigger in prod) is CORRECTLY classified HIGH and NOT swept as a test-limit. The T-block honestly separates the legitimate media-plane boundary (auto `ConnectionQuality→Poor` is genuinely non-headless — CDP throttles HTTP, not the established WebRTC/DTLS path the SFU uses to compute quality) from the REAL product gap: `enterManual()` is implemented but not destructured/wired into the control cluster (`VoiceStudyRoom.tsx:412`), so the deterministic manual opt-in path the spec named (spec-2 AC1 "opts in via a manual toggle") has no user-reachable entry point — the banner + hook are complete but dead UI. This is the honest crux of the wave: screen-share is proven, but the audio-only-degrade clause of M6's success metric has no working user path. It is filed as a high finding routed to V-2, not claimed green-by-assertion — the audio invariant (AC4) that IS provable was proven-live separately (mic present at every step, structurally untouched by the fallback code), and no FAIL scenario is left open unrouted.

T-8 security is adequate: the capability widening is proven LIVE in the decoded minted token (`canPublishSources=[microphone, screen_share, screen_share_audio]`, no camera, room-scoped, 1h TTL, sub bound to caller), and it did NOT widen WHO can mint — the auth matrix holds (unauth 401, malformed :id 400 not 500, missing/non-member 403, and the load-bearing IDOR pair returns 403 for the authed non-member vs 200 for the allowed member on a REAL private voice channel). Secret grep is clean; `LIVEKIT_API_SECRET` stays server-side per C-2 env-scoping. Coverage honesty holds across the pyramid: T-6 layout structurally + token-matches the adopted designs (`token_violations: []`), T-1..T-4 are CI-verified (lint/typecheck + 790 tests green, 22+ new incl. the audio-never-dropped invariant), and the media-plane boundary (real audio/video pixels, organic quality degradation) is honestly documented as deferred rather than faked or silently skipped. The T-block PASSES with the HIGH finding surfaced for V-2 to triage — the gate is coverage + honesty, both met — no evidence is fabricated and no realtime claim rests on a single client.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
