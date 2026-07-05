# P-2 — Spec (wave-52) — POINTER
**Source of truth:** `tasks.description` of **d123d9e0** (YAML head + 3 spec blocks + prose). wave_type multi-spec. claimed [d123d9e0, aad849ac, ef84b378]. design_gap_flag TRUE.

## Spec 1 (d123d9e0) — backend focus-room + join-presence
Create/join/leave EPHEMERAL in-memory focus rooms; open-rooms list + per-room roster over a DISTINCT `/study-room` namespace; empty rooms removed; membership/IDOR-gated. **MUST-LOCK 1** (no DB table), **MUST-LOCK 2** (separate from wave-49 timerPresence). Contracts: packages/shared/src/study-room.ts (NEW) FocusRoom + roster + event consts. NO migration.

## Spec 2 (aad849ac) — focus-room UI panel
Server-view panel: open-rooms list (name + "N focusing") + create + joined-room live roster + leave. studyRoomSocket.ts (mirror studyTimerSocket). Dark/design-system, <1024 slim, NO voice. Per D-3 mockup.

## Spec 3 (ef84b378) — room-scoped timer
Per-room synchronized Pomodoro, joined members share/control; **MUST-LOCK 3** — anchors in-memory keyed by roomId (NOT server_study_timer table), reuse ONLY pure compute-on-read + one-shot idempotent auto-advance (setTimeout keyed by roomId) + reconnect reconciliation; reuse wave-50 custom durations. NO per-room loop. Broadcast on /study-room.

## Scope-fence: NO voice/LiveKit (slice-2), persisted attendance, scheduled rooms, moderation, whiteboard.
