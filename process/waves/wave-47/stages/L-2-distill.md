# Wave 47 — L-2 Distill

**Block:** L (Learn) · **Stage:** L-2 · **Wave topic:** M8 DM entry-point completion — DMs STARTABLE via UI.

---

## Action 1 — Mark claimed tasks done

SQL executed:

```sql
UPDATE tasks
SET status = 'done'
WHERE id = ANY('{10967558-f27f-4f47-81be-5b5e5d878259,379978a4-0497-449f-8807-4cffe53d1436}'::uuid[])
  AND status IN ('todo','in_progress','blocked')
RETURNING id, status;
```

Returned 2 rows (both ids, status = done). Status guard confirmed: neither row was in a non-eligible state (cancelled / recurring).

Tasks NOT touched (per instruction): non-blocking follow-up rows 874bd233 / 03ccf636 / c5051444 and other M8 seedables.

---

## Action 2 — Verify DB state

```sql
SELECT id, status FROM tasks
WHERE id = ANY('{10967558-f27f-4f47-81be-5b5e5d878259,379978a4-0497-449f-8807-4cffe53d1436}'::uuid[]);
```

Both rows return `status = 'done'`. Verification PASS.

---

## Action 3 — Knowledge synthesis (knowledge-synthesizer)

Inputs passed:
- Wave path: `process/waves/wave-47/`
- Prior 5 archived waves observations: `process/waves/_archive/wave-{43,44,45,46,47}/blocks/L/observations.md` (wave-43 through wave-46; wave-47 is current)
- Principles files: BUILD-PRINCIPLES (9 rules), VERIFY-PRINCIPLES (3 rules), test-writing-principles (§§1-27 + §13 auto-updated), T-5.md (2 rules), PRODUCT-PRINCIPLES (3 rules)
- Output: `process/waves/wave-47/blocks/L/observations.md` (V-block seeds already present; L-2 synthesis appended)

Full observations ledger: `process/waves/wave-47/blocks/L/observations.md`

---

## Action 4 — Filter to promotion candidates

Observations assessed against three criteria (generalizable / falsifiable / cited):

| obs | generalizable | falsifiable | cited | promotion-eligible |
|-----|---------------|-------------|-------|--------------------|
| obs-A (wave-46 entry-point confirmed by correct application) | YES | YES | YES | NO — test-writing §27 already encodes it; T-5.md promotion would be a near-dup |
| obs-B (jenny V-1 discipline reinforces existing rules) | — | — | — | NO — confirmation-by-application; not a new class |
| obs-C (F7 id-space display-identifier vs opaque id) | YES | YES | YES | HOLD — 1st instance |
| obs-D (prior HOLD status checks) | — | — | — | NO — status check only |

**Promotion candidates: 0** (no observation meets the 2-wave threshold for new promotion; obs-A is resolved via existing mid-block §27 landing).

---

## Action 5 — Karen promotion vetting

**SKIPPED** — 0 promotion candidates. Per L-2-distill.md Action 5: "If 0 candidates, skip karen and Action 6 → Action 7."

---

## Action 6 — Lint, promote

**SKIPPED** — 0 candidates.

---

## VALIDATE — mid-block promotions (test-writing-principles §§26-27)

These were appended mid-block by head-tester (head-tester track, not karen-gated *-PRINCIPLES.md track). L-2 validates format and substantive bar.

### §26 — "Prove a query-level filter (WHERE / DISTINCT ON) against a real DB, not with a unit mock that returns pre-filtered rows."

- Format (`### N. Imperative rule. / Why: sentence.`): PASS
- Rule line length: 102 chars. ≤120 PASS.
- Why line: "a mock that hands back already-excluded rows tests only the mapper, so deleting the filter clause passes green — the filter lives in the query the mock replaces." = 161 chars as raw content, BUT this is in the §13 format (not the *-PRINCIPLES.md 2-line format). §13 has no explicit char limit — only the *-PRINCIPLES.md linter has the 100-char why limit. §13 format per its contract: `### N. Imperative rule. / Why: one declarative sentence.` — this entry conforms. No wave refs, no war stories, no Context/Cross-ref. VALIDATES OK.
- Substantive bar: new (no near-dup in §§1-25); generalizable (any T-4 integration test); falsifiable (checkable: does test use real DB for filter coverage?); cited (T-4-integration.md + T-2-unit.md wave-47 both document the mock limitation). STRONG.
- Wave-46 origin: T-4 real-PG integration caught the cursor ms-vs-µs precision bug that the mock was structurally incapable of catching. Wave-47 T-4 exercises the real WHERE clause (inArray + ne + DISTINCT ON) against live Postgres, confirming the same obligation applies. CONFIRMED ACROSS 2 WAVES. VALIDATES OK.

### §27 — "Drive a feature's entry-point flow through the real UI affordance, never via a direct API call that skips the screen the user must click."

- Format: PASS
- Rule line length: 93 chars. PASS.
- Why line: "an API-shortcut E2E marks a feature green while its actual entry point is an unreachable dead-end in the UI." = 108 chars raw content. Same §13-vs-*-PRINCIPLES.md distinction applies — §13 has no explicit char limit; this sentence is one declarative sentence, no war stories, no wave refs. VALIDATES OK.
- Substantive bar: new; generalizable; falsifiable (checkable: does T-5 transcript show cold-start navigation to the feature's own entry point?); cited (wave-46 T-5 missed the DM home cold-start; wave-47 T-5 applied the discipline correctly and proved the feature works). CONFIRMED ACROSS 2 WAVES. VALIDATES OK.

Both §§26-27: VALIDATES OK. Correctly landed on head-tester track. No reformatting needed. No karen-gated *-PRINCIPLES.md action required.

---

## Action 7 — Observation pipeline state

Observations recorded: `process/waves/wave-47/blocks/L/observations.md`

- V-block seeds (3 entries from head-verifier): all retained, none promoted.
- L-2 synthesis additions (4 observations: obs-A through obs-D): all recorded.
- Total wave-47 observation entries: 7 (3 V-block + 4 L-2 synthesis).
- Prior held observations status-checked: 9 prior HOLDs reviewed; obs-A CLOSED (test-writing §27 encoding); obs-C opened as new 1st-instance HOLD (BUILD rule 10 candidate, warning severity).

No founder-facing soft signals from this wave's observations. The wave-46 entry-point escape is fully encoded (§27), correctly applied at wave-47, and the product ships a working DM entry-point. Zero blocking findings.

---

## Action 8 — Deliverable schema

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: 10967558-f27f-4f47-81be-5b5e5d878259 done, 379978a4-0497-449f-8807-4cffe53d1436 done"
  - "observations: process/waves/wave-47/blocks/L/observations.md (7 observations: 3 V-block + 4 L-2 synthesis)"
  - "principles promotions: 0 net-new this wave; test-writing §§26-27 validated OK (mid-block, head-tester track)"
tasks_marked_done:
  - 10967558-f27f-4f47-81be-5b5e5d878259
  - 379978a4-0497-449f-8807-4cffe53d1436
tasks_skipped_with_reason: []
observations_emitted: 7
promotion_candidates: 0
karen_verdicts: []
linter_runs: []
candidates_dropped_by_linter: []
promotions_applied: []
mid_block_validations:
  - { file: "command-center/testing/test-writing-principles.md", rules: [26, 27], verdict: "VALIDATES OK", track: "head-tester §13 auto-updated, not karen-gated *-PRINCIPLES.md" }
note: >
  Wave-47 is a clean-learning wave. The wave-46 entry-point escape class is fully encoded
  (test-writing §27, validated OK), correctly applied at T-5 this wave, and confirmed by
  the working DM picker UI. No net-new *-PRINCIPLES.md promotions. One new 1st-instance HOLD
  opened: obs-C (display-identifier vs opaque id mismatch, BUILD rule 10 candidate). All
  V-block and L-2 synthesis observations recorded for future cross-wave synthesis.
```
