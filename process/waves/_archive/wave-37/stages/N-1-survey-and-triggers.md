# N-1 — Survey & triggers (wave-37)

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007 (M7, in_progress)"
  - "todo queue head: 84e17739 (M8 — Educator tools & deeper academics, H2)"
  - "active child tasks: open=2 done=10 seed_candidates=0"
  - "unassigned queue depth: 12"
  - "closure: none (scope shipped BUT M7 HELD in_progress — 2 open rows are status='blocked' = non-terminal; done flip would violate roadmap-lifecycle Invariant #3)"
  - "promotion: none (active slot NOT empty — M7 held)"
  - "decomposition fired: false (no unshipped buildable feature under M7; M8 decomposition IS the 7/7-rejected Option B, founder-gated)"
  - "rituals fired: [milestone-disposition BOARD (slug N-1-m7-disposition-wave-37)]"
  - "BOARD verdict: UNANIMOUS 7/7 APPROVE Option A"
prev_wave: 37
active_milestone_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
active_milestone_child_summary:
  open: 2
  done: 10
  seed_candidates: 0
next_todo_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
unassigned_queue_depth: 12
state_transitions_applied: []          # M7 HELD in_progress — no transition (binding refinement #1)
slot_promotion:
  promoted_id: null
  prior_active_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
decomposition_fired: false
proposals_fired:
  - {ritual: milestone-disposition, target_milestone: 6e2f68d8, reason: last-H1-MVP-completing-milestone-zero-buildable-seeds, decision: BOARD-7/7-APPROVE-A, by: BOARD-automatic, fired_at: 2026-07-02}
ritual_outcomes:
  - ritual: milestone-disposition
    outcome_summary: >
      M7 (last H1 / MVP-completing milestone) has seed_candidates=0 and its
      buildable MVP scope is SHIPPED (privacy controls wave-35, in-app
      notifications wave-37, deploy/canary satisfied). The only remaining M7 rows
      are 2 status='blocked' credential-blocked founder-ops (a1299e88 Resend
      domain, 84e09891 Railway bucket) — the brain cannot self-generate
      account-issued creds (rule 6). BOARD 7/7 APPROVE Option A: HOLD M7
      in_progress (do NOT mark done — blocked is non-terminal, Invariant #3),
      surface the founder-credential fork (provide creds + launch MVP vs pivot to
      H2 educator tools), and PAUSE for founder direction. Option B (auto-promote
      M8 / horizon-jump H1→H2) REJECTED 7/7 — no precedent pre-authorizes crossing
      the MVP line unattended; the two prior park-or-key forks (M5 Resend, M6
      LiveKit) were both surfaced and the founder chose provide-and-finish.
    decision: APPROVE-A
    by: BOARD (automatic, 7/7)
selected_trigger: pause                 # queue-exhausted-under-active-milestone + founder-reserved disposition
loop_state: paused
note: >
  Daily-checkpoint NOT fired despite unassigned depth=12: that queue is
  M-agnostic tech-debt under a blocked-headline milestone; draining it is the
  M5-era debt-drain-while-blocked anti-pattern and does not resolve the
  founder-reserved fork. The fork is surfaced via the N-3 pause, not a checkpoint.
  head-next gate: N-1 APPROVED (no failed checks).
```
