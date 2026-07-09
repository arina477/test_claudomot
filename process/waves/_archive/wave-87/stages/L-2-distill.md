# L-2 — Distill (wave-87)

**Block:** L (Learn). Stage L-1 ∥ **L-2**. Owner: head-learn (sub-agent). Mode: automatic.

## Action 1–2 — Mark claimed task done + verify

Claimed task this wave: `dc4abee3` (single spec; the only `claimed_task_id`). Already `status='done'` in the `tasks` table (verified this wave — no re-run needed). No bundle siblings. No skipped-with-reason rows.

## Action 3 — knowledge-synthesizer

Ran → `process/waves/wave-87/blocks/L/observations.md`. **3 observations** emitted (obs-1, obs-2 promotion-relevant; obs-3 informational). Input: wave-87 deliverables + prior 5 waves' archived observations (82–86) + principles files for de-dup. Within the ≤6 bound; no pruning.

## Action 4 — Filter to promotion candidates

Screened all 3 observations against the promotion bar (generalizable + falsifiable + cited + recurring/costly-if-ignored + NOT-already-covered), with the ≤1-per-file default-zero discipline.

### obs-1 — real-timer `waitFor` per-test timeout > asyncUtilTimeout invariant + guarded fake-timer teardown

- **Verdict: HOLD (no promotion).**
- Recurrence: verified FIRST INSTANCE. The synthesizer's recurrence check and the observations' de-dup section confirm no prior L-obs across waves 82–86 names the vitest per-test-timeout-vs-asyncUtilTimeout race or the real-timer teardown-guard class; waves 82/86 dealt with async settle at the app-logic layer, distinct from the test-harness timeout-budget layer. No existing `test-layer-principles/T-1.md` (0 rules) or BUILD rule covers it.
- Bar: clean + falsifiable, but a single occurrence of a test-harness timeout race does not clear the default-zero bar on its own merit. Per the observations header, a first instance HOLDs pending a 2nd confirming wave. Promotes on the next occurrence.

### obs-2 — re-verify a prior finding's security/robustness framing against current code before it becomes the wave target

- **Verdict: NO (no promotion).** Two independent disqualifiers:
- **(a) Not a clean single class.** The synthesizer logged the three instances (84/86/87) as *distinct narrow sub-classes*: 84 = BOARD prevented a harmful *option*; 86 = verify a security-config *value* against SDK source; 87 = a finding's framing *evaporated* (literal ask is a no-op). Adjacent, but not one falsifiable class — the "single recurring class" test fails.
- **(b) Already covered.** PRODUCT-PRINCIPLES **Rule 1** ("Verify every seed claim about what exists or is absent in the code at P-0; decomposer prose drifts both ways. / Why: A false-absent premise rebuilds existing work; a false-present one skips a needed addition.") already governs obs-2's mechanism. Wave-87's finding is precisely a false-present problem-premise (NULL role_id claimed to be an "RBAC gap" that did not exist) caught by P-0 verification against current code. The obs-2 wording is a narrower restatement of Rule 1 with "security framing" substituted for "seed claim." Promoting it would dilute Rule 1's authority (duplicate-promotion anti-pattern).
- Stays in `observations.md` for future synthesis; no candidate emitted.

### obs-3 — real-Postgres integration test lands via CI-provisioned follow-up PR

- **Verdict: NO (informational only, per synthesizer).** One-off / environmental workaround, not a falsifiable rule. The relevant principle ("don't mock the DB in integration tests") already exists as BUILD rule 4 / the T-1 GOOD example. No promotion.

## Action 5–6 — karen vetting + lint + promote

**0 promotion candidates → karen NOT spawned, linter NOT run, no candidate file written, no principles append, no promotion commit.** Per L-2 Action 5 ("If 0 candidates, skip karen and Action 6 → Action 7").

## Action 7 — Observation pipeline state

All 3 observations recorded in `process/waves/wave-87/blocks/L/observations.md` (append-only; read cross-wave by future L-2). obs-1 pre-shaped for promotion on a 2nd occurrence. No founder-checkpoint soft-signal flagged.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: dc4abee3 done (verified this wave; only claimed_task_id)"
  - "observations: process/waves/wave-87/blocks/L/observations.md (3 observations)"
  - "principles promotions: 0"
tasks_marked_done: [dc4abee3]
tasks_skipped_with_reason: []
observations_emitted: 3
promotion_candidates: 0
karen_verdicts: []
linter_runs: []
candidates_dropped_by_linter: []
promotions_applied: []
note: >
  Honest zero promotions. obs-1 HOLD (first instance of the vitest real-timer timeout-budget
  race; promotes on 2nd occurrence). obs-2 NO (not a clean single class across 84/86/87 AND
  already covered by PRODUCT-PRINCIPLES Rule 1 — promotion would be a duplicate). obs-3
  informational (covered by BUILD rule 4). No karen spawn / no linter run (0 candidates).
head_signoff:
  verdict: APPROVED
  stage: L-2
  reviewers: {karen: not-invoked-0-candidates}
  failed_checks: []
  rationale: >
    Zero promotions is the correct, common outcome. obs-1 is a clean falsifiable first instance
    that correctly HOLDs under the default-zero bar. obs-2 fails on two independent grounds —
    it is not one falsifiable class across the three cited waves, and its mechanism is already
    covered by PRODUCT-PRINCIPLES Rule 1, so promoting it would dilute existing canon. obs-3 is
    informational and already covered by BUILD rule 4. The claimed task is done in the DB; all
    observations are recorded for future synthesis. No promotion left pending; clean handoff to N.
  next_action: PROCEED_TO_N-block
```
