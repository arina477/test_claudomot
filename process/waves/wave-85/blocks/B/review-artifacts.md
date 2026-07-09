# Wave 85 — B-block review artifacts
**Block:** B (Build) · **Wave topic:** AssignmentCard optimistic toggle-revert (snapshot-restore + visible toast + a11y) · **Block exit gate:** B-6 · **Status:** in-progress
## Stage deliverables
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | in-progress | branch; no deps/schema |
| B-1 | stages/B-1-contracts.md | pending | SKIP |
| B-2 | stages/B-2-backend.md | pending | SKIP |
| B-3 | ... | done | snapshot-restore + visible toast + a11y (64c3b3eb) |
| B-4/5/6 | ... | pending | |
## Block-specific context
- Spec: task 3ad35a42 (incl. p4-phase2-corrections + p4-watch-items). Branch wave-85-assignment-toggle-revert. claimed [3ad35a42].
- **CARRY (P-4 folded):** (1) snapshot prev=assignment.myStatus before flip, restore on error (NOT opposite); (2) VISIBLE error toast (onAnnounce is sr-only) reusing app Toast pattern + a11y onAnnounce; (3) UPDATE existing apps/web/src/shell/assignments.test.tsx:312 (currently asserts buggy behavior) — build test so opposite!=capturedPrior; (4) watch stale-closure (deps [assignment.id,onStatusChange]).
## Gate verdict log
<B-6>
