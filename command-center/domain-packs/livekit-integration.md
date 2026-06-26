<!--
DISTILLATION NOTES (agent-creator Stage 2, applied 2026-06-26):
  Source: Gemini Deep Research fast run timed out (>~6min budget); content
  skeleton-synthesized per agent-creator.md RESILIENCE clause from the rendered
  brief + executor domain-prompt + tech_surface spec + StudyHall project context
  (command-center/dev/architecture/sdks.md §2 LiveKit + _library.md VoiceModule +
  Test §voice/video). No Gemini grounding artifacts to strip (none present).
  research_status: skeleton-synthesized.
  Final structure: §1 (~300 words), §2 (15 always-do), §3 (15 never-do), §4 (9 anti-patterns).
  Refresh via `claudomat sync` once a research archive exists.
-->

# Domain Pack — livekit-integration (LiveKit WebRTC voice/video executor)

## §1 KNOWLEDGE BASELINE

LiveKit is an open-source WebRTC SFU. StudyHall's NestJS `VoiceModule` never carries media — it uses `livekit-server-sdk` to manage rooms and mint short-lived JWT access tokens, while clients connect directly to the LiveKit server over WebRTC via `livekit-client` / `@livekit/components-react`. A token is built with `AccessToken(apiKey, apiSecret, { identity })` plus a `VideoGrant` (`roomJoin`, `room` = the StudyHall channel name, `canPublish`, `canSubscribe`); it is issued ONLY after a SuperTokens session check + RBAC check in `POST /api/v1/channels/:id/voice/token`. Tokens carry a TTL (≈4h) and the frontend re-requests before expiry. The API secret never leaves the server.

Deployment is a decision surface: self-host LiveKit on Railway (needs TURN/STUN for NAT traversal, TCP/UDP port exposure, fixed monthly cost) versus LiveKit Cloud free tier (account-issued `LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET`, ~100 participant-minutes/month, zero ops). The SDK call is identical for both — only `LIVEKIT_URL` changes (`wss://...railway.internal` vs `wss://<project>.livekit.cloud`). For self-use-mvp the default is Cloud free tier.

On the client, `@livekit/components-react` provides `LiveKitRoom`, `useTracks`, `useRoomContext`; `livekit-client` exposes `Room.connect(url, token)` and per-feature toggles `setMicrophoneEnabled`, `setCameraEnabled`, `setScreenShareEnabled`. The UI is a participant grid with mic/cam/screen-share controls and an audio-only fallback when no camera is present or permission is denied. Device permission failures must degrade gracefully, not crash the room. Error mapping at the `VoiceModule` boundary: room-not-found → 404 `VOICE_ROOM_NOT_FOUND`, bad key/secret → 500 `VOICE_TOKEN_ERROR` (internal, no detail leak), cloud rate limit → 429 `VOICE_RATE_LIMIT`. The media plane (ICE/DTLS/track routing/SFU) is explicitly NOT E2E-testable in headless Playwright — token issuance, room/identity naming, and control rendering are the testable surface.

## §2 ALWAYS-DO RULES

- Mint LiveKit access tokens server-side in `VoiceModule` only, after a session + RBAC check.
  Why: any client-side token path forces the API secret into the bundle.
- [STABLE] Keep `LIVEKIT_API_SECRET` on the server; it is the JWT signing key.
  Why: a leaked secret lets anyone forge room-join tokens.
- Set a bounded TTL (≈4h) on every access token and refresh before expiry.
  Why: long-lived or non-expiring tokens are replayable indefinitely.
- Scope each token's `VideoGrant` to the specific room (channel) and the user's identity.
  Why: an over-broad grant lets a user join rooms they have no access to.
- Use `identity = userId` so participants map to StudyHall users.
  Why: anonymous identities break presence, moderation, and the `voice_sessions` mapping.
- Read `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` from `ConfigService` env vars.
  Why: hard-coded values break the self-host↔Cloud switch and risk leaking the secret.
- Implement an audio-only fallback when no camera/permission is available.
  Why: a camera-required join blocks legitimate audio-only study participants.
- Map `livekit-server-sdk` errors to typed StudyHall codes at the `VoiceModule` boundary.
  Why: leaking `LivekitError` internals couples callers to the SDK.
- [STABLE] Provision TURN (and STUN) when self-hosting on Railway.
  Why: clients behind symmetric NAT cannot connect without TURN relay.
- Disconnect from the room on component unmount / page leave (`room.disconnect()`).
  Why: stale connections leak participant slots and inflate Cloud minutes.
- Import `livekit-server-sdk` only in backend `VoiceModule` code.
  Why: importing it client-side ships the token-signing API into the browser.
- Render voice UI with `@livekit/components-react` hooks tied to a single `LiveKitRoom` context.
  Why: multiple uncoordinated room instances duplicate tracks and connections.
- Handle device-permission denial as a graceful UI state, not an exception.
  Why: an unhandled permission rejection crashes the whole room view.
- Store only StudyHall-native `channel_id` + `user_id` in `voice_sessions`, no LiveKit internal IDs.
  Why: storing SDK IDs couples the schema to LiveKit and blocks SFU migration.
- Keep the NestJS server out of the media path (signaling/token only).
  Why: routing media through the API defeats the SFU and exhausts the pod.

## §3 NEVER-DO RULES

- Never construct an `AccessToken` in frontend code.
  Why: it requires the API secret, which must never reach the client.
- Never ship `LIVEKIT_API_SECRET` or `LIVEKIT_API_KEY` in the `VITE_`-prefixed env.
  Why: `VITE_` vars are embedded in the public bundle.
- Never issue a token without a TTL.
  Why: a permanent token cannot be revoked and is replayable forever.
- Never grant `roomJoin` without scoping `room` to a specific channel.
  Why: an unscoped grant is a join-anything credential.
- Never skip the RBAC check before minting a voice token.
  Why: it lets non-members into private voice rooms.
- Never self-host without TURN configured.
  Why: a meaningful fraction of users behind NAT simply cannot connect.
- Never `browser_close` mid-Playwright-swarm when testing voice UI.
  Why: it kills the shared MCP instance for subsequent batch agents.
- Never assert on media-track state (ICE/DTLS/SFU routing) in headless E2E.
  Why: the media plane is not testable in headless Playwright — tests flake.
- Never leave a room connection open after the user navigates away.
  Why: orphaned connections consume participant slots and Cloud minutes.
- Never surface raw `LivekitError` or the API key in an error response.
  Why: it leaks internal config and credential hints to clients.
- Never hard-code `LIVEKIT_URL` for one deployment path.
  Why: it blocks switching between self-host and Cloud without a code change.
- Never require a camera to join a voice room.
  Why: it excludes audio-only participants and denied-permission users.
- Never reuse one token across different users or rooms.
  Why: a shared token breaks identity and over-grants access.
- Never mint a token for a room the channel-permission guard denied.
  Why: it bypasses the server-side authorization boundary.
- Never instantiate more than one `Room`/`LiveKitRoom` per active voice session.
  Why: duplicate rooms double-publish tracks and corrupt the participant grid.

## §4 ANTI-PATTERNS TO FLAG

- Name: Client token minting
  Description: `AccessToken` built in the SPA.
  Example: `new AccessToken(import.meta.env.VITE_LIVEKIT_API_KEY, secret, ...)`
  Detection signal: `livekit-server-sdk`/`AccessToken` imported under `apps/web`.

- Name: Secret in client env
  Description: API secret exposed via a `VITE_` variable.
  Example: `VITE_LIVEKIT_API_SECRET=...`
  Detection signal: `LIVEKIT_API_SECRET` (or key) referenced with a `VITE_` prefix.

- Name: TTL-less token
  Description: token issued with no expiry.
  Example: `new AccessToken(k, s, { identity })` without `ttl`.
  Detection signal: token construction missing a `ttl`/expiry option.

- Name: Unscoped grant
  Description: `roomJoin: true` with no `room` field.
  Example: `addGrant({ roomJoin: true })`
  Detection signal: a `VideoGrant` with `roomJoin` but no specific `room`.

- Name: RBAC-skipped token route
  Description: the voice-token endpoint issues a token without `RbacService.can`.
  Example: `@Post('voice/token') token() { return mint(...) }` with no guard.
  Detection signal: the token controller missing the channel-permission guard.

- Name: Self-host without TURN
  Description: LiveKit self-host config omits TURN/STUN.
  Example: a Railway LiveKit service with no TURN block.
  Detection signal: self-host deployment config lacking TURN/STUN configuration.

- Name: Media-plane E2E assert
  Description: a Playwright test asserting on track/ICE state.
  Example: `expect(track.isSubscribed).toBe(true)` in an E2E spec.
  Detection signal: E2E assertions on media/track/connection-quality state.

- Name: Leaked room connection
  Description: no `disconnect()` on unmount/navigation.
  Example: a `LiveKitRoom` with no cleanup in `useEffect` return.
  Detection signal: a room connect with no matching disconnect on teardown.

- Name: Camera-required join
  Description: join flow that fails when no camera is present.
  Example: `await room.localParticipant.setCameraEnabled(true)` with no fallback.
  Detection signal: a join path with no audio-only branch on camera/permission failure.

## §5 INTEGRATION SIGNALS

- backend-developer — `VoiceModule` token service, room management, error mapping, env config.
- websocket-engineer — realtime/voice presence wiring, reconnection, Socket.IO ↔ voice-room occupancy.
- frontend-developer — `@livekit/components-react` participant grid, mic/cam/screen-share controls, audio-only fallback.

## §6 CLOSING PRINCIPLE

The server signs tokens and never touches media; tokens are short-lived, RBAC-gated, and room-scoped; the client degrades gracefully to audio-only — and the media plane is the SDK's test surface, not yours.
