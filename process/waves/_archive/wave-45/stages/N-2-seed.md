# N-2 — Seed (wave-45 → wave-46)

Picks the next bundle under the active milestone M8 for wave-46. Seed + siblings
identified only; no status writes (B-0 claims, L-2 closes).

## Action 1 — Pick the seed

Active milestone: **M8** (`84e17739-af5e-4396-beb9-b6f3d6836fc4`, `in_progress`).

The N-1 pause was resolved by the founder (2026-07-04): build M8 direct/group
messages first ("go with B and connect it yourself"); M8 success-metric set.
A DMs feature bundle was authored under M8 by the milestone-decomposition ritual
(all `milestone_id=M8`, `wave_id=NULL`, `status=todo`).

**Seed override — explicit reasoning (per N-2 Action 1 "LLM may re-order"):**
The default seed-picker takes the oldest `parent_task_id IS NULL` row under the
milestone by `created_at`. Two older top-level rows exist — the wave-45 V-2 debt
stragglers `f8eb49c1` and `a1dda389` (M8 follow-ups). Those are NOT wave-46's seed.
The founder directed DMs as wave-46's slice, and the DMs seed `a48f1910` is the
milestone's next scope slice, freshly authored per that direction. Per Action 1's
"prefer whichever the milestone scope needs next," I seed the founder-directed
DMs bundle. The debt stragglers remain queued (`wave_id=NULL`, `status=todo`) for
a later wave.

- `seed_task_id`: `a48f1910-473f-4a4a-bed6-385ec8d8c2d3`
- `seed_task_title`: "Add DM conversations schema + participant-gated backend spine"

## Action 2 — Load siblings

Siblings (`parent_task_id = a48f1910`, `status=todo`, `wave_id=NULL`):

- `32f5d29e-ba81-4a2e-a29c-53c4752f5fe4` — Fan out new DM messages over Socket.IO to participants
- `1ceffdc9-4a38-4bdd-b287-747ea7a2e319` — Build minimal DM UI: conversation list, thread, composer
- `d8264800-765d-443b-9d29-217d58dff308` — Make DM send offline-tolerant via the existing outbox

## Action 3 — Validate the bundle

DB re-confirm (`SELECT id, status, wave_id, milestone_id, parent_task_id`):

| id | status | wave_id | milestone_id | parent_task_id | verdict |
|---|---|---|---|---|---|
| a48f1910 (seed) | todo | NULL | 84e17739 (M8) | NULL | PASS |
| 32f5d29e | todo | NULL | 84e17739 (M8) | a48f1910 | PASS |
| 1ceffdc9 | todo | NULL | 84e17739 (M8) | a48f1910 | PASS |
| d8264800 | todo | NULL | 84e17739 (M8) | a48f1910 | PASS |

All 4 rows: `status='todo'`, `wave_id IS NULL`, `milestone_id=M8`; every sibling
`parent_task_id = a48f1910`. **Validation: PASS.**

## Action 5 — Emit claimed_task_ids

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: a48f1910-473f-4a4a-bed6-385ec8d8c2d3"
  - "bundled siblings: 3 (32f5d29e, 1ceffdc9, d8264800)"
  - "validation: pass (all todo / wave_id NULL / milestone_id=M8 / siblings parent=a48f1910)"
seed_task_id: a48f1910-473f-4a4a-bed6-385ec8d8c2d3
seed_task_title: "Add DM conversations schema + participant-gated backend spine"
bundled_sibling_ids:
  - 32f5d29e-ba81-4a2e-a29c-53c4752f5fe4
  - 1ceffdc9-4a38-4bdd-b287-747ea7a2e319
  - d8264800-765d-443b-9d29-217d58dff308
claimed_task_ids:
  - a48f1910-473f-4a4a-bed6-385ec8d8c2d3
  - 32f5d29e-ba81-4a2e-a29c-53c4752f5fe4
  - 1ceffdc9-4a38-4bdd-b287-747ea7a2e319
  - d8264800-765d-443b-9d29-217d58dff308
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
queue_exhausted: false
validation_failed: false
note: >
  Seed override applied: DMs bundle a48f1910 seeded over the two older top-level
  debt stragglers (f8eb49c1, a1dda389) per founder-directed M8 slice. Stragglers
  stay queued (wave_id NULL, status todo) for a later wave.
```

---

head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Seed a48f1910 + 3 siblings validated against the live tasks table — all todo,
    wave_id NULL, milestone_id=M8, siblings' parent_task_id = seed. WIP-limited to
    one seed + tight siblings; dependency-sequenced (schema/backend spine → fan-out
    → UI → offline). Bundle was authored by the milestone-decomposer ritual (not
    hand-INSERTed). Seed override from the default oldest-parent-null picker to the
    founder-directed DMs slice is documented with explicit reasoning; the older debt
    stragglers remain queued, not lost. Every N-2 exit checkbox ticks.
  next_action: PROCEED_TO_N-3
