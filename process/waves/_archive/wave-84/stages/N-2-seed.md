# N-2 — Seed (wave-84 → wave-85)

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 3ad35a42-efe5-4e9d-8f90-d22d6fe345e8"
  - "bundled siblings: 0 (single-task bundle)"
  - "validation: pass"
  - "premise-check: HOLDS (defect present + unfixed in current code)"
  - "head-next N-2 gate: APPROVED (re-gated after founder-deferral + precedent reconciliation)"
seed_task_id: 3ad35a42-efe5-4e9d-8f90-d22d6fe345e8
seed_task_title: "Assignments: optimistic toggle revert should restore captured prior state"
bundled_sibling_ids: []
claimed_task_ids: [3ad35a42-efe5-4e9d-8f90-d22d6fe345e8]
active_milestone_id: null
queue_exhausted: false
validation_failed: false
note: >
  milestone_id NULL BY DESIGN — bug-fix phase, structurally identical to waves 81–84.
  Single-spec seed, no siblings.
```

## Candidate survey

Surveyed the 12 oldest seedable candidates. Prefer high-value, well-scoped, single-spec bug fixes; head-next steered to `3ad35a42` (assignments optimistic-toggle-revert) as first choice — real user-facing correctness defect, fast to repro, self-contained, no new-feature surface (roadmap territory, deferred). Security-continuity alternative `f8fb8023` (anti-CSRF VIA_TOKEN) held in reserve. Avoided this phase: `ee6421a7` (feature-flavored parsing), `f51ace12` (design polish), `024a1483` (cosmetic PWA icon).

## PREMISE VERIFICATION — HOLDS

**Task claim:** AssignmentCard optimistic toggle revert assumes the opposite state on failure rather than restoring the captured prior value, and logs to console with no user-facing toast (AssignmentCard.tsx:166-170; live at handleToggle).

**Verified against current code** — `apps/web/src/shell/AssignmentCard.tsx` `handleToggle` (lines 652-664):

```js
const newState = e.currentTarget.checked ? 'done' : ('todo' as const);
onStatusChange(assignment.id, newState);
try {
  await api.setAssignmentStatus(assignment.id, { state: newState });
} catch (err) {
  console.error('[AssignmentCard] status toggle failed', err);
  onStatusChange(assignment.id, newState === 'done' ? 'todo' : 'done'); // BUG: assumes opposite of newState, not captured prior
}
```

Both defects PRESENT and UNFIXED:
1. Revert computes the OPPOSITE of `newState` (`newState === 'done' ? 'todo' : 'done'`) rather than restoring a captured prior value. Edge-case visual drift on a failed toggle (matches task's "correct in common case" framing).
2. On failure it only `console.error`s — NO user-facing toast/announce, despite an `announce` (onAnnounce) a11y channel being available in-component.

**Evaporation check (wave-83 ParseUUIDPipe lesson):** git history shows last touch to `AssignmentCard.tsx` was wave-42 (commit 07ebda95); no subsequent commit fixed this. grep across all branches for "optimistic / captured prior / toggle revert" returns only messaging/DM commits, none touching assignments. Premise did NOT evaporate.

## Bundle validation (Action 3)

Seed row confirmed live: `status='todo'`, `wave_id IS NULL`, `milestone_id IS NULL`, `parent_task_id IS NULL`. No siblings (`parent_task_id = seed` → 0 rows). Single-task bundle — valid.

## Fix shape (for wave-85 P-2 spec)

Snapshot prior `assignment.myStatus` before the optimistic `onStatusChange` flip; on error restore the captured prior value (not the assumed opposite) + fire `announce(...)` / a toast. Bounded, single-file (+ `assignments.test.tsx`).

## Verdict

COMPLETE. Seed 3ad35a42 approved by head-next N-2 gate. Proceed to N-3.
