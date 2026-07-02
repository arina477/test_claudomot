# L-2 — Distill (wave-35)

**Block:** L (Learn), stage L-2 (∥ L-1). Wave-35 = M7 privacy controls, shipped LIVE, V-block APPROVED.
**Head:** head-learn (owns L-block + ≤1-promotion-per-file gate).
**Mode:** automatic.

## Action 1-2 — Mark claimed tasks done + verify

`UPDATE tasks SET status='done' WHERE id = ANY(...) AND status IN ('todo','in_progress','blocked')` returned **4 rows**; verification `SELECT` confirms all 4 now `done`:

| task | title | status |
|------|-------|--------|
| 56a50862 | settings-privacy: profile visibility + who-can-DM | done |
| a4169fac | account data view + data download | done |
| d40ece71 | Sentry error tracking across api + web | done |
| 13b7ebfd | privacy/terms stubs + empty/error/loading states | done |

Full bundle (seed + 3 siblings) closed. No skipped / non-eligible rows.

## Action 3 — knowledge-synthesizer → observations

Spawned knowledge-synthesizer against wave-35 artifacts + prior wave-{31,32,33,34} observations + principles files. Output: `process/waves/wave-35/blocks/L/observations.md` — **4 observations** (2 strong, 1 warning, 1 informational). Blameless, system-level, artifact-cited.

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Identical-behavior privacy options = privacy-theater; honest selector collapses them | strong | 1st instance | PRODUCT-PRINCIPLES | HOLD |
| obs-2 | Spec `data:` contract diverges from P-3 architecture decision; P-4 REWORK | warning | 1st instance | PRODUCT-PRINCIPLES | HOLD |
| obs-3 | Sentry v10 OTel instrument-first ordering + decorator + VITE_ prefix | informational | 1st instance | none (SDK-doc) | SDK-doc only |
| obs-4 | Non-git Railway deploy: served-bundle content assertion required | strong | 2nd instance (w34+w35) | CI-PRINCIPLES | **PROMOTE** |

## Action 4 — Filter to promotion candidates

Applied the strict bar (generalizable ∧ falsifiable ∧ cited ∧ recurs 2+ waves ∧ costly-if-ignored):

- **obs-1** (honest privacy control) — NOVEL this wave (1st instance). Genuine + strong, but single-wave. Restraint: observation-only, NOT promoted. Held for a 2nd confirming wave.
- **obs-2** (spec↔plan data-model contradiction) — NOVEL this wave (1st instance). H-P-05 already fires it at P-4. Held; not promoted.
- **obs-3** (Sentry v10 ordering) — SDK gotcha, captured in the Sentry SDK-doc (L-1 Action 3), not a generalizable principle. Not a candidate.
- **obs-4** (Railway served-bundle content assertion) — **2nd-instance confirmed** (wave-34 discovered the false-green near-miss; wave-35 applied the content assertion at C-2, 3 markers 1/1/1 live). Meets all bars. **Single promotion candidate.**

**1 promotion candidate → CI-PRINCIPLES.md.** Zero candidates to any other file (lesson-inflation avoided).

## Action 5 — karen vetting

Spawned karen against the obs-4 candidate + CI-PRINCIPLES "Contract for new rules". Verdict **APPROVE, verbatim**:
- Recurrence real — confirmed wave-35 C-2 Check 4 performed a served-bundle CONTENT assertion (not just deployment-state SUCCESS): fetched `/assets/index-B_iPgjvp.js`, grepped 3 wave-unique markers, all 1/1.
- Code-claim true — C-2 confirms Railway services here are non-git-connected; digest-diff-only gate would be a false-green.
- Not a dup — distinct from rule 1 (deploy-state endpoint) and rule 2 (new-route 404-flip). A route probe passes on a stale web bundle; only the content assertion catches it. Slot 7 open.
- Format PASS — rule line 116 chars, Why line 97 chars, both under limits; 2 lines; no forbidden tokens.
- Binary/falsifiable + costly — an automated C-2 gate can PASS/FAIL it; ignoring it ships unreachable code behind green CI.

## Action 6 — Lint + promote

Candidate written to `process/waves/wave-35/blocks/L/candidates/CI-PRINCIPLES.md`. Deterministic linter: **`linter:OK`** (rule ≤120, Why ≤100, no forbidden tokens, exactly 2 non-empty lines). Appended as **CI-PRINCIPLES.md rule 7**:

```
7. For a non-git-connected Railway service, assert a change-unique marker appears in the served bundle after deploy.
   Why: A redeploy rebuilds the same source to a new digest, so digest-diff passes on stale code.
```

Committed with the candidate file as audit trail: `docs(principles): L-2 promote rule 7 to CI-PRINCIPLES from wave-35`.

## Action 7 — Observation pipeline state

4 observations recorded. 3 remain HOLD in `observations.md` for future cross-wave synthesis (obs-1/obs-2 → PRODUCT-PRINCIPLES rule 4 candidates on 2nd confirmation; obs-3 → SDK-doc closed). No soft founder-checkpoint flags this wave.

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: 56a50862 done, a4169fac done, d40ece71 done, 13b7ebfd done (RETURNING 4 rows; SELECT verify all done)"
  - "observations: process/waves/wave-35/blocks/L/observations.md (4 observations)"
  - "principles promotions: 1 across CI-PRINCIPLES.md (rule 7)"
tasks_marked_done: [56a50862, a4169fac, d40ece71, 13b7ebfd]
tasks_skipped_with_reason: []
observations_emitted: 4
promotion_candidates: 1
karen_verdicts: [{candidate_id: obs-4, target_file: "command-center/principles/CI-PRINCIPLES.md", verdict: APPROVE}]
linter_runs: [{candidate_id: obs-4, target_file: "command-center/principles/CI-PRINCIPLES.md", attempt: 1, verdict: OK, rejection_code: ""}]
candidates_dropped_by_linter: []
promotions_applied: [{file: "command-center/principles/CI-PRINCIPLES.md", line: 150, rule: "For a non-git-connected Railway service, assert a change-unique marker appears in the served bundle after deploy."}]
note: "obs-1/obs-2 novel this wave → held (no lesson-inflation). obs-3 SDK-doc only. obs-4 2nd-wave confirmed → promoted."

head_signoff:
  verdict: APPROVED
  stage: L-2
  reviewers: { knowledge-synthesizer: "4 observations emitted", karen: "obs-4 candidate APPROVE" }
  failed_checks: []
  rationale: >
    One rule promoted, and it earns it: obs-4 recurs across wave-34 (discovered) and wave-35
    (applied), is costly-if-ignored (a false-green ships unreachable code behind green CI),
    binary/falsifiable (grep a change-unique marker in the served bytes = PASS/FAIL), distinct
    from existing CI rules 1-2 (karen-confirmed non-dup), and passed both karen and the
    deterministic linter in the exact Contract format. The three novel observations
    (honest-privacy-control, spec↔plan data-model contradiction, Sentry v10 ordering) are
    real but single-wave or SDK-scoped, so they stay as observations — restraint over
    inflation. All 4 claimed tasks closed in the DB and verified. No contradiction with any
    existing rule. No promotion left pending.
  next_action: PROCEED_TO_L-block-exit
```
