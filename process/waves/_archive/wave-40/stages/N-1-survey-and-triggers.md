# N-1 — Survey & triggers (wave-40)

Survey read live from Postgres (`founder_bets` / `milestones` / `tasks` / `waves`) — no sidecar.

## Survey signals (Actions 1–4)

- **Active milestone (Action 1):** `6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007` — "M7 — Privacy controls, notifications & launch polish" (`in_progress`). Exactly one `in_progress` row; no invariant violation. M7 is the LAST H1 / MVP-completing milestone.
- **`todo` queue (Action 2):** M8 Educator tools (`84e17739`), M9 Monetization (`3e507bc0`), M10 Compliance (`97d65b49`), M11 Growth (`8d88e691`), M12 Offline-first (`36378340`), M13 Institution partnerships (`b7400254`). `next_todo_id` = M8 `84e17739` (highest-tier H2). NOT null — no stockout.
- **Active child-task summary (Action 3):** `open_count=1`, `done_count=13`, `seed_candidates=0`.
- **The one open M7 task:** `a1299e88-e92e-4879-ae62-6e724fb53979` — "Verify a Resend domain for transactional email", `status='blocked'`, `wave_id IS NULL`. Founder-credential-gated (needs a founder-owned domain + DNS records; brain cannot self-generate per always-on rule 6).
- **Unassigned queue depth (Action 4):** 13 `todo` tasks with `milestone_id IS NULL` — post-MVP debt/polish (test-infra `67881a58`, lint `4e994e96`, API robustness `4a92327c`, flake-stabilization `6832e3ea`, assignments follow-ups). NOT MVP-critical.

## Trigger phase (Actions 6–10)

- **Action 6 — Closure check: NO close.** `open_count=1` (not 0) — M7 has a real open row. Even setting that aside, `a1299e88` is `blocked` (non-terminal); closing M7 would violate the milestone-close invariant (all child tasks must be terminal + scope shipped). M7 stays `in_progress`.
- **Action 7 — Per-wave decomposition: DO NOT FIRE.** `seed_candidates=0` but M7's ONLY unshipped scope is the founder-blocked Resend task `a1299e88`. The buildable MVP scope is fully SHIPPED (privacy controls w35, notifications w37, avatar storage w38, avatar UI reachability w39, avatar hardening w40). Decomposition cannot author buildable work here — it would return `incomplete-scope`. Firing it would be an empty/hallucinated-bundle anti-pattern.
- **Action 8 — Slot promotion: NOT APPLICABLE.** M7 did not close, so `active_milestone != null`; no promotion. Auto-promoting M8 (horizon-jump H1→H2 across the MVP line) is a founder-reserved strategic call — and was already REJECTED 7/7 by the wave-37 BOARD (Option B). Not fired.
- **Action 9 — Daily-checkpoint: superseded by the milestone-disposition pause.** The unassigned queue is 13-deep but is M-agnostic post-MVP debt sitting under a blocked-headline MVP milestone; auto-draining it is the wave-37-flagged "debt-drain-while-blocked" anti-pattern. The strategic fork (finish MVP vs pivot to post-MVP) is the founder's call — surfaced via the N-3 pause, not a checkpoint.
- **Action 10 — Routing (mode=`automatic`):** This is the IDENTICAL milestone-disposition fork the wave-37 N-block already routed to the 7-seat BOARD (slug `N-1-m7-disposition-wave-37`), which voted **UNANIMOUS 7/7 APPROVE Option A: HOLD M7 `in_progress` + surface the founder-credential fork + PAUSE** (product-decisions 2026-07-02). Since wave-37 the founder chose Path A and the avatar/storage credential half was delivered + is live (w38/w39/w40); only the Resend-domain credential remains. Applied as standing PRECEDENT — no fresh 7-member BOARD convened for the identical fork (same do-not-re-litigate discipline as the floor-merges). No new milestone state transition; M7 HELD.

## Verdict

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007 (M7, in_progress)"
  - "todo queue head: 84e17739 (M8, H2)"
  - "active child tasks: open=1 done=13 seed_candidates=0"
  - "unassigned queue depth: 13"
  - "closure: none (open_count=1; a1299e88 blocked/non-terminal)"
  - "promotion: none (M7 held; M8 auto-promote = BOARD-7/7-rejected Option B)"
  - "decomposition fired: false (only unshipped M7 scope is founder-blocked a1299e88 → incomplete-scope)"
  - "rituals fired: [] (milestone-disposition resolved by wave-37 BOARD precedent)"
prev_wave: 40
active_milestone_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
active_milestone_child_summary:
  open: 1
  done: 13
  seed_candidates: 0
next_todo_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
unassigned_queue_depth: 13
state_transitions_applied: []
decomposition_fired: false
proposals_fired: []
ritual_outcomes:
  - {ritual: milestone-disposition, outcome_summary: "M7 HELD in_progress; founder-credential fork surfaced; loop paused", decision: "APPROVE Option A (precedent-application, wave-37 BOARD 7/7)", by: "head-next (applying N-1-m7-disposition-wave-37 precedent)"}
loop_state: paused
note: "Identical fork to wave-37, now narrowed: avatar-credential half delivered+live (w38/39/40); only Resend-domain credential a1299e88 remains founder-blocked."

head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: "Next-claimable computed from live tasks table. Exactly one disposition selected — HOLD M7 + surface founder-credential fork — grounded in a measured condition (seed_candidates=0 with the sole open row founder-credential-blocked and non-terminal). Closure correctly withheld (open_count=1, blocked row). Decomposition correctly not fired (would return incomplete-scope). M8 auto-promotion correctly withheld (founder-reserved MVP-line crossing, already 7/7-rejected). Applied the standing wave-37 BOARD ruling as precedent rather than re-litigating the identical fork."
  next_action: PROCEED_TO_N-2
```
