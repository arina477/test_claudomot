# N-1 — Survey & triggers (wave-35)

Head: head-next (owns N-block, spawn-pattern). Mode: automatic.

## Survey (Actions 1–4) — read from live Postgres

- **Action 1 — active milestone:** M7 `6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007` "Privacy controls, notifications & launch polish" — `in_progress`. Exactly one `in_progress` row (invariant holds).
- **Action 2 — todo queue:** 6 rows — M8 Educator tools, M9 Monetization, M10 Compliance & data rights, M11 Growth: server discovery, M12 Offline-first moat, M13 Institution partnerships. `next_todo_id` (informational; M7 still active) = M8 `84e17739`.
- **Action 3 — M7 child-task summary:** `open_count=5`, `done_count=4`, `seed_candidates=4`.
  - done (4, this wave's slice): 56a50862, a4169fac, d40ece71, 13b7ebfd.
  - open (5): 622a7bf3 (privacy-endpoint tests), 73e96a9d (states-AC re-scope), b7feab30 (Last-updated date fix), a1299e88 (Resend domain — credential-blocked), 84e09891 (Railway bucket — credential-blocked).
  - seed_candidates (4 = parent NULL + wave NULL + todo): 622a7bf3, 73e96a9d, b7feab30, a1299e88.
- **Action 4 — unassigned queue depth:** 12.

## Triggers (Actions 6–10)

- **Action 6 — closure check:** `open_count=5 > 0` → **NOT closed**. M7 stays `in_progress`. (M7 core scope — notifications polish, final deploy-verification/canary wiring — also not yet shipped; independent of the open-count gate.)
- **Action 7 — per-wave decomposition:** `seed_candidates=4 > 0` → strict fire-condition (seed_candidates=0) NOT met. Judgment applied per brief: the 3 buildable follow-ups (622a7bf3 substantive + 73e96a9d/b7feab30 tiny) form a viable, coherent next wave. **Decision: milestone-decomposer NOT spawned** — pick existing candidates (default when viable; avoids bundle bloat / premature scope authoring). `decomposition_fired: false`.
- **Action 8 — promotion / stockout:** `active_milestone != null` → no promotion. `todo` queue non-empty (M8–M13) → no stockout, no roadmap-planning.
- **Action 9 — daily-checkpoint:** first condition (no seed candidate) is false (seed_candidates=4) → **not fired**, despite unassigned_queue_depth=12.
- **Action 10 — routing:** no ritual proposals fired; nothing to route.

Credential-blocked seed candidate a1299e88 (Resend domain) and the parked Railway-bucket task 84e09891 are founder-credential-blocked ops actions — excluded from seeding (unblock only on founder keys).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007 (M7, in_progress)"
  - "todo queue head: 84e17739 (M8)"
  - "active child tasks: open=5 done=4 seed_candidates=4"
  - "unassigned queue depth: 12"
  - "closure: none (open_count=5>0)"
  - "promotion: none (M7 active)"
  - "decomposition fired: false (seed_candidates=4>0; buildable follow-ups viable)"
  - "rituals fired: []"
prev_wave: 35
active_milestone_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
active_milestone_child_summary:
  open: 5
  done: 4
  seed_candidates: 4
next_todo_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
unassigned_queue_depth: 12
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: "M7 stays in_progress — 5 open tasks (3 buildable follow-ups + 2 credential-blocked). Existing seed candidates chosen over fresh decomposition."
```
