# BOARD — N-1-checkpoint-wave-44

**Mode:** automatic
**Trigger:** N-1 Action 9 daily-checkpoint (routed to BOARD per automatic-mode table).
**Convened:** 2026-07-04 (wave-44 N-1).
**Threshold:** default 4+/7 (checkpoint bucket resolution).

## Firing conditions (all held — Action 9)

- M8 (`84e17739`) active; `seed_candidates=0` at survey; scope NOT shipped (DMs / message search / study-group tools / educator-role unbuilt).
- Decomposition (Action 7) NOT viable: M8 `## Success metric = _TBD by founder_`; remaining discretionary features metric-barred → milestone-decomposer would return `incomplete-scope`. Metric is founder-reserved and ALREADY escalated (open, non-blocking: `process/session/updates/checkpoint-2026-07-04-m8-discretionary.md`). NOT re-escalated to BOARD.
- `unassigned_queue_depth = 13 > 0`; 2 clean-seedable tech-debt seeds present.
- No stockout (M9-M13 todo).

## Proposition

Wave-45 = tech-debt HYGIENE wave: re-home the 2 clean unassigned tech-debt seeds — `4e994e96` (biome-lint cleanup) + `67881a58` (reconfigure Playwright MCP to bundled chromium for live UI tests) — into M8 (`UPDATE tasks SET milestone_id=M8`), keeping the M8 loop alive with metric-independent debt-clearing while the founder's M8 success metric is pending — RATHER than promoting a `todo` milestone (M9-M13) now (each carries the same `_TBD by founder_` metric wall + a strategic horizon-jump commitment).

## Votes (7 members, parallel, fresh context)

| # | Member | Vote | One-line |
|---|---|---|---|
| 1 | ceo-reviewer (strategist) | APPROVE | Promoting M9-M13 trades one metric-block for the same block + an unforced horizon-jump; hygiene preserves founder optionality, Playwright fix protects the offline-first wedge. |
| 2 | architect-reviewer | APPROVE | Re-home is a reversible `milestone_id` UPDATE, zero schema/migration risk; lint keeps CI signal clean; restoring live-UI test capability rebuilds the safety net before M8 features resume. |
| 3 | ux-researcher | ABSTAIN | No user-perceivable surface (honest abstain); strong APPROVE lean — promoting M9-M13 ships no student value faster (all metric-blocked); Playwright seed is a recurring carry worth clearing before the DM/search waves. |
| 4 | risk-manager | APPROVE | Dominant risk is preemptive-pause (rule 13): claimable metric-independent work exists, so pausing on M8 metric would be an unforced halt; hygiene avoids it; sequence `67881a58` first (test-capability restore). |
| 5 | founder-proxy | APPROVE | Live bet anchors H1/self-use-mvp; roadmap parks M9 in H2 + gates M10 on a paying-school trigger (not fired). Promoting now front-runs the founder's in-inbox M8 decision; hygiene matches the documented "hardening-then-core" disposition + wave-16 tech-debt-wave precedent. |
| 6 | competitive-analyst | APPROVE | No current rival move makes M9/M11 uniquely urgent; disciplined teams use inter-milestone breathing room to restore test infra; promoting a metric-TBD milestone ships unvalidatable work. |
| 7 | product-manager | APPROVE | Metric gates BOTH M8 features and effective M9-M13 right-sizing; 2-task bundle is a right-sized, seedable N-2 seed; promoting metric-TBD milestones = entering blind (sprint anti-pattern). |

## Tally

**APPROVE 6 / ABSTAIN 1 / REJECT 0 / HARD-STOP 0.**

6/7 APPROVE — clean (exceeds 4+/7 default; also clears strict 6+/7). No dissent, no member veto.

## Decision

**APPROVED.** Wave-45 = tech-debt hygiene wave. Re-home `4e994e96` + `67881a58` into M8. Loop stays RUNNING; no founder-metric pause (claimable metric-independent work exists — pausing now would violate CLAUDE.md rule 13). The M8 discretionary-feature + success-metric decision remains with the founder via the existing open, non-blocking checkpoint.

**N-2 ordering note (risk-manager + ux-researcher):** sequence `67881a58` (Playwright-MCP reconfigure — restores live-UI test capability) ahead of `4e994e96` (biome-lint, cosmetic) when N-2 picks the seed. N-2 owns the final seed/sibling pick.

## Applied

- `UPDATE tasks SET milestone_id='84e17739...' WHERE id IN ('67881a58...','4e994e96...')` → 2 rows; both retain `wave_id IS NULL` + `parent_task_id IS NULL` (clean-seedable, not stranded).
- M8 child summary now: open=2, done=14, seed_candidates=2. Unassigned queue 13 → 11.
- product-decisions.md appended (material checkpoint re-home).
- board-digest-2026-07-04.md updated.
