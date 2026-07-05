# P-3 — Plan (wave-52)

## Approach section
### Architecture deltas
- **NEW study-room module (apps/api/src/study-room/): gateway + service + (optional) controller.** A `@WebSocketGateway({ namespace: '/study-room' })` (DISTINCT from /study-timer — MUST-LOCK 2) reusing the messaging.gateway io.use WS-session validation + per-server Socket.IO rooms. In-memory Maps: `rooms: Map<serverId, Map<roomId, {name, roster: Map<userId,...>}>>` (ephemeral — MUST-LOCK 1) + `roomTimers: Map<roomId, anchors>` + `roomTimeouts: Map<roomId, Timeout>` (MUST-LOCK 3, keyed by roomId, distinct from the study-timer serverId-keyed maps). Reuse ONLY the study-timer service's PURE helpers (computeCurrentPhase, phaseDurationMs, the guarded idempotent transition + reconnect reconciliation) — extracted/shared, NOT the server_study_timer DB path. *Alternative:* fold into the study-timer gateway — REJECTED (MUST-LOCK 2 presence separation; a distinct module keeps the maps + namespace cleanly independent). Failure-domain: in-memory only, no DB/txn; membership gate reused.
- **Client (apps/web/src/shell/): studyRoomSocket.ts (mirror studyTimerSocket singleton + reconnect re-join) + a FocusRoomPanel component (per D-3 mockup) + room-timer reuse of the StudyTimerWidget (room-scoped props).**

### Data model / API / deps
- **NONE** — no schema, no migration (MUST-LOCK 1 + 3, all in-memory). No new deps (Socket.IO + the study-timer formulas exist).
- API: `/study-room` Socket.IO namespace — create_focus_room / join_focus_room / leave_focus_room / room-timer controls (keyed by roomId); STUDY_ROOM_ROOMS_EVENT + STUDY_ROOM_PRESENCE_EVENT + room-timer-update broadcasts. Optional REST GET /servers/:serverId/study-rooms snapshot (assertMember).

## Plan section
### File-level steps (grouped by build stage)
**B-1 (contracts):** `packages/shared/src/study-room.ts` (NEW) FocusRoomSchema + roster + STUDY_ROOM_* event consts + barrel. **node-specialist.**
**B-2 (backend):** `apps/api/src/study-room/{study-room.gateway.ts, study-room.service.ts, study-room.module.ts}` (+ app.module registration); extract/share the study-timer PURE compute-on-read helpers (refactor study-timer.service to export them, or a shared util) so the room-timer reuses formulas without the DB path; room CRUD + join/leave + ephemeral presence Map + room-timer (in-memory anchors keyed by roomId, one-shot idempotent auto-advance, reconnect); membership + room-membership gating. Unit + integration specs. **node-specialist.**
**B-3 (frontend):** `apps/web/src/shell/studyRoomSocket.ts` (NEW, mirror studyTimerSocket) + `FocusRoomPanel.tsx` (per D-3 mockup: open-rooms list + create + roster + leave) + room-timer via StudyTimerWidget room-scoped + api client + tests + mount in server view. **react-specialist.**
**B-4 (wiring):** repo typecheck + /study-room namespace registration (module in app.module). **node/orchestrator.**

### Specialist routing (AGENTS.md): node-specialist ✓ + react-specialist ✓. No missing.
### Parallelization: B-1 → B-2 (backend, serial) → B-3 (frontend, after B-2 + D-3 mockup). F-1-style CSS none.
### design_gap_flag: TRUE — FocusRoomPanel mockup at D-block (D-1→D-3) before B-3. Room-timer reuses study-timer widget (no new design).
### Self-consistency sweep
1. Every AC → step (rooms CRUD/presence→B-2; contracts→B-1; panel→B-3; room-timer→B-2+B-3; 3 MUST-locks→B-2 in-memory/distinct-namespace/roomId-keyed). ✓
2. Specialists named. ✓ 3. No file in 2 batches. ✓ 4. design_gap_flag true. ✓ 5. Alt (fold-into-study-timer) rejected. ✓ 6. No schema/API TBD (all in-memory + namespace defined). ✓ 7. No deps. ✓ 8. SDK N/A. ✓
Sweep clean. **B-6 MUST verify the 3 MUST-locks** (no DB table; /study-room ≠ /study-timer presence; room-timer roomId-keyed in-memory not server_study_timer).
