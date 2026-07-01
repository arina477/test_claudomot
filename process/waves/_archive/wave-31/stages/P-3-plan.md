# Wave 31 — P-3 Plan (multi-spec: M6 voice token-mint + client join)

## Approach section

### Architecture deltas
- **New `VoiceModule` (apps/api/src/voice/)** — a `VoiceTokenController` (`POST /channels/:channelId/voice/token`) + `VoiceTokenService`. The service loads the channel (404 if missing), gates on `RbacService.canViewChannelById(userId, channelId)` (403 if not), checks `channel.type === 'voice'` (400 else), then mints a LiveKit `AccessToken` (livekit-server-sdk) room-scoped to channelId. **Alternative:** put the route on the existing ServersController — REJECTED (voice is a distinct module boundary; keeps LiveKit imports isolated to VoiceModule). **Failure domain:** the token endpoint issues a credential — the auth+membership+voice-type gate is the security boundary; the API secret stays in the service (never serialized).
- **New client `voice-study-room` surface (apps/web)** — a React component using `@livekit/components-react` `LiveKitRoom` with `connect` gated on a user Join action (not on mount), fetching the token from the endpoint. **Alternative:** auto-connect on mount — REJECTED (a study room is drop-in-on-intent; auto-connecting on navigation wastes media + surprises the user). Minimal controls (leave + mic; camera off). **Failure domain:** client-only; token-fetch/connect errors render an error state.
- **Anti-pattern guard:** `livekit-server-sdk`/`AccessToken` imported in apps/api ONLY — never apps/web (would ship the API secret to the browser). An explicit test/lint check asserts this.

### Data model
No schema change. A voice room maps to an existing `channels` row (type='voice'); no new table. (Occupancy tracking — a future M6 wave — is split out.)

### API contracts (concrete)
- **`POST /channels/:channelId/voice/token`** — AuthGuard; path `:channelId`; no body; caller = session userId. 200 → `{ token: string, url: string }` (url = LIVEKIT_URL). Errors: 401 unauth, 403 unverified|non-member, 404 channel-missing, 400 non-voice-channel, 503 creds-unset-at-runtime.

### Dependency list
- **NEW: `livekit-server-sdk@2.15.5`** (apps/api) — server token mint (`AccessToken`, `addGrant`, `toJwt`). Why: the LiveKit-official server SDK; pinned to the SDK-doc version.
- **NEW: `@livekit/components-react@2.9.21` + `livekit-client`** (apps/web) — the LiveKit React client. Why: official client components; pinned.
- **External SDK pre-build (P-3 obligation):** read `command-center/dev/SDK-Docs/LiveKit/livekit.md` — versions pinned (2.15.5 / 2.9.21), the AccessToken constructor + addGrant(VideoGrant) + toJwt() surface confirmed, the apps/api-only import boundary documented. Env: LIVEKIT_API_KEY/SECRET/URL (server) + VITE_LIVEKIT_URL (client) — **not yet in Railway** (build with placeholder; live-connect needs founder creds; carry to C-2/T).

### SDK pre-build checklist
- Installed versions: livekit-server-sdk 2.15.5, @livekit/components-react 2.9.21 (per SDK doc — B-0 installs + confirms).
- Method surface verified: `new AccessToken(key,secret,{identity,ttl})`, `.addGrant({roomJoin,room,canPublish,canSubscribe})`, `.toJwt()`.
- Env-var contract: LIVEKIT_API_KEY/SECRET/URL (server), VITE_LIVEKIT_URL (client). Placeholder-key build path confirmed (unit tests decode the JWT, no live connect).

## Plan section

### File-level steps by B-stage
**B-0 Branch & schema:** branch `wave-31-voice-token-mint`. Install `livekit-server-sdk` (api) + `@livekit/components-react` + `livekit-client` (web); commit lockfile. No DB migration.

**B-1 Contracts:** SKIP (inline `{token,url}` DTO; no shared `@studyhall/shared` type / Zod / OpenAPI change). Record skip + fast-path note (B-3 depends on B-2's endpoint + the D-block design, so no B-2∥B-3 parallel).

**D-block (design_gap_flag=TRUE — runs BEFORE B-3):** D-1 brief → D-2 variants → D-3 adopt for the **voice-study-room** client surface (join/in-room/leave; audio-first; dark theme per DESIGN-SYSTEM). Output: `design/voice-study-room.html` adopted. B-3 builds to it.

**B-2 Backend:**
| # | Path | Op | What | Specialist |
|---|---|---|---|---|
| 1 | apps/api/src/voice/{voice.module.ts, voice-token.service.ts, voice-token.controller.ts} | create | VoiceModule + `POST /channels/:channelId/voice/token` (AuthGuard + canViewChannelById + channel-load [404/403] + type='voice' [400] → AccessToken mint room-scoped, ttl ~1h; 503 if creds unset) | livekit-integration |
| 2 | apps/api/src/app.module.ts | modify | register VoiceModule | livekit-integration |
| 3 | apps/api/src/voice/voice-token.service.spec.ts (+ controller spec) | create | unit: member→token (decode JWT: room=channelId, identity=userId, grants, exp~1h) with a PLACEHOLDER key; non-member→403; missing→404; non-voice→400; unset-creds→503 | livekit-integration |
| 4 | (guard test) | create | assert `livekit-server-sdk`/`AccessToken` is NOT imported under apps/web (grep-based test or lint rule) | livekit-integration |

**B-3 Frontend (AFTER B-2 + D-3):**
| # | Path | Op | What | Specialist |
|---|---|---|---|---|
| 5 | apps/web/src/**/VoiceStudyRoom.tsx (+ token-fetch hook + tests) | create | voice-study-room surface (@livekit/components-react LiveKitRoom, connect-on-Join, mic + leave, camera off; error state) built to the D-3 design; render/unit tests with LiveKit connection mocked (no live server) | livekit-integration |

**B-4 Wiring:** repo typecheck + `biome check` + build. Verify VoiceModule registered; the anti-pattern guard (no livekit-server-sdk in web) passes.

**B-5 Verify:** api+web unit + build (live LiveKit connect NOT required — placeholder key; deferred to T-5/C-2). **B-6 Review:** head-builder gate + /review. Commit-per-spec: token-mint → Refs d8a85de0; client → Refs 1dd1f2ca.

### Specialist routing (validated against AGENTS.md)
- `livekit-integration` — LiveKit voice/video (server token-mint in NestJS VoiceModule + the @livekit/components-react client). In AGENTS.md (the LiveKit specialist covers both server + client per its card). Backup: node-specialist (server) + react-specialist (client) if needed.
- Design: D-block head-designer + aidesigner for the voice-study-room surface.

### Parallelization
Serial: B-0 → B-2 (server token-mint) → D-block (voice-room design) → B-3 (client to the design + endpoint). B-2 ∥ D-block possible (disjoint: server code vs design), but B-3 needs both. livekit-integration owns B-2 + B-3 (serialize).

### Action 8 — self-consistency sweep
Block-1 ACs (token, gate 403/404/400/401, JWT claims, secret-server-side, anti-pattern guard) → steps 1-4. Block-2 ACs (fetch+connect-on-demand, minimal UI, follows-design, error state, no-server-sdk-in-web) → step 5 + D-block. Every AC mapped; specialists routed (livekit-integration); design_gap_flag=TRUE referenced (D-block fires); contracts concrete (route, JWT grants, DTO); new deps justified + SDK pre-build done; LiveKit creds carry noted. Clean.

## Exit
Multi-spec plan: B-2 VoiceModule token-mint (livekit-integration) → D-block voice-room design → B-3 client join (livekit-integration). B-1 skip. **design_gap_flag=TRUE → D-block FIRES after P-4.** External SDK LiveKit (server+client, pre-build done). Security (token-mint) → P-4 security gate + T-8. Creds not-in-Railway → build placeholder + founder heads-up. → P-4 Gate.
