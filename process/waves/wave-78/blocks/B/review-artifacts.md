# Wave 78 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** member-profile-card UX polish — academicRole clearable + hidden-vs-transient-error on card
**Block exit gate:** B-6
**Status:** in-progress

## Stage deliverables

| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | process/waves/wave-78/stages/B-0-branch-and-schema.md | done | schema sub-actions skip (no migration) |
| B-1 | process/waves/wave-78/stages/B-1-contracts.md | done | typescript-pro (shared profile contract) |
| B-2 | process/waves/wave-78/stages/B-2-backend.md | done | backend-developer (users.service undefined-vs-null) |
| B-3 | process/waves/wave-78/stages/B-3-frontend.md | done | react-specialist (editor + api.ts + card + tests) |
| B-4 | process/waves/wave-78/stages/B-4-wiring.md | done | |
| B-5 | process/waves/wave-78/stages/B-5-verify.md | pending | |
| B-6 | process/waves/wave-78/stages/B-6-review.md | pending | |

## Block-specific context

- **Spec contract:** tasks row 4be3b084 (DB); spec at process/waves/wave-78/stages/P-2-spec.md
- **Branch name:** wave-78-profile-card-polish
- **claimed_task_ids:** [4be3b084 (seed — academicRole clearable), 3b3530d8 (sibling — card hidden-vs-error)]
- **New deps added this wave:** none
- **New env vars added this wave:** none
- **Schema changes this wave:** none (users.academic_role already nullable text; no migration)
- **B-1 fast-path approved:** false (B-1 has a real contract change)
- **Files implemented (cumulative):** <updated at B-2, B-3, B-4>
- **Deviations from plan logged this block:** none

## Open escalations carried into gate

- head-product P-4 note: write-path fix lands in apps/api/src/users/users.service.ts (L71/L83/L113), not a "profile.service".
- jenny P-4 note: T-9 must add the 5th card state (retryable transport-error) to the journey map; hidden stays byte-identical.

## Gate verdict log

<appended by fresh head-builder spawn at B-6 Action 1>
