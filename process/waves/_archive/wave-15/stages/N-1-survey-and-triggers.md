# N-1 — Survey & triggers (wave-15)

Mode: `automatic`. STATUS: RUNNING. No pause/resume files present. No founder message since last tick. No measured pause trigger fired.

## Survey signals (Actions 1–4)

- **Action 1 — active milestone:** `6198650e-f4e0-44dc-9b0a-6550f01f9f82` — M3 — Real-time messaging — `in_progress`. Exactly one `in_progress` row (invariant holds).
- **Action 2 — todo queue head:** `eb2a1688-c6b5-416c-84b4-3ede41d07b4c` (M4 — Offline-first reliability). Queue is deep (M4..M13). Not consulted for promotion this wave — active slot is occupied.
- **Action 3 — active child summary (M3):** `open=8 done=13 seed_candidates=3`.
  - The 3 top-level `parent_task_id IS NULL`, `wave_id IS NULL`, `status='todo'` rows are: `46f16288` (create-server browser E2E coverage), `25523fb0` (real-PG mid-txn rollback test), `d058283d` (owner-gated invite-code rotation). All are carry-over tech-debt / test-infra — NOT unshipped-feature seeds.
- **Action 4 — unassigned queue depth:** `1` (the MCP-chromium task `67881a58`, `milestone_id` NULL).

## Trigger phase (Actions 6–10)

### Action 6 — Closure check: NONE
M3 `open_count=8 > 0`. M3 `## Scope` lists `thread replies (thread_parent_id)` and `file/image attachments (Railway Buckets ≤10MB)` as in-scope; both are NOT yet shipped, and `## Success metric` explicitly requires "threads and attachments working." LLM judgment: M3 scope NOT shipped. → **No `in_progress → done` transition.** Confirmed.

### Action 7 — Per-wave decomposition: FIRED → returned `validation-failed` (no-op, no DB writes)
Spawned `milestone-decomposer` (caller mode `next-bundle`) inline per the automatic-mode route, steering toward the next M3 feature slice (threads vs attachments).

The decomposer **refused** with `validation-failed`: ritual Step 1 condition 4 requires `seed_candidates = 0` for `next-bundle` mode, but the queue holds **3** top-level seed candidates. By `roadmap-lifecycle.md` § Bundles these ARE valid seed candidates regardless of feature-vs-debt content; the ritual counts rows and never reorders/re-parents existing rows. Authoring a new feature seed would be a no-op for wave selection.

**Delivery decision (head-next):** Accept the validation-failed as contractually correct. The pipeline is NOT stocked out — 3 claimable top-level bundles exist under M3. Do NOT re-fire, force a bundle, or hand-INSERT (that would be out-of-ritual INSERT / bundle manipulation — a discipline violation). The threads feature slice will be authored at a future N-1 once the top-level `todo` count under M3 drains to 0. No DB writes occurred this stage.

Note on prior precedent: wave-15's own N-1 (last wave) authored the @mentions bundle by treating tech-debt/V-2 carryover as "effective feature-seed count = 0." That worked because the decomposer accepted the fire that time and N-2 then exercised its re-order latitude to pick the new feature seed. This wave the decomposer refused on the gate, so no feature seed exists to prefer; N-2 picks the oldest existing seed instead. This is a healthy queue draining, not a stall.

### Action 8 — Slot promotion / stockout cascade: N/A
`active_milestone != null` → no promotion. `next_todo_id != null` (M4..M13 exist) → no stockout cascade.

### Action 9 — Daily-checkpoint: NOT FIRED
Action 9 requires "no seed candidate AND decomposition not fired/incomplete-scope." Here a seed candidate EXISTS (`seed_candidates=3`), so the first condition fails. Checkpoint does not fire.

### Action 10 — Routing
Decomposition routed to `milestone-decomposer` sub-agent per automatic-mode table; outcome `validation-failed` applied as no-op. No other rituals fired.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 6198650e-f4e0-44dc-9b0a-6550f01f9f82 (M3, in_progress)"
  - "todo queue head: eb2a1688-c6b5-416c-84b4-3ede41d07b4c (M4)"
  - "active child tasks: open=8 done=13 seed_candidates=3"
  - "unassigned queue depth: 1"
  - "closure: none (open=8, threads+attachments unshipped)"
  - "promotion: none (active slot occupied)"
  - "decomposition fired: true; returned validation-failed (seed_candidates=3, gate requires 0); no-op, no DB writes"
  - "rituals fired: [milestone-decomposition → validation-failed]"
prev_wave: 15
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
active_milestone_child_summary:
  open: 8
  done: 13
  seed_candidates: 3
next_todo_id: eb2a1688-c6b5-416c-84b4-3ede41d07b4c
unassigned_queue_depth: 1
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: null
decomposition_fired: true
proposals_fired:
  - {ritual: milestone-decomposition, target_milestone: 6198650e-f4e0-44dc-9b0a-6550f01f9f82, reason: decomposition-needed, decision: validation-failed-noop, by: milestone-decomposer, fired_at: 2026-06-30T11:00:00Z}
ritual_outcomes:
  - {ritual: milestone-decomposition, outcome_summary: "validation-failed — 3 seed candidates already in queue; gate requires 0; no DB writes; N-2 picks oldest existing seed", decision: noop, by: milestone-decomposer}
loop_state: ready
note: "Decomposition correctly refused on the row-count gate. Pipeline healthy (3 claimable seeds). Threads/attachments feature decomposition deferred to a future N-1 when M3 top-level todo count reaches 0."
```

---
head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Next-claimable computed from the live tasks table (seed_candidates=3, verified by
    direct query). Exactly one trigger evaluated to action — decomposition — which fired
    and correctly returned validation-failed on the seed_candidates=0 gate, leaving zero
    DB writes. Closure correctly withheld (open=8, M3 threads+attachments unshipped per
    Scope/Success-metric prose). No promotion (active slot occupied), no stockout (M4..M13
    in todo), no checkpoint (a seed candidate exists). The pipeline is not stalled — 3
    claimable top-level seeds remain; threads decomposition is deferred to a future N-1 by
    contract, not anticipatorily paused. No out-of-ritual INSERT, no bundle manipulation.
  next_action: PROCEED_TO_N-2
