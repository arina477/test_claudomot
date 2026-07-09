# L-2 — Distill (wave-85)

> Block L (Learn), stage L-2. Ran concurrent with L-1. Mode: `automatic`.
> Owner: head-learn. V-block exited APPROVE (karen + jenny + head-verifier).

## Action 1–2 — Mark claimed task done + verify

Single-spec wave; the only claimed task is the seed `3ad35a42-efe5-4e9d-8f90-d22d6fe345e8` (no siblings).

```sql
UPDATE tasks SET status='done'
WHERE id='3ad35a42-efe5-4e9d-8f90-d22d6fe345e8'
  AND status IN ('todo','in_progress','blocked')
RETURNING id;   -- UPDATE 1 (was in_progress)
```

Verify SELECT confirmed `status='done'`.

## Action 3 — knowledge-synthesizer

Spawned `knowledge-synthesizer` (verified in `command-center/AGENTS.md`) against `process/waves/wave-85/` + prior 5 waves' observations (wave-80..84) + all principles files. Output: `process/waves/wave-85/blocks/L/observations.md` — **4 observations**, all HOLD.

| id | title | severity | recurrence | candidate file |
|---|---|---|---|---|
| obs-1 | Optimistic-update revert must restore a CAPTURED prior snapshot, not assume the opposite value | warning | formal 1st L-obs (wave-80 F4 same mechanism but never elevated to an observation) | BUILD-PRINCIPLES.md |
| obs-2 | Failed async write needs a VISIBLE error for sighted users; sr-only announce serves AT only | warning | 1st instance | BUILD/DESIGN-PRINCIPLES.md |
| obs-3 | When a fix is value-equivalent to the bug on the simple path, assert the surfaces the fix ADDS, not the equivalent value | informational | 1st instance | T-2.md |
| obs-4 | Dismiss-timer useEffect callback dep must be useCallback-stable to prevent timer re-arming | informational | 1st instance | BUILD-PRINCIPLES.md |

## Action 4 — Filter to promotion candidates

All three gates (generalizable / falsifiable / cited) are met by obs-1..obs-4, but the **2+-wave recurrence bar** is the promotion gate and is the honest discriminator here:

- **obs-2, obs-3, obs-4** — explicitly FIRST INSTANCE. Stay as observations.
- **obs-1** — the synthesizer identified wave-80 B-6 finding F4 as the same mechanism/fix. Verified: wave-80's L-block observations never recorded this as a standalone observation (grep confirms F4 appears only in a passing review-artifacts line, no promotion disposition). It is therefore a **first formal L-block observation**, not a confirmed 2-wave recurrence. The pattern was independently caught at the B-6 review gate in both waves — the gate is doing its job. Judged HONESTLY, this does not clear the 2+-wave-observation bar, and strong-1st discretion is not warranted for a review-gate-catchable pattern.

**Promotion candidates: 0.**

## Action 5–6 — karen vetting + linter — SKIPPED

0 candidates cleared the bar → no karen spawn, no candidate file, no linter run, no promotion. Per Action 5: "If 0 candidates, skip karen and Action 6 → Action 7."

## Action 7 — Observation pipeline state

4 observations recorded in `process/waves/wave-85/blocks/L/observations.md` for future cross-wave synthesis. obs-1 is the strongest standing-HOLD carry-forward: if the assume-opposite-revert pattern recurs as a wave topic again, it clears the bar and should promote to BUILD-PRINCIPLES.md (pre-shaped 2-line form is drafted in the observation for the next distill to reuse). Soft signal only; no founder escalation.

## Footer

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: 3ad35a42-efe5-4e9d-8f90-d22d6fe345e8 done (was in_progress; UPDATE 1, verify SELECT confirms)"
  - "observations: process/waves/wave-85/blocks/L/observations.md (4 observations)"
  - "principles promotions: 0 (no candidate cleared the 2+-wave recurrence bar)"
tasks_marked_done: [3ad35a42-efe5-4e9d-8f90-d22d6fe345e8]
tasks_skipped_with_reason: []
observations_emitted: 4
promotion_candidates: 0
karen_verdicts: []
linter_runs: []
candidates_dropped_by_linter: []
promotions_applied: []
note: "0 promotions — most waves promote 0. obs-1 (snapshot-restore) is the strongest carry-forward HOLD; wave-80 F4 was a B-6 incidental catch never elevated to an L-observation, so the formal 2+-wave bar is unmet. Mode: automatic."
```
