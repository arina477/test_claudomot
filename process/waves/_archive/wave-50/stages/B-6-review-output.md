# B-6 Phase 2 Production-Bug Review — wave-50 (StudyHall per-server study-timer durations + F-1 fix)

**Branch:** `wave-50-timer-durations` · **Base:** `main` · **Reviewer:** code-reviewer (read-only)
**Diff scope:** migration 0023, `study-timer.ts` schema, service (`configureDurations` + duration-threading refactor), controller PATCH `/config`, shared contracts, `StudyTimerWidget.tsx` (config affordance + F-1 fix), `api.ts`, `icons.tsx`, `globals.css`.

**Gate signals reproduced locally:**
- `pnpm --filter @studyhall/api typecheck` — clean
- `pnpm --filter @studyhall/web typecheck` — clean
- `biome ci` on all 6 changed source files — clean, no fixes
- API tests: 647 passed / 647
- Web tests: 416 passed / 416

No lint/typecheck/build regression the head-builder gate would have missed. Findings below are logic/UX-level.

---

## SQL safety — CLEAN

- Migration 0023 is two additive `ADD COLUMN ... DEFAULT ... NOT NULL` statements. Additive with a constant default → safe; existing rows backfill to classic 25/5 (1500000 / 300000 ms). No data loss, no lock-heavy rewrite concern at this table's scale. Journal + snapshot (`0023`) are consistent with `_journal.json` idx 23.
- `configureDurations` upsert is fully parameterized via Drizzle (`.values()` / `.onConflictDoUpdate({ set })`) — no string interpolation, no injection surface.
- The `onConflictDoUpdate.set` touches **only** `work_duration_ms`, `break_duration_ms`, `updated_by`, `updated_at` — it does NOT touch `run_state`, `phase`, or any time anchor. Correct: a config change on an existing idle row leaves state/anchors untouched.

## Duration-threading correctness (the crux) — CLEAN

Every live-walk call site now threads the row's own durations. Verified exhaustively via `grep` on `WORK_DURATION_MS|BREAK_DURATION_MS|phaseDurationMs`:

- `phaseDurationMs(phase, durations)` — signature now requires the row; no zero-arg callers remain.
- `computeCurrentPhase(..., durations)` — line 113 walk + line 119 fallback both use `durations`, not bare constants.
- `selfHealIfOverdue` (277, 283) — passes `row`; heals with configured lengths.
- `doPhaseAdvance` (388) — re-reads the row before computing next-phase length; `advancePhase` derives phase, `phaseDurationMs(newPhase, row)` derives length. Idempotent UPDATE guard (`WHERE ends_at = expectedEndsAt AND run_state='running'`) preserved. Re-arm uses the fresh `newEndsAt`.
- `startTimer` (481-482) — pre-reads the row for `work_duration_ms`, falls back to `WORK_DURATION_MS` when no row exists. The `?? WORK_DURATION_MS` null-row handling is correct.
- The only bare-constant uses left are: column-DEFAULT semantics (schema/migration) and `idleDto` (230-231) for the no-row case — both correct fallbacks, not live-walk math.

**Off-by-one at phase boundaries:** none. `computeCurrentPhase` uses strict `phaseEndMs > nowMs` (exclusive) to keep the current phase; consistent with prior wave-49 behavior and unaffected by variable durations.

**startTimer read-then-write race:** benign. The pre-read is only to source the *configured* durations; the subsequent upsert is atomic and the `onConflictDoUpdate` deliberately does NOT overwrite duration columns, so even if a concurrent `configureDurations` lands between read and write, the persisted durations remain the latest-written config, not the stale pre-read value. The pre-read value only affects `ends_at` for this one start — acceptable and self-corrects on next self-heal/advance read.

## Conditional side effects — CLEAN

- `configureDurations` emits `STUDY_TIMER_UPDATED_EVENT` **only after** a successful upsert returns a row (guarded by `if (!row) throw`). No emit on the 403 (assertMember throws first) or 409 (ConflictException throws before the UPDATE) paths.
- Idle-guard ordering is correct: `getTimerRow` → `if (existing && run_state !== 'idle') throw ConflictException` happens **before** the upsert. No partial write on the 409 path.
- Upsert-idle-if-none path: when no row exists, `.values({ run_state: 'idle', phase: 'work', started_at: null, ends_at: null, paused_remaining_ms: null, work/break durations })` creates a sane idle row with no running timer. Correct for first-config-before-first-start.

## Contract mismatches — CLEAN

- `StudyTimerSchema` gains `workDurationMs` / `breakDurationMs` (`z.number().int().positive()`); DTO `rowToDto` (209-210) + `idleDto` (230-231) both populate them. Server → client consistent.
- `StudyTimerConfigSchema { workMinutes: 1-120, breakMinutes: 1-60 }` is the request body; controller `safeParse`s it, service converts `*60_000` to ms. Client `api.configureStudyTimer(serverId, {workMinutes, breakMinutes})` sends the same shape.
- Widget ms↔minutes conversions are consistent: `msToMinutes(ms) = round(ms/60000)` for display of configured values; `computeDisplaySeconds` uses `floor(durationMs/1000)`. Because persisted durations are always whole-minute multiples, both are exact — no drift.

## Null/undefined access — CLEAN

- `computeDisplaySeconds` guards `if (!timer) return 25*60` before dereferencing `timer.workDurationMs` — no undefined access on first render.
- `configuredWorkMin/BreakMin` guard `timer ?` before `msToMinutes(timer.workDurationMs)` — default 25/5 pre-fetch.
- `DurationConfigForm` receives numbers (never undefined) from the parent's guarded derivation; `useEffect` re-syncs on prop change.
- DTO duration fields are `NOT NULL` on the row and non-optional in the schema, so no idle/no-row null path reaches the widget.

## Missing error handling — MOSTLY CLEAN (2 findings)

- Controller: 400 (Zod `safeParse` → `BadRequestException(flatten())`), 403 (`assertMember` throws `ForbiddenException`), 409 (`ConflictException`), 401 (`@UseGuards(AuthGuard)`) — all wired.
- `request()` helper throws `Error("${status} ${statusText}: ${body}")`, so `msg.includes('409')` / `('400')` matching in the widget works for status-prefixed messages.
- See **M-1** (400 branch renders nothing) and **M-2** (desktop 409 has no surface) below.

## F-1 correctness — CLEAN

- Root inline style now sets `borderTop/Right/Bottom` individually and deliberately omits `borderLeft`, so `.timer-phase-work { border-left: 2px solid ... }` / `.timer-phase-break` from `globals.css` render at `<1024px` (inline no longer clobbers the class). Verified against `globals.css:309-321`.
- Desktop border (`>=1024px`): `.timer-phase-*` sets `border-left: none` in the `@media (min-width:1024px)` block, and the inline `borderTop/Right/Bottom` supply the other three sides → the widget keeps a visible border on all sides at desktop (left side is the CSS-none + no inline-left = no left border, matching the prior `>=1024px` design where the slim-bar indicator is intentionally hidden). No regression: pre-fix desktop had all 4 sides via shorthand, but the design intent at desktop is no phase-left-bar; the 3-side inline border preserves the box outline everywhere the design shows one. Confirmed by test 33 (`style.borderLeft` falsy, `style.borderTop` truthy).
- Phase toggle emerald↔amber is component-level: `accent = isWork ? '#10b981' : '#f59e0b'` and `phaseClass` swaps `timer-phase-work`/`break`.

## Idle-only UX — CLEAN (1 minor)

- `isApplyEnabled = !isLocked && !isApplying && isDirty && !workError && !breakError` — Apply correctly gated on idle + changed + valid.
- Locked state (`isTimerLocked = isRunning || isPaused`) disables inputs and swaps Apply for the "Reset timer to change lengths" hint. Clear.
- See **L-1** (dead ternary) below.

---

## Findings

### M-1 (Medium) — 400 error branch sets state that is never rendered
**File:** `apps/web/src/shell/StudyTimerWidget.tsx:768-769` (set) — no render site.
**What:** `handleApplyConfig` sets `setConfigError('400')`, but nowhere in the JSX renders `configError === '400'`. Only `configError === '409'` renders (and only in the slim row, `:1050`).
**Why it's a bug:** If the server ever returns 400 despite client validation (e.g. a future non-range integer rule, or a schema drift), the user gets a silent no-op — the spinner clears but no feedback appears. Test 28 implicitly documents this ("clears pending state" only). Low real-world frequency because client validation blocks most bad values, hence Medium not High.
**Fix:** Either render a `configError === '400'` inline message (mirroring the 409 block, in both desktop and slim), or drop the `setConfigError('400')` dead-state and surface the raw validation error. Prefer the former for parity with the documented AC 28.

### M-2 (Medium) — 409 reset hint has no surface on desktop (>=1024px)
**File:** `apps/web/src/shell/StudyTimerWidget.tsx:1050-1058` — the `configError === '409'` block lives inside the `lg:hidden` slim-config reveal row (`:1034`).
**What:** The 409 message renders only in the mobile slim row. On desktop, a 409 (someone else started the timer between the moment Apply was enabled and the request landing — a real race, since another member's start broadcasts async) produces no visible error; the spinner just clears.
**Why it's a bug:** Desktop users hitting the idle→running race get silent failure. The `isTimerLocked` hint covers the *steady-state* locked case, but not the *in-flight race* case where the broadcast hasn't yet flipped `runState` when the 409 returns.
**Fix:** Move/duplicate the `configError === '409'` message into the desktop `DurationConfigForm` region (or render it near the desktop form), not solely inside the `lg:hidden` container.

### L-1 (Low) — dead always-undefined ternary
**File:** `apps/web/src/shell/StudyTimerWidget.tsx:559`
```
aria-describedby={!isApplyEnabled && !workError && !breakError ? undefined : undefined}
```
**What:** Both ternary branches evaluate to `undefined` — the entire expression is unconditionally `undefined`.
**Why it's a smell:** Dead code; the apparent intent (describe *why* Apply is disabled for a11y) is not achieved. Biome passes it but it's misleading. The disabled Apply button has no `aria-describedby` reason, so screen-reader users get no explanation of why Apply is disabled — the stage doc comment claims "Disabled Apply gets aria-describedby with the reason," which this line does NOT deliver.
**Fix:** Either wire a real describedby id pointing at a visually-hidden reason string, or delete the attribute. If deleting, update the header comment's a11y claim to match.

### L-2 (Low) — redundant conditional expression (identical branches)
**File:** `apps/web/src/shell/StudyTimerWidget.tsx:460-463` (separator span)
```
style={{ color: isLocked ? 'rgba(255,255,255,0.40)' : 'rgba(255,255,255,0.40)' }}
```
**What:** The `/` separator's color ternary yields the same value on both branches.
**Why it's a smell:** Dead conditional — either the locked separator was meant to differ from unlocked, or the ternary should be a plain literal. Harmless at runtime but misleading.
**Fix:** Collapse to a plain string, or set the intended distinct locked color.

---

## Severity count

| Severity | Count |
|---|---|
| Critical | 0 |
| High | 0 |
| Medium | 2 (M-1 silent 400, M-2 desktop 409 no surface) |
| Low | 2 (L-1 dead a11y ternary, L-2 redundant color ternary) |

**Total: 4 findings (0 Critical, 0 High, 2 Medium, 2 Low).**

No Critical or High issues. The crux (duration-threading through start / phase-advance / self-heal / compute-on-read), SQL safety, conditional side effects, contract consistency, null-access, and the F-1 border fix are all correct. The two Medium findings are silent-failure UX gaps in the config error surfaces (400 never rendered; 409 desktop-invisible), not correctness or data-integrity bugs. Recommend fixing M-1/M-2 before merge for UX completeness; L-1/L-2 are cleanup.

---

## Re-run (post-fix-up)

**Fix commit under review:** `971815d` — "fix: B-6 review findings M-1/M-2 config-error-surfacing for wave-50"
**Branch:** `wave-50-timer-durations` · **Reviewer:** code-reviewer (read-only)
**Files changed:** `apps/web/src/shell/StudyTimerWidget.tsx` (+137/-72 across both files), `apps/web/src/shell/study-timer.test.tsx`.

**Gate signals reproduced locally (post-fix):**
- Web tests: **417 passed / 417** (was 416; +1 for new test 37)
- `biome ci .` (repo-wide, 294 files): **clean, no fixes applied**
- `pnpm --filter @studyhall/web typecheck`: **clean** (tsc `--noEmit`, exit 0)

### Finding dispositions

**M-2 (409 reset-hint invisible on desktop) → CONFIRMED-RESOLVED**
- Error rendering moved into `DurationConfigForm` behind a new `configError?: string | null` prop (`:376`, `:387`). The `configError === '409'` block now lives in the shared form body (`:602-611`), inside an `aria-live="polite" aria-atomic="true"` region (`:602`). Because the form is instantiated once for desktop (`hidden lg:flex`, prop wired at `:941`) and once for slim (`:1099`), the 409 hint now renders in the desktop region — the idle→running race no longer yields a silent no-op on desktop.
- The old slim-only paragraph (`data-testid="config-error-409"` in the `lg:hidden` reveal row) was **removed** (diff `-1044,18`). No double-render: the hint now renders once per form instance, each with a namespaced `data-testid={\`${idPrefix}-config-error-409\`}`, so desktop and slim get distinct ids. Test 27 rewritten to assert `getAllByTestId(/config-error-409$/).length > 0` with correct text via the desktop form (jsdom doesn't apply `lg:hidden`), replacing the old slim-open-then-click path.

**M-1 (400 set but never rendered) → CONFIRMED-RESOLVED**
- New `configError === '400'` branch (`:612-624`) renders an inline `WarningCircleIcon` (size 10, `aria-hidden`) + "Invalid duration values." text, danger colors (`#f87171` text, red border), namespaced `data-testid`. Sits in the same `aria-live="polite"` region → announced. `WarningCircleIcon` is imported (`:77`). `handleApplyConfig` still sets `setConfigError('400')` on a 400 (`:820`) and clears to `null` at entry (`:805`), so the state now has a live render site in both form instances. Test 28 rewritten from "clears pending only" to assert the inline message is visible.

**L-1 (dead always-undefined aria-describedby) → CONFIRMED-RESOLVED**
- The `!isApplyEnabled && !workError && !breakError ? undefined : undefined` dead ternary is gone. Disabled Apply now has `aria-describedby={!isApplyEnabled ? applyDisabledHintId : undefined}` (`:581`), and an `sr-only` hint span with matching `id={applyDisabledHintId}` (`:568-576`) renders whenever `!isApplyEnabled`, with real text ("Change a value to enable Apply" when not dirty / "Enter valid values to enable Apply" otherwise). The id resolves to non-empty text. New test 37 asserts the describedby id is truthy AND `document.getElementById(id)` resolves to a non-empty-text element — a genuine end-to-end a11y assertion. Header-comment a11y claim (`:58-61`) updated to match.

### Regression scan of the fix (no new Critical/High)

- **configError prop plumbing:** `configError?: string | null` is optional; both render branches use strict `=== '409'` / `=== '400'` equality, which is null/undefined-safe (no dereference, no null-access). Slim instance also passes the same prop (`:1099`) — no undefined-prop path. **No regression.**
- **Removed slim paragraph:** its sole responsibility (rendering the 409) is now covered by the in-form block for both instances. No orphaned `configError` state, no lost coverage. **No regression.**
- **Desktop vs slim conditional still correct:** desktop `DurationConfigForm` lives in the `hidden lg:flex` container, slim in the `lg:hidden` reveal — the responsive split is unchanged; only the error markup moved inside the shared component. Namespaced `idPrefix`-based ids keep desktop/slim testids distinct (no duplicate-id collision). **No regression.**
- **Existing 409/400 flow intact:** `handleApplyConfig` error mapping (`msg.includes('409')` / `('400')`, `:816-821`), optimistic reconcile, and `setIsApplyingConfig(false)` unwind are unchanged. Test 28 still asserts pending clears (inputs re-enable). **No regression.**
- **Markup nesting:** Apply button + hint span moved into a `flex flex-col gap-1` wrapper with the error region as a sibling (`:601`); valid JSX, tsc clean. **No regression.**

- **L-2 (redundant color ternary, `:488`):** re-confirmed **benign accepted-debt** — both branches evaluate to `rgba(255,255,255,0.40)`, so the `/` separator always renders the intended muted color. No runtime bug, biome passes it. Not touched by this fix and correctly left as cleanup.

### Updated severity count (post-fix)

| Severity | Count |
|---|---|
| Critical | 0 |
| High | 0 |
| Medium | 0 (M-1, M-2 both resolved) |
| Low | 1 (L-2 redundant color ternary — accepted debt) |

**M-2 → CONFIRMED-RESOLVED · M-1 → CONFIRMED-RESOLVED · L-1 → CONFIRMED-RESOLVED. No new Critical or High introduced.**

**B-6 Phase-2 exit condition: the branch now has ZERO Critical / ZERO High. VERDICT: 0 crit/high — YES.** Tests 27/28 updated and 37 added correctly assert the fixes; 417/417 web tests pass, `biome ci .` clean repo-wide, tsc clean. Remaining L-2 is accepted cleanup debt, non-blocking.
