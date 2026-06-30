# N-1 — Survey & triggers (wave-17)

## Survey phase (Actions 0–5)

- **Action 0 — head-next:** spawned, owns N-block lifetime. ACK.
- **Action 1 — active milestone:** `6198650e-f4e0-44dc-9b0a-6550f01f9f82` (M3 — Real-time messaging, `in_progress`). Exactly one `in_progress` row — invariant holds.
- **Action 2 — todo queue head:** `eb2a1688` (M4 — Offline-first reliability). 10 todo milestones (M4–M13). Not promoted (active slot occupied).
- **Action 3 — active child-task summary:** `open=6 done=15 seed_candidates=5`. (6 open = 5 top-level tech-debt todos + 1 sibling `10b9d18e` under parent `d1c4693d`.)
- **Action 4 — unassigned queue depth:** 2.
- **Action 5 — reserved:** no-op.

## Trigger phase (Actions 6–10)

- **Action 6 — closure check:** M3 `open_count = 6 > 0` → closure precondition fails immediately. Independently, LLM-judged scope NOT shipped: `## Scope` lists **thread replies (`thread_parent_id`)** and **file/image attachments (Railway Buckets, ≤10MB)** as explicit items with ZERO done tasks (15 done cover messaging core, edit/delete, reactions, presence, typing, member-list, @mentions only). Success metric requires "threads, and attachments working." **NO CLOSE.** Fall through to Action 7.

- **Action 7 — per-wave decomposition:** `active_milestone` exists, `seed_candidates = 5` (NOT 0) — but all 5 are tech-debt; scope is NOT shipped (threads + attachments unbuilt). The ceo-reviewer BINDING ordering note (wave-17 P-0) bound a tech-debt-vs-feature ordering decision to this N-1 because the next ritual-default seed (`d058283d`, oldest) is tech-debt for a 3rd consecutive wave = DRIFT. **BOARD convened** (`automatic` mode, slug `N-1-ordering-wave-17`) BEFORE seed pick. Verdict: **7/7 APPROVE B (unanimous, clean Tier-3 6+/7 bar cleared)** — prioritize features, decompose **threads first**. Applied: spawned `milestone-decomposer` sub-agent (inline, per Action 10 `automatic` route) with BOARD override → authored threads bundle (seed `497c2ae6` + 2 siblings). 5 tech-debt seeds remain parked (`todo`, `wave_id NULL`, NOT cancelled).

- **Action 8 — promotion / stockout:** `active_milestone != null` → no promotion, no stockout. M4–M13 remain `todo`.

- **Action 9 — daily-checkpoint:** NOT fired. Decomposition fired this tick and produced a seed (threads bundle) — first daily-checkpoint precondition ("no seed candidate AND decomposition not fired / returned incomplete-scope") is false.

- **Action 10 — routing:** `automatic` mode. Roadmap-planning: not fired. Decomposition: spawned `milestone-decomposer` sub-agent inline (returned `decomposition-complete`). Daily-checkpoint: not fired. BOARD ordering decision: 7/7 APPROVE B applied (no founder escalation — clean unanimous, no hard-stops).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 6198650e-f4e0-44dc-9b0a-6550f01f9f82 (M3, in_progress)"
  - "todo queue head: eb2a1688 (M4)"
  - "active child tasks: open=6 done=15 seed_candidates=5"
  - "unassigned queue depth: 2"
  - "closure: none (open>0 AND threads+attachments unshipped)"
  - "promotion: none"
  - "decomposition fired: true (threads bundle — BOARD override)"
  - "rituals fired: [milestone-decomposition]"
  - "BOARD: N-1-ordering-wave-17 — 7/7 APPROVE B (unanimous), applied"
prev_wave: 17
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
active_milestone_child_summary:
  open: 6
  done: 15
  seed_candidates: 5
next_todo_id: eb2a1688-c6b5-416c-84b4-3ede41d07b4c
unassigned_queue_depth: 2
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
decomposition_fired: true
proposals_fired:
  - {ritual: milestone-decomposition, target_milestone: 6198650e-f4e0-44dc-9b0a-6550f01f9f82, reason: decomposition-needed-feature-first, decision: applied, by: milestone-decomposer, fired_at: "2026-06-30T12:56:37Z"}
ritual_outcomes:
  - {ritual: milestone-decomposition, outcome_summary: "threads bundle: seed 497c2ae6 + siblings 6c008dd6, 0b728319 (3 tasks, ~2800 LOC)", decision: decomposition-complete, by: milestone-decomposer}
board_decisions:
  - {slug: N-1-ordering-wave-17, tally: "7/7 APPROVE B", bar: "Tier-3 6+/7 (cleared)", verdict: "B — feature-first, threads-first", escalated: false, file: "process/waves/wave-17/escalations/board-N-1-ordering-wave-17.md"}
loop_state: ready
note: "ceo BINDING ordering note resolved by BOARD (7/7 B). Tech-debt seeds parked, not cancelled. Threads-first; attachments deferred to a later wave per BOARD."
```

## head_signoff (head-next)

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: { board: "N-1-ordering-wave-17 (7/7 APPROVE B)" }
  failed_checks: []
  rationale: >
    Next-claimable computed from live tasks table (not a sidecar). Exactly one trigger fired
    (decomposition) with its firing condition cited (active milestone, scope-not-shipped, ceo-bound
    ordering). Closure correctly withheld: M3 open=6>0 AND threads+attachments are unshipped Scope
    items. The tech-debt-vs-feature ordering — bound to this N-1 by the ceo-reviewer — was resolved
    by a properly convened 7-seat BOARD under automatic mode; unanimous 7/7 APPROVE B clears the
    strict Tier-3 6+/7 bar with no hard-stops and no founder escalation required. Decomposition was
    authored by the milestone-decomposer ritual (not hand-INSERTed); parked tech-debt left todo/wave_id-NULL.
  next_action: PROCEED_TO_N-2
```
