# N-2 — Seed (wave-49 → wave-50)

Pick the next bundle under active milestone M8. Bundle = 1 seed + 0-N siblings
(`parent_task_id` self-FK). N-2 only identifies + validates; never writes status.

## Seed selection (judgment call, justified)

**Nine M8 seed candidates** (all top-level `todo`, `wave_id NULL`, `parent_task_id NULL`),
oldest → newest:

| # | id | title | created_at |
|---|----|-------|------------|
| 1 | f8eb49c1 | Unit-test buildTypingLabel transition table | 2026-07-04 07:03 |
| 2 | a1dda389 | Harden delete-any-message E2E (2-client fan-out hard assertion) | 2026-07-04 07:03 |
| 3 | 5bcbd27f | DM off-token surface substitutions | 2026-07-04 12:25 |
| 4 | 39fc1c5e | DM route: 4-col → canonical 3-panel | 2026-07-04 12:25 |
| 5 | 874bd233 | DM /dm/candidates throttle + 429 backoff | 2026-07-04 14:40 |
| 6 | c5051444 | DM getDmCandidates pagination | 2026-07-04 14:40 |
| 7 | 344eabde | DM who_can_dm positive-control integration case | 2026-07-04 15:38 |
| 8 | **f4b3659e** | **Study-timer configurable work/break durations (custom Pomodoro)** | 2026-07-05 11:27 |
| 9 | **ffd98a36** | **Study timer: restore <1024px slim-bar phase indicator** | 2026-07-05 15:14 |

**Decision — override strict-oldest; seed the study-group continuation:**

- **Seed:** `f4b3659e-842b-450c-9869-750b64685d63` — Study-timer configurable
  work/break durations (custom Pomodoro).
- **Sibling:** `ffd98a36-9d01-4fba-98ce-1c283c2553e3` — restore <1024px slim-bar
  phase indicator (wave-49 T-5/T-6 finding F-1 regression).

**Justification.** N-2 Action 1 permits LLM re-ordering when the milestone scope
needs a specific bundle next. The founder's standing wave-48 direction is
**study-group tools** (recorded in the wave-49 checklist header + product-decisions);
wave-49 shipped study-timer slice 1 (seed 1387d845). The aligned continuation is a
**study-timer hardening/enhancement wave**:

1. `f4b3659e` is the directed track — its own description reads "Deferred from
   wave-49 P-0 (mvp-thinner THIN) … Later M8 study-group slice. Reuse the wave-49
   timer schema + service + widget." It is the next study-group slice, not carryable
   polish.
2. `ffd98a36` is fresh same-feature debt (the wave-49 F-1 slim-bar regression, a
   CSS specificity collision at StudyTimerWidget.tsx:476). Bundling it as a sibling
   makes the wave a coherent study-timer unit — the enhancement lands and the
   regression it sits next to is cleared in the same wave.

Strict-oldest would pick `f8eb49c1` (a DM-polish straggler) — off the directed
track. The 7 DM-polish stragglers (f8eb49c1 / a1dda389 / 5bcbd27f / 39fc1c5e /
874bd233 / c5051444 / 344eabde) remain independently seedable (`wave_id NULL`,
top-level) for a future wave; they are carryable polish, not the directed track.

**WIP discipline.** 1 seed + 1 sibling — a tight, coherent study-timer unit. No
bundle bloat; no intra-bundle blocker (the regression fix and the enhancement touch
the same widget but neither depends on unbuilt work of the other).

## Bundle formation + validation (Action 2–3)

`UPDATE tasks SET parent_task_id = f4b3659e WHERE id = ffd98a36` — applied (RETURNING confirmed).

Validation re-read against DB (`WHERE id = ANY(claimed_task_ids)`):

| id | status | wave_id | milestone_id | parent_task_id | verdict |
|----|--------|---------|--------------|----------------|---------|
| f4b3659e (seed) | todo | NULL | 84e17739 (M8) | NULL | PASS |
| ffd98a36 (sib) | todo | NULL | 84e17739 (M8) | f4b3659e | PASS |

All per-row checks pass: status=todo, wave_id NULL, milestone_id=M8, sibling
parent_task_id = seed.id.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: f4b3659e-842b-450c-9869-750b64685d63"
  - "bundled siblings: 1"
  - "validation: pass"
seed_task_id: f4b3659e-842b-450c-9869-750b64685d63
seed_task_title: "Study-timer configurable work/break durations (custom Pomodoro)"
bundled_sibling_ids: [ffd98a36-9d01-4fba-98ce-1c283c2553e3]
claimed_task_ids: [f4b3659e-842b-450c-9869-750b64685d63, ffd98a36-9d01-4fba-98ce-1c283c2553e3]
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
queue_exhausted: false
validation_failed: false
note: >
  Founder-directed study-group continuation. Seed = deferred wave-49 THIN slice
  (custom Pomodoro); sibling = wave-49 F-1 slim-bar regression fix. Strict-oldest
  override justified above. 7 DM-polish stragglers stay seedable for a future wave.
```

## Stage-exit checklist (head-next gate)

- [x] WIP-limited: 1 seed + 1 tightly-scoped sibling.
- [x] Seed `parent_task_id IS NULL`; sibling `parent_task_id = seed.id`.
- [x] Both carry `milestone_id = M8`, `wave_id NULL`, `status = 'todo'`.
- [x] No intra-bundle dependency on unbuilt later work.
- [x] Bundle formed via `parent_task_id` self-FK (existing tasks re-parented; no
      hand-INSERT of new task rows — both tasks were authored earlier by the P-0
      mvp-thinner defer and V-2 triage per their authorized writers).

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Bundle validated against the DB — seed + one sibling, correct self-FK and
    assignment columns, no bloat, no intra-bundle blocker. Seed selection overrides
    strict-oldest per the founder's explicit study-group direction and keeps the
    study-timer work coherent (enhancement + its adjacent regression). claimed_task_ids
    populated for B-0 claim and L-2 close.
  next_action: PROCEED_TO_N-3
```
