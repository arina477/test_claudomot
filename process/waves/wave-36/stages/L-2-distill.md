# Wave 36 — L-2 Distill

**Stage:** L-2 (Distill), run concurrently with L-1 (Docs).
**Owner:** head-learn (spawn-pattern, owns L-block).
**Mode:** automatic.

## Distill verdict

**PROMOTE ZERO.** Three observations emitted; none clears the strict promotion bar this
wave. This is the common, healthy outcome — restraint protects principles-file authority.

## Action 1 + 2 — Mark claimed tasks done, verify

`claimed_task_ids` = 622a7bf3 (privacy regression tests, seed), 73e96a9d (states-AC
docs re-scope), b7feab30 (stub-date fix). Batch UPDATE with status guard returned 3 rows;
verification SELECT confirms all 3 `done`.

```
622a7bf3-94ff-464b-ad14-b37bcedf290d | done
73e96a9d-bf8f-4999-8ea8-1446178955c7 | done
b7feab30-77cf-4814-b170-d1541e58c677 | done
```

No skipped/ineligible rows (RETURNING count 3 == set size 3).

## Action 3 — knowledge-synthesizer

Spawned `knowledge-synthesizer` (mandatory in-stage spawn) against the full wave-36 dir,
prior 5 waves' observations (+ wave-23/24/25 test-deferral lineage), and all four
principles files. Output: `process/waves/wave-36/blocks/L/observations.md`.

**3 observations emitted:**

| id | class | severity | candidate file | promotion_status |
|----|-------|----------|----------------|-----------------|
| obs-1 | Security-boundary authz/IDOR regression tests deferred to a follow-up wave; no committed test artifact in the shipping wave (ephemeral T-8 proof only) | warning | BUILD-PRINCIPLES | HOLD — 1st clean instance |
| obs-2 | CI-PRINCIPLES rule 5 (integration-tier executed-count) validated under exact skipIf false-green conditions; 0 recurrences | informational | none (rule 5 exists) | NOT A NEW CANDIDATE — reinforcement |
| obs-3 | Two-layer IDOR proof: service integration test insufficient without a controller session-scoping test for session-only-userId endpoints | warning | BUILD-PRINCIPLES / T-8 | HOLD — 1st instance |

## Action 4 — Filter to promotion candidates (head-learn gate)

Under the STRICT bar (new + recurring + costly-if-ignored + binary + enforceable), zero
observations qualify as promotion candidates:

- **obs-1** — genuinely generalizable, falsifiable, and well-cited, and the P-0
  problem-framer explicitly nominated it for BUILD-PRINCIPLES "if it recurs." But it is the
  **first clean L-2 instance** of its precise class ("security-boundary code ships test-less
  in wave N; a dedicated follow-up wave N+1 backfills durable tests"). The adjacent prior
  observations are DIFFERENT axes and do not confirm it: wave-23 obs-2 was an intra-wave
  deferral to the T-8 *stage* (already covered by BUILD rule 4); the wave-16/21/23/24
  under-floor-override chain is a milestone-*size* matter, not test-timing; wave-24 was a
  test-backfill wave but its boundaries shipped with *zero* proof (not ephemeral T-8) and
  its L-2 isolated the CI executed-count mechanism, not this class. Recurrence bar FAILS →
  HOLD, promote on a confirmed 2nd instance. (Also honors the framer's own "if it recurs.")
- **obs-3** — first instance of the controller-vs-service IDOR-layer class. Recurrence bar
  FAILS → HOLD.
- **obs-2** — not a new observation; reinforces existing CI rule 5. No candidate.

## Action 5 — karen vetting

**Skipped per stage Action 5** ("If 0 candidates, skip karen and Action 6 → Action 7").
No candidate crossed the filter to karen, so there is no promotion to code-vet or
contract-lint. (V-1 karen already independently verified this wave's code claims at the
V-block; the L-2 code-claim-vetting path only fires for a rule being promoted, of which
there are none.)

## Action 6 — Promote

**No promotion.** BUILD-PRINCIPLES stays at 8 rules; CI/PRODUCT/VERIFY unchanged. No
contradiction with any existing rule to resolve.

## Action 7 — Observation pipeline state

Observations recorded to `process/waves/wave-36/blocks/L/observations.md` for future
cross-wave synthesis. obs-1 is the notable soft signal — an entire wave was consumed to
backfill tests that should have been authored inline in wave-35 — flagged for next-wave
watch and for founder-checkpoint awareness, but below the promotion threshold until a 2nd
confirming instance. No linter runs (no candidate reached the lint step).

## Footer

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: 622a7bf3 done, 73e96a9d done, b7feab30 done (RETURNING 3 == set 3; SELECT confirms)"
  - "observations: process/waves/wave-36/blocks/L/observations.md (3 observations)"
  - "principles promotions: 0 across all files (BUILD-PRINCIPLES stays at 8 rules)"
tasks_marked_done: [622a7bf3-94ff-464b-ad14-b37bcedf290d, 73e96a9d-bf8f-4999-8ea8-1446178955c7, b7feab30-77cf-4814-b170-d1541e58c677]
tasks_skipped_with_reason: []
observations_emitted: 3
promotion_candidates: 0
karen_verdicts: []
linter_runs: []
candidates_dropped_by_linter: []
promotions_applied: []
distill_verdict: PROMOTE_ZERO
distill_rationale: >
  obs-1 (security-boundary tests deferred to a follow-up wave) and obs-3 (controller vs
  service IDOR-layer proof) are both first clean L-2 instances of their precise classes;
  the strict recurrence bar fails. Adjacent prior "deferral" observations sit on different
  axes (intra-wave T-8 deferral covered by BUILD rule 4; under-floor override-ship is a
  size matter) and do not confirm obs-1. obs-2 reinforces existing CI rule 5, not a new
  candidate. Zero promotions is correct restraint — no principles-file bloat, no
  hallucinated or duplicate rule. Both HOLDs are watchlisted for a 2nd confirming wave.
note: "Test-hardening wave. Promote-zero. Both new warnings held at 1st instance per strict bar."
head_signoff:
  verdict: APPROVED
  stage: L-2
  reviewers: {knowledge-synthesizer: emitted-3-observations, karen: not-invoked-zero-candidates}
  failed_checks: []
  rationale: >
    Every claimed task is done and verified. knowledge-synthesizer ran with full cross-wave
    input and produced blameless, artifact-cited, system-level observations with rigorous
    near-dup and recurrence analysis. The promotion gate resolves to ZERO under the strict
    bar: both warning-severity observations are first-instance and correctly HELD; the
    informational observation reinforces an existing rule. No promotion means no karen
    code-vet / linter step is due, no contract-format risk, no duplicate, no contradiction.
    All L-2 exit boxes tick.
  next_action: PROCEED_TO_N-1
```
