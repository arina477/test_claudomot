# N-1 — Survey & triggers (wave-70)

Block: N (Next). Mode: `automatic`. All signals read from canonical Postgres (`$CLAUDOMAT_DB_URL`) this turn — no sidecar / bash-var hand-off.

## Survey signals (Actions 1–4)

- **Action 1 — active milestone:** `6a9424fe-c943-4b26-9110-6915661a6fb9` (M14 — "Trust & Safety: moderation for public discovery"), `status='in_progress'`. Exactly one `in_progress` row — invariant OK.
- **Action 2 — todo queue:** 3 `todo` milestones. `next_todo_id` not consumed this tick (active slot occupied).
- **Action 3 — M14 child summary:** `open_count=2`, `done_count=7`, `seed_candidates=2`.
  - Seed candidates (oldest first, all `status=todo` / `wave_id IS NULL` / `parent_task_id IS NULL`):
    1. `1193aebf-0b83-4cb2-bec8-0caa98339241` — "Reflect blocked state on the member-row Block affordance (Block↔Unblock toggle)" (V-2 FINDING-1, MEDIUM UX). 0 children.
    2. `1c633d2f-4cb7-4cd1-b589-b735e23228a2` — "Enrich GET /blocks with the blocked user's display name + avatar" (V-2 FINDING-2, MEDIUM).
- **Action 4 — unassigned queue depth:** 17.

## Milestone disposition (M14)

All 4 mvp-critical `## Scope` legs of M14 are SHIPPED and proven live: (1) report substrate; (2) owner/mod report-action loop + directory-level unlist; (3) user-to-user Block (block + DM HIDE bidirectional, proven live at T-8 this wave); (4) public-directory content-moderation gate (report→action→resolution + block provably reachable, proven live).

The 2 open tasks are UI-POLISH follow-ons (a state-reflecting affordance + a display-name/avatar enrichment), NOT new mvp-critical scope. Mechanically M14 CANNOT auto-close: `open_count=2 ≠ 0` and N-1 Action 6 gates the `in_progress → done` transition on `open_count = 0`. M14 stays `in_progress`.

**Disposition decision: DEFAULT (a).** Seed the polish now (N-2 picks `1193aebf`); wave-71 P-1 RESCOPE-AUTO-MERGE bundles both polish tasks; M14 closes after they ship — finishing M14's own polish before the founder public-launch GO. NOT escalated to BOARD: the choice (finish 2 small in-scope polish tasks vs close early with polish deferred) is a delivery-sequencing call inside the milestone, lighter than a BOARD convening merits, and no measured condition forces escalation. head-next confirmed this disposition (APPROVED, N-1).

## Trigger evaluation (Actions 6–10)

- **Action 6 — closure:** `open_count=2 ≠ 0` → NO closure. M14 stays `in_progress`. (Correctly blocks the premature-close anti-pattern.)
- **Action 7 — decomposition:** `seed_candidates=2 > 0` → does NOT fire. No out-of-ritual INSERT.
- **Action 8 — promotion / stockout:** `active_milestone ≠ null` → 8a no promotion; 3 `todo` milestones → 8b no stockout, no roadmap-planning.
- **Action 9 — daily-checkpoint:** precondition "no seed candidate" not met (`seed_candidates=2`) → does NOT fire.
- **Action 10 — routing:** no ritual fired → nothing to route.

Net: the sole live path is "seed the existing next bundle" → N-2 picks oldest seed `1193aebf`. Pipeline-stall anti-pattern absent (queue non-empty). head-next gate: APPROVED.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 6a9424fe-c943-4b26-9110-6915661a6fb9 (M14, in_progress)"
  - "todo queue head: 3 todo milestones present (slot occupied; not consumed)"
  - "active child tasks: open=2 done=7 seed_candidates=2"
  - "unassigned queue depth: 17"
  - "closure: none (open_count=2 != 0)"
  - "promotion: none (active slot occupied)"
  - "decomposition fired: false (seed_candidates=2 > 0)"
  - "rituals fired: []"
prev_wave: 70
active_milestone_id: 6a9424fe-c943-4b26-9110-6915661a6fb9
active_milestone_child_summary:
  open: 2
  done: 7
  seed_candidates: 2
next_todo_id: null   # 3 todo milestones exist but slot is occupied; not consumed this tick
unassigned_queue_depth: 17
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 6a9424fe-c943-4b26-9110-6915661a6fb9
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: >
  M14 mvp-critical scope shipped (4/4 legs proven live incl. user-to-user Block at T-8).
  2 open tasks are UI-polish follow-ons; M14 stays in_progress (open_count=2). DEFAULT
  disposition (a): seed polish; wave-71 P-1 RESCOPE-AUTO-MERGE bundles both; M14 closes
  after they ship. No ritual fired. head-next APPROVED N-1/N-2/N-3.

head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    All survey signals computed from live Postgres this turn (re-verified byte-identical by
    head-next). Trigger ladder walked correctly, exactly one path live (seed next bundle):
    closure declined (open=2!=0), decomposition not fired (seed_candidates=2>0), no
    promotion/stockout (active!=null, 3 todo), no checkpoint (seed exists). DEFAULT
    milestone disposition consistent with Action 6 fall-through; correctly not escalated.
    No preemptive-pause, pipeline-stall, premature-close, or out-of-ritual-INSERT anti-pattern.
  next_action: PROCEED_TO_N-2
```
