# N-1 — Survey & triggers (wave 1)

Combined survey (Actions 1–4) + trigger evaluation (Actions 6–10). Mode: `automatic`.
All signals read from canonical Postgres tables (`milestones` / `tasks` / `waves`), not a sidecar.

## Survey signals

| Signal | Value | Source |
|---|---|---|
| Active milestone (`in_progress`) | `5a6efc9e-9de7-4594-a75d-d45e30d9a417` — "M1 — Foundation: app shell, auth & profiles" | `SELECT … milestones WHERE status='in_progress'` (1 row; invariant OK) |
| `todo` milestone queue depth | 12 (M2–M13) | `count(*) … status='todo'` |
| Active child tasks: open | 5 | child summary query |
| Active child tasks: done | 1 (`cbf25dd5` — bootstrap monorepo + dark app shell + CI) | child summary query |
| Active child tasks: seed_candidates | 2 (`b9118041`, `9aae8255`) | child summary query |
| Unassigned queue depth | 0 | `count(*) … milestone_id IS NULL AND status='todo'` |
| Current running wave | `4616fa23-6e2b-423f-976f-e72341dcbf0a` (wave_number 1, status running) | `Wave — current` recipe |

## Trigger evaluation

### Action 6 — Active milestone closure check
**No closure.** `open_count = 5 ≠ 0`, so the precondition for closure does not hold. Independently, LLM scope
judgment confirms M1 is NOT shipped: `## Scope` enumerates monorepo bootstrap, Postgres+Drizzle, SuperTokens
auth (signup/login/verify/reset/refresh), user/profile module, dark app shell, CI, Resend. Only the foundation
scaffold (`cbf25dd5`, done) has shipped. `## Success metric` ("founder can sign up, verify email, set a profile,
load the dark app shell") is unmet — auth backend (`b9118041`) and auth/profile frontend (`9aae8255`) remain `todo`.
→ **M1 stays `in_progress`. No `milestones` write.**

### Action 7 — Per-wave decomposition trigger
**Not fired.** `seed_candidates = 2 ≥ 1`. A top-level `todo` task ready to become the next wave's seed already
exists under M1. Decomposition only fires when `seed_candidates = 0` AND scope unshipped. Condition not met.

### Action 8 — Slot promotion + stockout cascade
**Not applicable.** `active_milestone` is non-null (M1). No promotion of a `todo` milestone; no stockout cascade.

### Action 9 — Daily-checkpoint trigger evaluation
**Not fired.** Requires (a) no seed candidate found AND decomposition not fired, AND (b) `unassigned_queue_depth > 0`.
Here a seed candidate exists (so (a) fails) and `unassigned_queue_depth = 0` (so (b) fails). No checkpoint.

### Action 10 — Route proposals per active mode
No ritual proposals fired this tick → nothing to route.

## Net outcome
No state transitions. No rituals fired. M1 remains active with a viable seed for the next wave.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 5a6efc9e-9de7-4594-a75d-d45e30d9a417 (M1, in_progress)"
  - "todo queue head: M2 (12 todo milestones present)"
  - "active child tasks: open=5 done=1 seed_candidates=2"
  - "unassigned queue depth: 0"
  - "closure: none (open_count=5, scope unshipped)"
  - "promotion: none (active milestone non-null)"
  - "decomposition fired: false (seed_candidates=2)"
  - "rituals fired: []"
prev_wave: 1
active_milestone_id: 5a6efc9e-9de7-4594-a75d-d45e30d9a417
active_milestone_child_summary:
  open: 5
  done: 1
  seed_candidates: 2
next_todo_id: present  # 12 todo milestones M2–M13; not promoted (active slot occupied)
unassigned_queue_depth: 0
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 5a6efc9e-9de7-4594-a75d-d45e30d9a417
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: "M1 stays in_progress — only foundation scaffold shipped; auth + profiles scope remains. Seed b9118041 ready for wave-2."
```

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Next-claimable computed from live tasks/milestones (not a sidecar). Exactly the no-trigger
    path fires, each firing condition cited from concrete state: closure blocked by open_count=5
    + unshipped scope; decomposition blocked by seed_candidates=2; promotion N/A (active non-null);
    checkpoint blocked (seed exists AND unassigned_queue_depth=0). No invariant violation
    (single in_progress milestone). All four survey signals captured.
  next_action: PROCEED_TO_N-2
```
