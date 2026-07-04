# Wave 43 — N-1 Survey & triggers

head-next owns N-block (agentId ab9048ce6fdcbab0b, APPROVED). Mode: automatic. STRATEGIC INFLECTION.

## Survey
- Active: M8 (84e17739) in_progress. Children 6 open / 8 done / seed_candidates=0 (6 open follow-ups all wave_id-set).
- **Founder-named M8 CORE shipped:** educator role+moderation (w41), assignment collect/return (w42), class scheduling (w43).
- **Remaining M8 scope = DISCRETIONARY:** study-group tools, DMs/group DMs, message search — contract-barred from decomposition while metric `_TBD`.
- todo queue M9..M13 (no stockout). unassigned depth 14. Metric `_TBD by founder_`.

## Triggers
- **Closure (6):** M8 open=6 + 3 unshipped discretionary scope → NOT closeable. Stays in_progress.
- **Decomposition (7):** FIRED — `expand-current-bundle` (a discretionary decompose is CONTRACT-BARRED by the ritual's _TBD-metric guard). Re-homed the 6 accumulated polish/coverage follow-ups into an M8 polish/hardening bundle: seed 8e54799a (carries the T6-F1 MAJOR 1024-responsive defect) + 5 siblings (8828484f, ca43eb12, 683fec9b, 8d971bc2, 0308cdf1), all wave_id→NULL, siblings parent=8e54799a. decomposition-complete, no split. Decision committed 9da0210. This clears real debt without needing the metric + keeps the loop moving (rule 13).
- **Metric-TBD + discretionary-priority (3):** now GENUINELY DUE (founder-named core exhausted). head-next directed a BOARD escalate; refined to a direct escalated FOUNDER-CHECKPOINT (process/session/updates/checkpoint-2026-07-04-m8-discretionary.md) because the `## Success metric` field is explicitly founder-reserved (`_TBD by founder_`) — per rule 17 the success metric + feature priority are founder decisions, so a BOARD to conclude "this is founder-reserved" is redundant. NON-BLOCKING (the polish wave proceeds; rule 13 — metric-TBD is not a measured pause trigger). The metric becomes a HARD prerequisite gate on the FIRST discretionary decompose (a future wave), NOT on the polish wave.
- **Seed-stranding (4):** RESOLVED — the 6 follow-ups re-homed (wave_id nulled) into the polish bundle (option b/d), clearing the accumulated strand (w41/w42/w43 pairs) in one move.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 84e17739 (M8)"
  - "active child tasks: open=6 done=8 seed_candidates=0→ (re-homed to seedable)"
  - "closure: none (M8 open=6 + discretionary scope unshipped)"
  - "decomposition fired: true (expand-current-bundle re-home; polish bundle seed 8e54799a + 5 siblings)"
  - "rituals fired: [milestone-decomposition(expand-current-bundle)]"
prev_wave: 43
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
active_milestone_child_summary: {open: 6, done: 8, seed_candidates: 0}
unassigned_queue_depth: 14
state_transitions_applied: []
decomposition_fired: true
proposals_fired:
  - {ritual: milestone-decomposition, mode: expand-current-bundle, target_milestone: 84e17739, decision: fired, by: milestone-decomposer, fired_at: "2026-07-04"}
ritual_outcomes:
  - {ritual: milestone-decomposition, outcome_summary: "M8 polish bundle re-home: seed 8e54799a + 5 siblings", decision: decomposition-complete, by: milestone-decomposer}
loop_state: ready
note: "STRATEGIC INFLECTION: founder-named M8 core done; discretionary scope contract-barred on _TBD metric → next wave = polish/hardening (metric-independent); metric+priority surfaced as escalated founder-checkpoint (non-blocking)."
```
