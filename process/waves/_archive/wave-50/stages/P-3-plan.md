# P-3 — Plan (wave-50)

## Approach section

### Architecture deltas
- **study-timer schema (apps/api/src/db/schema/study-timer.ts):** ADD `work_duration_ms` + `break_duration_ms` integer columns (NOT NULL, defaults 1500000 / 300000) to the existing `server_study_timer` table. Additive; anchors-only model preserved (durations are per-server config read at Start/phase-transition, not a running counter). *Alternative considered:* a separate `server_study_timer_config` table — rejected (1:1 with the timer row, UNIQUE(server_id) already exists; a second table adds a join + reconciliation for zero benefit). Failure-domain: none — same row, same membership gate.
- **StudyTimerService (apps/api/src/study-timer/study-timer.service.ts):** (a) `rowToDto` includes the two duration fields; (b) Start/phase-advance use the row's configured durations instead of hardcoded 25/5 constants (replace the WORK_DURATION_MS/BREAK_DURATION_MS literals with the row values, defaulting to 25/5 for rows predating the migration via the column default); (c) new `configureDurations(serverId, userId, workMinutes, breakMinutes)` — assertMember, validate ranges, **require run_state='idle'** (throw 409 ConflictException otherwise), UPDATE the two columns, emit `study-timer:update` to the server room. *Alternative:* apply-on-next-phase mid-run — rejected (complicates the compute-on-read multi-phase walk with mixed durations; idle-only is unambiguous and the reviewers scope-fenced to minimal). Failure-domain: reuses the existing membership gate + broadcast; no new boundary.
- **StudyTimerWidget (apps/web/src/shell/StudyTimerWidget.tsx):** (a) render current configured minutes; (b) a minimal duration-config affordance (2 validated number inputs + Apply), disabled/hint-blocked while running/paused; (c) **F-1 fix** — stop the inline `border` shorthand (line ~476) from clobbering the `.timer-phase-work/.timer-phase-break` `border-left` (globals.css:310-315). *Affordance placement pending D-block* (design_gap_flag true).

### Data model
- Migration **0023** (drizzle-kit generate): `ALTER TABLE server_study_timer ADD COLUMN work_duration_ms integer NOT NULL DEFAULT 1500000, ADD COLUMN break_duration_ms integer NOT NULL DEFAULT 300000;`. Online, additive, backfills existing rows to 25/5 via defaults. No index/FK/unique change. Applied prod-first at C-2 (public proxy), per the wave-49 procedure.

### API contracts
- **PATCH `/servers/:serverId/study-timer/config`** — req `StudyTimerConfigSchema {workMinutes:int 1-120, breakMinutes:int 1-60}`; res 200 `StudyTimer` DTO. Auth: AuthGuard (401 anon) + assertMember (403 non-member). Errors: 400 (invalid range/non-integer via Zod/pipe), 409 (run_state != idle). Idempotent within a config value (last-write-wins on the single row). Emits `study-timer:update` to `presence:server:<id>`-style room.
- **GET `/servers/:serverId/study-timer`** (existing) — DTO gains `workDurationMs` + `breakDurationMs`.
- Types: `packages/shared/src/study-timer.ts` — extend `StudyTimerSchema` (+2 fields) + add `StudyTimerConfigSchema`.

### Dependency list
None. No new third-party deps, no new SDK. (external-sdk-integration-rules N/A.)

## Plan section

### File-level steps (grouped by build stage)

**B-0 (branch + schema):**
- `apps/api/src/db/schema/study-timer.ts` — modify: add 2 duration columns. **node-specialist.**
- `apps/api/drizzle/migrations/0023_*.sql` (+ meta) — create: generated migration. **node-specialist.** (order: after schema edit.)

**B-1 (contracts):**
- `packages/shared/src/study-timer.ts` — modify: extend StudyTimerSchema (+workDurationMs/breakDurationMs) + add StudyTimerConfigSchema; barrel export. **node-specialist.** (order: after B-0; B-2/B-3 consume.)

**B-2 (backend):**
- `apps/api/src/study-timer/study-timer.service.ts` — modify: rowToDto+2 fields; Start/advance use configured durations; add configureDurations (validate + idle-guard 409 + broadcast). **node-specialist.**
- `apps/api/src/study-timer/study-timer.controller.ts` — modify: add PATCH .../config route (assertMember, Zod body). **node-specialist.**
- `apps/api/src/study-timer/study-timer.service.spec.ts` + `apps/api/test/integration/study-timer.integration.spec.ts` — modify: config unit + real-PG integration (validation, idle-guard 409, next-Start-uses-new-durations, member/non-member). **node-specialist.** (order: after service/controller.)

**B-3 (frontend):**
- `apps/web/src/auth/api.ts` — modify: add configureStudyTimer client. **react-specialist.**
- `apps/web/src/shell/StudyTimerWidget.tsx` — modify: render config + affordance (per adopted D-block mockup) + **F-1 border fix**. **react-specialist.** (order: after D-block adopts the affordance mockup; F-1 fix has no design dep and can land first.)
- `apps/web/src/styles/globals.css` — modify (if the F-1 fix moves the base border to a class). **react-specialist.**
- `apps/web/src/shell/study-timer.test.tsx` — modify: affordance states (idle-editable / running-blocked / validation) + slim-bar border assertion. **react-specialist.**

**B-4 (wiring):** repo typecheck + route registration (config route via existing controller/module — no new module). **orchestrator/node-specialist.**

### Specialist routing (validated against AGENTS.md)
- **node-specialist** (backend, schema, migration, contracts) — in AGENTS.md ✓ (wave-49 B-0/B-1/B-2).
- **react-specialist** (widget affordance, F-1 CSS, web tests) — in AGENTS.md ✓ (wave-49 B-3).
No missing specialists; no agent-creator needed.

### Parallelization map
- B-0 schema → B-0 migration (serial).
- B-1 contracts after B-0 (serial; B-2/B-3 depend).
- B-2 service → controller → specs (serial within backend).
- B-3: F-1 CSS fix (no design dep) can run in parallel with / ahead of the config affordance (which waits on D-block). api.ts before widget config wiring.
- B-2 and B-3 do NOT overlap (B-3 consumes B-2's config endpoint) — standard.

### design_gap_flag
**true** — the duration-config affordance needs a D-block mockup (D-1 brief → D-2 variant → D-3 adopt) before B-3 builds it. The F-1 slim-bar fix has NO design gap (restores adopted design/study-timer.html).

### Self-consistency sweep
1. Every P-2 AC maps to ≥1 step: durations-persist→schema+service; validation→controller/Zod; idle-only-409→service; next-Start→service; sync→service broadcast; authz→controller assertMember; widget affordance→B-3; F-1→B-3 CSS. ✓
2. Every step has a specialist. ✓
3. No file in multiple parallel batches. ✓
4. design_gap_flag referenced (true). ✓
5. Architecture deltas have alternative trade-offs (separate-table; apply-on-next-phase). ✓
6. Data + API contracts concrete (migration 0023 DDL, PATCH config schema/codes). ✓
7. New deps: none. ✓
8. SDK pre-build: N/A. ✓
Sweep clean.
