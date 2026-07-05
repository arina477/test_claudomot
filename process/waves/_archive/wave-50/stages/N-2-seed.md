# N-2 — Seed (wave-50)

head-next (agent `abae158f52302344f`) gated this stage: **APPROVED**. Decision: **option (a)** — pick a seed from the 7 existing M8 candidates; NO decomposition recommended.

## Seed decision (the judgment call)

**Decision: option (a).** Decomposition gates on `seed_candidates = 0`; here it is 7. Firing milestone-decomposer to author the joinable focus-room / body-doubling slice now would be out-of-ritual scope injection over a non-empty seed queue. The focus-room lives in M8 `## Scope` prose (a future decomposition input); the ceo-reviewer note is a strategic ranking, not an authored task — acting on it now would be anticipatory. The instructed default holds: DM-polish is coherent AND the focus-room is net-new large scope genuinely needing a decomposition ritual later. WIP discipline: M8 open=7 already; opening a new large slice widens WIP.

## Chosen seed

- **Seed:** `39fc1c5e-7fcc-473a-9f50-71cdb53f8759` — "DM route: remove redundant empty channel-sidebar column (4-col → canonical 3-panel)"
- **Siblings:** zero (single-task bundle)
- **`claimed_task_ids`:** `["39fc1c5e-7fcc-473a-9f50-71cdb53f8759"]`

Rationale for this seed over the other six: direct continuity with the wave-49 B-6 REWORK "study-timer-namespace" thread (candidate pair 39fc1c5e + 5bcbd27f); user-visible layout correctness > internal test-hardening (f8eb49c1 / a1dda389 / 344eabde) and pre-scale gold-plating (874bd233 / c5051444) on a self-use MVP with no load; lowest risk (no schema / migration / realtime). `5bcbd27f` (token half of the pair) stays a standalone `todo` candidate for a future seed, not bundled now.

## Validation (Action 3) — PASS

Live DB re-confirm of seed `39fc1c5e`:

| field | value | expected | ok |
|---|---|---|---|
| status | todo | todo | ✓ |
| wave_id | NULL | NULL | ✓ |
| milestone_id | 84e17739 (M8) | M8 | ✓ |
| parent_task_id | NULL | NULL (seed) | ✓ |

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 39fc1c5e-7fcc-473a-9f50-71cdb53f8759"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: 39fc1c5e-7fcc-473a-9f50-71cdb53f8759
seed_task_title: "DM route: remove redundant empty channel-sidebar column (4-col → canonical 3-panel)"
bundled_sibling_ids: []
claimed_task_ids: ["39fc1c5e-7fcc-473a-9f50-71cdb53f8759"]
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
queue_exhausted: false
validation_failed: false
note: "Option (a) DM-namespace layout seed. head-next N-2 signoff APPROVED. 6 remaining M8 candidates + 13 unassigned persist, wave_id NULL, seedable for future waves."
```

## head-next N-2 signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  seed_decision:
    option: a
    seed_task_id: 39fc1c5e-7fcc-473a-9f50-71cdb53f8759
    seed_title: "DM route: remove redundant empty channel-sidebar column (4-col → canonical 3-panel)"
    sibling_count: 0
    claimed_task_ids: ["39fc1c5e-7fcc-473a-9f50-71cdb53f8759"]
    decomposition_recommended: false
  rationale: >
    Option (a). Decomposition gates on seed_candidates=0; here it is 7, so firing milestone-decomposer
    now would be out-of-ritual scope injection over a non-empty seed queue. Chosen seed 39fc1c5e is the
    DM-namespace layout fix tied to the wave-49 B-6 study-timer-namespace REWORK thread — highest
    user-visible value, lowest risk, single self-contained bundle. Zero siblings.
  next_action: PROCEED_TO_N-3
```
