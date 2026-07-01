# Wave 32 — B-2 Backend

## Specialist
- **livekit-integration** — implemented the voice-participants endpoint (backend only).

## Files implemented
- `apps/api/src/voice/voice-participants.service.ts` (new) — `VoiceParticipantsService.listParticipants(userId, channelId)`
- `apps/api/src/voice/voice-participants.controller.ts` (new) — `GET /channels/:channelId/voice/participants` (AuthGuard)
- `apps/api/src/voice/voice-participants.service.spec.ts` (new) — 18 unit tests
- `apps/api/src/voice/voice-participants.controller.spec.ts` (new) — 6 unit tests
- `apps/api/src/voice/voice.module.ts` (mod) — register controller + service + UsersModule import

## AC → code
- AC1 200 {count,participants}: service:121 / controller:46
- AC2 uniform-403 gate order (canViewChannelById FIRST → 403; channel-load → 400; AuthGuard → 401): service:122-138 (exact mirror of voice-token.service.ts:97-112); controller:42
- AC3 RoomServiceClient EXPLICIT host/key/secret (gotcha #3) + ESM dynamic-import: service:143-156, getSdk() memoized
- AC4 empty/absent room TwirpError → {count:0,[]}: service:158-172, isTwirpError() class-name guard
- AC5 identity=userId → display, `||` fallback (display_name || email-local || userId): service:174-198 (batched WHERE id IN, no N+1)
- AC7 credential-independent / creds-unset → 503: service:143-149 (matches wave-31 ServiceUnavailableException)

## /simplify (Action 3)
Applied — verdict LEAVE-ALONE. Code is at correct clarity; step-gate + memoized import + TwirpError guard protect load-bearing invariants (gate order, `||` fallback, absent-room→empty). No edits.

## Deviations + adjudications
1. **env via process.env not ConfigService** (plan said ConfigService). Adjudication: ACCEPT — mirrors wave-31 voice-token.service.ts exactly; two env-access patterns in one module would be inconsistent. → carry to L-1 as a spec-vs-code reconciliation note (both should migrate to ConfigService together later; NOT a bug).
2. **isTwirpError via constructor.name** (not instanceof). Adjudication: ACCEPT — instanceof would require unwrapping the dynamic import in the catch; class-name check is the established ESM-dynamic-import pattern; test mock uses a real `class TwirpError extends Error`.
3. **VoiceParticipantsService queries db directly** (UsersModule imported for future use). Adjudication: ACCEPT — idiomatic to this codebase (VoiceTokenService queries channels directly too); spec requires the batch lookup, which is satisfied.

## Verification
449/449 unit tests green; biome (lint/import-sort) clean; typecheck clean.

```yaml
skipped: false
fast_path_active: false
specialists_spawned: [livekit-integration]
files_implemented:
  - apps/api/src/voice/voice-participants.service.ts
  - apps/api/src/voice/voice-participants.controller.ts
  - apps/api/src/voice/voice-participants.service.spec.ts
  - apps/api/src/voice/voice-participants.controller.spec.ts
  - apps/api/src/voice/voice.module.ts
deviations:
  - {specialist: livekit-integration, change: "process.env not ConfigService", plan_said: "ConfigService", why: "mirror wave-31", adjudication: accept-carry-L1}
  - {specialist: livekit-integration, change: "isTwirpError via constructor.name", plan_said: "handle TwirpError", why: "ESM dynamic-import", adjudication: accept}
  - {specialist: livekit-integration, change: "direct db lookup", plan_said: "usersService", why: "codebase-idiomatic", adjudication: accept}
simplify_applied: true
```
