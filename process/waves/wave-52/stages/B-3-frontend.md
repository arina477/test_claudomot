# B-3 — Frontend (wave-52)
**react-specialist aaaed5e4. Commit (Refs: aad849ac panel + ef84b378 room-timer view).**
- **studyRoomSocket.ts (NEW):** dedicated `/study-room` Socket.IO singleton (io(`${BASE}/study-room`), withCredentials, reconnect re-join of active room). **Wave-49 namespace-mismatch lesson applied** — connects to /study-room, NOT /messaging or /study-timer; regression-guard test asserts the URL + `not.toContain('/messaging')`/`('/study-timer')`. join/leave/create + onRooms/onPresence/onTimerUpdate/onJoinError helpers.
- **FocusRoomPanel.tsx (NEW):** per design/focus-room-panel.html — open-rooms list (name + live "N focusing"), create affordance, joined roster (aria-live + role=list/listitem + aria-current) + leave; states empty/creating/loading/error/room-vanished. Room-timer via RoomTimerSection reusing the StudyTimerWidget countdown/phase pattern (StudyRoomTimer roomId DTO; controls over studyRoomSocket, not REST). Mounted in MainColumn below StudyTimerWidget. Socket-only.
- 26 new tests (6 socket incl. namespace assertion + 20 panel).
## Verify: biome ci (scoped) 0; tsc 0; web 448 pass; **biome ci . repo-wide 0 (303 files, BUILD rule-10)**; study-timer/messaging/DM unregressed.
## Deviation: room-timer pending-clear folded into the countdown useEffect (biome useExhaustiveDependencies).
