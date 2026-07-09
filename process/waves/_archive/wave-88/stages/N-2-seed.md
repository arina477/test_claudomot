# N-2 — Seed (wave-89)

Owner: head-next. Mode: automatic.

## Action 1 — Pick the seed

No active milestone (roadmap complete). Seed drawn from the unassigned bug queue (bug-fix phase). Candidate premises re-verified against LIVE code before selection (PRODUCT rule 1; four prior evaporations).

**Selected seed: `45f0a88d-90dd-47b1-a827-e6cf8bbf606e`** — "Scroll+focus the first errored profile field on failed save".

Why this one (verified-live bug):
- **Verified LIVE** in `apps/web/src/pages/ProfilePage.tsx`: the save handlers (`handleAcademicSave`, lines ~345–385) set an error string on validation failure but never call `scrollIntoView()` / `.focus()` — `grep "scrollIntoView\|focus()"` returns nothing in the file. A failed save on a field scrolled out of view leaves the user with no visible indication of what failed.
- **Genuine functional UX defect**, not a doc-mismatch or cosmetic asset gap. Self-contained, small scope, single-file React fix.
- **Rejected alternatives:** `024a1483` (PWA icon 404) is LIVE but cosmetic and needs binary PNG asset generation, not a code fix; `6e28e2cb` (.strict() missing) is LIVE but the report itself confirms it's mass-assignment SAFE — marginal doc/enforcement hardening. `f9985cea`, `ed34c749`, `8f0221cb` all verified ALREADY FIXED in current code.

## Action 2 — Load siblings

`SELECT id FROM tasks WHERE parent_task_id='45f0a88d...' AND status='todo' AND wave_id IS NULL` → **0 rows**. Single-task bundle (expected — unassigned-queue bugs have no parent/siblings).

## Action 3 — Validate the bundle

`SELECT id,status,wave_id,milestone_id,parent_task_id FROM tasks WHERE id='45f0a88d-90dd-47b1-a827-e6cf8bbf606e'`:
- `status = 'todo'` ✓
- `wave_id IS NULL` ✓
- `milestone_id IS NULL` (unassigned bug — no active milestone; acceptable in bug-fix phase) ✓
- `parent_task_id IS NULL` (seed) ✓

Validation **PASS**. (Note: the N-2 stage template's `milestone_id = $active` check is N/A here — there is no active milestone in the roadmap-complete bug-fix phase; the seed is a top-level unassigned bug, which B-0 claims by id-array regardless of milestone linkage.)

## Action 5 — claimed_task_ids

`claimed_task_ids = ["45f0a88d-90dd-47b1-a827-e6cf8bbf606e"]`

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 45f0a88d-90dd-47b1-a827-e6cf8bbf606e"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: 45f0a88d-90dd-47b1-a827-e6cf8bbf606e
seed_task_title: "Scroll+focus the first errored profile field on failed save"
bundled_sibling_ids: []
claimed_task_ids: ["45f0a88d-90dd-47b1-a827-e6cf8bbf606e"]
active_milestone_id: null
queue_exhausted: false
validation_failed: false
note: "Bug-fix phase, no active milestone. Seed is a verified-live functional UX defect in apps/web/src/pages/ProfilePage.tsx (no scrollIntoView/focus on failed save). Premise confirmed against live code; 3 of the brief's other candidates were already FIXED."

head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Single-task bundle limits WIP correctly. Seed 45f0a88d is a genuinely-live, well-scoped functional bug
    (verified against live ProfilePage.tsx — no scroll/focus on failed save), not a stale/deferred/already-shipped
    or marginal item. Validation passed against the DB (todo, wave_id NULL, parent NULL). No hand-authored task —
    picked from the existing unassigned queue. Backlog is not drained: this is a real bug, and other actionable
    items remain (024a1483, 6e28e2cb) for future waves.
  next_action: PROCEED_TO_N-3
```
