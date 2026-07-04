# Wave 43 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** Class scheduling — scheduled_sessions entity + scheduling module (5 endpoints) + authoring modal + calendar view + session detail
**Block exit gate:** B-6
**Status:** in-progress

## Stage deliverables

| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch+migration 0020 (scheduled_sessions); typecheck clean |
| B-1 | stages/B-1-contracts.md | done | 4 schemas + refines; shared typecheck clean |
| B-2 | stages/B-2-backend.md | pending | scheduling module + 5 endpoints |
| B-3 | stages/B-3-frontend.md | pending | SessionForm + ClassCalendar + SessionDetail |
| B-4 | stages/B-4-wiring.md | pending | |
| B-5 | stages/B-5-verify.md | pending | |
| B-6 | stages/B-6-review.md | pending | |

## Block-specific context

- **Spec contract:** tasks row 535bdb8c (DB); spec at process/waves/wave-43/stages/P-2-spec.md
- **Branch name:** wave-43-class-scheduling
- **claimed_task_ids:** [535bdb8c (backend+modal), cdf81427 (calendar view), 1216146e (session detail)]
- **New deps added this wave:** none
- **New env vars added this wave:** none
- **Schema changes this wave:** NEW scheduled_sessions table (single migration)
- **B-1 fast-path approved:** false
- **Files implemented (cumulative):** (updated B-2/B-3/B-4)
- **Deviations from plan logged this block:** none

## Open escalations carried into gate

none

## Gate verdict log

<appended by fresh head-builder spawn at B-6>
