# Wave 32 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn)
**Reviewed against:** process/waves/wave-32/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale

The M6 occupancy wave is contract-faithful end-to-end and its one load-bearing security surface — the uniform-403 membership gate — is genuinely reproduced, not merely code-read. I verified all seven gate heuristics against the actual source and tests (not the stage summaries) and re-ran both suites live: backend voice specs 24/24 green, frontend occupancy 27/27 green.

**H-1 Authz boundary (LOAD-BEARING) — PASS.** `VoiceParticipantsService.listParticipants` runs `rbacService.canViewChannelById` FIRST (line 123) and throws `ForbiddenException` before any channel load or LiveKit call. The negative path is reproduced by three distinct tests in `voice-participants.service.spec.ts` that assert ordering, not just the thrown type: `non-member/missing channel → db.select NOT called` (asserts `expect(mockSelect).not.toHaveBeenCalled()`), `non-member → RoomServiceClient NOT called` (`mockListParticipants` not called), and `RBAC called with correct userId+channelId`. A non-member gets a uniform 403 with zero existence/type leak — a missing channel and a non-member are indistinguishable to the caller. This is a faithful mirror of the wave-31 token-service gate (confirmed by reading `voice-token.service.ts`: same `canViewChannelById → 403`, same `type !== 'voice' → 400` order). The dev-smoke 401 (unauth) covers the AuthGuard door; the 403 non-member door is reproduced in unit tests as required.

**H-2 Contract — PASS, no drift.** Server emits `{count, participants:[{userId, displayName}]}`; `api.ts:getVoiceParticipants` types it identically; `useVoiceOccupancy` consumes `{count, participants}`; `VoiceOccupancyIndicator` props match `VoiceParticipant`. One inline DTO, one shape, both sides.

**H-3 Realtime discipline — PASS.** Poll is BOUNDED (`setInterval` at 10s, within the 10–15s spec window), not a websocket. AbortController coalescing aborts the prior in-flight request each tick; interval + abort are torn down on BOTH unmount and `enabled=false`. Tests cover coalescing, both teardown paths, and interval re-fire. No double-fetch on enable-flip: the effect's cleanup (clearInterval+abort) runs before re-entry, and the channelId-reset effect only sets loading state (no fetch).

**H-4 `||` fallback — PASS.** `display_name || email-localpart || userId` (line 192-193). The empty-string case is explicitly tested (`empty-string display_name → falls back to email localpart (|| not ??)`) — the P-4/karen carry is honored.

**H-5 Secret discipline — PASS.** `RoomServiceClient` constructed server-side only with explicit host/key/secret (gotcha #3, no env fallback). grep confirms zero `livekit-server-sdk`/`RoomServiceClient`/`AccessToken` imports in apps/web (only comments + an anti-pattern guard test reference the string).

**H-6 Scale — PASS, no gold-plating.** Batched user lookup via one `WHERE id IN (...)` query (no N+1). 10s poll is reasonable. No Redis/websocket/queue added.

**H-7 Deviations — all acceptable, none a silent contradiction.** `process.env`-not-ConfigService is the *correct* mirror of the established wave-31 convention (verified against `voice-token.service.ts:115-117`) — mirroring it is the plan, not a deviation from it. `isTwirpError` by constructor-name avoids importing the type into the error path (pragmatic, tested via a subclass whose `constructor.name === 'TwirpError'`). Dead-method-reconciled and test-stub-fix are hygiene. TwirpError/empty-room → `{count:0,[]}` and creds-unset → 503 both tested.

Module wiring correct (`VoiceModule` imports AuthModule/RbacModule/UsersModule; registers the new controller + service). Live LiveKit occupancy remains deferred to T/C-2 pending Railway creds — a standing, non-blocking escalation the spec sharpened, not a build gap.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2
