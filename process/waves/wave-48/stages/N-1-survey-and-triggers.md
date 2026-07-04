# N-1 — Survey & triggers (wave-48, deciding wave-49)

Mode: `automatic`. head-next owns the N-block. Deciding the disposition for wave-49.

## Survey phase (Actions 1–4) — all signals from live Postgres this tick

**Action 1 — Active milestone:** one row → **M8 — Educator tools & deeper academics** (`84e17739-af5e-4396-beb9-b6f3d6836fc4`, `in_progress`). Class `product-feature`, Horizon H2, Tier T5. No invariant violation (exactly one `in_progress`).

**Action 2 — `todo` queue:** 5 rows — M9 Monetization (H2), M10 Compliance (H2, gated on a paying-school trigger not yet fired), M11 Growth/discovery (H2, T6), M12 Offline-first moat (H3, T6), M13 Institution partnerships (H3, T6). All are horizon-jumps. `next_todo_id` is nominally M9 by tier, but promotion is contra-indicated (see Action 8).

**Action 3 — M8 open child-task summary:**
```
open_count=7   done_count=23   seed_candidates=7
```
The 7 open tasks (all `status=todo`, `wave_id NULL`, `parent_task_id NULL` — technically seedable):
- `344eabde` DM privacy: who_can_dm='server-members' positive-control
- `c5051444` DM: LIMIT/pagination on getDmCandidates
- `5bcbd27f` DM off-token surface substitutions (picker restriction UI)
- `874bd233` DM: reconcile /dm/candidates throttle policy + 429
- `39fc1c5e` DM route: remove redundant empty channel-sidebar column (cleanup)
- `a1dda389` Harden delete-any-message E2E (wave-45 straggler)
- `f8eb49c1` Unit-test buildTypingLabel transition table (wave-45 straggler)

All 7 are DM-polish DEBT or wave-45 stragglers. The founder-named M8 FEATURE scope — **study-group tools (shared timers/Pomodoro, study sessions, whiteboard)** and **message search** — is UNBUILT and UNDECOMPOSED (no bundle).

**Action 4 — Unassigned queue depth:** `unassigned_queue_depth = 12` (milestone_id IS NULL, status=todo).

## Trigger phase (Actions 6–10)

**Action 6 — M8 closure check:** `open_count = 7 ≠ 0` AND LLM-judged scope NOT shipped (of the `## Scope` list, study-group tools + message search have zero done tasks; only the DM slice shipped). **M8 does NOT close.** No `in_progress → done` transition.

**Action 7 — Per-wave decomposition trigger:** literal condition (`seed_candidates = 0`) does NOT fire — 7 seed candidates exist. BUT those 7 are debt-only. Seeding any = a **2nd consecutive DM-polish debt wave**, which the standing wave-48-direction guardrail (product-decisions.md, wave-47 N-1) **BARS**: *"if wave-49 would again be debt-only, re-escalate the study-groups-vs-search feature fork to the FOUNDER rather than auto-seed more polish."* The only value-advancing M8 work is the FEATURE fork (study-group tools vs message search), which is **founder-reserved with no board default** (established at wave-47 N-1). Decomposition of a feature cannot fire autonomously — it requires the founder's priority pick. → routed to BOARD to confirm the disposition (Action 10).

**Action 8 — Slot promotion + stockout cascade:** `active_milestone ≠ null` (M8 still in_progress) → 8a/8b do not fire. No stockout (5 `todo` milestones exist), so no roadmap-planning. Promoting M9-M13 is contra-indicated: all are H2/H3 horizon-jumps that prior BOARDs (wave-44 6/7, wave-46) ruled would front-run the founder's pending M8 feature decision. Not promoted.

**Action 9 — Daily-checkpoint trigger:** does NOT fire. Requires a null next-claimable AND decomposition-not-fired; here the block is a founder-reserved feature fork, not a checkpoint-shaped stall. The disposition is routed as a founder re-escalation via BOARD, not a daily-checkpoint.

**Action 10 — Route per mode (`automatic`):** the wave-49 disposition (a founder-reserved feature-priority fork under a standing guardrail) convened the **BOARD**, slug `N-1-wave-49-founder-fork`.

### BOARD outcome
Artifact: `process/waves/wave-48/escalations/board-N-1-wave-49-founder-fork.md`.
**Verdict: (c) PAUSE + FOUNDER RE-ESCALATION — 6/7** (strategist, industry-expert, realist, user-advocate, risk-officer, founder-proxy), REJECT 1/7 (counter-thinker, conditional on a real forward slice existing — condition unmet: cupboard is bare). **2 HARD-STOP vetoes** (strategist, realist). Clears both the 4+/7 default bar and the 6+/7 Tier-3 strict bar.

Disposition: wave-49 does NOT open. Write a founder re-escalation checkpoint (study-group tools vs message search vs new direction); hold the loop on a MEASURED board-escalation hard-stop (rule-13 trigger d). DM-polish debt stays queued (7 tasks: status=todo, wave_id NULL, parent NULL, seedable) for the next feature wave. N-2/N-3 do NOT run.

## Deliverable footer

```yaml
n_stage_verdict: DEFERRED    # founder-reserved feature fork re-escalated; loop pauses (measured board-escalation hard-stop)
verdict_evidence:
  - "active milestone: 84e17739 (M8, in_progress) — not closeable (scope not shipped)"
  - "todo queue head: M9 (3e507bc0) — NOT promoted (horizon-jump, front-runs pending M8 decision)"
  - "active child tasks: open=7 done=23 seed_candidates=7 (all 7 open = DM-polish debt / wave-45 stragglers)"
  - "unassigned queue depth: 12"
  - "closure: none (M8 open_count=7, feature scope unbuilt)"
  - "promotion: none"
  - "decomposition fired: false (feature fork founder-reserved; debt-only seeding guardrail-barred)"
  - "rituals fired: [BOARD:N-1-wave-49-founder-fork]"
  - "BOARD verdict: (c) PAUSE+re-escalate 6/7, 2 HARD-STOP vetoes"
prev_wave: 48
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
active_milestone_child_summary:
  open: 7
  done: 23
  seed_candidates: 7
next_todo_id: 3e507bc0-bce5-4f3b-b22a-d3c887fc0548   # M9 — NOT promoted
unassigned_queue_depth: 12
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
decomposition_fired: false
proposals_fired:
  - {ritual: BOARD, slug: N-1-wave-49-founder-fork, reason: founder-reserved-feature-fork-under-guardrail, decision: PAUSE-and-re-escalate, by: BOARD-6/7, fired_at: 2026-07-04}
ritual_outcomes:
  - {ritual: BOARD, outcome_summary: "(c) PAUSE + founder re-escalation 6/7; 2 HARD-STOP vetoes; study-groups-vs-search founder-reserved with no board default", decision: PAUSE, by: BOARD}
loop_state: paused
pause_reason: "wave-49 would be debt-only (guardrail-barred); the only value-advancing M8 work is the study-groups-vs-search feature fork, founder-reserved with no board default. Re-escalated to founder."
founder_checkpoint: process/session/updates/checkpoint-2026-07-04-wave49-m8-feature-fork.md
note: "N-2/N-3 not run — no wave-49 opens. Loop holds on a measured board-escalation hard-stop pending the founder's feature-priority answer."
```

## Exit criteria

- [x] All survey signals captured (Actions 1–4).
- [x] No invariant violations.
- [x] Closure check applied (Action 6) — M8 not closeable.
- [x] Per-wave decomposition evaluated (Action 7) — debt-only seeding guardrail-barred; feature fork founder-reserved.
- [x] Promotion + stockout cascade applied (Action 8) — no promotion (horizon-jumps contra-indicated).
- [x] Daily-checkpoint evaluated (Action 9) — not fired.
- [x] Proposal routed per mode (Action 10) — BOARD; verdict (c) PAUSE 6/7.
- [x] Outcomes captured.
- [x] `n_stage_verdict: DEFERRED` (loop pauses on measured board-escalation).
- [x] checklist N-1 row checked.
