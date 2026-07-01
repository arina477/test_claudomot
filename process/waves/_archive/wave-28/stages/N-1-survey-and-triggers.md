# N-1 — Survey & triggers (wave-28)

Mode: `automatic`. head-next gate: **APPROVED** (agentId a6467c4a5561f5e97).

## Survey signals (Actions 1–4 — verified against live Postgres this tick)

| Signal | Value | Source |
|---|---|---|
| Running wave | `02c97a51-5998-427b-aa2d-97d6ca12f885` (wave_number 28, status=running) | `waves` WHERE status='running' |
| Active milestone (Action 1) | M5 `a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d` "Academic tooling: assignments", in_progress | `milestones` WHERE status='in_progress' (exactly one row — no invariant violation) |
| todo queue head (Action 2) | M6 `8702a335` (voice/video), then M7..M13 | `milestones` WHERE status='todo' ORDER BY created_at |
| M5 child summary (Action 3) | open=7, done=11, seed_candidates=1 | `tasks` WHERE milestone_id=M5 |
| M5 seed candidate | `d23a0740-0326-4748-a158-62e69ea733e7` (presence/members code-debt), created 2026-06-30 | top-level todo, wave_id NULL, parent_task_id NULL |
| Unassigned queue depth (Action 4) | 5 | `tasks` WHERE status='todo' AND milestone_id IS NULL |

## Trigger evaluation (Actions 6–10)

- **Action 6 — closure check:** open_count=7 ≠ 0 → M5 does NOT close, stays `in_progress`. No `in_progress → done` transition. (M5-close blocker = reminders arc, Resend-key founder-pending. The M5 park-or-key fork is a **record-only** founder-pending carry, already in the 2026-07-01 founder digest — NOT a measured pause condition per CLAUDE.md rule 13; not re-escalated.)
- **Action 7 — per-wave decomposition:** seed_candidates=1 ≠ 0 → does NOT fire. Queue already has a seed for N-2.
- **Action 8 — slot promotion / stockout:** active_milestone ≠ null → no promotion; todo queue non-empty (M6..M13) → no stockout cascade.
- **Action 9 — daily-checkpoint:** seed candidate exists (Action 7 did not fire) → does NOT fire.
- **Action 10 — routing:** no rituals fired → no BOARD / ceo-agent routing. Clean N-1.

## Effective outcome

Single firing path: **seed the existing M5 bundle** (next-task). No state transitions applied, no rituals fired, no invariant violations.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d (M5, in_progress)"
  - "todo queue head: 8702a335-90ec-40ff-8c7d-a91bb7790a27 (M6)"
  - "active child tasks: open=7 done=11 seed_candidates=1"
  - "unassigned queue depth: 5"
  - "closure: none (open=7≠0 → M5 stays in_progress)"
  - "promotion: none (active≠null)"
  - "decomposition fired: false (seed_candidates=1)"
  - "rituals fired: []"
prev_wave: 28
active_milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
active_milestone_child_summary:
  open: 7
  done: 11
  seed_candidates: 1
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
note: "M5 park-or-key fork = record-only founder-pending carry (2026-07-01 digest); not a pause trigger per rule 13."
```
