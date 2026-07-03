# N-1 — Survey & triggers (wave-38)

Milestone state survey + trigger evaluation for the close of wave-38 (avatar + attachment storage go-live under M7). All signals read live from Postgres (`milestones` / `tasks` / `waves`), not a sidecar.

## Survey signals (Actions 1–4)

- **Action 1 — Active milestone:** exactly ONE `in_progress` row → `M7` (`6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007`, "Privacy controls, notifications & launch polish"). No invariant violation.
- **Action 2 — `todo` queue:** M8–M13 all present (`84e17739` M8 Educator tools … `b7400254` M13). `next_todo_id = 84e17739` (M8, highest-tier next) — not consulted this tick (no promotion needed; slot occupied).
- **Action 3 — M7 child summary:** `open_count=3`, `done_count=11`, `seed_candidates=2`.
  - `a1299e88` — "Verify a Resend domain for transactional email" — `status='blocked'` (founder-gated: needs founder-owned domain + DNS; non-terminal, NOT buildable).
  - `c208e91e` — "Wire the profile-settings entry so avatar upload is reachable in the UI" — `todo`, `wave_id NULL`, `parent NULL` (seed candidate; F1 fix from this wave's T-5).
  - `7525b759` — "Harden avatar endpoints against malformed/edge input (two 500s → 4xx)" — `todo`, `wave_id NULL`, `parent NULL` (seed candidate; LOW hardening).
- **Action 4 — Unassigned queue depth:** 12.

## Trigger evaluation (Actions 6–10)

- **Action 6 — Closure check:** `open_count=3 ≠ 0` → M7 does **NOT** close. Stays `in_progress`. The blocked Resend row (`a1299e88`) is non-terminal (Invariant #3); MVP-buildable scope is largely shipped but M7 headline still has open founder-gated + buildable work. **No milestone transition.**
- **Action 7 — Per-wave decomposition:** `seed_candidates=2 ≠ 0` → real seedable work exists → decomposition does **NOT** fire.
- **Action 8 — Slot promotion / stockout:** `active_milestone` still non-null (M7) → no promotion. `todo` queue non-empty (M8–M13) → no stockout, no roadmap-planning.
- **Action 9 — Daily-checkpoint:** a seed candidate exists → **not** triggered. (Note for a future tick: `a1299e88` Resend-domain remains founder-blocked; if it becomes the *only* remaining M7 work after `c208e91e`/`7525b759` ship, it will surface at a checkpoint / disposition fork.)
- **Action 10 — Routing:** no ritual proposals fired → nothing to route. Mode is `automatic`; no BOARD / ceo-agent needed.

## Outcome

Clean survey tick — no transitions, no rituals. The N-block advances to N-2 to seed the next wave from M7's existing candidates.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007 (M7, in_progress)"
  - "todo queue head: 84e17739-af5e-4396-beb9-b6f3d6836fc4 (M8)"
  - "active child tasks: open=3 done=11 seed_candidates=2"
  - "unassigned queue depth: 12"
  - "closure: none (open_count=3 → M7 stays in_progress; blocked row a1299e88 non-terminal)"
  - "promotion: none (slot occupied by M7)"
  - "decomposition fired: false (seed_candidates=2)"
  - "rituals fired: []"
prev_wave: 38
active_milestone_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
active_milestone_child_summary:
  open: 3
  done: 11
  seed_candidates: 2
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
note: "a1299e88 (Resend domain) remains founder-blocked; will surface at a future checkpoint/disposition fork if it becomes M7's only remaining work."

head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Next-claimable computed from the live tasks table (seed_candidates=2 confirmed by
    direct query). Exactly one trigger outcome selected — the null-trigger / next-task
    path — with cited conditions: closure blocked by open_count=3, decomposition blocked
    by seed_candidates=2, stockout blocked by M8-M13 present, checkpoint blocked by an
    existing seed candidate. No preemptive pause: M7 holds legitimate buildable work and
    STATUS is RUNNING under automatic mode.
  next_action: PROCEED_TO_N-2
```
