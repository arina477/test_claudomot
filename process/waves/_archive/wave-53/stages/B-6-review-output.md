# B-6 Phase 2 — Production-bug review — wave-53 study-room UUID guard + generic error mapping

Branch: `wave-53-study-room-uuid-guard` @ `a188168`
Scope: `git diff main...HEAD` — `apps/api/src/study-room/study-room.gateway.ts`, `apps/api/src/common/uuid.util.ts` (+ specs).
Reviewer stance: adversarial — does the fix actually close the info-disclosure leak without opening a new one?

## Verdict: APPROVED (no Critical / no High)

The leak is closed. All 7 catch blocks were converted to `safeErrorMessage`; `safeErrorMessage` never falls through to a raw message for a non-Forbidden error; `isUuid` is correct and correctly applied (serverId + roomId, never userId); malformed ids short-circuit at the parser before any service/DB call. Findings below are Medium/Low (UX regression + hardening notes), none blocking.

---

## 1. Leak fully closed? — YES

- All 7 catch sites now call `safeErrorMessage(err, <fallback>, this.logger)`: gateway.ts:198, 222, 374, 401, 423, 445, 467. Grep confirms zero remaining `err instanceof Error ? err.message` in the file.
- `safeErrorMessage` (gateway.ts:534-547) returns `err.message` ONLY for `ForbiddenException`; every other branch returns the caller-supplied `fallback` constant. There is no code path that returns a raw non-Forbidden message — the function's only two `return` statements are `err.message` (Forbidden) and `fallback`. No fall-through.
- The original leak vector — a non-UUID serverId reaching `assertMember`'s Drizzle uuid-cast and surfacing the raw `22P02 invalid input syntax for type uuid` string — is now closed on two independent layers:
  1. Parse-layer: `!isUuid(...)` in all 4 parsers rejects the payload → `null` → generic "Invalid payload" message, no service call.
  2. Defense-in-depth: even if a malformed id bypassed the parser, `safeErrorMessage` genericizes the `22P02` and logs a `warn` server-side (gateway.ts:539-542).
- The generic-error tests assert the emitted message contains none of `invalid input syntax / server_members / server_id / user_id / uuid` (spec UUID-1a, UUID-2, UUID-4). userId (`socket.data.userId`) never appears in any emitted payload.

## 2. Over-genericization — MEDIUM (UX regression, not a security or contract break)

`StudyRoomService` throws non-Forbidden `HttpException`s and plain `Error`s that were previously forwarded verbatim to the client and are now genericized:

- `ConflictException('Reset the room timer to change durations')` — study-room.service.ts:602, thrown from `configureRoomTimer`, surfaced via `handleTimerConfig` catch (gateway.ts:467).
- `Error('Work duration must be between 1 and 120 minutes')` — service.ts:609.
- `Error('Break duration must be between 1 and 60 minutes')` — service.ts:612.
- `Error('Room name cannot be empty')` — service.ts:270 (createRoom).

Before wave-53: `err instanceof Error ? err.message` forwarded all of the above (ConflictException and plain Error both extend Error). After wave-53: only `ForbiddenException` is forwarded; the four above now reach the user as the generic fallback ("Failed to configure room timer" / "Failed to create room").

Severity assessment — MEDIUM, not High:
- Not a functional/contract break: the web client (`FocusRoomPanel.tsx:1171`) renders the `joinError` string verbatim and does NOT string-match on any specific message; no test string-matches either (grep clean). Nothing breaks.
- The `ConflictException` "Reset the room timer to change durations" is a legitimately actionable user-facing message — genericizing it is a real UX downgrade (user no longer learns they must reset first). The two duration-bound `Error`s are practically unreachable from the client because `parseConfigPayload` already rejects non-positive/non-integer minutes, but it does NOT enforce the 120/60 upper bounds, so `workMinutes: 999` reaches the service and now yields a generic message instead of "must be between 1 and 120". Same for `Room name cannot be empty` — unreachable from the client (parser requires `name.length > 0`), so no user impact there.

Recommendation (non-blocking): forward all `HttpException` subclasses (`err instanceof HttpException`), not just `ForbiddenException`. Nest `HttpException` messages are author-controlled and client-safe by design; the raw-DB-error leak comes from non-Http `Error`/Drizzle objects, which the fallback still catches. This restores the Conflict + bound messages while keeping the leak closed. If the team prefers the strict allowlist, at minimum add `ConflictException` to the forward list.

## 3. Guard correctness — PASS

- `isUuid` = `z.string().uuid().safeParse(value).success` — Zod's `.uuid()` accepts any RFC-4122 version and is case-insensitive; no false negatives on valid UUIDs. Spec covers valid v4, malformed trailing char, short segment count, empty, SQL-injection string — all correct.
- Applied to `serverId` in all 4 parsers and to `roomId` in `parseRoomPayload` + `parseConfigPayload`. Correct: `serverId` hits a DB uuid-cast via `assertMember` (service.ts:169-177, `eq(server_members.server_id, serverId)`). `roomId` is in-memory-only (Map key, `randomUUID()`-generated) and never DB-cast, so guarding it is harmless defense-in-depth, not required — no correctness issue.
- `isUuid` is NOT applied to `userId` — correct. `userId` is a SuperTokens opaque session id (not a UUID); the test file's comment at SERVER_ID definition documents this. Guarding userId would have broken auth.

## 4. Control-flow — PASS

All 4 parsers return `null` on `!isUuid(...)`; every handler checks `if (!parsed) { emit generic invalid-payload; return; }` BEFORE the `try` block that calls the service (handleCreateRoom:175, handleJoinRoom:210, handleSubscribeServerRooms:350, handleTimerStart/Pause/Reset/Config, handleLeaveRoom:290). Execution short-circuits before any `roomService.*` call — confirmed by spec UUID-1a/1b/1c/2/6 asserting `svc.getOpenRooms/createRoom/joinRoom` `not.toHaveBeenCalled()`. No continue-past-guard path.

## 5. Logging — PASS

- `logger.warn(msg, { error: err })` for the 22P02 case (gateway.ts:540) and `logger.error(msg, { error: err })` otherwise (gateway.ts:544). Both are valid Nest `Logger` methods; both include the full `err` object server-side only. The return value (client-facing) is the `fallback` constant in both branches — the logged detail never reaches the socket.
- Spec UUID-4 spies `logger.error` and asserts it is called while the client message excludes the raw internal string. Correct.
- Minor (LOW): Nest's `Logger.warn/error` signature is `(message, ...optionalParams)`. Passing `{ error: err }` as the 2nd arg is treated as the "context" param and Nest will `String()` it to `[object Object]` in the default formatter, so the structured error is effectively lost in standard console transport (stack not printed). Functionally the leak is still contained (nothing extra reaches the client), but the server-side diagnostic is weaker than intended. Consider `logger.error(msg, (err as Error)?.stack)` or a structured-logger call. Non-blocking.

## Low / nits

- LOW: `parseConfigPayload` guards the lower bound (`<= 0`) and integer-ness of `workMinutes`/`breakMinutes` but not the upper bounds (120/60) that the service enforces — so out-of-range values reach the service and now get a generic error (see finding 2). Aligning the parser bounds with the service would make the validation message moot and reject earlier.
- LOW: `uuid.util.ts` builds a fresh Zod schema per call (`z.string().uuid()` inside the function body). Hoist to a module-level `const UUID_SCHEMA = z.string().uuid();` to avoid re-allocating the schema on every parse. Micro-perf only; the parse-layer runs per WS message.

## Test coverage note

New spec covers: parse-rejection-before-DB (UUID-1/2/6), Forbidden message forwarded (UUID-3), unexpected-error genericized + logger called (UUID-4), happy-path regression (UUID-5). Gap: no test asserts that a `ConflictException` from `configureRoomTimer` is NOW genericized — which is exactly the finding-2 behavior. If the team adopts the "forward all HttpException" recommendation, add a test pinning Conflict-message forwarding.

---

# B-6 Re-review — iteration 2 (fix-up commit 482c796)

**Verdict: CLEAN — 0 Critical / 0 High / 0 Medium / 0 Low.**

Reviewed `git diff main...HEAD`, focus commit `482c796 fix: B-6 review — forward HttpException messages, fix error logging`.

## Confirmations against the four specific checks

1. **Leak still fully closed.** `safeErrorMessage` forwards `err.message` only when `err instanceof HttpException`. A DrizzleQueryError / raw `Error` is NOT an HttpException — it falls through to the `isInvalidTextRepresentation` warn branch or the generic `logger.error` branch, and the client receives the static `fallback` string. Verified all study-room.service throw sites (lines 177/189/270/307/602/609/612): the four HttpException throws (`ForbiddenException` ×3, `ConflictException` ×1) use static author strings; the plain `Error` throws (name-empty, duration-range) are NOT HttpException and correctly genericize. No DB error is or can be wrapped as an HttpException in these handlers. The gateway helper mirrors the shipped `SupertokensExceptionFilter` (auth.exception.filter.ts) HttpException-first ordering exactly — branches never overlap.

2. **No over-forward.** `grep` for interpolated exception messages (`${`, `new BadRequestException`, etc.) in study-room.service.ts returns nothing. Every HttpException message is a static, client-safe author string — no user ids, SQL, or internal state embedded. Change is safe.

3. **Logger fix correct.** Second arg is now `err instanceof Error ? err.stack : String(err)` — a string, matching Nest `Logger.error(message, stack?)` / `Logger.warn` signatures. Detail is server-side only; never returned to the client (client gets `fallback`). Fixes the `[object Object]` regression.

4. **No regression.** Full API suite green: **717 passed / 39 files**. Spot-checked assertions are real, not vacuous: UUID-4b asserts `msg).toBe(conflictMsg)` (exact ConflictException forwarding); UUID-4 asserts client msg excludes raw/secret text AND `loggedDetail` is a string ≠ `[object Object]` containing the error text (locks the logger fix); UUID-3 asserts exact ForbiddenException forwarding.

## Prior findings — all resolved
- Medium (over-genericization of non-Forbidden HttpException) → fixed by the `HttpException` discriminator; locked by new UUID-4b test.
- Low (logger `[object Object]`) → fixed; locked by strengthened UUID-4.
- Low (per-call Zod schema) → fixed; `UUID_SCHEMA` hoisted to module scope in uuid.util.ts.

No new production-bug or security issue introduced. Ready to proceed.
