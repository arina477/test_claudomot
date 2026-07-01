# V-1 — jenny semantic-spec verification (wave-31, M6 voice token-mint + client)

**Reviewer:** jenny (semantic-spec: does LIVE DEPLOYED behavior match the spec's INTENT?)
**Spec:** DB task `d8a85de0-3015-45f0-84be-e879ccd90c91` (multi-spec, 2 blocks) + sibling `1dd1f2ca`
**Deployed:** api `001b3da2` (SUCCESS, digest f738bf07…) + web `e103384e` (SUCCESS, digest e9365e02…) on Railway prod.
**Runtime-evidence basis:** live 401 route-flip (C-2) + live uniform-403 authz probe on random UUID (T-8) + unit JWT-decode (T-2) + shipped code. Live voice-connect honestly creds-deferred (LIVEKIT_* absent → 503 for authed, by design).

## Verdict: APPROVE

Every AC's INTENT is met by the deployed behavior. The single spec deviation (404→403 on missing channel) is a spec-GAP, not spec-DRIFT — the shipped uniform-403 is the security-correct behavior; the spec's 404 AC was the weaker call and must reconcile to 403 at L-1. No blocking findings.

---

## Block 1 — token-mint (d8a85de0), AC by AC

| AC (spec intent) | Deployed behavior | Match |
|---|---|---|
| member on voice channel → 200 `{token,url}`, token=LiveKit JWT, url=server URL | `voice-token.controller.ts:40-49` returns service result; `voice-token.service.ts:126-145` mints AccessToken + returns `{token, url: LIVEKIT_URL}`. Unit decodes real JWT (spec.ts:143-162). | ✅ INTENT met |
| JWT room-scoped (room=channelId), identity=userId, short-lived (~1h), roomJoin+canPublish+canSubscribe, signed w/ SECRET never in response/client | `service.ts:126-139` identity=userId (JWT `sub`), ttl `'1h'`, room=channelId, roomJoin/canPublish/canSubscribe true. Unit asserts `sub==USER_ID`, `video.room==CHANNEL_ID`, `roomJoin/canPublish/canSubscribe true`, `exp` bounded (spec.ts:146-162). Secret read from `process.env` server-side only, never returned. | ✅ INTENT met |
| non-member / cannot-view → 403, gated on `canViewChannelById(userId,channelId)` (id-only, NOT 2-param guard) | `service.ts:97-100` RBAC-first → `ForbiddenException`. **Live T-8 probe: authed request on random UUID → 403 on prod.** Uses `canViewChannelById` (rbac.service.ts:427). | ✅ INTENT met |
| non-voice channel type → 400/409 | `service.ts:110-111` `channel.type !== 'voice'` → `BadRequestException` (400). Unit spec.ts:189. | ✅ INTENT met |
| unauth → 401; unverified → 403 (AuthGuard) | `controller.ts:41` `@UseGuards(AuthGuard)`. **Live C-2 route-flip: unauth POST → 401 `{message:unauthorised}` on prod** (also proves route registered on new revision). Guard stacking: 401 (AuthGuard) fires before 403 (in-service RBAC). | ✅ INTENT met + 2b confirmed |
| creds unset → clear 503, not malformed token | `service.ts:119-121` env-guard → `ServiceUnavailableException` (503). **Live C-2: LIVEKIT_* confirmed absent; authed → 503 by design.** Unit spec.ts:197/204/211 (missing key/secret/url each → 503). | ✅ INTENT met |
| livekit-server-sdk imported ONLY in apps/api, never apps/web; build/lint/test asserts no web import | **grep confirmed: 0 real `livekit-server-sdk`/`AccessToken` imports under `apps/web/src`** (only comments + the anti-pattern test itself). Web imports `@livekit/components-react` only (VoiceStudyRoom.tsx:24-29). | ✅ INTENT met |

**Audio-first bonus vs spec:** grant additionally restricts `canPublishSources=[TrackSource.MICROPHONE]` (`service.ts:137`; unit asserts `['microphone']`). Tightens (never loosens) the spec's grant — camera/screen-share excluded at the token layer. No drift; supports the audio-first fixed decision.

---

## Item 2 — the 404→403 change: spec-GAP adjudication

**Classification: spec-GAP (the spec's 404 AC was the weaker/wrong call; shipped uniform-403 is security-correct). NOT spec-DRIFT.**

- Spec block-1 AC #4 said "missing channel → 404 (load the channel row explicitly)".
- Shipped: `canViewChannelById` returns `false` on missing (rbac.service.ts:427-437), and the service gates RBAC **first** (`service.ts:97-100`) → missing and non-member both yield an identical **403** with zero existence/type signal. `service.ts:10-16` documents this as the deliberate B-6 security fix.
- **Why GAP not DRIFT:** the spec's own AC text flagged the hazard ("canViewChannelById returns false, not throw, on missing, so 404-missing must be distinguished from 403-non-member") — distinguishing them is precisely the enumeration leak the /review P1 caught: a 404-vs-403 split lets a non-member probe channel existence. The codebase convention (`ChannelMessageGuard`) is uniform-403 default-deny. This is a credential-issuing endpoint (P-4 security-scope gate). The spec's 404 optimizes debuggability at the cost of an existence oracle; the shipped 403 chooses non-enumerability — the correct trade for this endpoint. Precedent: wave-28's 200→201 reconciliation (code security/correctness-right, spec reconciles to it).
- **Live proof:** T-8 authed probe on a random UUID returned **403** on prod (not 404) — the enumeration-safe behavior is deployed, not just coded.

**L-1 reconciliation recommendation (non-blocking):**
1. Amend d8a85de0 spec block-1 AC "missing channel → 404" → **"missing channel → 403 (uniform default-deny; no existence signal to non-members — enumeration-safe)"**, mirroring wave-28's 200→201 amendment.
2. Fix the downstream 404 doc-drift the T-block already logged: controller JSDoc `voice-token.controller.ts:37` ("404 — channelId does not exist") and `useVoiceToken.ts:126-128` (dead 404 branch) — F-31-T-2 / F-31-T-3. These are harmless doc/dead-code artifacts (the 404 path is unreachable), so **non-blocking**, but should land at L-1 for spec/code coherence.

---

## Block 2 — client join surface (1dd1f2ca), AC by AC

| AC (spec intent) | Deployed behavior | Match |
|---|---|---|
| React surface fetches token from POST endpoint, connects ON DEMAND (user clicks Join), NOT auto-connect on mount | `useVoiceToken.ts` does NOT auto-fetch (idle on mount; `fetchToken` explicit, lines 38-94). `VoiceStudyRoom.tsx:87` idle→PreJoinView "Join voice" CTA; `LiveKitRoom connect={true}` only rendered in `status==='ready'` (line 93-97) after the click. | ✅ INTENT met |
| minimal controls: leave/disconnect + audio(mic); camera OFF default; own presence shown | `VoiceStudyRoom.tsx:99` `video={false}`; `:98` `audio={true}`; mic-toggle (`:465-494`) + Leave (`:504-535`); own tile w/ presence dot (`:404-421`, `:587-596`). | ✅ INTENT met |
| follows D-block-adopted design/voice-study-room.html | Header + 5 states (pre-join/connecting/in-room populated/alone/error) map 1:1 to the adopted mockup (component doc `:4-9`). T-9 journey F4 confirms adopted design. | ✅ INTENT met |
| token-fetch failure (403/404/401) OR connect failure → clear error state, never blank/crash | `useVoiceToken.ts:87-93` catch → error state w/ classified message (`:117-137` maps 401/403/404/400/503 to friendly copy); `VoiceStudyRoom.tsx:107-113` `onError`→`setError` (visible ErrorView `:244-322` w/ Try-again), NOT silent pre-join fallback. | ✅ INTENT met |
| livekit-server-sdk/AccessToken NOT imported in web (only components-react + livekit-client) | grep-confirmed (see block-1 AC #7). | ✅ INTENT met |

**Edge cases:** camera-OFF/no-screen-share honored (`video={false}`, no screen-share UI). Unit render tests mock the connection (5 states + teardown, 13 web voice tests) — live connect honestly deferred to creds, matches the spec's own edge-case note.

---

## Cross-cutting checks

3. **Client intent (connect-on-demand / audio-first / error state / adopted design):** all met — see block-2 table.
4. **Channel + fixed decisions:** LiveKit **Cloud** (settled) — server out of media path, only mints tokens. Audio-first (settled) — `canPublishSources=[MICROPHONE]` + `video={false}`. No cross-server voice — gated on `canViewChannelById` which resolves `server_id` and delegates to `canViewChannel` (rbac.service.ts:427-437), so a user only gets a token for a channel in a server they belong to. **No drift on any fixed decision.**
5. **Journey map (F4):** T-9 confirmed current — `user-journey-map.md:220-222` describes F4 as audio-first 5-state surface + server-minted `POST /channels/:channelId/voice/token`, session+membership gated. Nothing dropped.
6. **M6 progress — first slice, NOT closed:** milestone `8702a335` "M6 — Voice/video study rooms" is **`in_progress`** in the DB (correct). This slice ships token-mint + minimal client join only. The M6 metric requires live voice + screen-share + audio-fallback + occupancy/rings — **all future M6 waves**. **"First slice shipped" ≠ "M6 metric met."** M6 correctly stays `in_progress`; the metric is NOT yet met. Both claimed tasks are `in_progress` (V-block will not close them; that is N-block's move after V/L pass).

---

## Findings summary

**Blocking:** none.

**Non-blocking (→ L-1 reconciliation):**
- **spec-GAP (adjudicated):** block-1 AC "missing channel → 404" superseded by security-correct uniform-403. Amend spec AC → 403 (wave-28 200→201 precedent). Live-proven (T-8 prod 403 on random UUID).
- **doc-drift (F-31-T-2/T-3):** controller JSDoc `:37` + `useVoiceToken.ts:126-128` dead 404 branch — harmless (unreachable), clean up at L-1 with the AC amendment.
- **F-31-T-1 (MEDIUM, pre-existing wave-wide, non-blocking):** malformed non-UUID channelId → 500 (canViewChannelById 22P02). Predates this wave (same on wave-12 messages route); no leak, no auth bypass; tracked task 4a92327c (ParseUUIDPipe project-wide). Not a wave-31 hard-stop.

**Deferred honestly (not a gap):** live voice-connect (media plane) — LIVEKIT_* creds founder-pending; 503-by-design proven live; token-mint gate + client states proven by unit + live T-8/C-2 probes. Consistent with the spec's own creds edge-case.

verdict: APPROVE
blocking_findings: 0
