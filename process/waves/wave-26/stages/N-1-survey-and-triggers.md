# N-1 — Survey & triggers (wave-26 → wave-27 seed)

**Block:** N (Next), stage N-1. **Mode:** `automatic`. **Owner:** head-next (spawn-pattern).
**Prev wave:** 26 (SHIPPED LIVE — presence dots on message-row author avatars, incl. T-5-caught self-presence fix).

## Survey phase (Actions 1–4) — read from live Postgres

| Signal | Value | Source query |
|---|---|---|
| Active milestone (Action 1) | `a5232e16` — **M5 — Academic tooling: assignments** (`in_progress`) | `SELECT ... WHERE status='in_progress'` → exactly 1 row (invariant OK) |
| `todo` queue head (Action 2) | `8702a335` — **M6 — Voice/video study rooms** (queue depth 8: M6–M13) | `SELECT ... WHERE status='todo' ORDER BY created_at` |
| M5 child summary (Action 3) | **open=9, done=8, seed_candidates=3** | `count(*) FILTER (...)` on `tasks WHERE milestone_id=$M5` |
| Unassigned queue depth (Action 4) | **6** | `count(*) WHERE status='todo' AND milestone_id IS NULL` |
| Current running wave | `14908bd1` / wave_number **26** / `status=running` / milestone=M5 | `Wave — current` anchor |

**M5 seed candidates (top-level `todo`, `wave_id IS NULL`, `parent_task_id IS NULL`):**
- `d058283d` — Rotate permanent server invite_code (owner-gated regenerate). Embedded TRIGGER: *"before first real external users / any pre-launch link distribution."*
- `6a546c7b` — Presence perf: `getCoMemberUserIds` full-membership scan per connect (server-side; wave-14 V-2 M-1/KI-1; test-covered).
- `d23a0740` — Presence/members code-debt: displayName empty-fallback + `ServerMembersResponseSchema` wrapper/wire mismatch (cleanup; latent, no live mismatch today).

## Trigger phase (Actions 6–10)

### Action 6 — Closure check
`active_milestone` exists AND `open_count = 9 ≠ 0` → **NO closure.** M5 stays `in_progress`. No premature-close (anti-pattern avoided). No promotion.
Record-only: M5's headline scope (assignment due-date **reminder** arc via NotificationsModule + Resend) remains **cred-blocked on the founder's Resend API key** — the sole M5-close blocker, already escalated. This is a record-only carry, NOT a measured pause trigger; the workable M5 backlog (presence perf / invite rotation / cleanup) is unblocked and progresses.

### Action 7 — Per-wave decomposition trigger
`seed_candidates = 3 > 0` → **decomposition NOT fired.** A viable seed already exists in M5's queue. milestone-decomposer NOT spawned.

### Action 8 — Slot promotion + stockout cascade
`active_milestone != null` → no promotion. `todo` queue non-empty (M6–M13) → **no stockout cascade;** roadmap-planning NOT fired.

### Action 9 — Daily-checkpoint trigger
Next-claimable is NOT null (3 seed candidates available) AND decomposition condition not met → **daily-checkpoint NOT fired.** (Fires only when next-claimable is null AND unassigned queue non-empty.)

### Action 10 — Route proposals per mode
No ritual proposals fired this tick → nothing to route.

## Net
No rituals fired. M5 remains the active milestone with a viable seed. Loop continues (no measured pause trigger: STATUS=RUNNING unchanged, no hard-stop verdict, no founder message, no `.loop-paused.yaml`).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: a5232e16 (M5 — Academic tooling: assignments), in_progress"
  - "todo queue head: 8702a335 (M6 — Voice/video study rooms); depth 8 (M6–M13)"
  - "active child tasks: open=9 done=8 seed_candidates=3"
  - "unassigned queue depth: 6"
  - "closure: none (open=9 ≠ 0)"
  - "promotion: none (active slot occupied)"
  - "decomposition fired: false (seed_candidates=3 > 0)"
  - "rituals fired: []"
prev_wave: 26
active_milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
active_milestone_child_summary:
  open: 9
  done: 8
  seed_candidates: 3
next_todo_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
unassigned_queue_depth: 6
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: >
  M5 headline (assignment due-date reminder arc, Resend-dependent) is cred-blocked on the
  founder's Resend API key — sole M5-close blocker, already escalated; record-only carry, NOT a
  measured pause trigger. Workable M5 backlog (presence perf / invite rotation / cleanup) is
  unblocked. Seed selection handled at N-2.

head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Next-claimable computed from live Postgres (not a sidecar). Exactly the null-set of triggers
    fired, each with its firing condition cited: closure gated by open=9≠0, decomposition gated by
    seed_candidates=3>0, promotion gated by an occupied active slot, stockout gated by a non-empty
    todo queue (M6–M13), daily-checkpoint gated by a non-null next-claimable. No premature milestone
    close, no anticipatory pause, no out-of-ritual writes. All N-1 exit checkboxes tick.
  next_action: PROCEED_TO_N-2
```
