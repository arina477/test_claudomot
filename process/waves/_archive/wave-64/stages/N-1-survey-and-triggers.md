# N-1 — Survey & triggers (wave-64)

Mode: `automatic`. STATUS: RUNNING. No rule-13 pause trigger fired.

## Survey phase (Actions 1–4)

**Action 1 — active milestone:** exactly one `in_progress` row.
- `36378340-0ea5-428e-bc94-03750fb103f6` — M12 — Offline-first moat. Invariant holds (count=1).

**Action 2 — todo queue (by created_at):**
- `3e507bc0…` M9 — Monetization: freemium tiers
- `97d65b49…` M10 — Compliance & data rights
- `8d88e691…` M11 — Growth: server discovery
- `b7400254…` M13 — Institution partnerships & portable identity
- `next_todo_id`: N/A — active slot is occupied by M12; no promotion needed this wave.

**Action 3 — M12 child-task summary (post-block; see Action 7):**
- open=2, done=8, seed_candidates=1.

**Action 4 — unassigned queue depth:** 14 (`status='todo' AND milestone_id IS NULL`).

## Trigger phase (Actions 6–10)

**Action 6 — closure check = NO.** `open_count=2` (≠0). M12 scope NOT shipped: the M12 success metric spans offline messages (shipped) + offline academic content (shipped wave-63) + previously-loaded media (shipped wave-64) + **conflict-resolution UI (NOT built, named in the metric)** + the assignment-media leg (now blocked). Multiple `## Scope` items lack done tasks → milestone remains `in_progress`. No `in_progress→done` transition.

**Seed-quality intervention (pre-Action 7):** M12 entered N-1 with 2 seed_candidates. One — `10e7543f` "Serve assignment attachment media from offline cache when disconnected" — was DESCOPED at wave-64 P-0 REFRAME (problem-framer): there is NO online assignment-attachment-open surface in the product (AssignmentCard renders only a paperclip count + filename chips, no byte-render path), so it is a false-present premise for an offline-read-cache slice. It is blocked on a prerequisite feature that does not yet exist. Seeding it would produce an un-buildable wave. **Action taken:** `UPDATE tasks SET status='blocked'` with a description note recording the prerequisite (online assignment-attachment view must land first) and the un-block path. This removes it as a stale seed_candidate without losing the work — it stays counted in M12's open scope and is recoverable from the DB.

**Action 7 — decomposition = NOT fired.** After the block, `seed_candidates=1` (`db3ade72`). A viable seed exists → per Action 7 (`seed_candidates=0` is the fire condition), decomposition does NOT fire. N-2 will pick `db3ade72`.

**Action 8 — promotion / stockout = N/A.** Active milestone present (M12); no slot to promote into. Todo queue non-empty (4 milestones) — no stockout cascade.

**Action 9 — daily-checkpoint = NOT fired.** A seed candidate exists (fire condition #1 "no seed candidate" is false). No checkpoint.

**Action 10 — routing:** no ritual proposals fired this tick. Nothing to route.

## Seed decision (for N-2)

Next seed = **`db3ade72-6504-4700-93b1-9d99b4098f38`** — "Offline hydration for the message list (unlock previously-viewed media on cold offline open)". V-1-jenny non-blocking follow-up from wave-64. Actionable now; directly advances the M12 offline moat by wiring the channel/message-list read path to the Dexie messages cache so wave-64's attachment cache is reachable on a cold offline open; reuses the proven read-through pattern (DM/assignments/schedule). Smallest viable, highest-value next step. Zero siblings → single-task bundle.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 36378340-0ea5-428e-bc94-03750fb103f6 (M12, in_progress)"
  - "todo queue head: none needed (M12 active); 4 todo milestones present"
  - "active child tasks: open=2 done=8 seed_candidates=1 (post-block)"
  - "unassigned queue depth: 14"
  - "closure: none (open_count=2, scope not shipped — conflict-resolution UI + assignment-media leg unshipped)"
  - "promotion: none (active slot occupied)"
  - "decomposition fired: false (seed_candidates=1 after block)"
  - "rituals fired: []"
  - "seed-quality action: 10e7543f todo→blocked (descoped, blocked on nonexistent online assignment-attachment view)"
prev_wave: 64
active_milestone_id: 36378340-0ea5-428e-bc94-03750fb103f6
active_milestone_child_summary:
  open: 2
  done: 8
  seed_candidates: 1
next_todo_id: null
unassigned_queue_depth: 14
state_transitions_applied:
  - {task: 10e7543f-431f-44ac-8af0-3c0882ca9885, from: todo, to: blocked, note: "descoped seed candidate — blocked on nonexistent online assignment-attachment-open surface"}
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: "M12 stays in_progress; db3ade72 is the seed for wave-65."

head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Next-claimable computed from the live tasks table (not a sidecar). Exactly one
    trigger decision made — no ritual fires, because a viable seed candidate exists
    after correctly re-classifying the descoped 10e7543f to blocked (it is gated on a
    nonexistent online render surface; seeding it would produce an un-buildable wave —
    a pipeline-stall / bundle-bloat avoidance). Invariant (one in_progress milestone)
    holds. Closure correctly withheld: M12 scope unshipped (conflict-resolution UI +
    assignment-media leg). No preemptive pause — no measured rule-13 trigger fired.
  next_action: PROCEED_TO_N-2
```
