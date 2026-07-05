# P-2 — Spec (wave-50) — POINTER

**Source of truth:** the spec contract lives in `tasks.description` of primary task **f4b3659e-842b-450c-9869-750b64685d63** (YAML head + `---` + prose). This file is a convenience copy.

**wave_type:** multi-spec (2 blocks). **claimed_task_ids:** [f4b3659e, ffd98a36]. **design_gap_flag:** true.

## Spec 1 — f4b3659e: per-server custom Pomodoro durations (ACs)
- Member sets server timer work/break minutes (validated) → persists on the single timer row → used for subsequent phases.
- Work 1–120 min, break 1–60 min; out-of-range/non-integer/missing → 400, unchanged.
- **Configurable only while idle** (409 if running/paused, "reset to change") — chosen transition semantic (keeps compute-on-read anchor model clean).
- After config, next Start uses new durations (verifiable via ends_at/remaining).
- Config change fans out over existing `study-timer:update` → other members' widgets update live, no reload.
- Members only: anon 401, non-member 403; serverId from route, userId from session (IDOR-safe).
- Widget shows current config + minimal validated affordance (disabled/blocked while running/paused).

**Contracts:** shared StudyTimerSchema += workDurationMs/breakDurationMs; StudyTimerConfigSchema {workMinutes 1-120, breakMinutes 1-60}. `PATCH /servers/:serverId/study-timer/config` → 200 DTO / 400 / 409 / 403 / 401. Migration 0023: server_study_timer += work_duration_ms (default 1500000), break_duration_ms (default 300000), additive backfill 25/5.

## Spec 2 — ffd98a36: F-1 slim-bar fix (ACs)
- <1024px slim-bar shows 2px phase-colored left border (emerald Work / amber Break) per design; tracks phase live.
- Desktop ≥1024px unchanged; idle → neutral border.
- Fix: inline border shorthand at StudyTimerWidget.tsx:476 clobbers stylesheet border-left (specificity) → ~1-line CSS-scope fix. No logic.

## Scope-fence (P-0 unanimous)
NO per-user prefs / presets / long-break-every-N / history / heavy settings UI — future sibling slices.
