# N-2 — Seed (wave-46 → wave-47)

head-next gate: **APPROVED** (WIP-limited bundle, correct self-FK + assignment columns, dependency-ordered, ritual-authored).

## Seed pick (Action 1) — OVERRIDE of oldest-created_at default

The default oldest-`created_at` picker would grab a wave-45 debt straggler (`f8eb49c1` 07:03:29 or `a1dda389` 07:03:42) or a non-blocking F9/F10 row. **OVERRIDE** to the **F-A DM-entry-point bundle** per N-2 Action 1 ("LLM may re-order... prefer whichever the milestone scope needs next").

Rationale: F-A is the **#1 priority** — it completes the DM feature the founder explicitly chose to build. A shipped-but-UNSTARTABLE feature is the highest-value thing to finish. This is feature-**COMPLETION**, not debt — the wave-45 "3rd-consecutive-debt-wave" guardrail does NOT apply (wave-46 was a feature wave).

- **Seed:** `10967558-f27f-4f47-81be-5b5e5d878259` — "DM Start-picker: make DMs startable — DM-candidate source + entry point".

## Siblings (Action 2)

- `379978a4-0497-449f-8807-4cffe53d1436` — "DM optimistic-row author resolution (wave-46 F7)" — `parent_task_id = 10967558…`.

Single-sibling bundle. No forward dependency (sibling depends on seed's entry-point, not an unbuilt later sibling).

## Validation (Action 3, live Postgres)

| task | status | wave_id | milestone_id | parent_task_id |
|---|---|---|---|---|
| `10967558…` (seed) | todo | NULL | 84e17739 (M8) | NULL |
| `379978a4…` (sibling) | todo | NULL | 84e17739 (M8) | 10967558 (=seed) |

All checks pass. **validation: pass.**

## Pending flag carried to wave-47 P-0 (NOT resolved here)
The F-A follow-up needs a founder **"who's DM-able"** product decision — the Start-DM picker's candidate source (DM anyone vs. server co-members only). Product/taste Tier-3 call. N-2 only seeds; wave-47 P-0 owns the decision (routed per mode — BOARD under `automatic`). NOT a measured pause trigger.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 10967558-f27f-4f47-81be-5b5e5d878259"
  - "bundled siblings: 1"
  - "validation: pass"
seed_task_id: 10967558-f27f-4f47-81be-5b5e5d878259
seed_task_title: "DM Start-picker: make DMs startable — DM-candidate source + entry point"
bundled_sibling_ids: [379978a4-0497-449f-8807-4cffe53d1436]
claimed_task_ids: [10967558-f27f-4f47-81be-5b5e5d878259, 379978a4-0497-449f-8807-4cffe53d1436]
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
queue_exhausted: false
validation_failed: false
note: "F-A DM-entry-point bundle (feature-completion, not debt). Wave-47 P-0 must resolve the founder who's-DM-able product decision before B."
```
