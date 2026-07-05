# Wave 53 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, B-6 Phase 1)
**Reviewed against:** process/waves/wave-53/blocks/B/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale
The implementation faithfully delivers all six acceptance criteria against the actual diff (`a188168`, 4 files, +304/-15), and both P-4 carries are enforced. Verified line-by-line against `study-room.gateway.ts`, `uuid.util.ts`, and the two spec files — not the deliverables' word.

**Spec conformance (6/6 ACs):**
- **AC-1/AC-5 (parse-layer guard, no leak):** `isUuid` is applied to `serverId` in all four parsers (`parseServerPayload` 556, `parseCreatePayload` 563, `parseRoomPayload` 571, `parseConfigPayload` 584). A malformed serverId returns `null` from the parser, which every one of the five handler call sites (create/join/leave/subscribe/timer verbs) routes to the pre-existing generic `'Invalid payload: ...'` branch that emits and returns BEFORE any service/DB call. No new leak path; no DB access on the malformed path.
- **AC-2 (still denied, no DB query):** confirmed by the tests (UUID-1a/1c assert `getOpenRooms` not called; UUID-2 asserts `createRoom` not called; UUID-6 asserts `joinRoom` not called) — parse-layer rejection, not mock-the-SUT.
- **AC-3 (ForbiddenException passthrough):** `safeErrorMessage` discriminates via `err instanceof ForbiddenException` (value import from `@nestjs/common`, not `import type`) and forwards `err.message` unchanged. UUID-3 asserts the exact "You are not a member of this server" string is forwarded, not genericized. Authz denials keep their intended message.
- **AC-4 (unknown error genericized + server-logged):** the `else` branch of `safeErrorMessage` calls `logger.error(...)` with full detail and returns the fallback string. UUID-4 asserts the client message excludes the raw internal text and that `logger.error` was called. The belt-and-suspenders 22P02 warn branch (via the existing `isInvalidTextRepresentation` walker) is a proportionate safety net, not gold-plating.
- **AC-6 (wave-52 flows unbroken):** UUID-5 regression guard asserts the valid-member happy path still emits `STUDY_ROOM_ROOMS_EVENT`; the shared `SERVER_ID` test constant was correctly updated to a real UUID so all pre-existing cases still pass the new guard.

**P-4 carries enforced:**
- Carry #1 (jenny): `isUuid` is applied to `serverId` (and `roomId`) ONLY. `userId` is `socket.data.userId` (SuperTokens session-derived opaque text) and is never passed through a parser or `isUuid` — the wave-40:510 anti-opaque-text-UUID precedent is not re-tripped. The test file even self-documents this (`USER_A/USER_B are SuperTokens opaque session IDs, NOT uuids`).
- Carry #2 (head-product): `ForbiddenException` value import is present (line 36) and load-bearing for the `instanceof` discrimination.
- Carry #3: roomId validation was added for guard uniformity (adjudicated ALLOWED at B-2) — roomIds are server-generated `crypto.randomUUID()`, zero false-positive risk, and not the leak source; no over-investment.

**Correctness traps — all clear:** `safeErrorMessage` correctly discriminates ForbiddenException by value `instanceof`; all seven catch blocks are hardened (create/join/subscribe/timer start/pause/reset/config — grep-confirmed, none missed); the parse guard routes malformed ids to the existing generic branch (not a new emit); `isUuid` is sound (`z.string().uuid().safeParse().success`), covered by 8 unit cases including SQL-injection-style and near-miss strings.

**Test honesty:** the gateway cases assert the load-bearing no-leak property against a real leak-pattern set (`invalid input syntax`, `server_members`, `server_id`, `user_id`, `uuid`) AND the service-not-called property on the malformed path — proving parse-layer rejection rather than stubbing the leak away. UUID-4 asserts logger detail. These are behavioral, not coverage theater.

**B-5 integration-DB classification is sound:** the 18 failing files are exactly the 18 `*.spec.ts` under `apps/api/test/integration/` (real-Postgres, waves 30-49 — account-data, malformed-uuid-params, moderation, study-timer, etc.), uniform failure = local test PG on :5433 unreachable (no docker), which is the signature of an env gap, not a regression. Zero overlap with wave-53's four `apps/api/src/` files; the study-room gateway is in-memory and fully unit-covered (716 unit + 8 uuid + 8 gateway wave-53 cases green). This is `DATABASE_URL_TEST`, not `$CLAUDOMAT_DB_URL` — correctly NOT a rule-13 brain-DB hard-stop. Deferral to authoritative C-1 CI is consistent with prior-wave practice and does not mask a defect.

**Deviations:** roomId validation, ForbiddenException value-import, and VALID_SERVER_ID consolidation are all adjudicated ALLOWED at B-2 with no silent contradiction of plan targets, method names, or architecture. Commit discipline clean: single commit `a188168` cites the single claimed task; files scoped to the one spec block (Action 6 skipped — single-spec wave).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
