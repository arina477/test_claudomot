# Wave 42 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** Assignment collect/return — submission (table + submit + member-presign) + educator roster + return-with-comment
**Block exit gate:** B-6
**Status:** gate-passed

## Stage deliverables

| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch+migration 0019 (assignment_submissions); typecheck clean |
| B-1 | stages/B-1-contracts.md | done | 6 schemas + mySubmission; shared typecheck clean |
| B-2 | stages/B-2-backend.md | done | 4 endpoints, IDOR-safe, resubmit-clears-return, member-presign; api typecheck clean |
| B-3 | stages/B-3-frontend.md | done | submit + roster + return dialog; typecheck+biome clean; permission-gated |
| B-4 | stages/B-4-wiring.md | done | repo typecheck 4/4 clean; 4 routes registered; no drift |
| B-5 | stages/B-5-verify.md | done | lint/unit(354)/build all green; live smoke → T-block |
| B-6 | stages/B-6-review.md | done | head-builder APPROVED (attempt2); /review CLEAN (H1+L1 fixed) |

## Block-specific context

- **Spec contract:** tasks row db8e082a (DB); spec at process/waves/wave-42/stages/P-2-spec.md
- **Branch name:** wave-42-assignment-submissions
- **claimed_task_ids:** [db8e082a (submission), 1746f72a (roster), b859984b (return)]
- **New deps added this wave:** none
- **New env vars added this wave:** none
- **Schema changes this wave:** NEW assignment_submissions table (single migration; returned_at + organizer_comment folded in per P-0 finding #2)
- **B-1 fast-path approved:** false (contract changes present)
- **Files implemented (cumulative):** (updated B-2/B-3/B-4)
- **Deviations from plan logged this block:** none

## Open escalations carried into gate

none

## Gate verdict log

<appended by fresh head-builder spawn at B-6>

## Block exit / handoff
```yaml
build_block_status:    complete
branch:                wave-42-assignment-submissions
stages_run:            [B-0, B-1, B-2, B-3, B-4, B-5, B-6]
stages_skipped:        []
review_verdict:        APPROVE
deviations_logged:     ["frontend single-commit (shared UI) — ratified", "attachment.id=object_key inline", "barrel exports in shared/index.ts"]
last_commit_sha:       cef9fb8
ready_for_ci:          true
```
