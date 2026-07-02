# Wave 34 — P-2 Spec (pointer)
**Source of truth:** YAML head + prose in `tasks.description` for primary row **e9cd341a**. Multi-spec (2 blocks). Convenience copy.
- **wave_type:** multi-spec · **claimed_task_ids:** [e9cd341a (screen-share), 61e52c3e (audio-fallback)] · **design_gap_flag:** TRUE → D-block

## Spec 1 — Screen-share (e9cd341a) — TWO-LAYER
- (API) extend AccessToken canPublishSources to add SCREEN_SHARE[+_AUDIO]; update voice-token.service.spec.ts:156. Token shape unchanged; grant capability widened; RBAC unchanged.
- (client) @livekit/components-react screen-share publish/subscribe in VoiceStudyRoom.tsx: start/stop, distinct prominent tile for subscribers, clean revert. Live-verified (2 participants).
- keep-OUT: annotation, multi-share grid, quality selector, custom window-picker, recording.

## Spec 2 — Audio-only fallback (61e52c3e) — client
- On ConnectionQuality→Poor OR manual opt-in: unsubscribe/pause inbound video (camera + screen-share), keep audio uninterrupted; surface audio-only state (calm banner/pill) + restore-video path; re-subscribe on restore/recovery. Debounce flapping.
- keep-OUT: per-track granularity, custom bandwidth heuristics, quality tiers, persisted pref.

## Cross-cutting
- **Live-verification NON-NEGOTIABLE** (ceo): T-block 2-participant real test (screen-share render/revert + poor-bandwidth degrade/restore). LiveKit keys LIVE.
- **Security:** token-grant capability widening → P-4 security-scope + T-8 re-probe (members get screen_share; secret server-side).
- **N-block:** close M6 (metric met) → pivot to M7.
→ P-3 Plan (per-spec).
