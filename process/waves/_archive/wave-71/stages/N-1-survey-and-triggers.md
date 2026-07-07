# N-1 — Survey & triggers (wave-71)

Milestone state read from the live Postgres tables (`founder_bets` / `milestones` / `tasks` / `waves`) — no sidecar hand-off. Mode: `automatic`.

## Survey phase (Actions 1–4)

- **Action 1 — active milestone:** `SELECT ... WHERE status='in_progress'` → **0 rows**. `active_milestone = null`. M14 (6a9424fe — Trust & Safety) transitioned `in_progress → done` at wave-71 L-1: all 4 mvp-critical Scope legs shipped + proven live across waves 69–71; 9/9 child tasks `done` (verified: `done=9 total=9`). Closure recorded in `command-center/product/product-decisions.md`.
- **Action 2 — todo queue:** 3 rows — M9 (3e507bc0 — Monetization: freemium tiers), M10 (97d65b49 — Compliance & data rights), M13 (b7400254 — Institution partnerships & portable identity). All three are **founder-reserved strategic theme picks** (money / legal / strategic positioning), so `next_todo_id` is NOT auto-selectable by the brain (see Action 8a).
- **Action 3 — active-milestone child summary:** N/A — `active_milestone = null`. (M14 closed at L-1; its counts were `open=0 done=9 seed_candidates=0`.)
- **Action 4 — unassigned queue depth:** **18** rows (`status='todo' AND milestone_id IS NULL`).

## Trigger phase (Actions 6–10) — the FOUNDER-RESERVED fork

- **Action 6 — closure check:** M14 already closed at L-1 (`in_progress → done`, recorded). No fresh transition to apply this tick. `active_milestone = null`.
- **Action 7 — per-wave decomposition:** requires `active_milestone` to exist. `active_milestone == null` → NOT applicable. No decomposition target exists.
- **Action 8a — slot promotion:** `active_milestone == null` → normally promote the next `todo`. **BLOCKED — founder-reserved.** The 3 `todo` milestones are strategic theme selections the brain CANNOT make autonomously:
  - M9 Monetization (freemium tiers) — money / pricing decision (always-on rules 9 + 17: spend/pricing = founder-reserved).
  - M10 Compliance & data rights — legal / compliance-regime decision (founder-reserved).
  - M13 Institution partnerships & portable identity — strategic positioning / horizon decision (founder-reserved).

  Choosing which strategic theme to advance next is the founder's call, NOT the brain's — confirmed by the wave-71 P-0 ceo-reviewer and always-on rules 9/17. Under `automatic` mode, strategic + money/compliance decisions route to the **founder** (splits + hard-stops go to founder, not BOARD). This is a genuine hard-stop-to-founder.
  - **ALSO:** the **public-launch GO** for the now-complete M14 public directory (moderation for public discovery) is a distinct founder-reserved launch decision — a public-facing go-live is not a brain-autonomous action.
- **Action 8b — stockout cascade:** NOT fired. `todo` milestones DO exist (3) — there is no milestone stockout; roadmap-planning is not warranted. The block is a promotion-authority gate, not an empty-roadmap gate.
- **Action 9 — daily-checkpoint:** NOT fired. The block is a founder-reserved strategic fork, not a "null claimable + fillable queue" checkpoint condition. Firing a checkpoint would misroute a founder-reserved decision to BOARD.
- **Action 10 — routing:** No ritual fired. The single outcome is a hard-stop-to-founder → the loop PAUSES at N-3.

## Outcome

No milestone promoted, no decomposition fired, no ritual routed. `active_milestone` remains `null`. The next legal step (promote a strategic theme OR issue the public-launch GO) is founder-reserved and cannot be resolved autonomously → measured pause emitted at N-3. This is NOT preemptive: M14 is genuinely, provably complete, and the next move is genuinely founder-owned.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: null (M14 6a9424fe closed in_progress→done at L-1, recorded)"
  - "todo queue head: null-for-autonomous-purposes (3 todo milestones exist but all founder-reserved: M9 money / M10 legal / M13 strategic)"
  - "active child tasks: n/a (no active milestone)"
  - "unassigned queue depth: 18"
  - "closure: none this tick (M14 closed at L-1)"
  - "promotion: none — founder-reserved (strategic theme pick + public-launch GO)"
  - "decomposition fired: false (no active milestone to decompose)"
  - "rituals fired: []"
prev_wave: 71
active_milestone_id: null
active_milestone_child_summary:
  open: 0
  done: 0
  seed_candidates: 0
next_todo_id: null           # 3 todo rows exist but none brain-promotable (founder-reserved)
unassigned_queue_depth: 18
state_transitions_applied: []   # M14 in_progress→done applied at L-1, not re-applied here
slot_promotion:
  promoted_id: null
  prior_active_id: null
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: paused
note: >
  FOUNDER-RESERVED fork. active_milestone=null AND the only 3 todo milestones (M9 Monetization,
  M10 Compliance, M13 Partnerships) are money/legal/strategic theme picks the brain cannot promote
  autonomously (always-on rules 9/17; automatic routes splits + hard-stops to founder, not BOARD).
  Plus a distinct founder-reserved public-launch GO for the now-complete M14 public directory.
  Two founder decisions awaited: (1) public-launch GO for the completed public directory; (2) which
  next theme to advance — Monetization / Compliance / Partnerships. Loop pauses at N-3.
```
