# B-6 Phase 2 — Production-Bug Review — wave-52 (StudyHall Joinable Focus Room)

Branch: `wave-52-focus-room` · Diff base: `main` · Scope: NEW `/study-room` realtime module (in-memory).

Gate-miss checks run:
- `tsc --noEmit` — **PASS** for `@studyhall/api`, `@studyhall/web`, `@studyhall/shared` (all exit 0).
- `biome ci` on all changed files — **PASS** (8 files, no findings).
- `@studyhall/api` study-room service spec — **PASS** (40/40).

Lint/typecheck are green, so the "head-builder gate miss" is not a lint/type gap; the findings below are logic/behaviour-level bugs the type system doesn't catch.

---

## In-memory state correctness (Maps / rosters / timers)

### [HIGH] Created room is never joined → permanent count-0 ghost room + orphaned Map entry
`apps/api/src/study-room/study-room.service.ts:261-284` (createRoom) + `apps/web/src/shell/FocusRoomPanel.tsx:937-953` (handleCreateConfirm).

**What's wrong:** `createRoom` inserts a `FocusRoomEntry` with `roster: new Map()` (empty) and returns; it never adds the creator to the roster. The frontend `handleCreateConfirm` calls `createFocusRoom(...)` then transitions to `list` — it does **not** call `joinFocusRoom`. The confirming frontend test (`focus-room.test.tsx:232` "Create confirm calls createFocusRoom(serverId, name)") verifies only `createFocusRoom` is called, so this is the intended-but-broken behaviour, not a stray path.

**Why it's a production bug:** A room's only removal path is `leaveRoom` → `roster.size === 0` → `removeRoom`. A room that is created but never joined has `roster.size === 0` from birth, and `leaveRoom` is never reachable for a user who never joined. Result: the room sits in the `rooms` Map **forever** broadcasting `count: 0` ("0 focusing"). Every create by any user leaks one permanent ghost entry into `Map<serverId, Map<roomId, entry>>`. This is both a memory leak (MUST-LOCK 1's "no orphaned empty rooms" invariant is violated for the create path) and a UX defect (creator lands on the list, not in their own room; the list fills with empty rooms).

**Fix (pick one, server-authoritative preferred):**
- In `handleCreateRoom` (gateway), after `createRoom` succeeds, immediately run the join path for the creator (add to roster + `socket.join(study-room:room:<roomId>)` + broadcast roster), so a created room always has ≥1 member and is auto-removed when the creator leaves; **or**
- have `createRoom` seed the roster with the creating user (requires passing socketId/displayName/avatarUrl through, mirroring `joinRoom`), and have the frontend `handleCreateConfirm` set `_activeRoomId` + transition to `joined`.
Either way, add a service test asserting a created room has count 1 and is removed when the creator disconnects.

### [LOW] `getRoomsForServer` test helper is broken/misleading
`apps/api/src/study-room/study-room.gateway.ts:444-446`.

**What's wrong:** Named "getRoomsForServer" but calls `getRoomIdsForSocket(serverId, '')` with an empty socketId, which can only ever return `[]` (no roster entry has socket `''`). It returns roomIds, not rooms. Not used in production paths, only exposed "for tests".

**Why:** Dead/misleading surface; a future test relying on it silently gets `[]`. **Fix:** delete it, or implement it as `this.roomService['roomsListFor'](serverId)` via a real accessor.

### Otherwise clean
Multi-tab dedup (`joinRoom` keyed by userId, sockets `Set`), last-tab-leave (`entry.sockets.size===0` → delete user), last-member-leave → `removeRoom`, empty-server-map cleanup (`serverRooms.size===0` → `rooms.delete`), and `onModuleDestroy` clearing all `roomTimeouts` are all correct. Socket-disconnect cleanup walks the gateway `socketRoomIndex` and calls `leaveRoom` per entry, then deletes both reverse indexes — no orphaned roster/index entries on disconnect. `removeRoom` clears the timeout **and** deletes the `roomTimers` anchor before dropping the room, so no orphaned timer/timeout when a room vanishes.

---

## In-memory CAS / room-timer

**Clean.** The captured-`endsAt` compare-and-set in `doRoomPhaseAdvance` (`study-room.service.ts:685-733`) is sound:
- Guards `!anchor || run_state !== 'running'` → no null-deref if the room/anchor was removed or paused/reset before the timeout fires (setTimeout-after-removal is handled).
- CAS mismatch (`ends_at===null || getTime() !== capturedEndsAtMs`) → stale/double-fire no-ops idempotently.
- Re-arm clears any prior handle first (`armRoomAutoAdvance` → `clearRoomAutoAdvance`), so no duplicate timers at a phase boundary.
- `pause`/`reset` both `clearRoomAutoAdvance` before mutating; `pause` nulls `ends_at` so even a race-fired timeout no-ops on the run_state check.
- `selfHealRoomTimerIfOverdue` (line 750) correctly guards idle/paused/null-anchor/future-endsAt and reuses the wave-49 `computeCurrentPhase` formula; `started_at` back-computation (`newEndsAt - phaseDurationMs(healedPhase, anchor)`) is consistent with the returned phase. No off-by-one at the boundary.

---

## Conditional side effects

**Clean.** Broadcasts fire only after the service op succeeds (inside `try` after the await/call). `leaveRoom`/disconnect correctly branch: `roomRemoved` → broadcast rooms-list only; else → broadcast roster **and** rooms-list (count changed). Empty-room removal broadcasts the updated list (`handleDisconnect`/`handleLeaveRoom` both call `broadcastRoomsUpdate` on `roomRemoved`). Timer control is gated by `assertRoomMember` before any mutation/emit.

---

## Contract mismatches (server↔client)

**Clean.** Event/verb strings are consistent: gateway emits `study-room:rooms|presence|timer_update|join_error`; `studyRoomSocket.ts` subscribes to the same literals (locally re-declared to dodge CJS named-export resolution — matches the wave-49 studyTimerSocket convention). Verb payloads (`create_focus_room {serverId,name}`, `join/leave/timer_* {serverId,roomId}`, `config {…,workMinutes,breakMinutes}`) match the gateway parsers. `StudyRoomTimer` DTO is keyed by `roomId` (distinct from `StudyTimer.serverId`) per MUST-LOCK 3, and `getRoomTimer` populates every schema field. Presence payload shape (`{roomId, roster:{roomId,viewers,count}}`) matches `FocusRoomPresenceEventSchema` and the frontend reads `event.roster.viewers`.

---

## Null/undefined access

**Clean.** All Map lookups are guarded: `getRoom` (`?.get`), `leaveRoom`/`pauseRoomTimer` early-return on missing anchor/room, `getRoomTimer` falls back to a synthetic idle anchor when none exists (so join-before-start never null-derefs), `roomsListFor`/`getRoomIdsForSocket` guard missing server maps. Frontend timer helpers null-check `timer` before `endsAt`/`remainingMs` access.

---

## Missing error handling

**Clean.** Create with empty/whitespace name → `Error` → `study-room:join_error` (not the reserved `'error'` channel). Join non-existent/removed room → `ForbiddenException("Focus room not found…")` → join_error. Non-member → 403. Timer control while not joined → `assertRoomMember` 403 → join_error. Config out-of-range → `Error` → join_error; running/paused config → `ConflictException`. Payload parsers reject malformed input before any state touch. `resolveUserProfile` swallows DB errors and falls back to userId/null (roster still renders).

**[LOW] note:** `parseConfigPayload` accepts non-integer minutes (`typeof === 'number' && > 0`), diverging from the shared `int()` schema (e.g. `workMinutes: 2.5` is accepted and stored). Harmless (range still enforced) but tighten to `Number.isInteger` for contract fidelity.

---

## Auth / IDOR

**Clean.** `userId` is always taken from `socket.data.userId` (SuperTokens session via `installWsAuthMiddleware`), never from the client payload; `serverId`/`roomId` come from the payload but are gated: `assertMember` (DB `server_members` check) on create/join/getOpenRooms, and `assertRoomMember` (in-roster check) on all four timer verbs. A non-member cannot enumerate or join rooms of a server they don't belong to (the initial rooms list is only pushed to sockets that pass `assertMember` on join, and `study-room:server:<id>` membership is only granted inside those authorized paths). `displayName`/`avatarUrl` are resolved server-side at connect, so a client cannot inject a fake presence name.

---

## Frontend

**Clean on the wave-49 lesson:** `studyRoomSocket.ts:76` connects to `${BASE}/study-room` (correct namespace; guarded by the namespace-assertion unit test). Reconnect re-join re-emits `join_focus_room` for `_activeRoomId` on `connect`, and `leaveFocusRoom` clears `_activeRoomId` so an intentional leave does not auto-rejoin. `FocusRoomPanel` handles room-vanished (rooms event no longer contains the joined room → clears roster/timer → `room-vanished` state), guards stale-closure roster/timer updates via `joinedRoomRef`, and the countdown recomputes from `endsAt` on each 1s tick (anti-drift). The create-flow gap is reported under In-memory state (HIGH) above — it manifests on the frontend as "creator lands on list, not in the room."

**[LOW]** `handleJoin` (`FocusRoomPanel.tsx:960-974`) sets `setJoining(roomId)` before the `if (!room) return;` guard, so an early return leaves `joining` stuck until the 3s timeout; benign (room is always present in that path) but the guard should precede `setJoining`.

---

## Severity count

- **Critical: 0**
- **High: 1** — created room never joined → permanent count-0 ghost room + orphaned Map entry (`study-room.service.ts` createRoom / `FocusRoomPanel.tsx` handleCreateConfirm).
- **Medium: 0**
- **Low: 3** — broken `getRoomsForServer` test helper; `parseConfigPayload` accepts non-integer minutes; `handleJoin` sets `joining` before the `!room` guard.

## B-6 Phase-2 exit

**The branch does NOT have 0 Critical/High.** One HIGH finding (created-room-never-joined ghost/leak) must be reworked before Phase-2 exit. All other categories are clean; typecheck, lint, and the service spec suite are green.

---

## Re-run (post-fix-up)

Fixes verified: backend `e95fea5` (study-room.gateway.ts + service.ts), frontend `34aba66` (FocusRoomPanel.tsx + studyRoomSocket.ts). Read-only re-review.

### [HIGH] Created room never joined → ghost/leak — **CONFIRMED-RESOLVED**

**Backend (`e95fea5`).** The join path was extracted into a shared `performJoin(socket, serverId, roomId)` — a verbatim move of the code previously inline in `handleJoinRoom` (roster-add via `joinRoom` with userId-keyed multi-tab dedup, `selfHealRoomTimerIfOverdue`, `ensureServerRoom`, `socket.join(study-room:room:<id>)`, `socketRoomIndex` dedup-push, socket-directed TIMER_UPDATE + ROOMS emits, then broadcast PRESENCE roster + ROOMS). `handleCreateRoom` now does `createRoom` → `performJoin(socket, serverId, roomId)`, so the creator is auto-joined and the room is born with `count:1`. `createRoom`'s return shape changed to `{roomId, rooms}` (service.ts:265,283) and no longer broadcasts an empty roster itself. The only removal path (last-member-leave / disconnect → `roster.size===0` → `removeRoom`) is now reachable for the creator, so no permanent count-0 ghost and no orphaned `Map<serverId,Map<roomId,entry>>` entry.
Three new service tests (`study-room.service.spec.ts`) prove it at the service level: create→join → `count:1` + creator in roster; creator leave → `roomRemoved:true`, list length 0; creator disconnect (`leaveAllRoomsForSocket`) → `roomRemoved:true`, list length 0. (Tests exercise the `createRoom`+`joinRoom` service sequence rather than the gateway `performJoin` wrapper directly — acceptable, since `performJoin` only adds socket-bookkeeping around `joinRoom`; that bookkeeping is the same code the pre-existing gateway join tests already cover.)

**Frontend (`34aba66`).** `handleCreateConfirm` sets `pendingCreateServerIdRef.current = serverId`, emits `create_focus_room` (no second `join_focus_room` — server already joined the creator, so no double-join / double-presence), and the `onPresence` handler, while the ref is set, consumes the first presence event: clears the ref, `setActiveRoom(serverId, roomId)` for reconnect re-join (no join verb), resolves the `FocusRoom` from the current rooms list (fallback minimal shape if rooms hasn't landed), then `setJoinedRoom` / `setRoster` / `setPanelState('joined')`. Creator now lands IN their room, not on the list. Test 6 updated to assert the joined transition via the presence event.

### No new Critical/High introduced

- **`performJoin` extraction:** normal `handleJoinRoom` now delegates to `performJoin` — byte-for-byte the prior inline body, wrapped in the same try/catch. No double-add for a normal join (`joinRoom` dedups by userId; `socketRoomIndex` push is guarded by an existence check). Create + normal join both exercise the identical path. Clean.
- **Presence-for-a-different-room race:** NOT reachable. A create is initiated only from the `list`/`creating` state, where the creator's socket is in `study-room:server:<id>` (rooms broadcasts) only — not in any per-room channel. `handleLeaveRoom` does `socket.leave(study-room:room:<id>)` (gateway:299), so a previously-joined-then-left creator receives no stray per-room presence. The only presence event deliverable during a pending create is the creator's own auto-join. Ref is cleared before any state mutation (line 915) and also cleared in `onJoinError` — no misfire on a later error.
- **rooms-before-presence ordering:** `performJoin` emits socket-directed ROOMS before broadcasting PRESENCE, and the handler has an explicit fallback for the not-yet-arrived case. Safe.
- **`setActiveRoom` for reconnect:** sets `_activeServerId`/`_activeRoomId` without emitting a join verb — correct; the `connect` reconnect handler re-emits `join_focus_room` for the active room, and `leaveFocusRoom` still clears it. Correct.
- **8s safety timeout — minor, does NOT rise to a finding:** `handleCreateConfirm` returns a `() => clearTimeout(safetyTimer)` cleanup, but it is invoked as a plain event handler (`CreateRoomForm.handleSubmit` → `onConfirm(trimmed)`), so the returned closure is discarded and the timer always runs to completion. Benign: the timer body is guarded by `if (pendingCreateServerIdRef.current !== null)`, so once the presence path clears the ref (nominal, <1s) the fire is a no-op — no state corruption, no leak beyond one short-lived timer. New LOW-adjacent nit, not a regression; acceptable for Phase-2 exit.

### The 3 Lows

- **`getRoomsForServer` helper — FIXED.** Now returns `this.roomService.roomsListFor(serverId)` (real `FocusRoom[]`); `roomsListFor` promoted from `private` to public (service.ts:208). No longer the misleading `getRoomIdsForSocket(serverId,'')` that always returned `[]`.
- **`parseConfigPayload` non-integer minutes — FIXED.** Now rejects with `!Number.isInteger(p.workMinutes)` / `!Number.isInteger(p.breakMinutes)` in addition to the `> 0` range check; matches the shared `int()` schema. `workMinutes: 2.5` is now rejected.
- **`handleJoin` sets `joining` before the `!room` guard — STILL OPEN (LOW), acceptable.** `FocusRoomPanel.tsx:1017` still calls `setJoining(roomId)` before `if (!room) return` (line 1019). Explicitly deferred to frontend in the fix scope; benign (room is always present in that path, and the 3s timeout clears it) — acceptable for Phase-2 exit.

### Updated severity count

- **Critical: 0**
- **High: 0** (was 1 — resolved)
- **Medium: 0**
- **Low: 1** — `handleJoin` sets `joining` before the `!room` guard (leftover, acceptable). (The two backend Lows are fixed; the discarded-cleanup 8s-timer nit is benign and not counted as a blocking finding.)

### Gate signals (re-run)

- `@studyhall/api` full suite — **PASS 690/690** (37 files; includes the 3 new creator-auto-join tests; wave-49 study-timer suite intact).
- `@studyhall/web` full suite — **PASS 448/448** (28 files; test 6 updated to assert joined transition). The `ECONNREFUSED` log noise is the known B-5 socket-singleton autoconnect flake, not a failure.
- `tsc --noEmit` — **PASS** for `@studyhall/api` and `@studyhall/web` (both exit 0).
- `biome ci .` — **PASS** repo-wide (303 files, no findings).

### B-6 Phase-2 exit — re-run verdict

**The branch now has 0 Critical / 0 High.** The HIGH ghost-room leak is CONFIRMED-RESOLVED (backend auto-join via `performJoin` + frontend create→joined via presence), no new Critical/High introduced, 2 of 3 Lows fixed and the remaining Low (frontend `joining`-before-guard) is an accepted deferral. All gate signals green. **B-6 Phase-2 exit criteria met.**
