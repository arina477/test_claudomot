# B-1 — Contracts (wave-52)
**node-specialist a7329a94. Commit f918417 (Refs: d123d9e0).**
- **packages/shared/src/study-room.ts (NEW):** FocusRoomSchema {id,serverId,name,count} + FocusRoomViewerSchema {userId,displayName,avatarUrl} + FocusRoomRosterSchema {roomId,viewers[],count}; event consts STUDY_ROOM_ROOMS_EVENT('study-room:rooms') / _PRESENCE_EVENT('study-room:presence') / _JOIN_ERROR_EVENT('study-room:join_error') / _TIMER_UPDATE_EVENT('study-room:timer_update'); client verb consts (create/join/leave + timer start/pause/reset/config); StudyRoomTimerSchema (mirror StudyTimerSchema, roomId not serverId; reuses STUDY_TIMER_PHASES/RUN_STATES). Barrel-exported. **All events distinct from study-timer (MUST-LOCK 2 at contract level).**
- Verify: shared typecheck+build clean; biome 0.
```yaml
skipped: false
contracts_authored: [packages/shared/src/study-room.ts, packages/shared/src/index.ts]
deviations: [StudyRoomTimerSchema + verb consts added (cleaner than prose note; typed misuse-catch)]
```
