# N-2 — Seed (wave-68 → seeds wave-69)

Block: N (Next). head-next owns the block. Mode: automatic.

## Actions

**Action 1 — Pick the seed.** Under active milestone M14 (`6a9424fe-c943-4b26-9110-6915661a6fb9`), the sole `parent_task_id IS NULL AND wave_id IS NULL AND status='todo'` row is the bundle the N-1 decomposition just authored:

- **seed** `9f2bb017-fd19-464d-ab2b-c13ed75c04bb` — "Add report substrate + directory-level unlist for public discovery"

Only one seed candidate exists (verified: `count=1`), so no re-ordering judgment needed.

**Action 2 — Load siblings** (`parent_task_id = seed`, `wave_id IS NULL`, `status='todo'`):

- `d7250881-eb30-40fc-880a-95cf055c2425` — "Wire owner/moderator report-action loop reusing ModerationService"
- `96d5ed58-ccc9-482a-a469-ec714edb7962` — "Build student report UI + owner report inbox surfaces"

**Action 3 — Validate the bundle** (re-confirmed against the DB this stage):

| id | status | wave_id | milestone_id | parent_task_id | verdict |
|---|---|---|---|---|---|
| 9f2bb017 (seed) | todo | NULL | 6a9424fe (M14) | NULL | PASS |
| d7250881 (sib) | todo | NULL | 6a9424fe (M14) | 9f2bb017 | PASS |
| 96d5ed58 (sib) | todo | NULL | 6a9424fe (M14) | 9f2bb017 | PASS |

All rows `status='todo'`, `wave_id IS NULL`, `milestone_id = M14`; siblings correctly parent to the seed. Validation **PASS**.

**Action 5 — Emit claimed_task_ids** = `[9f2bb017, d7250881, 96d5ed58]`. B-0 of wave-69 claims this batch (`wave_id=<new>`, `status='in_progress'`); L-2 of wave-69 closes it.

## Slice summary (for wave-69 P-0/P-1)
Foundational report → action primitive for M14's public-launch gate: a session-authed student report substrate (reports table + `POST /reports`) + directory-level **unlist** (owner-initiated `is_public=false` pulls a server out of `GET /servers/discover`) + an owner/moderator report-action loop routed through the existing wave-41 `ModerationService` (reusing `can(moderate_members)` + the rank guard + message soft-delete) + minimal client report + inbox surfaces. No second permission system. ~2,800 net LOC. **Deferred to later M14 bundles** (in task prose): platform-admin (non-owner) unlist, user-to-user block, full report-review queue UI, appeal flow, automated detection, report rate-limits. Expect ≥1 more M14 bundle before the launch gate is fully met. Bundle is substantial → wave-69 P-1 sizes/decomposes as usual.

## head-next stage-exit gate (N-2)

- [x] WIP-limited: one seed + 2 tightly-scoped siblings (all trace M14 ## Scope; deferred scope explicitly named, not padded in).
- [x] Seed has `parent_task_id IS NULL`; every sibling has `parent_task_id = seed.id`.
- [x] Every bundled task carries `milestone_id = M14`, `wave_id = NULL`, `status = 'todo'`.
- [x] Dependencies sequenced: seed (report substrate + unlist) → sib1 (action loop on the substrate) → sib2 (UI on both). No sibling depends on unbuilt later scope.
- [x] Bundle authored by the milestone-decomposer ritual, not hand-INSERTed.

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Single seed candidate under M14 picked (9f2bb017) with 2 correctly-parented siblings, all
    todo/wave_id-NULL/milestone-M14, re-validated against Postgres this stage (PASS). Bundle is
    the decomposer's ritual output, WIP-limited, dependency-sequenced, with later M14 scope
    explicitly deferred rather than crammed. claimed_task_ids emitted for wave-69 B-0.
  next_action: PROCEED_TO_N-3

n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 9f2bb017-fd19-464d-ab2b-c13ed75c04bb"
  - "bundled siblings: 2 (d7250881, 96d5ed58)"
  - "validation: pass"
seed_task_id: 9f2bb017-fd19-464d-ab2b-c13ed75c04bb
seed_task_title: "Add report substrate + directory-level unlist for public discovery"
bundled_sibling_ids:
  - d7250881-eb30-40fc-880a-95cf055c2425
  - 96d5ed58-ccc9-482a-a469-ec714edb7962
claimed_task_ids:
  - 9f2bb017-fd19-464d-ab2b-c13ed75c04bb
  - d7250881-eb30-40fc-880a-95cf055c2425
  - 96d5ed58-ccc9-482a-a469-ec714edb7962
active_milestone_id: 6a9424fe-c943-4b26-9110-6915661a6fb9
queue_exhausted: false
validation_failed: false
note: "M14 first bundle. wave_id NULL confirmed (per memory: V-2 follow-up wave_id-NULL discipline honored by decomposer)."
```

## Next
→ N-3 (archive + handoff).
