# N-1 — Survey & triggers (wave-27)

head-next signoff: **APPROVED** (next_action: PROCEED_TO_N-2).

## Survey signals (Actions 1–4, verified via psql against `$CLAUDOMAT_DB_URL`)

- **Action 1 — active milestone:** `a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d` — M5 "Academic tooling: assignments", status `in_progress`. Exactly one `in_progress` row (no invariant violation).
- **Action 2 — `todo` milestone queue (by created_at):** M6 Voice/video study rooms (head) → M7 Privacy/notifications/launch → M8 Educator tools → M9 Monetization → M10 Compliance → M11 Growth: discovery → M12 Offline-first → M13 Institution partnerships. 8 rows. `next_todo_id = 8702a335` (M6).
- **Action 3 — M5 child-task summary:** `open=8`, `done=10`, `seed_candidates=2`.
- **Action 4 — unassigned queue depth:** 5.

M5 seed candidates (top-level `todo`, `wave_id`+`parent_task_id` NULL, by created_at):
1. `d058283d-a979-4528-9cd6-3ff48b4cfbc1` — "Rotate permanent server invite_code (owner-gated regenerate)" [OLDEST, 2026-06-29]
2. `d23a0740-0326-4748-a158-62e69ea733e7` — "Presence/members code-debt: displayName empty-fallback + unused ServerMembers wrapper schema" [2026-06-30]

## Trigger evaluation (Actions 6–10)

- **Action 6 — closure check:** `open=8 ≠ 0` → M5 does **NOT** close; stays `in_progress`. (M5's reminders-arc bet-headline remains Resend-key-blocked on founder — a record-only carry already in `process/session/updates/founder-digest-2026-07-01.md`; per CLAUDE.md rule 13 this is NOT a measured pause condition and is NOT re-escalated here.)
- **Action 7 — decomposition:** `seed_candidates=2 ≠ 0` → does **NOT** fire.
- **Action 8 — promotion/stockout:** `active != null` → no promotion, no stockout cascade.
- **Action 9 — daily-checkpoint:** seed candidates exist (Action 7 found candidates) → does **NOT** fire.
- **Action 10 — routing:** no ritual proposals fired → nothing to route. No BOARD, no ceo-agent. Clean N-1.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d (M5, in_progress)"
  - "todo queue head: 8702a335 (M6 — Voice/video study rooms)"
  - "active child tasks: open=8 done=10 seed_candidates=2"
  - "unassigned queue depth: 5"
  - "closure: none (open=8 ≠ 0; M5 stays in_progress)"
  - "promotion: none (active != null)"
  - "decomposition fired: false (seed_candidates=2)"
  - "rituals fired: []"
prev_wave: 27
active_milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
active_milestone_child_summary:
  open: 8
  done: 10
  seed_candidates: 2
next_todo_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
unassigned_queue_depth: 5
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: "Clean N-1. M5 stays in_progress (open=8). Reminders-arc Resend-key block is a record-only founder-pending carry (2026-07-01 digest), not a measured pause per rule 13 — not re-escalated."

head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Next-claimable computed from the live tasks table (Postgres queried this turn, no sidecar).
    Trigger ladder resolves cleanly to next-task: Action 6 close does not fire (open=8), Action 7
    decomposition does not fire (seed_candidates=2), Action 8 promotion/stockout does not fire
    (active non-null), Action 9 daily-checkpoint does not fire (candidates exist, claimable non-null).
    Exactly one outcome with condition cited; no pipeline-stall risk. Eight todo milestones exist so
    roadmap-planning correctly stays silent. Resend-key reminders-arc block is a record-only
    founder-pending carry, not a measured pause per rule 13, correctly not re-escalated.
  next_action: PROCEED_TO_N-2
```
