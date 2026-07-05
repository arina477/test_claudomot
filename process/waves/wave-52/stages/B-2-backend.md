# B-2 — Backend (wave-52)
**node-specialist ae177471. Commit d0f7b76 (Refs: d123d9e0 + ef84b378).**
NEW module apps/api/src/study-room/ (gateway/service/module + spec) + app.module registration.

## MUST-locks + carries — all implemented
- **MUST-LOCK 1 (ephemeral):** `rooms: Map<serverId, Map<roomId, entry>>` + `roomTimers: Map<roomId, anchor>` in-memory; zero Drizzle write, no table/migration; empty room removed from Map + broadcast.
- **MUST-LOCK 2 (presence separation):** `@WebSocketGateway({namespace:'/study-room'})` — own presence + socketRoom/Server indices; NO import of StudyTimerGateway/timerPresence/server_study_timer/study-timer events. Reuses installWsAuthMiddleware + per-server-room idiom (study-room:server:<id> + study-room:room:<roomId>).
- **MUST-LOCK 3 + [karen-1] in-memory CAS:** room-timer anchors keyed by roomId; `armRoomAutoAdvance` captures `capturedEndsAtMs`; `doRoomPhaseAdvance` no-ops if `anchor.ends_at.getTime() !== capturedEndsAtMs` (idempotent CAS against the Map, NOT the DB `UPDATE WHERE` — re-implemented). Imports ONLY the pure computeCurrentPhase/phaseDurationMs. No per-room loop. **Double-fire test confirms one advance.**
- **[karen-4] timeout cleanup:** clearRoomAutoAdvance on removeRoom/pause/reset/onModuleDestroy (fake-timer tests).
- **[jenny-gap-2] parity:** pure helpers already module-level exported (study-timer.service:76,98) → imported, ZERO refactor; wave-49 timer 36/36 still pass (byte-identical).
- **[jenny-gap-1] REST:** socket-only (open-rooms list pushed on server-room join); no REST GET.
- **Auth/IDOR:** assertMember 403; room-membership to control timer; serverId/roomId from client, userId from socket.data (session).

## Functionality: create/join/leave rooms (multi-tab deduped), empty-room removal, open-rooms + roster broadcasts, room-timer start/pause/reset/config (compute-on-read, wave-50 durations), join_error on the distinct event.

## Verify: tsc 0; biome ci src/study-room 0; **40 new tests + 647 existing = 687 pass** (wave-49 timer 36/36 intact); `biome ci .` repo-wide 0 (BUILD rule-10).

## Deviation: none.
