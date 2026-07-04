# Wave 48 — L-block observations ledger

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave observations stay here until a second wave confirms.

## V-block observations (seeded by head-verifier at V-3 end-of-life)

- **[Mid-block promotion — VERIFY-PRINCIPLES rule 4; VALIDATED at L-2]** The head-verifier
  promoted a rule at V-3: "A negative-case test passes verification only if a positive control
  admits the value the negative excludes." Wave-48's everyone-control (`dm-candidates.spec.ts:110`
  `expect(ids).toContain(USER_Y_EVERYONE)`) is the load-bearing evidence: it proves the query
  returns co-members in general, making the nobody-exclusion (`not.toContain(USER_X_NOBODY)` :113)
  attributable specifically to the `ne(who_can_dm,'nobody')` predicate rather than passing vacuously
  on an empty result set. This is a genuine well-formed lesson. VALIDATED at L-2 (see Part A of
  deliverable); VERIFY-PRINCIPLES rule 4 is in-file and linter-clean.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read: process/waves/wave-48/ full artifact set (T-4, V-1-karen, V-1-jenny, V-2-triage,
V-3-fast-fix, B-6-review, V-block gate-verdict).
Prior archives consulted: process/waves/_archive/wave-{43,44,45,46,47}/blocks/L/observations.md
(recurrence checks on positive-control class, V-2 strand class, and all prior held HOLDs).
Principles files read: BUILD-PRINCIPLES (9 rules), VERIFY-PRINCIPLES (4 rules — including
mid-block rule 4), CI-PRINCIPLES (9 rules), PRODUCT-PRINCIPLES (3 rules), test-writing-principles
(rules 1-27 + §13), T-5.md (2 rules), T-4.md (0 rules).

---

- **[obs-A — test-writing §26 CONFIRMED BY CORRECT APPLICATION; no new promotion]**
  Wave-48's T-4 integration spec is the corrective for the wave-46/47 mock-no-op gap. The T-4
  stage notes explicitly: "Real-Postgres + per-test rollback discipline (test-writing §26): the
  harness applies real Drizzle migrations and `truncateTables()` runs in `beforeEach` — real DB,
  per-test isolation, NOT mocked." Karen V-1 independently confirms: "import order guarantees the
  SUT's `db` singleton binds to the TEST DB. No mock of `db`, `.where()`, or the query builder
  anywhere in the file." This is confirmation-by-correct-application of test-writing §26 ("prove
  filters against real DB not mock"). The lesson from wave-47 was absorbed; the wave-48 integration
  spec exercises the REAL SUT against REAL Postgres. Not a new promotion — §26 is already the
  correct permanent encoding.

  Source: process/waves/wave-48/stages/T-4-integration.md § "Real-Postgres + per-test rollback
  discipline"; process/waves/wave-48/stages/V-1-karen.md Claim 1-2.
  Severity: informational.
  Candidate principles file: none (confirmation-by-application of §26).
  Disposition: NOT A NEW CANDIDATE — §26 confirmed-by-correct-application.

- **[obs-B — V-2 wave_id strand near-miss; recurring ritual-doc class; not promotable]**
  Follow-up task 344eabde was initially created with `wave_id = 25c46eee...` (wave 48 UUID,
  provenance). The head-verifier's V-3 note Q5 confirms it is seedable because `wave_id` carries
  provenance only and `parent_task_id IS NULL` governs seedability — meaning this instance was
  NOT stranded. However, the V-2 Action 4 canonical SQL still sets `wave_id = current wave`,
  which is the recurrently identified structural issue. This wave the orchestrator handled it
  correctly (V-2-triage.md Action 4 explicitly notes "wave_id = current wave 48" as provenance;
  `parent_task_id = NULL` was set correctly from the start — so no strand occurred).

  Recurrence class: the wave_id-strand class (MEMORY-tracked: "v2-milestone-followup-wave-id-
  must-be-null-for-n2-seed") continues to be correctly mitigated by the MEMORY note and correct
  V-2 ritual execution. This is the Nth documented near-awareness (wave-44 obs-2 was the 4th
  stranding; wave-47 obs on the same class confirmed NO strand this wave — correctly applied).
  Wave-48 also confirms NO strand (correct execution). The class remains a brain-owned ritual-doc
  issue (V-2 Action 4 INSERT SQL), not a project VERIFY/BUILD/CI/PRODUCT principle. The fix is in
  the brain-vendored V-2 Action 4 INSERT; a project *-PRINCIPLES.md rule cannot fix a brain-owned
  ritual. The MEMORY note is the correct and sufficient mitigation.

  Source: process/waves/wave-48/stages/V-2-triage.md Action 4; process/waves/wave-48/blocks/V/
  gate-verdict.md Q5.
  Severity: informational.
  Candidate principles file: none (brain-owned ritual-doc class; MEMORY is the authoritative
  mitigation).
  Disposition: NOT A PROJECT-PRINCIPLES CANDIDATE — ritual-doc fix target; MEMORY is active.

## Wave-48 net-new principle promotions beyond mid-block: 0

All L-2 synthesis observations are either confirmation-by-correct-application (obs-A, §26
already encoded) or a recurring brain-owned ritual-doc class (obs-B, MEMORY-tracked). Zero
new promotion-eligible observations. This is the expected default for a test-only hardening
wave whose learning is largely an application of prior lessons.

---

## Prior held observations — second-instance status check (wave-48)

| origin | obs | class | wave-48 status |
|--------|-----|-------|----------------|
| wave-44 obs-1 | Responsive/layout fix introduces overlay without WCAG dialog contract; BUILD rule 10 | NOT CONFIRMED. Wave-48 is test-only; no layout fix or overlay introduced. Remains 4-wave HOLD. |
| wave-45 obs-1 | Browser resolution in committed playwright config; T-5 rule 3 | NOT CONFIRMED. No Playwright runner browser-resolution issue this wave; T-5 skipped (no UI changes). Remains 3-wave HOLD. |
| wave-45 obs-2 | `playwright test --list` false-green for browser-resolution change; BUILD rule 10 | NOT CONFIRMED. No browser-resolution config change this wave. Remains 3-wave HOLD. |
| wave-47 obs-C | Display-identifier vs opaque-id mismatch; "Unknown user" sentinel; BUILD rule 10 | NOT CONFIRMED. Wave-48 is test-only; no component rendering user identities. Remains 1-wave HOLD. |
| wave-41 obs-1 | V-3 redeploy false-green; CI rule 7 | NOT CONFIRMED. No V-3 fast-fix redeploy (V-3 Phase 2 skipped). Remains 7-wave HOLD. |
| wave-41 obs-2 | Symbol-grep false-positive; VERIFY rule 4 slot | SLOT NOW OCCUPIED (VERIFY rule 4 = positive-control, mid-block wave-48). This candidate must move to VERIFY rule 5 or be assessed anew for fit. Its substance: "symbol-grep false-positive from pre-existing component catches a non-finding; bundle-verification via symbol grep is unreliable." This is a VERIFY-class rule distinct from rule 4. Remains HOLD at VERIFY rule 5 slot on recurrence. |
| wave-41 obs-3 | Parallel-path enforcement gap; BUILD rule 10 | NOT CONFIRMED. No new parallel enforcement boundary. Remains 7-wave HOLD. |
| wave-40 obs-1 | T-8 fix mechanism contradicts architectural decision; PRODUCT rule 4 | NOT CONFIRMED. No T-8-sourced architectural conflict. Remains 8-wave HOLD. |
| wave-40 obs-4 | Global 22P02 filter / text-keyed route params; BUILD rule 10 | NOT CONFIRMED. No new text-keyed route params. Remains 8-wave HOLD. |

**Note on wave-41 obs-2:** VERIFY rule 3 slot was occupied at wave-46; VERIFY rule 4 slot is now occupied (wave-48 mid-block). Wave-41 obs-2 should target VERIFY rule 5 on its next recurrence assessment.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| mid-block | VERIFY-PRINCIPLES rule 4 (positive control for negative-case tests) | strong | VALIDATED — promoted mid-block at V-3 (wave-48 everyone-control as load-bearing evidence) | VERIFY-PRINCIPLES rule 4 | VALIDATED at L-2; in-file; karen APPROVE |
| obs-A | test-writing §26 confirmed by correct application; wave-48 integration spec hits real Postgres with per-test isolation | informational | confirmation-by-correct-application of §26 | none (§26 already encodes this) | NOT A NEW CANDIDATE |
| obs-B | V-2 wave_id provenance (344eabde); strand near-miss awareness; recurring ritual-doc class | informational | recurring ritual-doc class (MEMORY active) | none (brain-owned V-2 ritual) | NOT A PROJECT-PRINCIPLES CANDIDATE |

**Observations emitted (L-2 synthesis): 2 (obs-A, obs-B)**
**Severities: 2 informational (obs-A, obs-B)**
**Promotion-eligible beyond mid-block: NONE**
**Mid-block validation: VERIFY-PRINCIPLES rule 4 VALIDATED (karen APPROVE — format clean, sequential, distinct)**
