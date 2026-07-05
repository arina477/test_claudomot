# B-2 — Backend (wave-50)

**node-specialist a395e9a7. Commits:** 34b4b83 (service), 07f9510 (controller), 75acc5e (tests). All cite Refs: f4b3659e.

## Implemented
- **rowToDto** carries workDurationMs/breakDurationMs.
- **[karen-2 CARRY — done] Durations threaded through the full compute-on-read walk:** `phaseDurationMs(phase, row)`, `computeCurrentPhase(…, durations)`, `selfHealIfOverdue`, `doPhaseAdvance` (refetches row for durations), `startTimer` (pre-reads row for configured work length; onConflictDoUpdate omits duration cols = sticky config). Bare WORK/BREAK_DURATION_MS consts now only the no-row idleDto fallback. A restarted process self-heals a custom-duration timer with CONFIGURED lengths, not 25/5.
- **configureDurations(serverId, userId, workMinutes, breakMinutes):** assertMember→403; **idle-only → 409 ConflictException** ("Reset the timer to change durations") if running/paused; upsert work=workMinutes*60000 / break=breakMinutes*60000 (state cols untouched; upserts an idle row if none); **[karen-1 CARRY — done] emits internal STUDY_TIMER_UPDATED_EVENT via EventEmitter2** → gateway `@OnEvent` re-broadcasts wire `study-timer:update` with extended DTO. Returns DTO.
- **Controller:** `PATCH /servers/:serverId/study-timer/config` — AuthGuard, serverId @Param, userId session, StudyTimerConfigSchema.safeParse + BadRequestException (matches scheduling.controller pattern — no shared ZodValidationPipe in repo). 200 DTO; 400/409/403/401 propagate.

## Tests (19 new)
- Unit (11): custom-duration computeCurrentPhase walk; phaseDurationMs reads row; configureDurations 403/409-running/409-paused/200-idle+persist+emit/no-row-upsert; rowToDto duration fields; startTimer uses configured work.
- Integration (8, real-PG in CI): config idle→persist+emit; GET reflects; startTimer uses configured length; config running→409; paused→409; non-member→403; **karen-2 self-heal uses 10/2 config not 25/5**; backward-compat default rows = 25/5.

## Verify
- `npx tsc --noEmit`: 0. `npx biome ci src/study-timer`: 0. `pnpm --filter @studyhall/api test`: **647 passed** (was 638), 36 files.
- Integration locally: port 5433 ECONNREFUSED — pre-existing local-infra baseline (all 18 integration files fail identically without the local PG; CI provisions PG16 + runs them). NOT a regression (stash-verified). Migration 0023 NOT applied locally → C-2.

## Deviation from plan
None material. startTimer gained one pre-read getTimerRow (needed for sticky-config correctness + the "next Start uses configured durations" AC). Zod validated via safeParse+BadRequestException (repo convention).
