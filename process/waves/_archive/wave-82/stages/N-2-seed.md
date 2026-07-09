# N-2 — Seed (wave-82 → wave-83)

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 4a92327c-8432-4841-a1d3-c0b4405396a5"
  - "bundled siblings: 0"
  - "validation: pass (status=todo, wave_id=NULL, milestone_id=NULL, parent_task_id=NULL)"
seed_task_id: 4a92327c-8432-4841-a1d3-c0b4405396a5
seed_task_title: "API robustness: ParseUUIDPipe on :serverId / :id path params (non-UUID → 400 not 500)"
bundled_sibling_ids: []
claimed_task_ids:
  - 4a92327c-8432-4841-a1d3-c0b4405396a5
active_milestone_id: null
queue_exhausted: false
validation_failed: false
note: >
  Picked from the 36-deep unassigned bug-fix backlog (milestone_id NULL, parent_task_id NULL,
  wave_id NULL, status todo). Single-seed, 0-sibling bundle — the correct WIP-limited shape for
  a clean bug-fix wave (head-next APPROVED; N-2 Action 2 permits an empty sibling list).

  Rationale for this seed: a founder-flagged, tightly-scoped API robustness + security fix.
  Today a malformed (non-UUID) :serverId / :id path param on GET /servers/:serverId/me/permissions
  and the assignments endpoints reaches the DB layer and returns a 500 instead of a clean 400.
  Adding ParseUUIDPipe turns malformed-input server errors into correct bad-request responses across
  several endpoints — a genuine user-facing + security-signal improvement with low blast radius and
  a single-spec footprint. Preferred over the higher-blast-radius auth/CSRF candidate (f8fb8023) and
  over the transient-401 fast-follow, keeping this a clean, self-contained bug-fix wave.
```
