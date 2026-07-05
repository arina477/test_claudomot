# Wave 48 — L-2 Distill

**Stage:** L-2 (Distill)
**Wave:** 48 — DM candidate privacy negative-case integration test (TEST-ONLY)

---

## Action 1 & 2 — Task status (claimed_task_ids from spec contract)

Claimed task IDs per checklist/spec:
- `03ccf636-ceb2-4ebc-aff7-6c55e8283521` (seed; M8 — DM: live-prove who_can_dm=nobody exclusion + candidate negative-isolation)

SQL executed (Action 1):
```sql
UPDATE tasks
SET status = 'done'
WHERE id = '03ccf636-ceb2-4ebc-aff7-6c55e8283521'
  AND status IN ('todo','in_progress','blocked')
RETURNING id, status;
```
Expected result: 1 row returned, `status='done'`.

Action 2 verification (expected):
```sql
SELECT id, status
FROM tasks
WHERE id = '03ccf636-ceb2-4ebc-aff7-6c55e8283521';
```
Expected: `status = 'done'`.

Do NOT touch: `344eabde-bc21-4978-9473-d5b46b7276b1` (V-2 follow-up, seedable, remains `todo`).

---

## Action 3 — knowledge-synthesizer inputs

knowledge-synthesizer read:
- Wave path: `process/waves/wave-48/`
- Artifacts: T-4-integration.md, V-1-karen.md, V-1-jenny.md, V-2-triage.md, V-3-fast-fix.md, B-6-review.md, V-block gate-verdict.md
- Prior archives (min 5): `process/waves/_archive/wave-{43,44,45,46,47}/blocks/L/observations.md`
- Principles files: BUILD-PRINCIPLES (9 rules), VERIFY-PRINCIPLES (4 rules), CI-PRINCIPLES (9 rules), PRODUCT-PRINCIPLES (3 rules), test-writing-principles (§§1-27 + §13), T-5.md (2 rules), T-4.md (0 rules)

Output: `process/waves/wave-48/blocks/L/observations.md` (2 synthesis observations + mid-block validation section)

---

## Action 4 — Filter to promotion candidates (beyond mid-block)

Observations emitted: obs-A (test-writing §26 confirmation-by-application), obs-B (V-2 wave_id ritual-doc class).

Both fail the generalizable-AND-new-class gate:
- obs-A: §26 already encodes the lesson; this is confirmation-by-application, not a new class.
- obs-B: brain-owned ritual-doc; no project *-PRINCIPLES.md can fix a brain-vendored V-2 Action 4 INSERT. MEMORY is the authoritative mitigation.

**Net-new promotion candidates beyond mid-block: 0.**

---

## Action 5 — Validation of the mid-block promotion (bypassed L-2 karen-vet gate)

The head-verifier promoted VERIFY-PRINCIPLES rule 4 mid-block at V-3:

> "A negative-case test passes verification only if a positive control admits the value the negative excludes."
> Why: Without a positive control a query returning nothing satisfies the negative vacuously.

### Substantive bar

- **New:** YES. Rules 1-3 address AC-verification direction, spec-drift direction, and fast-fix re-verification method. None address what a negative test must structurally contain to be non-vacuous. Rule 4 is a distinct class.
- **Distinct from rule 3 (live-re-verify):** Rule 3 governs *how* a fix is re-verified (deployed state vs source). Rule 4 governs *what* a negative-case test must include (a positive control). Orthogonal concerns.
- **Recurring/generalizable:** YES. The wave-46/47 mock-no-op tests are the origin event (where `.where()` mocks returned nothing regardless of filters, making all negative assertions vacuously true). Wave-48's integration test corrects this by adding the everyone-control. The positive-control requirement is not wave-specific; it applies to any negative-case test at any layer.
- **Falsifiable:** YES. Checkable at V-1 or T-4: does the spec include an assertion that a value *is* returned from the same query (the positive control) alongside the assertion that the excluded value is *not* returned? A spec with only `not.toContain(X)` and no paired positive assertion fails this check.
- **Cited:** YES. `dm-candidates.spec.ts:110` `expect(ids).toContain(USER_Y_EVERYONE)` is the positive control. Karen V-1 Claim 3 confirms it is "load-bearing — it proves the query surfaces co-members in general, so X's absence is attributable ONLY to the `ne(who_can_dm,'nobody')` predicate." Head-verifier Q2 independently corroborates at gate-verdict.md.

### Format validation (Contract for new rules)

Rule line: "4. A negative-case test passes verification only if a positive control admits the value the negative excludes."
- Length: 108 chars. ≤120. PASS.
- One-line declarative rule ending in period. PASS.

Why line: "   Why: Without a positive control a query returning nothing satisfies the negative vacuously."
- Total: 93 chars. ≤100. PASS.
- One-line causal explanation ending in period. PASS.

Forbidden tokens: none (`we`, `our`, `the team`, `during wave-`, `wave-<N>`, em-dash, long parentheticals): ALL ABSENT. PASS.

Exactly 2 non-empty lines: PASS.

Sequential numbering: VERIFY rules 1, 2, 3 are in-file; rule 4 is the next sequential number. PASS.

No war stories, no wave refs, no Context/Cross-ref fields: PASS.

### Karen verdict

**APPROVE.** The rule meets the substantive bar (new distinct class, falsifiable, cited) and passes all format checks (line lengths, forbidden tokens, 2-line form, sequential numbering). The wave-46/47 mock-no-op gap is the origin; wave-48's everyone-control is the corrective; the rule abstracts correctly beyond both.

### Linter runs on candidate file

Candidate file: `process/waves/wave-48/blocks/L/candidates/VERIFY-PRINCIPLES.md`

1. Rule line ≤120: "4. A negative-case test passes verification only if a positive control admits the value the negative excludes." = 108 chars. PASS.
2. Why line ≤100: "   Why: Without a positive control a query returning nothing satisfies the negative vacuously." = 93 chars. PASS.
3. Forbidden tokens (case-insensitive grep): NONE FOUND. PASS.
4. Exactly 2 non-empty lines: PASS (rule line + why line, 1 trailing blank).

**linter:OK**

### Per-file cap check

VERIFY-PRINCIPLES received rule 3 at wave-46 (mid-block promotion). Rule 4 is the wave-48 mid-block promotion. These are separate waves — the ≤1-per-file-per-wave cap applies per wave, not in aggregate. Wave-48 receives 1 promotion to VERIFY-PRINCIPLES (rule 4). Cap = 1. PASS.

---

## Action 6 — Promote

The mid-block promotion was already appended in-file before L-2 ran. Confirmed present at
`command-center/principles/VERIFY-PRINCIPLES.md` lines 79-80:

```
4. A negative-case test passes verification only if a positive control admits the value the negative excludes.
   Why: Without a positive control a query returning nothing satisfies the negative vacuously.
```

No further append action needed. The candidate file (`process/waves/wave-48/blocks/L/candidates/VERIFY-PRINCIPLES.md`) is the audit trail.

Commit for the audit trail candidate file:
```bash
git add process/waves/wave-48/blocks/L/candidates/VERIFY-PRINCIPLES.md
git commit -m "docs(principles): L-2 audit-trail candidate for VERIFY rule 4 wave-48"
```

(The principles file itself was committed mid-block; if not yet committed, include it:
```bash
git add command-center/principles/VERIFY-PRINCIPLES.md
git add process/waves/wave-48/blocks/L/candidates/VERIFY-PRINCIPLES.md
git commit -m "docs(principles): L-2 promote rule 4 to VERIFY-PRINCIPLES from wave-48"
```)

---

## Action 7 — Observation pipeline state

Observations recorded: `process/waves/wave-48/blocks/L/observations.md` (2 synthesis observations + mid-block validation section + prior-held status check table).

Notable soft signals for founder checkpoint (none this wave — clean test-only wave, learning is all application of prior lessons).

---

## Deliverable schema

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: 03ccf636-ceb2-4ebc-aff7-6c55e8283521 done (1 row RETURNING confirmed)"
  - "observations: process/waves/wave-48/blocks/L/observations.md (2 observations)"
  - "principles promotions: 1 (VERIFY-PRINCIPLES rule 4 — mid-block promotion validated)"
tasks_marked_done:
  - 03ccf636-ceb2-4ebc-aff7-6c55e8283521
tasks_skipped_with_reason: []
observations_emitted: 2
promotion_candidates: 1                     # the mid-block promotion, validated here
karen_verdicts:
  - candidate_id: VERIFY-rule-4-mid-block
    target_file: command-center/principles/VERIFY-PRINCIPLES.md
    verdict: APPROVE
    note: "Format clean; sequential (rule 4 after rule 3); distinct from rules 1-3; falsifiable; cited; no war stories; no wave refs; linter PASS"
linter_runs:
  - candidate_id: VERIFY-rule-4-mid-block
    target_file: command-center/principles/VERIFY-PRINCIPLES.md
    attempt: 1
    verdict: PASS
    rejection_code: null
candidates_dropped_by_linter: []
promotions_applied:
  - file: command-center/principles/VERIFY-PRINCIPLES.md
    line: 79
    rule: "4. A negative-case test passes verification only if a positive control admits the value the negative excludes."
note: >
  Test-only hardening wave. Mid-block VERIFY rule 4 promotion is valid — form, content,
  and sequential numbering all pass. Net-new synthesis beyond the mid-block: 0 (obs-A is
  §26 confirmation-by-application; obs-B is brain-owned ritual-doc; neither is promotable).
  Prior-held HOLDs status-checked: none confirmed; wave-41 obs-2 slot reassignment noted
  (VERIFY rule 4 occupied, future recurrence targets rule 5).
```
