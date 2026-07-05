# Wave 50 — B-block review artifacts

**Block:** B (Build) · **Wave topic:** M8 study-group slice 2 — study-timer custom per-server durations + F-1 slim-bar fix · **Gate:** B-6 · **Status:** in-progress · **Branch:** wave-50-timer-durations · **claimed:** [f4b3659e, ffd98a36] · **Design:** design/timer-duration-config.html

## Stage deliverables
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | in-progress | branch + migration 0023 (+work/break_duration_ms) |
| B-1 | stages/B-1-contracts.md | pending | StudyTimerSchema +2 fields; StudyTimerConfigSchema |
| B-2 | stages/B-2-backend.md | pending | configureDurations (idle-only 409) + thread durations through walk |
| B-3 | stages/B-3-frontend.md | pending | duration-config affordance per design/timer-duration-config.html + F-1 fix |
| B-4 | stages/B-4-wiring.md | pending | |
| B-5 | stages/B-5-verify.md | pending | run CI-identical: biome ci . + full test suite (obs-A lesson) |
| B-6 | stages/B-6-review.md | pending | |

## Block-specific context
- **Spec contract:** tasks row f4b3659e (DB); pointer process/waves/wave-50/stages/P-2-spec.md. wave_type multi-spec.
- **Branch name:** wave-50-timer-durations
- **claimed_task_ids:** [f4b3659e (durations), ffd98a36 (F-1 slim-bar fix)]
- **New deps added this wave:** none
- **New env vars added this wave:** none
- **Schema changes this wave:** migration 0023 — server_study_timer += work_duration_ms (default 1500000), break_duration_ms (default 300000); additive backfill 25/5.

## MANDATORY B-block carries (from P-4 Phase-2 karen + D-3 head-designer)
- **karen-1 (event wiring):** `configureDurations` emits INTERNAL `STUDY_TIMER_UPDATED_EVENT` ('study-timer.updated', service.ts:46) — NOT the wire event. Gateway `@OnEvent` (gateway.ts:271) fans out the wire `study-timer:update` (STUDY_TIMER_UPDATE_EVENT). Extended DTO rides existing payload.
- **karen-2 (duration threading — correctness-critical):** thread per-row work/break durations through `phaseDurationMs()`, `computeCurrentPhase()`, `doPhaseAdvance()`, AND `selfHealIfOverdue()` — not only `startTimer()`. Make phaseDurationMs/computeCurrentPhase row-aware. Else self-heal corrupts custom-duration phase math with 25/5.
- **spec (idle-only):** config allowed only when run_state='idle'; 409 ConflictException if running/paused. assertMember→403, anon→401; serverId from route, userId from session.
- **D-3-1:** slim/mobile reveal-row inputs get the SAME aria-invalid+aria-describedby+aria-live validation chain as desktop.
- **D-3-2:** F-1 slim-bar 2px left-border toggles emerald(Work)↔amber(Break) by phase at the component level.
- **D-3-3:** locked-state "/" separator uses --text-muted not --border-hairline.
- **obs-A (B-5):** B-5 MUST run the CI-identical commands (biome ci . + full test suite) before B-6.

## Gate verdict log
<head-builder at B-6>
