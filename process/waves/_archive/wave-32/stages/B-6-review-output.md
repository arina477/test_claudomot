# Wave 32 — B-6 /review output (critical-pass, orchestrator-run)

**Scope Check: CLEAN.** Intent: M6 pre-join voice occupancy (endpoint + client indicator). Delivered: exactly that (2000 insertions across 11 files, ~1082 of which are tests). No out-of-scope changes; no missing requirements (all 7 ACs implemented + tested).

## Critical categories
- **SQL / injection safety — CLEAN.** All DB access via Drizzle parameterized builders (`eq(channels.id, channelId)`, `inArray(users.id, identities)`). No string interpolation into SQL. (confidence 9/10, voice-participants.service.ts:130-134,178-181)
- **Contract mismatch — CLEAN.** `{count:number, participants:[{userId:string,displayName:string}]}` identical across service → controller → api.ts → useVoiceOccupancy → VoiceOccupancyIndicator. Repo typecheck (strict, exactOptionalPropertyTypes) enforces it. (9/10)
- **Null access — CLEAN.** `userMap.get(p.identity)` may be undefined → guarded by optional chaining (`user?.display_name`); `||` fallback resolves to email-local then userId; never empty. (9/10, service.ts:190-196)
- **Error handling — CLEAN.** TwirpError (absent room) → `{count:0,[]}`; all OTHER errors rethrow (correct — no silent swallow of unknown failures); creds-unset → explicit 503. Client hook fail-soft: preserves last-known data on error, swallows only AbortError. (9/10)
- **Secret leakage — CLEAN.** RoomServiceClient / livekit-server-sdk imported server-side only; grep confirms zero server-SDK import in apps/web; LIVEKIT_API_SECRET read only in the service, never returned. (9/10)
- **Race / concurrency — CLEAN.** Bounded poll (setInterval, not websocket); AbortController aborts previous in-flight before each tick (coalescing, BUILD rule 5); interval + abort torn down on unmount AND enabled=false; no double-fetch on enabled-flip. (9/10, useVoiceOccupancy.ts:95-142)
- **Enum/value completeness — N/A.** No new enum/status/tier introduced.
- **Conditional side effects — CLEAN.** `enabled: status === 'idle'` gates the poll to the pre-join surface; stops the moment the user joins. Empty-room CTA branch is pure presentation. (9/10, VoiceStudyRoom.tsx:61)

## Findings
- **Critical:** none.
- **High:** none.
- **Medium (accepted-debt):** the two voice services (token + participants) both read LIVEKIT_* via `process.env` rather than ConfigService (plan said ConfigService). Consistent + correct shipped behavior; carried to L-1 for spec reconciliation (VERIFY rule 2). Not a bug.
- **Low:** D-3 build-polish carries (off-4px-grid arbitrary spacing values) — cosmetic, non-blocking.

## Verdict
No critical/high findings. PR quality high. → B-6 Phase 2 PASS.
