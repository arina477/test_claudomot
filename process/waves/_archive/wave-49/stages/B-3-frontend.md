# B-3 — Frontend (wave-49 study timer)

**Stage:** B-3 · **Spec:** c3daf6d3 (widget) + client half of cb81bf03 (socket) / 1387d845 (endpoints) · **Agent:** react-specialist (afd95f8445c8cbc05) · **Commit:** 1a6972c (Refs: c3daf6d3)

## Files
**New**
- `apps/web/src/shell/StudyTimerWidget.tsx` — the widget
- `apps/web/src/shell/studyTimerSocket.ts` — join/leave + onStudyTimerUpdate/onStudyTimerPresence (singleton reconnect)
- `apps/web/src/shell/study-timer.test.tsx` — 17 component/unit tests

**Modified**
- `apps/web/src/auth/api.ts` — getStudyTimer / startStudyTimer / pauseStudyTimer / resumeStudyTimer / resetStudyTimer
- `apps/web/src/styles/globals.css` — colon-blink keyframe + timer-phase-work/break slim-bar classes (prefers-reduced-motion guarded)
- `apps/web/src/shell/icons.tsx` — PlayFillIcon / PauseFillIcon / TimerFillIcon / CoffeeIcon
- `apps/web/src/shell/MainColumn.tsx` — mounts `<StudyTimerWidget serverId={selectedId} />` in the shrink-0 strip above MessageList

## Binding-model confirmations (P-0/P-4/D-3 carries)
- **compute_on_read (anti-drift):** countdown never client-authored. Each 1s tick recomputes `Math.max(0, floor((new Date(timer.endsAt).getTime() - Date.now())/1000))` off the server-issued endsAt from the latest study-timer:update. Drift resets on every server broadcast + re-corrects each second. Paused uses server remainingMs (endsAt null).
- **roster distinct from online-presence:** separate socket event (study-timer:presence, not user:presence); separate state (widget-local useState); TimerFillIcon badge + phase-colored ring (emerald work / amber break) vs green dot. Never merged with presenceSocket set.
- **D-3 carries applied:** `.btn` transition fixed to real CSS props; slim-bar (<1024) 2px phase border-left; paused badge aria-atomic="true"; aria-live="polite" on phase pill (role=status); prefers-reduced-motion carried; decorative header icons not timer controls.

## Verify
- biome ci (7 files touched): 0 errors 0 warnings
- tsc --noEmit: clean
- @studyhall/web suite: 394/394 pass (17 new study-timer + 0 regressions)

## Deviation from plan
None reported by the sub-agent. Frontend-only; consumed B-1 contracts + B-2 endpoints/events; no invented hex (Tailwind tokens + 2 design-system constants mirroring design/study-timer.html).
