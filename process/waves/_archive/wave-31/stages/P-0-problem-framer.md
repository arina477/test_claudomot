```yaml
verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Framing is architecturally sound and code-verified. Server-side token-mint (API
  secret stays server-side, client receives a short-lived room-scoped JWT) is the
  correct LiveKit pattern — the client-side-secret antipattern is explicitly guarded
  against in every task AC and in the SDK doc. The gate correctly stacks SuperTokens
  session THEN membership/RBAC THEN voice-channel-type, all of which map to existing,
  verified code (`AuthGuard.verifySession`, `RbacService.canViewChannelById`,
  `channels.type` discriminator). CRITICAL VERDICT: this wave is BUILDABLE-NOW, not
  credential-blocked — the token-mint service and its unit tests sign+assert JWT
  claims/grants/expiry with a placeholder key and never open a live LiveKit
  connection; the client join surface renders+wires against @livekit/components-react
  with connect-on-demand and never needs a live server. Self-host-vs-Cloud is already
  DECIDED (Cloud, product-decisions 2026-Q2) and does not block THIS wave regardless.
  Scope (3 tasks) is the correct load-bearing-first slice; no gold-plating in-bundle.
  Two non-blocking framing precisions handed to P-1/P-2 (see below) — neither warrants
  REFRAME because the ACs already point at the right layer and target.
proposed_reframe: |
  (n/a — PROCEED)
escalation_reason: |
  (n/a — PROCEED)
sibling_visible: false
```

---

# Wave-31 P-0 — problem-framer verdict

## Symptom-vs-cause check (mandatory)

This is a greenfield feature wave, not a bug-fix, so there is no symptom→cause
inversion risk in the classic sense. The equivalent check — "is the seed's named
target the real load-bearing boundary?" (PRODUCT-PRINCIPLES rule 2) — PASSES:

- The seed correctly identifies the **server-side token-mint** as the load-bearing
  first slice. Nothing joins a room without a server-minted room-scoped token; the
  client (1dd1f2ca) and occupancy (78f51968) are downstream consumers. This is the
  right causal ordering, matching M6 `## Scope` ("room + token service after session
  check is first + load-bearing").

## Code-verified framing premises (PRODUCT-PRINCIPLES rule 1)

Every seed premise was checked against the actual repo, not the decomposer prose:

| Premise (from task ACs) | Verified? | Evidence |
|---|---|---|
| No `VoiceModule` exists yet (greenfield) | TRUE-absent | `apps/api/src/voice/` does not exist; no `voice`/`channel` module dirs found |
| SuperTokens session guard exists to reuse | TRUE-present | `apps/api/src/auth/auth.guard.ts` — `AuthGuard.canActivate` wraps `verifySession()` |
| Membership/RBAC gate exists to reuse | TRUE-present | `RbacService.canViewChannelById(userId, channelId)` (rbac.service.ts:428) = channel-id-only membership+visibility check, default-deny on missing channel |
| Channel has a "voice channel" discriminator | TRUE-present | `channels.type = text('type').default('text').notNull()` (schema/servers.ts:79) — voice channels carry `type='voice'`; the AC's "confirm channel is a voice channel" is a real, buildable column read |
| LiveKit Cloud is the decided path | TRUE | product-decisions 2026-Q2 (lines 127-133): Cloud, not self-host on Railway |
| Env vars provisioned, no founder-ask blocks this slice | TRUE | product-decisions line 387: LIVEKIT_URL/API_KEY/API_SECRET server-side + VITE_LIVEKIT_URL client already provisioned |

## Antipattern scan (against the client-side-secret + gold-plating + scope-creep lens)

- **Client-side-secret (#2 wrong-layer / security):** NOT triggered — the framing
  explicitly forbids it. Seed AC: "`LIVEKIT_API_KEY`/`SECRET` read server-side only,
  never `VITE_`-prefixed, never imported in `apps/web`." SDK doc carries an
  ANTI-PATTERN GUARD (livekit.md:13). `RoomServiceClient` in the occupancy task
  (78f51968) correctly stays server-side with explicit ConfigService creds (gotcha #3).
  The API stays out of the media path. Correct layer throughout.
- **Gold-plating (#3/#4):** NOT triggered — screen-share, speaking/presence rings,
  low-bandwidth auto-downgrade, recording, breakout rooms, moderation are all
  explicitly OUT (product-decisions line 388; each sibling task names its own OUT
  list). LiveKit-native audio-only fallback is the ONLY degradation in scope — that
  is a correctness requirement (gotcha #7 "never require camera to join"), not gold.
- **Scope-creep through coupling (#5):** NOT triggered — the 3 tasks are one coherent
  end-to-end slice (mint → join → see-who's-in), not 2+ unrelated changes bundled.
  Occupancy is NOT premature: it reuses the seed's exact server-side creds + membership
  gate and closes the "door left open" loop (see inside → join) that is the M6
  success-metric affordance. Sized ~2,200 net LOC, within rubric.
- **Configuration drift (#6) / validation theater (#7) / backwards-compat (#8):** none
  triggered.

## Buildable-now determination (KEY QUESTION)

**BUILDABLE-NOW. Not credential-blocked** (unlike the M5 reminders wave, which was
blocked on a live Resend key). Reasoning:

1. **Token-mint service + unit tests need no live LiveKit account.** The mint is a
   pure JWT-signing operation: `new AccessToken(key, secret, {identity, ttl})` +
   `addGrant({roomJoin, room, canPublish, canSubscribe})` + `await toJwt()`. Tests
   sign with a placeholder key/secret and assert the decoded JWT structure — `sub`
   (identity=userId), `exp` (4h bound), `video` grant (roomJoin + room=channelId +
   canPublish + canSubscribe), `iss`. No network call to LiveKit occurs during mint
   or during unit verification. The membership/session gate is tested against the
   existing DB-backed RBAC path exactly like the message guards already are.
2. **Client join surface needs no live server.** `<LiveKitRoom connect={false}>` /
   connect-on-demand behind a "Join Room" gesture renders and wires without ever
   dialing a server. Rendering, the mic/cam toggle wiring, `onMediaDeviceFailure`
   audio-only degradation, and disconnect-on-unmount are all testable as component
   behavior. Per the specialist card + SDK doc, the media plane (ICE/DTLS/SFU/track
   routing) is explicitly NOT headless-E2E-testable — but that is deliberately OUT of
   this wave's verifiable surface, so its untestability blocks nothing here.
3. **Occupancy endpoint** wraps `RoomServiceClient.listParticipants(channelId)`; its
   testable surface is the session+membership gate, env-var wiring (gotcha #3), and
   the "absent room / TwirpError → empty list" mapping — all assertable with the
   client mocked at the VoiceModule boundary. Live-connect verification is deferred.

**What live creds ARE eventually needed for (a LATER wave, not this one):** actually
connecting a browser to LiveKit Cloud and confirming audio flows — i.e. the
end-to-end media smoke test. That is a deploy/live-connect concern (C/T-block against
real Cloud), correctly out of this build-and-unit-verify slice.

## Self-host vs Cloud

Does NOT block this wave. The token format (AccessToken + VideoGrant + JWT claims) is
identical for self-host and Cloud — only `LIVEKIT_URL` + the key/secret values differ,
and both are env-driven via ConfigService. The decision is already made (Cloud,
product-decisions 2026-Q2) so there is not even a live decision to flag; recording it
here only as a confirmed constraint the mint code already honors (env-driven URL, never
hard-coded — livekit-integration always-do rule).

## Two non-blocking precisions handed forward (NOT a REFRAME)

These sharpen P-1/P-2 but the ACs already point at the correct layer + target, so no
reframe is warranted:

1. **Gate reuse target — use `canViewChannelById`, not the 2-param
   `ChannelPermissionGuard`.** The route is `POST /channels/:channelId/voice/token`
   (serverId-less). The existing `ChannelPermissionGuard` reads BOTH `req.params.id`
   (serverId) AND `req.params.channelId` (channel-permission.guard.ts:47-48) and would
   403 on "missing route params" for this route shape. The correct reuse is the
   channel-id-only `RbacService.canViewChannelById(userId, channelId)` (rbac.service.ts:428),
   which is exactly the pattern `ChannelMessageGuard` already uses for the parallel
   serverId-less `/channels/:channelId/messages` route. P-2 should specify a
   voice-specific guard (or extend the message guard) built on `canViewChannelById`,
   NOT on the 2-param guard. This is a build-detail, not a framing error — the seed AC
   already says "member of the server owning `:channelId`," which is precisely what
   `canViewChannelById` computes.

2. **"Voice channel" check is a `channels.type='voice'` read, layered AFTER
   membership.** The discriminator exists (`channels.type`, default `'text'`). The
   seed AC correctly requires "the channel is a voice channel — else 403." P-2 should
   note the 404-vs-403 ordering (missing channel → 404; non-voice or non-member → 403)
   consistent with the existing default-deny convention, and that `canViewChannelById`
   returns false (not throw) on a missing channel so the voice-type check must load the
   channel row itself to distinguish 404 from 403.

## Disposition

PROCEED. Framing is sound, load-bearing-first, correctly layered, gold-plating-free,
and — critically — buildable-now with placeholder creds. The two precisions above are
forwarded to P-1/P-2 as build-shaping notes, not reframes.
