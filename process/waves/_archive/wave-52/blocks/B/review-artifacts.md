# Wave 52 — B-block review artifacts
**Block:** B (Build) · **Wave topic:** joinable focus room — study-room module (in-memory rooms + join-presence + room-timer) + FocusRoomPanel · **Gate:** B-6 · **Status:** in-progress · **Branch:** wave-52-focus-room · **claimed:** [d123d9e0, aad849ac, ef84b378] · **Design:** design/focus-room-panel.html
## Stage deliverables
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch; SCHEMA SKIP (MUST-lock 1 — no table/migration) |
| B-1 | stages/B-1-contracts.md | done | study-room.ts (FocusRoom/roster/events distinct from study-timer; StudyRoomTimerSchema roomId) |
| B-2 | stages/B-2-backend.md | pending | study-room module (gateway/service/module) — in-memory rooms + presence + room-timer |
| B-3 | stages/B-3-frontend.md | pending | studyRoomSocket + FocusRoomPanel per design; room-timer reuses StudyTimerWidget |
| B-4 | stages/B-4-wiring.md | pending | |
| B-5 | stages/B-5-verify.md | pending | biome ci . + full suite (BUILD rule-10) |
| B-6 | stages/B-6-review.md | pending | head-builder + /review — verify 3 MUST-locks + in-memory CAS |
## Block-specific context
- **Spec:** tasks row d123d9e0 (DB, 3-block multi-spec). wave_type multi-spec. design_gap_flag true. Branch wave-52-focus-room. No deps, no env, NO schema (MUST-lock 1).
## MANDATORY carries (P-0 MUST-locks + P-4 Phase-2)
- **MUST-LOCK 1 (ephemeral):** rooms/rosters/room-timer anchors are in-memory Maps ONLY. NO focus_rooms/attendance table, NO migration.
- **MUST-LOCK 2 (presence separation):** NEW `@WebSocketGateway({namespace:'/study-room'})` with its OWN presence Map + distinct events (STUDY_ROOM_ROOMS_EVENT 'study-room:rooms' + STUDY_ROOM_PRESENCE_EVENT 'study-room:presence'). MUST NOT touch wave-49 timerPresence or the /study-timer namespace.
- **MUST-LOCK 3 (room-timer state):** room-timer anchors in-memory keyed by roomId; setTimeout map keyed by roomId (distinct from the server-timer serverId-keyed map); NO per-room loop; NOT server_study_timer.
- **[karen-1 HIGHEST RISK] in-memory CAS:** room-timer auto-advance idempotency = compare-and-set against the in-memory roomTimers Map anchor (compare expected endsAt), NOT a copy of doPhaseAdvance's `UPDATE...WHERE ends_at=` DB path (which is DB-COUPLED). Reuse ONLY the PURE formulas (computeCurrentPhase/phaseDurationMs, module-level exports).
- **[karen-4] timeout leak:** roomTimeouts Map cleanup on room removal / onModuleDestroy (mirror study-timer.service :150-155/340-347).
- **[jenny-gap-1] REST snapshot:** decide GET /servers/:serverId/study-rooms at B (socket-only valid fallback) — don't leave undecided.
- **[jenny-gap-2] helper-extraction parity:** if extracting the pure helpers from study-timer.service, add a parity guard the wave-49 SERVER timer stays byte-identical (cf. wave-25 mention-slug parity test).
- **Auth:** io.use WS-session (installWsAuthMiddleware from common/ws-auth.ts) + assertMember (403) + room-membership (control room timer only if joined). serverId/roomId from client, userId from session (IDOR-safe).
- **BUILD rule-10:** B-5 runs biome ci . + full suite before B-6.
- **D-3 note:** .btn transition malformed (study-timer.html base carry — keep for parity, don't fix).
## Gate verdict log
<head-builder at B-6>

## Status — block exit
```yaml
build_block_status: complete
branch: wave-52-focus-room
stages_run: [B-0, B-1, B-2, B-3, B-4, B-5, B-6]
review_verdict: APPROVE
last_commit_sha: 34aba66
ready_for_ci: true
gate_status: gate-passed
```
head-builder B-6 attempt-1 APPROVED (3 MUST-locks + in-memory CAS verified). /review: 1 High (created-room ghost) fixed e95fea5+34aba66 → re-run 0 crit/high. Action 6 PASS.
