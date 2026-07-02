# N-1 — Survey & triggers (wave-36)

Mode: `automatic`. head-next owns the N-block (this deliverable). No pause/resume file present; STATUS RUNNING; no founder message; no hard-stop verdict — no preemptive-pause condition.

## Survey signals (Actions 1–4)

- **Active milestone (Action 1):** M7 — Privacy controls, notifications & launch polish (`6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007`), `in_progress`. Exactly one `in_progress` row — invariant holds.
- **todo queue (Action 2):** M8–M13 present (6 rows). `next_todo_id` irrelevant this tick (active slot occupied by M7).
- **M7 child summary (Action 3, pre-remediation):** open=2, done=7, **seed_candidates=1**. The lone seed_candidate was `a1299e88` (Verify a Resend domain), a founder-DNS ops action — structurally a claimable seed but NOT autonomously buildable.
- **Unassigned queue depth (Action 4):** 12.
- **Current running wave:** 36 (milestone_id=M7).

## Trigger phase (Actions 6–10)

### Action 6 — Closure check → NO CLOSE
M7 has `open_count=2` (≠0) → mechanical closure gate not satisfied. M7 stays `in_progress`. (Both open rows are parked founder-ops — see remediation.) Genuine unshipped `## Scope` remains: "notifications module polish". No premature close.

### Action 7 — Per-wave decomposition → FIRED
The lone SQL seed_candidate (`a1299e88`) is founder-DNS-blocked, not buildable. Genuinely-buildable, credential-independent unshipped scope exists (in-app notifications surface — backend `NotificationsModule` exists but no persistent notification feed / web surface; mentions are built). Fired `milestone-decomposition` (reason `decomposition-needed`) against M7, inline (automatic mode, Action 10).

**Roadmap-hygiene remediation (N-1 owns `tasks.status`):** the decomposer's first fire correctly returned `validation-failed` — it refuses to author a second claimable seed while a seed candidate exists, and `a1299e88` (+ its cred-blocked cousin `84e09891` Railway bucket) were mislabeled `status='todo'` when their true state is `blocked` (waiting on a human/founder per SCHEMA). N-1 reclassified both `todo → blocked`. This dropped `seed_candidates` to 0 and unblocked authoring. Neither is M7's success-metric headline; both remain open-but-blocked founder-ops (surface when founder does the DNS / bucket work).

Decomposer re-fired → `decomposition-complete`. One bundle INSERTed (commit `98a9f45`):
- seed `0b33df33-fafb-4572-ba32-6a6450cf63a6` — Add persistent in-app notifications model + read/list API
- sibling `f3f52d9a-984a-44a4-9a82-293e90be93b7` — Add mark-notification-read endpoints (single + all)
- sibling `edac03e0-be3c-4b89-b3c7-e9d367ec275b` — Build web notifications center + unread indicator

### Action 8 — Slot promotion / stockout → N/A
Active slot occupied (M7 stays). No promotion, no stockout cascade (M8–M13 in `todo` anyway).

### Action 9 — Daily-checkpoint → NOT FIRED
Decomposition was fired this tick and produced a buildable seed → the checkpoint precondition ("no seed candidate AND decomposition not fired") is not met.

### Action 10 — Routing
Decomposition → milestone-decomposer sub-agent, inline (automatic-mode table). Applied.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007 (M7, in_progress)"
  - "todo queue head: M8..M13 present (slot occupied; no promotion)"
  - "active child tasks (pre-remediation): open=2 done=7 seed_candidates=1 (lone candidate founder-DNS-blocked)"
  - "active child tasks (post-decomp): open=5 done=7 seed_candidates=1 (buildable seed 0b33df33)"
  - "unassigned queue depth: 12"
  - "closure: none (open_count!=0; unshipped notifications scope remains)"
  - "promotion: none (slot occupied)"
  - "decomposition fired: true (bundle 0b33df33 + 2 siblings; commit 98a9f45)"
  - "hygiene: a1299e88 + 84e09891 reclassified todo->blocked (true state; founder-ops)"
  - "rituals fired: [milestone-decomposition]"
prev_wave: 36
active_milestone_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
active_milestone_child_summary:
  open: 5
  done: 7
  seed_candidates: 1
next_todo_id: null
unassigned_queue_depth: 12
state_transitions_applied:
  - {milestone: null, from: null, to: null, recorded_in_decisions_log: false}
task_status_corrections:
  - {task: a1299e88, from: todo, to: blocked, reason: "founder-DNS ops (Resend domain) — waiting on human; not autonomously buildable"}
  - {task: 84e09891, from: todo, to: blocked, reason: "founder AWS/Tigris creds (Railway bucket) — waiting on human; not autonomously buildable"}
slot_promotion:
  promoted_id: null
  prior_active_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
decomposition_fired: true
proposals_fired:
  - {ritual: milestone-decomposition, target_milestone: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007, reason: decomposition-needed, decision: authored, by: milestone-decomposer, fired_at: 2026-07-02}
ritual_outcomes:
  - {ritual: milestone-decomposition, outcome_summary: "1 bundle authored — seed 0b33df33 (notifications model + read/list API) + siblings f3f52d9a (mark-read endpoints), edac03e0 (web notifications center); commit 98a9f45; product-decisions appended", decision: complete, by: milestone-decomposer}
loop_state: ready
note: "M7 is NOT a park-or-key situation — it was promoted (wave-34) specifically as credential-independent, and a genuinely-buildable credential-independent scope item (in-app notifications) remains. The 2 parked founder-ops tasks (Resend domain, Railway bucket) are correctly blocked, not the milestone headline. Pipeline continues on real buildable work; no founder fork raised."

head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: "Next-claimable computed from the live tasks table. Exactly one trigger fired (milestone-decomposition, condition: buildable seed_candidate=0 after correcting a mislabeled founder-blocked seed, unshipped credential-independent scope remains). M7 not closed (open_count!=0, unshipped notifications scope). No roadmap-planning (M8-M13 in todo). No daily-checkpoint (decomposition produced a seed). The parked founder-ops tasks were reclassified to their true 'blocked' state — roadmap hygiene, not seeding cred-blocked work. Bundle authored by the decomposer ritual, not hand-INSERTed."
  next_action: PROCEED_TO_N-2
```
