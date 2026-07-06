# N-2 — Seed (wave-61)

Mode: `automatic`. Active milestone M8 (`84e17739`). N-1 disposition: GENUINE STOCKOUT → founder-checkpoint (loop_state: paused).

## Action 1 — Pick the seed

Raw seed predicate against M8:
```sql
SELECT id, title FROM tasks
WHERE milestone_id='84e17739-af5e-4396-beb9-b6f3d6836fc4'
  AND status='todo' AND wave_id IS NULL AND parent_task_id IS NULL
ORDER BY created_at LIMIT 1;
```
Raw result: **999a14d1** (getDmCandidates cursor/pagination — the sole row matching the predicate).

**LLM exclusion (per N-2 Action 1: "read prose, prefer whichever the milestone scope needs next"):** 999a14d1's description is an explicit do-not-auto-drain fence — "DEFER until a real large-server scaling wave lands WITH usage data — premature at zero users... Do NOT auto-drain at zero users." M8's substantive scope is shipped; this is a deliberate wave-56 deferral, not the next thing the milestone needs. It is **excluded** as a seed. No other M8 row matches the seed predicate.

→ **No eligible seed.** Jump to Action 4 (empty-queue path).

## Action 2 — Load siblings

N/A (no seed). Not run.

## Action 3 — Validate the bundle

N/A (no seed). Skipped — queue exhausted.

## Action 4 — Empty-queue path

No genuine seed candidate under M8. Upstream N-1 reason: **GENUINE STOCKOUT** —
- M8 drainable tail exhausted (only open task = 999a14d1, do-not-auto-drain).
- M8 substantive scope shipped (42 done); milestone stays `in_progress` (999a14d1 retained as deferral) — NOT closed.
- M9 (Monetization) + M12 (Offline-first) — the two value milestones — are FOUNDER-RESERVED and non-promotable by loop/BOARD.
- 13 unassigned-queue rows are all `milestone_id IS NULL` → NOT N-2-seedable (a seed requires `milestone_id=<active>`); they await a P-0-walk / founder-checkpoint assignment decision.
- `todo` milestones exist (M9–M13) → no roadmap-planning stockout.

Emit queue-exhausted. 999a14d1 is explicitly NOT seeded (do-not-drain honored). N-3 archives + closes the wave, then writes the measured pause (`STATUS: BLOCKED` + `.loop-paused.yaml`) so P-0 does not spin on nothing.

## Action 5 — Emit claimed_task_ids

`claimed_task_ids = []` (empty — no bundle).

## Deliverable

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: null (queue exhausted — 999a14d1 excluded as do-not-auto-drain)"
  - "bundled siblings: 0"
  - "validation: skipped (queue exhausted)"
seed_task_id: null
seed_task_title: ""
bundled_sibling_ids: []
claimed_task_ids: []
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
queue_exhausted: true
validation_failed: false
note: "GENUINE STOCKOUT. 999a14d1 raw-matched the seed predicate but is do-not-auto-drain (wave-56 deferral, premature at zero users) → excluded. No autonomous seed. 13 unassigned rows are milestone_id NULL → not N-2-seedable. Loop pauses for founder M9-vs-M12 direction call at N-3."
```

## head-next N-2 signoff

head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: { head-next: APPROVED }
  failed_checks: []
  rationale: >
    STOCKOUT disposition verified against live tasks table (not accepted from
    deliverable assertions). (a) NO out-of-ritual INSERT / no bundle authored —
    correct; nothing drainable to insert, tasks table unchanged. (b) 999a14d1
    correctly NOT promoted: live row confirms wave_id NULL + status='todo'
    (no flip, no wave assignment); its description carries the literal fence
    "Do NOT auto-drain at zero users" — a wave-56 deferral, not the next thing
    M8 needs; exclusion is read-only. (c) queue-exhausted is correct with a
    DB-grounded exhaustion reason: sole M8 seed-predicate match is the
    do-not-drain deferral (M8 = 42 done / 1 todo-deferral; substantive scope
    shipped), unassigned rows are all milestone_id IS NULL (not N-2-seedable),
    5 todo milestones exist (no roadmap-planning stockout). N-2-seedable set
    under M8 = {999a14d1} only, which is correctly excluded. Non-blocking
    inaccuracy noted: the "13 unassigned rows" figure is imprecise (17 total
    milestone_id IS NULL rows; 13 = the todo subset). Does not touch the
    disposition — the not-seedable claim holds under every count. Corrected
    inline below.
  failed_checks: []
  count_note: "unassigned milestone_id IS NULL = 17 total (13 todo); prior text said 13"
  next_action: PROCEED_TO_N-3
