# N-2 — Seed (wave-48 → wave-49)

Pick the next bundle under the active milestone M8. **Seed-picker OVERRIDE applied** —
see rationale below.

## Seed selection — OVERRIDE of default oldest-`created_at` picker

The default N-2 picker (`ORDER BY created_at LIMIT 1` over top-level `todo`/`wave_id IS NULL`
rows under M8) would return `f8eb49c1` — a DM-polish straggler — because the 7 DM-polish
follow-ups are OLDER top-level rows (created 2026-07-04) than the study-timer seed
(created 2026-07-05). N-2 Action 1 explicitly permits LLM re-ordering: "prefer whichever
the milestone scope needs next."

**Override → seed `1387d845` (study-group tools slice 1).** The founder answered the
wave-48 N-1 pause directly in chat (2026-07-04): build study-group tools next under M8
(shared timers/Pomodoro, study sessions, collaborative whiteboard). The study-group tools
slice-1 bundle is the founder-directed intended wave-49 seed. The 7 DM-polish stragglers
(344eabde / c5051444 / 5bcbd27f / 874bd233 / 39fc1c5e / a1dda389 / f8eb49c1) remain
independently seedable for a later wave (`wave_id IS NULL`, `status='todo'`). Same override
pattern as the wave-45→46 DMs seed override.

## Bundle (validated against DB, Action 3)

| role | id | status | wave_id | milestone_id | parent_task_id |
|---|---|---|---|---|---|
| seed | 1387d845-b8db-40cc-b6cb-a83d508ce3fe | todo | NULL | 84e17739 (M8) | NULL |
| sibling | cb81bf03-3472-4987-9749-86b254f89f19 | todo | NULL | 84e17739 (M8) | 1387d845 |
| sibling | c3daf6d3-01b4-4aa8-8e45-a198c456ecf3 | todo | NULL | 84e17739 (M8) | 1387d845 |
| sibling | 832b83b7-2124-475c-90bd-7dbc33f3a4f8 | todo | NULL | 84e17739 (M8) | 1387d845 |

Dependencies sequenced: schema + backend spine (seed) → Socket.IO fan-out (cb81bf03) →
widget display/controls (c3daf6d3) → phase auto-advance + reconnect reconciliation
(832b83b7). No sibling depends on an unbuilt later sibling.

## head-next signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Bundle read from the live tasks table (not a sidecar). Exactly one seed + 3 tight
    siblings — WIP-limited, one milestone scope slice. Seed parent_task_id IS NULL; every
    sibling parent_task_id = seed.id; all four status='todo', wave_id IS NULL,
    milestone_id=M8. Dependencies sequenced (spine → fan-out → widget → reconcile). Bundle
    authored by the milestone-decomposer ritual (not hand-INSERTed). Seed-picker override
    from the default oldest-created_at row is explicit and founder-directed (study-group
    tools chosen at the wave-48 N-1 resume); DM-polish stragglers remain independently
    seedable. All N-2 stage-exit checks tick.
  next_action: PROCEED_TO_N-3
```

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 1387d845-b8db-40cc-b6cb-a83d508ce3fe"
  - "bundled siblings: 3 (cb81bf03, c3daf6d3, 832b83b7)"
  - "validation: pass (all todo, wave_id NULL, milestone_id=M8, siblings parent=seed)"
  - "default-picker override: default would pick f8eb49c1 (older DM-polish straggler); founder-directed study-group slice chosen"
seed_task_id: 1387d845-b8db-40cc-b6cb-a83d508ce3fe
seed_task_title: "Add group study-timer schema + server-scoped backend spine"
bundled_sibling_ids:
  - cb81bf03-3472-4987-9749-86b254f89f19
  - c3daf6d3-01b4-4aa8-8e45-a198c456ecf3
  - 832b83b7-2124-475c-90bd-7dbc33f3a4f8
claimed_task_ids:
  - 1387d845-b8db-40cc-b6cb-a83d508ce3fe
  - cb81bf03-3472-4987-9749-86b254f89f19
  - c3daf6d3-01b4-4aa8-8e45-a198c456ecf3
  - 832b83b7-2124-475c-90bd-7dbc33f3a4f8
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
queue_exhausted: false
validation_failed: false
note: "Founder-directed seed override; DM-polish stragglers stay queued (wave_id NULL, seedable later)."
```
