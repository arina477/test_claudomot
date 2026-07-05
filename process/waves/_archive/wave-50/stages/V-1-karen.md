# V-1 — Karen source-claim verification (wave-50)

**Wave:** 50 — M8 study-group slice 2: per-server custom Pomodoro durations on the LIVE shared study timer + F-1 slim-bar fix.
**Merge commit under review:** `699477655a2918a17b481437dea49ae349e6e317` (`feat: per-server custom Pomodoro durations on shared study timer + F-1 slim-bar fix (#64)`).
**Checked-out HEAD:** `a909afd` (main); merge `699477` is an ancestor — all `git show 699477:<path>` reads resolve against the merge tree.
**Deployed targets probed:** api `https://api-production-b93e.up.railway.app`, web `https://web-production-bce1a8.up.railway.app`.
**Method:** read-only — merge-tree `git show` + anon `curl` probes. NO fixes attempted.

## VERDICT: **APPROVE**

Every source claim across P-3 / B-0..B-6 / C-1..C-2 is substantiated on the merge tree AND corroborated on the deployed revision. The karen-2 duration-threading claim — the crux — is REAL, not decorative. No claimed-but-fake, no decorative-test-only, no deferred-undocumented findings.

---

## Finding 1 — File existence on merge tree: PASS

All 7 claimed files exist at `699477` (`git cat-file -e` OK for each):

| File | Status |
|---|---|
| `apps/api/src/db/schema/study-timer.ts` | OK |
| `apps/api/drizzle/migrations/0023_lush_iron_fist.sql` | OK |
| `apps/api/src/study-timer/study-timer.service.ts` | OK |
| `apps/api/src/study-timer/study-timer.controller.ts` | OK |
| `packages/shared/src/study-timer.ts` | OK |
| `apps/web/src/shell/StudyTimerWidget.tsx` | OK |
| `design/timer-duration-config.html` | OK |

Schema +2 duration columns confirmed at `study-timer.ts:35-36` — `work_duration_ms: integer(...).notNull().default(1500000)` + `break_duration_ms: integer(...).notNull().default(300000)`.

## Finding 2 — Function/export existence: PASS

- `configureDurations(serverId, userId, config)` — `study-timer.service.ts:714`.
- `phaseDurationMs(phase, durations)` — `service.ts:76-81` — **row-aware**: returns `durations.break_duration_ms`/`durations.work_duration_ms`, no bare constant.
- `computeCurrentPhase(initialPhase, startedAt, now, durations)` — `service.ts:98-125` — **row-aware**: the compute-on-read walk calls `phaseDurationMs(phase, durations)` at `:113`, threading the row's own durations.
- `StudyTimerConfigSchema` (`shared/src/study-timer.ts:113`) + `StudyTimerConfig` type (`:117`) exported; re-exported from `@studyhall/shared` via `packages/shared/src/index.ts:202-210` (`from './study-timer.js'`). Body: `workMinutes: z.number().int().min(1).max(120)`, `breakMinutes: z.number().int().min(1).max(60)` — matches the P-3 spec ranges.
- `StudyTimerSchema` gains `workDurationMs`/`breakDurationMs` (both `z.number().int().positive()`) at `shared/src/study-timer.ts:41-42`.
- `configureDurations` PATCH handler in controller — `controller.ts:161-174`.

## Finding 3 — Route registration (anon probes on DEPLOYED api): PASS

Controller declares 6 routes (`grep -cE '@Get|@Post|@Patch' = 6`): 5 original (start/pause/resume/reset POST + GET) + the NEW `@Patch('servers/:serverId/study-timer/config')` at `controller.ts:161`.

Live anon probes against `api-production-b93e`:

| Probe | Result | Meaning |
|---|---|---|
| `PATCH /servers/probe/study-timer/config` | **401** | NEW config route REGISTERED (401 auth-guard, NOT 404-unregistered) ✅ |
| `GET /servers/probe/study-timer` | **401** | existing guarded route intact |
| `GET /socket.io/?EIO=4&transport=polling` | **200** | gateway (incl. `/study-timer` namespace fan-out) live |

401 (not 404) on the config route is the decisive proof the new route shipped and is serving.

## Finding 4 — Migration 0023 applied on deployed DB: PASS (substantiated)

- Migration SQL (`0023_lush_iron_fist.sql`): two additive `ALTER TABLE "server_study_timer" ADD COLUMN ... integer DEFAULT 1500000/300000 NOT NULL` — matches the schema defaults exactly.
- Journal `meta/_journal.json`: idx 22 = `0022_unusual_clint_barton`, idx **23** = `0023_lush_iron_fist` — the ledger-idx-23 claim is consistent with the tree.
- C-2 substantiates application: pre-apply ledger 22 rows (`latest=1783252929946` = 0022 journal `when`), post-apply 23 rows (`latest=1783268077606` = 0023 journal `when`), both columns present, 2 rows backfilled 25/5.
- Runtime corroboration: the config route returns **401 (auth), not 500** — the controller→service→`server_study_timer` table load succeeds, which it could not if the columns were missing (`rowToDto` reads `work_duration_ms`/`break_duration_ms`). A 500 would surface if the ADD COLUMN had not run. 401 confirms the table/columns load cleanly.

## Finding 5 — Deploy hash match: PASS (reproduced)

- C-2 claims api deployment `29b4c8ae` + web `8927936f`, both SUCCESS, both deployed-commit == merge SHA `699477655a`, via `serviceInstanceDeploy(latestCommit:false)` polled against Railway's authoritative `deployments` endpoint (not `/health` alone). Rollback targets (api `476d8a0d` / web `d6f480c0`) identified pre-cutover. Substantiated in the C-2 verdict block.
- Reproduced live: `GET /health` → **200** `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`; web `/` → **200**.

## Finding 6 — Antipattern catalog (the crux): PASS — claim is REAL

**karen-2 duration threading — REAL, not decorative.** Bare `WORK_DURATION_MS`/`BREAK_DURATION_MS` (`service.ts:56-57`) appear in ONLY 3 spots, all no-row fallbacks:
- `:230-231` — the `idleDto` returned when NO row exists (no-row default).
- `:481-482` — `existing?.work_duration_ms ?? WORK_DURATION_MS` / `?? BREAK_DURATION_MS` — explicit null-coalescing fallback in `startTimer`'s pre-read (row-aware when a row exists).

They do **NOT** appear in the live compute-on-read walk. The walk is fully row-aware:
- `phaseDurationMs(phase, row)` reads `row.work_duration_ms`/`break_duration_ms` (`:76-81`).
- `computeCurrentPhase(..., durations)` calls `phaseDurationMs(phase, durations)` at `:113` and its defensive tail at `:124` uses `durations.work_duration_ms`.
- `selfHealIfOverdue` passes the row: `computeCurrentPhase(phase, row.started_at, now, row)` (`:277`) and `phaseDurationMs(healedPhase, row)` (`:283`).
- `doPhaseAdvance` refetches the row and calls `phaseDurationMs(newPhase, row)` (`:388`).

→ A restarted process self-heals a custom-duration timer with CONFIGURED lengths, not 25/5. Claim verified.

**Internal event, not direct wire emit — REAL.** `configureDurations` emits `STUDY_TIMER_UPDATED_EVENT` (`= 'study-timer.updated'`, an INTERNAL EventEmitter2 event, `service.ts:63`) at `:769`. The gateway `@OnEvent(STUDY_TIMER_UPDATED_EVENT) handleTimerUpdated` (`gateway.ts:271`) re-broadcasts the WIRE `STUDY_TIMER_UPDATE_EVENT` (`= 'study-timer:update'`) to `study-timer:server:<serverId>`. Service never touches the socket directly — the internal→wire seam is intact (karen-1 carry).

**Idle-only 409 guard — REAL.** `configureDurations:731-732`: `if (existing && existing.run_state !== 'idle') throw new ConflictException('Reset the timer to change durations')`. Upsert `onConflictDoUpdate` sets ONLY `work_duration_ms`/`break_duration_ms`/`updated_by`/`updated_at` (`:753-758`) — time anchors/run_state untouched (sticky-config correct).

**F-1 fix — REAL.** `StudyTimerWidget.tsx` root inline style (`:867-872`) decomposes the border into `borderTop`/`borderRight`/`borderBottom` ONLY and deliberately does NOT set `borderLeft` or the `border` shorthand (comments `:854-857`, `:867-869`), leaving `.timer-phase-work`/`.timer-phase-break` `border-left` from `globals.css` un-clobbered. `DurationConfigForm` component present (`:379`), used in both desktop (`:934`) and slim-reveal (`:1091`) regions.

**Fakery checks:** none found. No claimed-but-fake exports, no decorative/skipped tests substituting for real coverage, no undocumented deferrals. B-2 documents its one deviation (startTimer pre-read for sticky-config) transparently.

---

## Summary

| Claim area | Verdict | Key evidence |
|---|---|---|
| 1. File existence | PASS | all 7 files at `699477` |
| 2. Function/export | PASS | `configureDurations`, row-aware `phaseDurationMs`/`computeCurrentPhase`, `StudyTimerConfigSchema`/`StudyTimerConfig`, PATCH handler |
| 3. Route registration | PASS | config route 401 (not 404) live; 6 routes declared |
| 4. Migration applied | PASS | 0023 idx 23; config route 401-not-500 corroborates columns load |
| 5. Deploy hash match | PASS | C-2 substantiates SUCCESS @ 699477; /health 200 reproduced |
| 6. Antipattern crux | PASS | constants no-row-fallback only; internal event; 409 guard; F-1 real |

**FINAL: APPROVE.** No REWORK items. No blocking findings for V-2 triage.
