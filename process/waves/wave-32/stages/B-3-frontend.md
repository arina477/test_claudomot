# Wave 32 — B-3 Frontend

## Specialist
- **livekit-integration** — occupancy indicator + bounded-poll hook (client domain).

## Files implemented
- `apps/web/src/shell/useVoiceOccupancy.ts` (new) — bounded-poll hook (setInterval ~10s, cleared on unmount + enabled=false; AbortController coalescing per BUILD rule 5; fail-soft; returns {count,participants,status})
- `apps/web/src/shell/VoiceOccupancyIndicator.tsx` (new) — four-state component to adopted design
- `apps/web/src/shell/voice-occupancy.test.tsx` (new) — 27 tests
- `apps/web/src/shell/VoiceStudyRoom.tsx` (mod) — wire indicator into pre-join surface; poll enabled pre-join, disabled after join
- `apps/web/src/auth/api.ts` (mod) — getVoiceParticipants method

## Designs consumed
- `design/voice-occupancy-indicator.html` (D-3 canonicalized) — four states mapped: loading(skeleton) / empty("door's open") / populated(count chip + "N studying now" + avatar cluster + "+N") / error(fail-soft role=status, Join reachable).

## a11y (verified in tests)
role=status aria-live=polite; sr-only full name announcement (retained below 1024); avatar aria-label=displayName; error uses role=status NOT alert; Join never blocked by error.

## /simplify (Action 3)
Applied. One real win: removed dead `stateRef` + its sync effect in useVoiceOccupancy.ts — fail-soft path uses a functional `setState((prev)=>…)` updater, so the "avoid stale closure" ref was orphaned/misleading. Behavior-preserving; 27/27 tests green + typecheck clean after removal.

## Deviations + adjudications
- Specialist reported "none". 
- **B-6 watch (orchestrator note):** hook fetches inline (replicating api.ts headers) while also adding `getVoiceParticipants` to api.ts — confirm the added api method is used (by the indicator/tests) or is dead; head-builder /review to check. Non-blocking.

## Verification
27/27 occupancy tests green; typecheck clean; formatter + lint run by specialist.

```yaml
skipped: false
fast_path_active: false
specialists_spawned: [livekit-integration]
files_implemented:
  - apps/web/src/shell/useVoiceOccupancy.ts
  - apps/web/src/shell/VoiceOccupancyIndicator.tsx
  - apps/web/src/shell/voice-occupancy.test.tsx
  - apps/web/src/shell/VoiceStudyRoom.tsx
  - apps/web/src/auth/api.ts
designs_consumed: [design/voice-occupancy-indicator.html]
deviations: []
simplify_applied: true
```
