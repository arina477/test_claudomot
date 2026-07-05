# B-3 — Frontend (wave-50)

**react-specialist abdd5dd9. Commit d7cda60 (Refs: f4b3659e + ffd98a36 dual-cited — shared widget file).**

## Files
- `apps/web/src/auth/api.ts` — `configureStudyTimer(serverId, {workMinutes, breakMinutes})` → PATCH /config.
- `apps/web/src/shell/StudyTimerWidget.tsx` — `DurationConfigForm` sub-component (desktop inline `hidden lg:flex` + slim reveal `lg:hidden` with real <button> toggle + Escape); validated work/break inputs; Apply (idle-only, disabled+reset-hint while running/paused); 409→reset-hint, 400→inline error; reconcile via existing `study-timer:update` subscription; idle display uses DTO workDurationMs/breakDurationMs. **F-1 fix** on root style. **D-3 a11y carries** (aria-label inputs, aria-invalid/describedby/live validation on desktop + slim).
- `apps/web/src/shell/icons.tsx` — FadersIcon (ph-faders).
- `apps/web/src/styles/globals.css` — .input-base/.input-error (token-compliant).
- `apps/web/src/shell/study-timer.test.tsx` — 19 new tests (36 total).

## Config apply + reconcile
`configureStudyTimer` PATCH → backend persists + broadcasts `study-timer:update` (via B-2's internal-event → gateway @OnEvent) → widget's existing `onStudyTimerUpdate` subscription setTimer → durations propagate to the form via useEffect sync. All members update, no reload.

## F-1 fix (specificity collision resolved)
Wave-49 root `style` had `border: '1px solid rgba(255,255,255,0.06)'` (shorthand sets border-left; inline specificity 1-0-0-0 always beats the `.timer-phase-work` class → phase border invisible <1024). Fix: inline style now sets `borderTop`/`borderRight`/`borderBottom` individually, NOTHING on borderLeft → `.timer-phase-work/.timer-phase-break border-left` (globals.css) renders, toggling emerald(Work)/amber(Break) by phase at <1024.

## Verify
biome ci (scoped, specialist): 0. tsc: 0. web suite: 416/416 (36 study-timer). **Repo-wide `biome ci .` at B-5 caught 2 format-drift files (integration spec + globals.css) → fixed 3d5b53b (obs-A lesson).**

## Deviation from plan
computeDisplaySeconds idle now uses DTO durations (spec AC "show configured duration"); DurationConfigForm as sub-component (readability). No commit by specialist (orchestrator committed per-spec).
