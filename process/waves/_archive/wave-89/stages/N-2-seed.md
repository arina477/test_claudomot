# N-2 — Seed (wave-89 → seeds wave-90)

## Actions

- **Action 1 — Pick seed:** No active milestone, so the seed is drawn from the unassigned queue (bug-fix phase, consistent with waves 82–89). Selected `024a1483-24c6-4a8a-b209-8468727b3d41` — "[bug-design] PWA manifest icon /icons/icon-192.png 404s". Premise-verified LIVE-AND-REACHABLE at N-1 (see N-1 critical evaluation).
- **Action 2 — Load siblings:** none (`SELECT ... WHERE parent_task_id='024a1483...' AND status='todo' AND wave_id IS NULL` → 0 rows). Single-task bundle (valid).
- **Action 3 — Validate:** seed row confirmed `status='todo'`, `wave_id IS NULL`, `parent_task_id IS NULL`. Pass. (`milestone_id IS NULL` — the unassigned-queue seed pattern established across the bug-fix phase; N-2 does not require a milestone link for an unassigned-queue seed.)
- **Action 5 — claimed_task_ids:** `[024a1483-24c6-4a8a-b209-8468727b3d41]`.

## Deliverable

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 024a1483-24c6-4a8a-b209-8468727b3d41"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: 024a1483-24c6-4a8a-b209-8468727b3d41
seed_task_title: "[bug-design] PWA manifest icon /icons/icon-192.png 404s"
bundled_sibling_ids: []
claimed_task_ids:
  - 024a1483-24c6-4a8a-b209-8468727b3d41
active_milestone_id: null
queue_exhausted: false
validation_failed: false
note: "Single-task bug-fix bundle from the unassigned queue (roadmap complete, re-plan founder-deferred). Real reachable defect: PWA manifest icons genuinely missing (apps/web/public/ absent), 404 on every install."
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: "Seed is a WIP-limited single-task bundle; validated against the live tasks table (todo / wave_id NULL / parent NULL). Real, reachable functional defect premise-verified with file:line evidence. No bundle bloat."
  next_action: PROCEED_TO_N-3
```
