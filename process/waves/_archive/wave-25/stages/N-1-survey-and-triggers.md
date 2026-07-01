# N-1 — Survey & triggers (wave-25)

Owner: head-next (spawn-pattern, N-block). Mode: `automatic`. Canonical state read live from Postgres (`milestones` / `tasks`) via SCHEMA.md recipes — no sidecar.

## Survey phase (Actions 1–4)

**Action 1 — active milestone**
```
a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d | M5 — Academic tooling: assignments | in_progress
```
Exactly one `in_progress` row — no invariant violation.

**Action 2 — todo queue**
8 `todo` milestones exist (M6..M13). Queue non-empty → no stockout. `next_todo_id` not needed (active slot occupied).

**Action 3 — active child-task summary** (`WHERE milestone_id = a5232e16…`)
```
open_count=9 | done_count=7 | seed_candidates=4
```

**Action 4 — unassigned queue depth**
```
5
```

## Trigger phase (Actions 6–10)

**Action 6 — Closure check:** `open_count=9 ≠ 0` → M5 has work in flight/pending. Closure condition (all child tasks terminal) NOT met → M5 stays `in_progress`. No `in_progress → done` transition.

Note (record-only): M5's `## Scope` is the assignments module (organizer posts assignment, members mark done, due-date reminders via Resend). That arc is cred-blocked on the founder's Resend API key (M5-disposition already escalated — the sole M5-close blocker). The workable M5 backlog is the presence/invite debt inherited from M3 / wave-9 / wave-14, which is what the 4 seed candidates represent.

**Action 7 — Per-wave decomposition:** `seed_candidates=4 > 0` → a seed candidate already exists. Decomposition NOT needed; milestone-decomposer NOT fired.

**Action 8 — Slot promotion + stockout:** `active_milestone` is non-null (M5 not closed) → promotion skipped. `todo` queue non-empty (8 rows) → stockout cascade NOT fired; roadmap-planning NOT fired.

**Action 9 — Daily-checkpoint:** requires `seed_candidates=0`. Here `seed_candidates=4 > 0` → checkpoint NOT fired.

**Action 10 — Routing:** no ritual proposals fired this tick → nothing to route.

## Verdict

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d (M5 — Academic tooling: assignments, in_progress)"
  - "todo queue head: non-empty (8 todo milestones M6..M13; active slot occupied so promotion N/A)"
  - "active child tasks: open=9 done=7 seed_candidates=4"
  - "unassigned queue depth: 5"
  - "closure: none (open_count=9 ≠ 0)"
  - "promotion: none (active slot occupied by M5)"
  - "decomposition fired: false (seed_candidates=4 > 0)"
  - "rituals fired: []"
prev_wave: 25
active_milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
active_milestone_child_summary:
  open: 9
  done: 7
  seed_candidates: 4
next_todo_id: null   # active slot occupied; promotion not evaluated this tick
unassigned_queue_depth: 5
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: "Clean survey — no rituals fired. M5 stays in_progress (open_count=9). Assignments arc is Resend-key cred-blocked (escalated, sole M5-close blocker); workable M5 backlog = 4 presence/invite debt seed candidates. N-2 selects from these."

head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    All survey signals (Actions 1–4) captured live from Postgres and cross-verified: one in_progress
    milestone (no invariant violation), open=9/done=7/seed_candidates=4 under M5, unassigned depth=5,
    8 todo milestones (no stockout). Trigger ladder walked top-to-bottom: closure NOT met (open≠0),
    decomposition NOT needed (seed_candidates>0), promotion N/A (slot occupied), stockout NOT fired
    (todo queue non-empty), daily-checkpoint NOT fired (seed_candidates>0). No pipeline stall — a
    workable seed exists for N-2. Every N-1 exit checkbox ticks from concrete state.
  next_action: PROCEED_TO_N-2
```
