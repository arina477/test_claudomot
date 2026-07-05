# V-1 jenny — Semantic spec-conformance verification — wave-52 (StudyHall joinable focus room)

**Verdict: APPROVE.** Deployed production behavior matches the spec INTENT across all 3 blocks, all 3 MUST-LOCKs, the scope-fence, and journey continuity. No spec-drift found; the one prior gap (skeleton-stuck handshake) is resolved and confirmed live. Zero new findings that require rework.

- **Method:** Read the authoritative 3-block DB spec (task d123d9e0). Confirmed no persisted table in prod DB. Deep-read the shipped backend (`study-room.gateway.ts`, `study-room.service.ts`, `study-room.module.ts`) + shared contract (`packages/shared/src/study-room.ts`) + client (`apps/web/src/shell/studyRoomSocket.ts`). Ran a live `socket.io-client` session against **deployed prod** (`wss://api-production-b93e.up.railway.app/study-room`) as Fixture A (session cookie via SuperTokens signin) exercising create/config/start/join-bogus/empty-name/leave, plus an anon-handshake probe and a `/study-timer`-namespace separation probe. NO MCP, NO browser_close. T-5's exhaustive 2-client E2E is trusted for the multi-client roster/timer fan-out; this pass is the semantic/contract lens on top.
- **Targets:** web `https://web-production-bce1a8.up.railway.app`, api `wss://api-production-b93e.up.railway.app` (merge 725f7b6). Fixture A `studyhall-e2e-fixture@example.com`, server `ad62cd12`. No real users touched.

---

## 1. AC semantics across the 3 blocks — MATCHES

- **Rooms are ephemeral (vanish when empty)** — MATCHES (live). Created `JennyV1-…` → `study-room:rooms` count 1; on last-member `leave_focus_room` the deployed server broadcast `study-room:rooms {rooms:[]}` immediately — the room vanished. Code path: `service.ts` `removeRoom` fires when `room.roster.size === 0`, and clears the armed auto-advance timeout first (no leak). DB probe: **zero** `focus%/study_room%/attendance%` tables in prod — no persisted remnant. MUST-LOCK 1 upheld both in code (only in-memory Maps: `rooms`, `roomTimers`, `roomTimeouts`) and at the live persistence layer.
- **Explicit-JOIN roster DISTINCT from wave-49 ambient timer roster** — MATCHES. Roster is populated only by explicit `create`/`join` verbs into the room-scoped Map; there is no ambient "viewing" auto-add. The `/study-timer` ambient presence is a separate namespace + separate handshake (verified live: connecting `/study-timer` is an independent connection with its own events). A user subscribed/joined on `/study-room` does not appear in the `/study-timer` roster and vice-versa — the two presence systems never share a Map (MUST-LOCK 2).
- **Room timer is room-scoped (separate from server study timer)** — MATCHES (live). `study-room:timer_update` payloads are keyed by `roomId` (`8739d6b6…`), broadcast on the `/study-room` namespace only. Config/start mutate in-memory anchors keyed by roomId; no write to `server_study_timer`.
- **Membership-gated (non-member denied)** — MATCHES (live). Anon handshake to `/study-room` was rejected with `connect_error: "Unauthorized"` (WS-upgrade auth via `installWsAuthMiddleware`). Code: `assertMember` on create/join/subscribe, `assertRoomMember` on all timer controls; `userId` always from `socket.data` (authenticated session), never from the client message — serverId/roomId are the only client-supplied identifiers (IDOR-safe split).

## 2. Contract conformance — MATCHES

Live wire frames exactly match the shared `study-room.ts` schemas:
- `study-room:rooms` → `{serverId, rooms:[{id, serverId, name, count}]}` — matches `FocusRoomRoomsEventSchema` + `FocusRoomSchema`.
- `study-room:presence` → `{roomId, roster:{roomId, viewers:[{userId, displayName, avatarUrl}], count}}` — matches `FocusRoomPresenceEventSchema` + `FocusRoomRosterSchema` (avatarUrl present, correctly the roster-only field the study-timer viewer omits).
- `study-room:timer_update` → `{roomId, timer:{roomId, phase, runState, endsAt, remainingMs, running, updatedBy, workDurationMs, breakDurationMs}}` — matches `StudyRoomTimerSchema`. **Keyed on `roomId`, distinct from `StudyTimer.serverId`** — confirmed on the wire.
- Errors on the non-reserved `study-room:join_error` channel (NOT reserved `'error'`) — confirmed live 3×: out-of-range duration, room-not-found, empty-name.
- Room-timer reuses the wave-49/50 MODELS: pure `computeCurrentPhase`/`phaseDurationMs` imported from the study-timer service (not reimplemented), one-shot `setTimeout` auto-advance keyed by roomId (distinct from the serverId-keyed server map), no per-room tick loop (`setInterval`). Custom durations reuse the wave-50 configurable model per room. MUST-LOCK 3 upheld.

## 3. Scope-fence — MATCHES (none leaked)

- **NO voice/video** — T-5 DOM scan `hasVoiceVideo=false`; no LiveKit/webrtc/camera/mic imports in the study-room module. Confirmed.
- **NO persisted attendance/history/stats** — zero focus/attendance tables in prod DB; no INSERT/UPDATE of room state anywhere (DB touched only for read-only `server_members`/`users` auth+profile lookups).
- **NO scheduled/reservable rooms** — create is immediate-only; no schedule verb/field.
- **NO moderation/multi-room admin** — no kick/ban/admin verbs; leave only removes the caller's own socket.
- **NO whiteboard** — absent.

## 4. Journey continuity — MATCHES

Live create→auto-join→roster→room-timer→leave round-tripped without dead-ends: creator auto-lands joined (roster 1), config+start propagate room-scoped, last-member leave disbands the room and returns the client to the empty open-rooms list. T-5 confirmed the 2-client body-doubling path (cross-client roster fan-out to 2, timer sync, ephemeral removal) with 26 screenshots. Panel coexists with the study-timer widget as two distinct sections (`design/focus-room-panel.html` adopted; T-5 S5 confirms both timers render without crowding, incl. the <1024px compact bar). Empty/create/not-joined/joined/room-vanished/error states all present and legible.

## 5. Spec-gap / drift ledger

- **Resolved gap:** the T-5 skeleton-stuck bug was a **spec-gap** (the initial-subscribe handshake `subscribe_server_rooms` was not enumerated in the original spec). Fixed in merge `725f7b6` and the verb is now documented in the shared contract. Confirmed live: `subscribe_server_rooms` → immediate `study-room:rooms` (empty `[]` resolves skeleton to empty-state). Resolved — no action.
- **T-8 F-1 (Low):** already V-2-routed. Not re-reported here.
- **No spec-drift** (code-wrong-vs-spec) found. The only nuance: `study-room.service.ts` imports the Drizzle `db` client, but strictly for read-only membership/profile lookups the spec sanctions — no room/roster/timer state is ever persisted, so MUST-LOCK 1 is not violated.

---

## Bottom line

Deployed prod behavior conforms to the wave-52 spec's intent on every axis: ephemeral rooms, explicit-join roster distinct from the ambient timer roster, room-scoped timer separate from the server timer, membership/IDOR gating (anon rejected at handshake), the exact shared-schema wire contract, all 3 MUST-LOCKs, and the full scope-fence. Live socket evidence + T-5's 2-client E2E + a clean prod DB together prove it. **APPROVE.**

Relevant files:
- `/home/claudomat/project/packages/shared/src/study-room.ts` (contract)
- `/home/claudomat/project/apps/api/src/study-room/study-room.gateway.ts`
- `/home/claudomat/project/apps/api/src/study-room/study-room.service.ts`
- `/home/claudomat/project/apps/web/src/shell/studyRoomSocket.ts`
- `/home/claudomat/project/design/focus-room-panel.html`
- `/home/claudomat/project/process/waves/wave-52/stages/T-5-tester-1.md` (trusted 2-client E2E)
