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

## Build-block exit handoff
```yaml
build_block_status:    complete
branch:                wave-85-assignment-toggle-revert
stages_run:            [B-0, B-3, B-4, B-5, B-6]
stages_skipped:        [B-1 (no contracts), B-2 (no backend)]
review_verdict:        APPROVE
last_commit_sha:       72c424fe
ready_for_ci:          true
flakes_documented:     [assignments.test.tsx pre-existing realtime flake in a DIFFERENT describe block (not the new toggle tests)]
```
## C-block note
Frontend-only (apps/web). No migration. Deploy the WEB service only at C-2. T-8: no auth surface — T-8 SKIPS (not an auth wave); T-5 live-verifies the toggle-failure toast + restore on the deployed app.
