# T-3 — Contract (wave-52)
**Pattern:** A (CI-verified). Project-internal Zod/shared-type; no external SDK.
- B-1 authored packages/shared/src/study-room.ts: FocusRoomSchema + FocusRoomRosterSchema + StudyRoomTimerSchema + event consts (study-room:rooms/presence/timer_update/join_error) + verb consts — all DISTINCT from study-timer (MUST-lock 2 at contract level).
- CI typecheck + test green: gateway emits ↔ studyRoomSocket subscribes ↔ FocusRoomPanel renders bound to the SAME shared types (single source; tsc enforces both sides). Boundary-drift: StudyRoomTimer (roomId) vs StudyTimer (serverId) — distinct DTOs, tsc-enforced.
- Coverage: new event payloads + the room-timer roomId DTO covered by socket + panel tests. No contract gap.
```yaml
test_pattern: ci-verified
skipped: false
contracts_audited: [FocusRoomSchema, FocusRoomRosterSchema, StudyRoomTimerSchema, STUDY_ROOM_* events/verbs]
ci_evidence: ["C-1 typecheck + test PASS — emit/subscribe/render bound to shared types"]
findings: []
```
