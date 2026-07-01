# Wave 32 — P-3 Plan (single-spec: M6 occupancy)
## Approach
- **Server:** extend the wave-31 `VoiceModule` with a `VoiceParticipantsService` + a `GET /channels/:channelId/voice/participants` controller route. Reuse the EXACT wave-31 gate helper (canViewChannelById FIRST → 403; channel-load; type='voice' → 400) — factor it if not already shared, else mirror. RoomServiceClient (livekit-server-sdk, already installed) constructed with EXPLICIT host/apiKey/secret from ConfigService (gotcha #3). `listParticipants(channelId)` → map ParticipantInfo.identity(=userId) → member display via usersService.findById (batch WHERE id IN) with null-display fallback → `{count, participants}`. TwirpError/absent-room → `{count:0,[]}`. Creds-unset → `{count:0,[]}` or 503. **Alt considered:** LiveKit webhooks for push occupancy — REJECTED (live-push is mvp keep-OUT; poll is the MVP). **Failure domain:** read-only; a LiveKit error → empty list (fail-soft), never crashes the pre-join.
- **Client:** an occupancy indicator component on the wave-31 voice-study-room PRE-JOIN surface — fetch `/participants` on a bounded interval (~10-15s) while pre-join is visible; stop on unmount/join. Render count + identities per the D-block-adopted design. **Alt:** websocket live occupancy — REJECTED (keep-OUT). **Failure domain:** client-only; fetch error → show nothing/stale (no crash).
## Data model / contracts / deps
No schema/migration. No new dep (livekit-server-sdk from wave-31). Inline `{count, participants}` DTO → B-1 SKIP. SDK: RoomServiceClient.listParticipants (SDK docs read; explicit-creds + TwirpError confirmed).
## Plan by B-stage
- **B-0:** branch `wave-32-voice-occupancy`. No schema/dep.
- **B-1:** SKIP (inline DTO).
- **D-block (design_gap=TRUE, before B-3):** D-1/D-2/D-3 for the occupancy indicator (bounded extension of design/voice-study-room.html pre-join; count + identities; dark-theme tokens). Adopt.
- **B-2 backend (livekit-integration):** VoiceParticipantsService + route (reuse gate, RoomServiceClient explicit-creds, identity→display null-fallback, empty→0) + unit tests (mock RoomServiceClient: member→list, non-member→403, empty→0, null-display fallback, creds-unset→0/503) + anti-pattern (RoomServiceClient not in web).
- **B-3 frontend (livekit-integration):** occupancy indicator to the adopted design + bounded-poll hook (stop on unmount/join) + tests (mock fetch: count/identities render, poll bounded, error→no-crash).
- **B-4/B-5/B-6:** typecheck+lint+build; unit; head-builder gate + /review (security: no cross-server leak, secret server-side, bounded poll).
## Specialist routing
- `livekit-integration` — RoomServiceClient occupancy read (server) + the client indicator (its domain). In AGENTS.md.
## Action 8 sweep
AC1-5 (endpoint) → B-2; AC6 (client indicator) → D-block + B-3; AC7 (credential-independent) → B-2/B-3 mocks. Every AC mapped; design_gap_flag=TRUE (D-block); security (reuse gate) → P-4/T-8; no new dep/schema. Clean.
## Exit
Single-spec: B-2 participants endpoint (reuse wave-31 gate + RoomServiceClient) → D-block occupancy-indicator design → B-3 client indicator + poll. B-1 skip. design_gap=TRUE → D fires. livekit-integration. Security → P-4 gate. → P-4 Gate.
