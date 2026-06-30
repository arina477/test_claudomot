# L-2 Rule-Quality Vet — wave-21 (karen)

**Candidate:** obs-3 → BUILD-PRINCIPLES rule 5 (reconnect-loop in-flight guard).
**Verdict: APPROVE-PROMOTION — with the why line REWRITTEN.** The synthesizer's submitted
why line is a hard format failure (144 chars vs. ≤100 limit); the rule class, recurrence, and
non-dup all hold. Final corrected text at the bottom.

---

## Gate 1 — Recurrence ≥2 waves, SAME class — CONFIRMED

Genuinely the same structural class: a **reconnect-triggered async loop authored without
in-flight coalescing**, fired by the **identical two event sources** (socket `connect` +
window `online`), producing concurrent overlapping runs.

- **wave-20 H1** (`process/waves/_archive/wave-20/stages/B-6-review-output.md:18-27`):
  `drain()` (`apps/web/src/features/sync/outbox.ts:109-148`) had no re-entrancy guard. Socket
  `connect` and window `online` both route `runDrainAndCatchup → drain()` and overlap on
  reconnect → double-POST + reorder risk. **High** (in-order wedge at risk). Fixed with
  `_drainInFlight: Promise<void> | null` promise-mutex — verified live at
  `apps/web/src/features/sync/outbox.ts:107` + `:139-145`.
- **wave-21 M1** (`process/waves/wave-21/stages/B-6-review-output.md:42-46`): the catch-up
  `while`-loop (`apps/web/src/shell/useMessages.ts:144-188`) has NO in-flight guard. The same
  two triggers — socket `connect` (`apps/web/src/shell/useMessages.ts:210`) + window `online`
  (`apps/web/src/shell/useMessages.ts:222`) — both call `runDrainAndCatchup`, each starting the
  loop from the same `lastSeenCursorRef.current` (`apps/web/src/shell/useMessages.ts:140`) →
  overlapping `getMessagesAfter` calls + benign cursor-ref race. **Medium** (dedup-by-id at
  `:155-158` + idempotent `bulkPut` preserve correctness).

Same authoring gap; wave-20's guard (`outbox.ts:107/139-145`) is directly portable to the
wave-21 loop. Severity differs (reorder wedge vs. dedup-safe perf) only because the loop's
correctness contract differs downstream — the **structural** defect is identical. Recurrence
holds across two consecutive waves.

## Gate 2 — Format (BUILD-PRINCIPLES Contract `:9-18`) — FAIL AS SUBMITTED → fixed

- Rule line: measured **112 chars** (synthesizer claimed 113) — within ≤120. PASS.
- Why line AS SUBMITTED: measured **144 chars**, NOT the claimed 97. **FAILS ≤100 by 44 chars.**
  The "97" was fabricated (it counted only the trailing clause). The submitted why line also
  carries a parenthetical `(socket connect + window online)`.
- Other tokens: no `we`/`our`/`the team`/`during wave-`/`wave-<N>`/em-dash. Exactly 2 lines.

The synthesizer's self-reported char counts are unreliable on this candidate — a reminder that
L-2 must measure, never trust the candidate's claimed counts. Rewriting the why line to a
measured **100 chars** (drops the parenthetical, stays falsifiable):

  `Socket-connect and window-online can fire together; an unguarded loop runs twice, doubling requests.`

## Gate 3 — Non-dup vs rules 1-4 — NEW

Rules 1-4 (`BUILD-PRINCIPLES.md:70-80`): prod-boot artifact validation, push-after-stage,
backfill-seed parity, reproduce-negative-authz-path-at-B-6. None addresses async-loop
re-entrancy / concurrency. No near-dup.

## Gate 4 — Actionable + correct — YES

Concrete and B-6-checkable: for any newly authored reconnect-triggered async loop, is there a
module-level in-flight flag or promise-mutex coalescing the concurrent triggers? Absence fails
the rule. Trigger overlap is real in live code (`useMessages.ts:210` socket connect +
`:222` window online → unguarded `while` at `:144`). Falsifiable + correct.

---

## VERDICT: APPROVE-PROMOTION (why line corrected)

Append to `command-center/principles/BUILD-PRINCIPLES.md` as rule 5, contingent on head-builder
domain sign-off:

```
5. Guard every reconnect-triggered async loop with an in-flight coalescing flag or promise-mutex at authoring time.
   Why: Socket-connect and window-online can fire together; an unguarded loop runs twice, doubling requests.
```

Rule line = 112 chars (≤120). Why line = 100 chars (≤100). Exactly 2 non-empty lines. No
forbidden tokens, no em-dash, no parenthetical. Sequential (next = 5). Format-clean as written
here.
