# N-1 — Survey & triggers (wave-39)

Canonical state read live from Postgres (`founder_bets`/`milestones`/`tasks`/`waves`) via
`CLAUDOMAT_DB_URL`; no sidecar/bash-var hand-off. Running wave confirmed via
`SELECT ... FROM waves WHERE status='running'` → wave 39 (id fc6efe36).

## Survey signals (Actions 1–4)

- **Action 1 — active milestone:** M7 `6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007`
  "Privacy controls, notifications & launch polish", `status=in_progress`. Exactly one
  `in_progress` row (invariant #3 holds).
- **Action 2 — todo queue:** 6 rows (M8 Educator tools, M9 Monetization, M10 Compliance,
  M11 Growth: server discovery, M12 Offline-first moat, M13 Institution partnerships).
  `next_todo_id` = M8 `84e17739` (head of queue) — NOT promoted (M7 still active).
- **Action 3 — M7 child summary:** `open=2, done=12, seed_candidates=1`.
  - open rows: `a1299e88` (Verify a Resend domain — **blocked**, founder-credential-gated,
    non-terminal) + `7525b759` (Harden avatar endpoints — **todo**, wave_id NULL,
    parent NULL, buildable backend).
- **Action 4 — unassigned queue depth:** captured (M-agnostic debt; not consulted this
  tick since a seed candidate exists).

## Trigger evaluations (Actions 6–10)

- **Action 6 — closure check:** `open_count=2 ≠ 0` → M7 does NOT close. Stays
  `in_progress`. (`a1299e88` is `blocked` = non-terminal; closing M7 with an open
  non-terminal row would violate Invariant #3 / premature-milestone-close anti-pattern.)
  **No transition.**
- **Action 7 — per-wave decomposition:** `seed_candidates=1 ≠ 0` → real seedable work
  exists → decomposition does **NOT** fire. (Firing would be out-of-ritual bundle-bloat.)
- **Action 8 — slot promotion + stockout:** `active_milestone != null` → 8a not entered.
  6 `todo` milestones exist → no stockout → roadmap-planning does **NOT** fire.
- **Action 9 — daily-checkpoint:** a seed candidate exists (Action 7 found one) → the
  ALL-hold condition is not met → checkpoint does **NOT** fire.
- **Action 10 — routing:** no ritual proposals fired; nothing to route.

## Upcoming juncture (flagged, not acted on)

After `7525b759` ships in wave 40, M7's only remaining open task will be `a1299e88`
(Verify a Resend domain — founder-credential-gated). At the NEXT wave's N-1, M7 will present
seed_candidates=0 with its sole open row `blocked` on a founder-reserved credential. That is
the queue-exhausted-under-active-milestone + founder-reserved fork already recorded in the
wave-37 pause context (Option A, 7/7 BOARD). The loop should then surface a daily-checkpoint
/ founder-credential-fork pause (verify a Resend email domain to finish the MVP launch, OR
direct the loop to post-MVP educator tools / M8). **Do NOT pre-empt it now — a seed candidate
exists this tick, so no pause is warranted (anticipatory-pause prohibition, rule 13).**

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007 (M7, in_progress)"
  - "todo queue head: 84e17739 (M8) — not promoted (M7 active)"
  - "active child tasks: open=2 done=12 seed_candidates=1"
  - "unassigned queue depth: >0 (not consulted; seed candidate exists)"
  - "closure: none (open_count=2)"
  - "promotion: none"
  - "decomposition fired: false"
  - "rituals fired: []"
prev_wave: 39
active_milestone_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
active_milestone_child_summary:
  open: 2
  done: 12
  seed_candidates: 1
next_todo_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
unassigned_queue_depth: null   # not consulted — seed candidate exists; checkpoint not triggered
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: "M7 held in_progress (open=2, non-terminal blocked row a1299e88). Seed candidate 7525b759 exists → no decomposition/checkpoint/pause this tick. Flagged: next N-1 will face seedless/founder-blocked M7 → founder-credential-fork checkpoint."

head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: "Next-claimable computed from the live tasks table (not a sidecar). Exactly one trigger outcome selected — no trigger fires — with each firing condition cited from canonical counts (open=2, seed_candidates=1, 6 todo milestones). Closure correctly withheld (non-terminal blocked row). Decomposition correctly withheld (seedable work exists). Stockout correctly withheld (6 todo). Daily-checkpoint correctly withheld (seed candidate present). No preemptive pause; the founder-credential juncture is flagged for the NEXT wave, not acted on now."
  next_action: PROCEED_TO_N-2
```
