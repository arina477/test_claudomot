# Wave 34 — P-3 Plan (multi-spec: screen-share + audio-fallback)

## Approach section

### Spec 1 — Screen-share (e9cd341a), TWO layers
- **API layer (small):** `apps/api/src/voice/voice-token.service.ts` — extend the AccessToken `VideoGrant.canPublishSources` to include `TrackSource.SCREEN_SHARE` (+ `SCREEN_SHARE_AUDIO`) alongside `MICROPHONE`. This is the load-bearing fix (problem-framer): canPublishSources supersedes canPublish; without SCREEN_SHARE the client publish is server-rejected. Update the spec assertion at `voice-token.service.spec.ts:156` (['microphone'] → ['microphone','screen_share','screen_share_audio'] or the SDK's literal). Token shape + RBAC gate UNCHANGED (same member-gated mint; capability widened).
  - *Alt considered:* per-participant dynamic grants — REJECTED (over-engineered; all room members may share; static grant is correct for the self-use MVP).
- **Client layer:** `apps/web/src/shell/VoiceStudyRoom.tsx` — (a) a share/stop-share control that calls `localParticipant.setScreenShareEnabled(true/false)` (via `useLocalParticipant`); (b) subscribe + render remote screen-share: `useTracks([Track.Source.ScreenShare])` → render the active screen-share as a DISTINCT PROMINENT tile (larger, focused) vs. the avatar tiles, per the D-block design; (c) clean revert on stop (track unpublish → tile removed, layout returns). The wave-31 client has `video={false}` + no screen prop (:114) — this adds screen-share track handling without enabling camera.
  - *Failure domain:* client-only track publish + a static server grant; a publish failure (permission denied) surfaces as an idle share button, not a crash.

### Spec 2 — Audio-only fallback (61e52c3e), client only
- **Client layer:** `apps/web/src/shell/VoiceStudyRoom.tsx` (+ a small hook, e.g. `useAudioOnlyFallback`) — listen to `RoomEvent.ConnectionQualityChanged` (or `participant.connectionQuality`); on Poor (debounced) OR a manual opt-in toggle → set inbound remote VIDEO + SCREEN_SHARE publications `setSubscribed(false)` (keep audio subscribed); surface the audio-only state (banner/pill per D-block) + a restore-video control; on restore or ConnectionQuality→Good (per design) → re-subscribe the video the user had. Debounce quality flapping.
  - *Alt considered:* server-side adaptive stream / simulcast layer control — REJECTED (keep-OUT; LiveKit-native ConnectionQuality + client subscription control is the bounded correct layer).
  - *Failure domain:* client-only subscription toggling; audio is never touched (the invariant — keep talking).

### Data model / deps
None (no schema; no new dep — @livekit/components-react + livekit-server-sdk already installed w31). SDK surfaces verified against `command-center/dev/SDK-Docs/LiveKit/livekit.md` (screen_share source, ConnectionQuality, setSubscribed).

### API contracts
- voice/token: response shape unchanged ({token,url}); the minted grant now permits screen_share publish for members. T-8 re-probe: member token includes screen_share; non-member still 403 (gate unchanged).

## Plan by B-stage
- **B-0:** branch `wave-34-voice-screenshare-fallback`. No schema/dep.
- **B-1 Contracts:** SKIP (no shared Zod/OpenAPI; token shape unchanged; inline).
- **D-block (design_gap=TRUE, before B-3):** D-1/D-2/D-3 for TWO surfaces — (1) screen-share prominent tile, (2) audio-only-state banner/pill + restore control — bounded extensions of the adopted `design/voice-study-room.html` (dark-theme tokens). Adopt.
- **B-2 Backend (livekit-integration):** voice-token.service.ts canPublishSources += SCREEN_SHARE[+_AUDIO]; update voice-token.service.spec.ts:156; unit test asserts the grant includes screen_share for a member.
- **B-3 Frontend (livekit-integration):** screen-share publish/subscribe/tile (spec 1 client) + audio-only-fallback hook + state UI (spec 2), both to the D-block-adopted designs. Tests: screen-share start/stop/render/revert (mock LiveKit room); audio-fallback on simulated ConnectionQuality-Poor + manual toggle → video unsubscribed, audio kept, restore re-subscribes; debounce.
- **B-4/B-5/B-6:** repo typecheck + lint + unit/build + dev-smoke; head-builder gate + /review (security: token grant scoped to members; no secret leak; audio-never-dropped invariant).

## Specialist routing (AGENTS.md validated)
- **livekit-integration** — both specs (API token-grant extension + client screen-share + client audio-fallback). Its domain is exactly LiveKit voice/video (token + client tracks). In AGENTS.md.

## Parallelization map
- B-2 (api grant) can run in parallel with the D-block (design) since they don't overlap. B-3 (client) depends on BOTH B-2 (grant, so publish isn't rejected) AND D-3 (adopted designs). So: B-2 ∥ D-block → B-3 → B-4.

## Action 8 — self-consistency sweep
- Spec-1 ACs (screen-share) → B-2 (grant) + B-3 (client tile). Spec-1 AC "token permits screen_share" → B-2. Spec-2 ACs (audio-fallback) → B-3 (hook + UI). Live-verify ACs → T-block (2-participant). design_gap TRUE → D-block. Security (grant widening) → P-4/T-8. Every AC mapped. Specialist = livekit-integration (exists). No new dep/schema. Clean.

## Exit
Multi-spec: screen-share (B-2 grant + B-3 client tile) + audio-fallback (B-3 client). B-1 skip. **design_gap=TRUE → D-block fires** (screen-share tile + audio-only-state UI). livekit-integration. Security (token-grant widening) → P-4 security-scope + T-8. LiveKit LIVE → live-verification MANDATORY (T-block 2-participant). M6-close→M7. → P-4 Gate.
