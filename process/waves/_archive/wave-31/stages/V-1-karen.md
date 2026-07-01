# V-1 karen — wave-31 (M6 voice token-mint + client) — LIVE source-claim verification

**Verdict: APPROVE**

Scope: source-claim verification against the LIVE DEPLOYED state (HEAD = `aa8c8af`, ancestor-confirmed; `ca3d277` merged via PR #44 and is an ancestor of HEAD). API + web deployed and reachable. Every load-bearing claim below holds in the shipped code and, where probeable, in the deployed revision.

---

## Claim-by-claim verification

### Claim 1 — Fixed P1 gate (uniform-403, enumeration-safe) is in shipped code — HOLDS
`apps/api/src/voice/voice-token.service.ts:93-111`. `mintToken` calls `rbacService.canViewChannelById(userId, channelId)` FIRST (line 97); `!canView → ForbiddenException` (403, line 99). Only after the RBAC pass does it load the channel + type-check (lines 104-111 → 400 for non-voice, member-only reachable). The old load-first path is gone — the type-check is now provably downstream of the authz gate. A missing channel and a non-member channel both hit `canView===false` → identical 403 with zero existence/type signal. Matches the `ChannelMessageGuard` default-deny convention. **Confirmed.**

### Claim 2 — Secret server-side only — HOLDS
- `grep livekit-server-sdk|AccessToken` in `apps/web/src` returns only comments + anti-pattern test assertions (`VoiceStudyRoom.tsx:18`, `voice-study-room.test.tsx:321-327`) — no real import.
- No `VITE_`-prefixed LiveKit secret anywhere in `apps/web` (grep empty); no LiveKit ref in `apps/web/.env*`.
- `apps/web/package.json:16` carries `@livekit/components-react` (client lib — correct) but NOT `livekit-server-sdk` (server-mint SDK — correctly absent).
- Token endpoint returns only `{ token, url }` (`voice-token.service.ts:45-48, 145`); `LIVEKIT_API_SECRET` is read at `:116` and never returned.
- Live probe: unauthenticated POST returns body `{"message":"unauthorised"}` — no secret fragment. **Confirmed.**

### Claim 3 — Audio-scoped grant — HOLDS
`voice-token.service.ts:131-139`: `at.addGrant({ roomJoin: true, room: channelId, canPublish: true, canPublishSources: [TrackSource.MICROPHONE], canSubscribe: true })`. `canPublishSources` supersedes `canPublish` — camera/screen-share excluded. **Confirmed.**

### Claim 4 — Token props — HOLDS
`voice-token.service.ts:126-145`: `identity: userId` (:127), `room: channelId` (:133), `ttl: '1h'` (:128), `const token = await at.toJwt()` (:143 — awaited, v2.x async). ESM dynamic-import bridge present: `getSdk()` memoizes an in-flight `import('livekit-server-sdk')` Promise with import-failure → 503 mapping (`:55, :67-78, :124`). **Confirmed.**

### Claim 5 — Deploy live (voice route registered on deployed revision) — HOLDS
Live probes against `https://api-production-b93e.up.railway.app`:
- `POST /channels/<uuid>/voice/token` (unauth) → **401** (AuthGuard active, route registered).
- Control `POST /channels/x/voice/nonsense` → **404** — proves the 401 is the guard flip, not a route-miss.
- `GET /health` → **200** (deploy healthy; `/healthz` 404 is expected — Railway health path is `/health`).
- Web `https://web-production-bce1a8.up.railway.app` → **200**.
HEAD `aa8c8af` has `ca3d277` as ancestor; deployed revision serves an `aa8c8af`-ancestor. **Confirmed.**

### Claim 6 — Client (VoiceStudyRoom) behavior — HOLDS
`apps/web/src/shell/VoiceStudyRoom.tsx` + `useVoiceToken.ts`:
- Connect-on-demand / no auto-connect: `useVoiceToken` does NOT fetch on mount; `status` starts `'idle'` → PreJoinView; fetch fires only on `onJoin` click (`VoiceStudyRoom.tsx:87, useVoiceToken.ts:38-39, 63-68` reset-to-idle on channel change). Test `does NOT auto-connect on mount` (`voice-study-room.test.tsx:124`).
- `video={false}` (camera off): `VoiceStudyRoom.tsx:99`; asserted `voice-study-room.test.tsx:162-178`.
- Disconnect on Leave + unmount: `handleLeave → room.disconnect()` (`:347-350`); unmount teardown effect `roomRef.current.disconnect()` (`:357-361`). Teardown test uses a STABLE module-level `mockDisconnect` (`:38`) returned by every `useRoomContext()` call (`:80-82`), reset via `clearAllMocks` — `toHaveBeenCalledTimes(1)` on unmount (`:296`) is stable, not flaky. Leave test `:299-315`.
- `onError → error state`: `VoiceStudyRoom.tsx:107-113 → setError(message)` (not silent reset-to-pre-join); `useVoiceToken.setError` transitions to `'error'` (`:103-108`).
- Built to `design/voice-study-room.html` (present, 26 KB; 5 states implemented per component header `:4-9`). **Confirmed.**

### Claim 7 — 404→403 reconciliation carry documented (not a live defect) — HOLDS
The missing-channel now returns **403** (not 404): `canViewChannelById` returns `false` for a missing channel (`rbac.service.ts:435`), and the voice service maps that to 403 uniformly (`voice-token.service.ts:98-99`). This is the deliberate default-deny security fix and is explicitly flagged for L-1 reconciliation in the service header (`:14-16` "a missing channel now returns 403 (not 404) — deliberate default-deny … Flag for L-1 spec reconciliation").

Stale carries confirmed present (correct — these are the documented L-1 items, NOT live defects):
- Controller JSDoc `voice-token.controller.ts:37` still lists `404 — channelId does not exist` (stale — F-31-T-2).
- `useVoiceToken.ts:126-128` retains a `404` handler branch (stale — F-31-T-3). Harmless: the endpoint no longer emits 404 for missing channel, so the branch is dead, not wrong.
Both are documented for L-1 reconciliation, not live behavior bugs. **Confirmed — correct shipped behavior is 403.**

---

## Antipattern checks (rule 2)

- **Real security model, not theater — HOLDS.** Token mint is gated on SuperTokens session (AuthGuard → 401, live-confirmed) + membership (`canViewChannelById` → 403). No cross-server voice: grant is `room = channelId` scoped (`:133`). Secret stays server-side (Claim 2). Audio-scoped (Claim 3). This targets the actual model, not a happy-path stub.
- **Occupancy split honest — HOLDS.** `grep occupancy|participantCount` in `apps/api/src` is empty — no half-built occupancy field was shipped-then-abandoned. Consistent with the split-to-NULL/future-M6 claim (`78f51968`). The client derives a live count from LiveKit participants (`VoiceStudyRoom.tsx:363`), which is presentation, not a persisted server occupancy claim.
- **MEDIUM (malformed-UUID → 500) is genuinely PRE-EXISTING — HOLDS.** `canViewChannelById` runs `eq(channels.id, channelId)` on a `uuid` column (`rbac.service.ts:429-433`); a malformed UUID raises Postgres `22P02 → 500`. The voice controller takes a raw `@Param('channelId') channelId: string` with NO `ParseUUIDPipe` (`voice-token.controller.ts` — grep confirms absent). The identical shape exists on the wave-12 messages route: `messages.controller.ts:74` also takes a raw string param, no `ParseUUIDPipe`, and reaches the SAME `canViewChannelById`. Voice inherits established behavior verbatim — the MEDIUM is not introduced by this wave.

---

## Reality-check summary

No bullshit found. Every claim in the V-1 brief is backed by shipped source and, where testable, by live deployed behavior. The P1 security fix (uniform-403 reorder) is real and provably downstream-gated. The secret-server-side, audio-scoped, and token-prop claims all hold. The 404→403 shift is a deliberate, documented security fix with its stale-doc carries correctly logged for L-1 (F-31-T-2/T-3), not concealed as complete. The MEDIUM is honestly scoped as pre-existing. Occupancy was honestly deferred, not faked.

**Verdict: APPROVE.**

### L-1 reconciliation items to carry (documented, not blocking)
1. F-31-T-2: `voice-token.controller.ts:37` JSDoc still lists `404 — channelId does not exist` → update to 403.
2. F-31-T-3: `useVoiceToken.ts:126-128` dead 404 handler branch → remove or repoint.
3. Controller-spec "404 missing channel" test is stale vs. the 403 shipped behavior → reconcile at L-1.

### Recommended follow-up (non-blocking, future wave)
- The MEDIUM (malformed-UUID → 500) is pre-existing and out of scope here, but a `ParseUUIDPipe` on `:channelId` across all `channels/:channelId/*` routes (messages + voice) would convert it to a clean 400. Route to a future hardening task, not this wave.
