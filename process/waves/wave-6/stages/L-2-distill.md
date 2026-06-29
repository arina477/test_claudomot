# L-2 — Distill (wave-6 CI boot-probe)

> Block L (Learn), stage L-1 ∥ L-2. head-learn owns the block (spawn-pattern).
> Wave-6: pre-merge compiled-artifact boot-probe CI job. PR #16 merged 75e7d9d. CI-only, V-APPROVED.

## Action 1+2 — Mark claimed task done + verify

```sql
UPDATE tasks SET status='done'
WHERE id='da242f6b-bce7-49c7-a7cc-69ca4849fc6e' AND status IN ('todo','in_progress','blocked')
RETURNING id;   -- → da242f6b (done); UPDATE 1
```

Verify: `SELECT id,status FROM tasks WHERE id='da242f6b…'` → `done`. Confirmed. Single-task bundle (no siblings); RETURNING count = set size, no stale ids.

## Action 3 — knowledge-synthesizer

Spawned `knowledge-synthesizer` over `process/waves/wave-6/` + prior `_archive/wave-{1,3,4,5}/blocks/L/observations.md` + CI/BUILD principles files. Output: `process/waves/wave-6/blocks/L/observations.md` — **4 observations** (under the 6 cap; no pruning needed).

| obs | severity | candidate file | candidate-grade? |
|---|---|---|---|
| obs-1 boot-probe closes 4-wave compiled-dist boot-crash recurrence | informational | none | no (closure, not new pattern) |
| obs-2 CI-PRINCIPLES dedup analysis (boot-probe fulfills BUILD rule 1) | informational | none | no (dedup resolution) |
| obs-3 enforce_admins=false persists (3-wave carry) | warning | CI-PRINCIPLES | YES |
| obs-4 e2e detection-latency gap (deployed-URL, not in-run artifact) | warning | CI-PRINCIPLES | no (held; needs observed failure) |

## Action 4 — Filter to promotion candidates

- **Boot-probe → CI rule (obs-1/obs-2): NOT a candidate.** Generalizable + cited, but it duplicates BUILD-PRINCIPLES rule 1 ("Boot the production-built artifact in a prod-like container and exercise its runtime config before merge"). The boot-probe shipping FULFILLS that rule; in this repo CI is the only pre-merge gate, so a CI rule names the same enforcement point. No karen spawn — does not clear the dedup bar. Promoting would be duplicate-promotion + lesson-inflation.
- **obs-3 (enforce_admins): candidate-grade.** Three-wave carry (wave-3 obs-5 → wave-5 obs-3 → wave-6 persistence), generalizable, falsifiable, cited; per-file cap slot open. Routed to karen.
- **obs-4 (e2e detection-latency): held.** Structural identification across 2 waves, but promotion condition is an OBSERVED post-deploy failure that passed all required checks — has not occurred. Not a candidate this wave.

## Action 5 — karen vetting (obs-3 only)

Candidate written to `blocks/L/candidates/CI-PRINCIPLES.md`:

```
1. Set enforce_admins=true on the main branch-protection rule so required CI checks apply to every actor.
   Why: With enforce_admins=false an admin or bot can push to main and bypass the required checks.
```

**karen verdict: HARD-REJECT.**
- Infra claim VERIFIED REAL against live `gh api repos/arina477/test_claudomot/branches/main/protection`: `enforce_admins.enabled=false`, required contexts `[lint,typecheck,test,build,secret-scan,boot-probe]`, `required_approving_review_count: 0`, `strict: true`. The candidate's premise (false → admin/bot can bypass required checks) is true; not hallucinated.
- Format/contract: PASSES (2 lines, within char limits, no forbidden tokens, falsifiable) — but moot.
- **Substance kill:** "Set enforce_admins=true" directly contradicts the project's deliberate, B-6-gate-recorded `enforce_admins=false` posture (preserved for the `gh pr merge --auto` bot-merge path). Promoting a principle the live config violates on day one is a contradiction-left-standing failure. Not a deferral — a third recurrence would still contradict the recorded decision. A cosmetic rewrite cannot clear it; only a differently-scoped rule ("an intentionally-granted admin/bot bypass must not be used to merge red") with its own provenance could ever be promotable, and that provenance does not exist yet.

## Action 6 — Lint + promote

**Not run.** karen REJECTED the sole candidate; no candidate reaches the linter. Drop recorded in observations.md under the obs-3 originating observation (reason: karen-REJECT — contradiction with deliberate live enforce_admins=false posture). No principles file edited.

## Action 7 — Observation pipeline state

4 observations emitted to `process/waves/wave-6/blocks/L/observations.md` (durable for cross-wave synthesis). Standing carries for future L-2:
- obs-3 (enforce_admins): only promotable if founder/BOARD moves the bot path to `enforce_admins=true` via `bypass_actors`, OR if a differently-scoped "don't merge red even when bypass-capable" rule earns its own provenance.
- obs-4 (e2e detection-latency): promotable on an observed post-deploy user-flow failure that passed all required checks.

## Action 8 — Deliverable footer

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: da242f6b-bce7-49c7-a7cc-69ca4849fc6e done (UPDATE 1; verified)"
  - "observations: process/waves/wave-6/blocks/L/observations.md (4 observations)"
  - "principles promotions: 0 across [] (boot-probe rule = dedup of BUILD rule 1; enforce_admins = karen HARD-REJECT)"
tasks_marked_done: [da242f6b-bce7-49c7-a7cc-69ca4849fc6e]
tasks_skipped_with_reason: []
observations_emitted: 4
promotion_candidates: 1
karen_verdicts:
  - {candidate_id: obs-3-enforce-admins, target_file: command-center/principles/CI-PRINCIPLES.md, verdict: REJECT}
linter_runs: []
candidates_dropped_by_linter: []
candidates_dropped_by_karen:
  - {candidate_id: obs-3-enforce-admins, target_file: command-center/principles/CI-PRINCIPLES.md, final_reason: "karen HARD-REJECT — contradicts deliberate live enforce_admins=false posture (bot-merge path); contradiction-left-standing risk"}
promotions_applied: []
note: "PROMOTE ZERO — disciplined, correct outcome. Boot-probe rule duplicates BUILD rule 1 (didn't reach karen). enforce_admins candidate karen-rejected on substance. No principles file edited; no bloat, no duplicate, no contradiction."
```

## head_signoff (L-2 / L-block-exit gate)

```yaml
head_signoff:
  verdict: APPROVED
  stage: L-2
  reviewers: {knowledge-synthesizer: emitted-4-obs, karen: REJECT-obs-3}
  failed_checks: []
  rationale: >
    Every L-2 stage-exit check ticks. Claimed task da242f6b marked done and verified. The candidate
    rules were dedup-screened against existing *-PRINCIPLES.md BEFORE proposing: the headline boot-probe
    CI rule was rejected at the dedup screen (it duplicates BUILD rule 1, which the boot-probe fulfills
    rather than supersedes) and never reached karen; the enforce_admins candidate cleared the
    candidate-grade bar (3-wave carry, falsifiable, cited) and was routed to karen, who verified its
    code-claim against the LIVE repo and HARD-REJECTED it as a contradiction with the project's deliberate
    enforce_admins=false posture. Net promotions = 0, which is the common and correct outcome; zero rules
    were left pending, and no new↔existing contradiction was introduced (the contradiction risk was the
    reason for rejection, not a result of promotion). Retro is blameless and at the system level throughout.
    L-block principles delta handed to N-block clean.
  next_action: PROCEED_TO_N-1
```
