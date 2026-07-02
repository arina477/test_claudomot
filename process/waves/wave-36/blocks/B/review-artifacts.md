# Wave 36 — B-block review artifacts

**Block:** B (Build) · **Wave topic:** M7 test-hardening — regression tests for the shipped privacy endpoints + states-AC docs re-scope + stub-date fix · **Block exit gate:** B-6 · **Status:** in-progress

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | schema SKIP (no deltas), no deps, no env |
| B-1 | stages/B-1-contracts.md | done-skip | no contract surface changes → fast-path B-2∥B-3 approved |
| B-2 | stages/B-2-backend.md | pending | api tests (node-specialist) |
| B-3 | stages/B-3-frontend.md | pending | toUiVisibility unit + date fix (react-specialist) + docs |
| B-4 | stages/B-4-wiring.md | pending | repo typecheck + run new tests (verify tier executes) |
| B-5 | stages/B-5-verify.md | pending | |
| B-6 | stages/B-6-review.md | pending | |

## Block-specific context
- **Spec contract:** tasks row 622a7bf3 (DB). **Branch:** wave-36-privacy-tests.
- **claimed_task_ids:** [622a7bf3 tests, 73e96a9d states-AC docs, b7feab30 stub-date]
- **New deps:** none. **New env vars:** none. **Schema changes:** none (schema sub-actions skipped).
- **wave_type:** multi-spec. **B-1 fast-path approved:** TRUE (no contract changes).
- **BINDING:** real-PG integration for authz tests (no mock-the-SUT); seed profile_visibility via harnessQuery (karen note); T-4 verifies tier provably executed (jenny/wave-24 false-green).
- **Files implemented (cumulative):** <B-2, B-3>
- **Deviations:** none

## Open escalations carried into gate
none

## Gate verdict log
<head-builder at B-6>
