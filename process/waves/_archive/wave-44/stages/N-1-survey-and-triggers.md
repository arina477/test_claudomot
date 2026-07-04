# N-1 — Survey & triggers (wave-44)

**Block:** N (Next). **Stage:** N-1. **Mode:** automatic. **Head:** head-next (owns N-block).

## Survey phase (Actions 0–5) — ground truth from live Postgres

| Action | Query | Result |
|---|---|---|
| 1 — active milestone | `SELECT ... WHERE status='in_progress'` | 1 row → **M8** `84e17739-af5e-4396-beb9-b6f3d6836fc4` (Educator tools & deeper academics). No invariant violation. |
| 2 — todo queue | `SELECT ... WHERE status='todo' ORDER BY created_at` | 5 rows → M9 Monetization, M10 Compliance, M11 Growth-discovery, M12 Offline-first moat, M13 Institution partnerships. `next_todo_id` = M9 `3e507bc0` (earliest / business-model founder-bet). No stockout. |
| 3 — M8 child summary | `count(*) FILTER ...` on `tasks WHERE milestone_id=M8` | **open=0, done=14, seed_candidates=0** (at survey time). |
| 4 — unassigned depth | `count(*) WHERE status='todo' AND milestone_id IS NULL` | **13**. Breakdown: 12 top-level, of which only **2 clean-seedable** (`parent_task_id IS NULL AND wave_id IS NULL`): `4e994e96` biome-lint, `67881a58` Playwright-MCP; 10 stranded (wave_id SET → never N-2-seedable); +1 with a parent. |

## Trigger phase (Actions 6–10)

**Action 6 — Closure check:** M8 open=0, but LLM-judged scope NOT shipped. M8 `## Scope` names educator-role + moderation + assignment collect/return + class scheduling + **study-group tools + DMs/group-DMs + message search**. First four are shipped/polished (waves 41-44); study-groups / DMs / search are UNBUILT. → **NOT closeable.** Fall through to Action 7.

**Action 7 — Per-wave decomposition:** M8 seed_candidates=0 AND scope not shipped → decomposition would normally fire. BUT M8 `## Success metric = _TBD by founder_`, and the remaining discretionary features (study-groups/DMs/search) are contract-barred from prioritization without it → milestone-decomposer would return `incomplete-scope`. The metric is **founder-reserved** and was **already escalated** at wave-43 N-1 (open, non-blocking: `process/session/updates/checkpoint-2026-07-04-m8-discretionary.md`). Per the checkpoint author's judgment and the strategic brief: **decomposition NOT fired; metric NOT re-escalated to BOARD** (founder's call, already with the founder). No violation of the incomplete-scope escalation rule because the barred field is founder-reserved, not BOARD-decidable.

**Action 8 — Slot promotion / stockout:** `active_milestone != null` (M8 not closed) → 8a promotion does not apply. 8b stockout does not apply (`next_todo_id != null`). No milestone transition this tick.

**Action 9 — Daily-checkpoint:** ALL conditions held → **FIRED**:
- Action 7 found no seed candidate AND decomposition not viable (metric-barred, would return incomplete-scope). ✓
- `unassigned_queue_depth = 13 > 0`. ✓
- Stockout cascade (8b) NOT in flight. ✓

**Action 10 — Route per mode (automatic):** daily-checkpoint → **BOARD**, slug `N-1-checkpoint-wave-44`. Convened 7 members (parallel, fresh context). Proposition: wave-45 = tech-debt hygiene (re-home `4e994e96` + `67881a58` into M8) vs promote a todo milestone.

## BOARD outcome

**APPROVE 6 / ABSTAIN 1 / REJECT 0 / HARD-STOP 0** (ceo-reviewer, architect-reviewer, risk-manager, founder-proxy, competitive-analyst, product-manager APPROVE; ux-researcher ABSTAIN — no user-facing surface). Clean 6/7 (clears 4+/7 default and 6+/7 strict). No dissent, no veto. Artifact: `process/waves/wave-44/escalations/board-N-1-checkpoint-wave-44.md`.

**Decision:** wave-45 = tech-debt hygiene wave. Re-home the 2 clean tech-debt seeds into M8. Loop stays RUNNING — no founder-metric pause (claimable metric-independent work exists; a pause now would violate always-on rule 13). M8 discretionary-feature + success-metric decision remains with the founder (existing open checkpoint).

**Applied:** `UPDATE tasks SET milestone_id='84e17739' WHERE id IN ('67881a58','4e994e96')` → 2 rows; both retain `wave_id IS NULL` + `parent_task_id IS NULL` (clean-seedable, not stranded). Post-UPDATE M8 child summary: **open=2, done=14, seed_candidates=2**. Unassigned queue 13 → 11.

**N-2 ordering note:** sequence `67881a58` (Playwright-MCP reconfigure — restores live-UI test capability) ahead of `4e994e96` (biome-lint, cosmetic). N-2 owns the final seed/sibling pick.

---

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 84e17739-af5e-4396-beb9-b6f3d6836fc4 (M8)"
  - "todo queue head: 3e507bc0-bce5-4f3b-b22a-d3c887fc0548 (M9)"
  - "active child tasks (at survey): open=0 done=14 seed_candidates=0"
  - "active child tasks (post-rehome): open=2 done=14 seed_candidates=2"
  - "unassigned queue depth: 13 (2 clean-seedable) → 11 after re-home"
  - "closure: none (M8 scope not shipped — study-groups/DMs/search unbuilt)"
  - "promotion: none"
  - "decomposition fired: false (metric-barred; founder-reserved metric already escalated, not re-escalated)"
  - "rituals fired: [daily-checkpoint]"
prev_wave: 44
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
active_milestone_child_summary:
  open: 2
  done: 14
  seed_candidates: 2
next_todo_id: 3e507bc0-bce5-4f3b-b22a-d3c887fc0548
unassigned_queue_depth: 11
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
decomposition_fired: false
proposals_fired:
  - {ritual: daily-checkpoint, decision: BOARD-APPROVE-6of7, by: BOARD, fired_at: "2026-07-04T16:45:00Z"}
ritual_outcomes:
  - ritual: daily-checkpoint
    outcome_summary: "wave-45 = tech-debt hygiene; re-homed 67881a58 (Playwright-MCP) + 4e994e96 (biome-lint) into M8; loop stays RUNNING; M8 metric decision stays with founder (existing open checkpoint)"
    decision: APPROVE
    by: BOARD (6/7, slug N-1-checkpoint-wave-44)
assignments_applied:
  - {task: 67881a58-aceb-4ccb-95e7-772e8f306dd4, from_milestone: null, to_milestone: 84e17739-af5e-4396-beb9-b6f3d6836fc4, wave_id: null, parent_task_id: null}
  - {task: 4e994e96-7935-4ebf-95ad-1551a087b6c6, from_milestone: null, to_milestone: 84e17739-af5e-4396-beb9-b6f3d6836fc4, wave_id: null, parent_task_id: null}
next_wave_direction: tech-debt-hygiene
n2_seed_candidate_ids: [67881a58-aceb-4ccb-95e7-772e8f306dd4, 4e994e96-7935-4ebf-95ad-1551a087b6c6]
n2_ordering_note: "sequence 67881a58 (restores live-UI test capability) ahead of 4e994e96 (cosmetic)"
loop_state: ready
note: "No founder-metric pause: claimable metric-independent work exists (2 clean seeds + 5 promotable milestones), so pausing on M8's founder-reserved metric would be a preemptive-pause (rule 13) violation. M8 success-metric + discretionary-feature decision remains founder-reserved via the still-open non-blocking checkpoint (checkpoint-2026-07-04-m8-discretionary.md). No pause/resume file present; STATUS=RUNNING; no founder message this turn."
```
