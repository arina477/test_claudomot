# Wave 17 — P-block review artifacts

**Block:** P (Product)
**Wave topic:** Real-Postgres mid-transaction-failure rollback test for create-server (test-infra; builds the real-PG test harness)
**Block exit gate:** P-4
**Status:** in-progress

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| P-0 | process/waves/wave-17/stages/P-0-frame.md | done | PROCEED; ceo BINDING note (2/3 tech-debt line → N-1 BOARD if wave-18 tech-debt) |
| P-1 | process/waves/wave-17/stages/P-1-decompose.md | done | PROCEED single-spec; floor-exempt (test-infra, wave-16 precedent); design_gap FALSE |
| P-2 | tasks.description of 25523fb0 (+pointer) | done | single-spec; real-PG rollback test |
| P-3 | process/waves/wave-17/stages/P-3-plan.md | done | reuse CI Postgres service + migrate + real txn; no new dep; forced mid-txn failure |
| P-4 | process/waves/wave-17/stages/P-4-gemini-review.md | pending | |

## Block-specific context
- **Wave topic:** real-Postgres integration test forcing a mid-txn failure in createServer → assert NO orphan rows (server/category/channel/membership). Replaces the always-invoke db.transaction stub.
- **Spec-contract short-circuit verdict:** no-prior-spec (prose)
- **Roadmap milestone:** M3 (seed is an M3 top-level todo, wave-7 carry)
- **design_gap_flag:** FALSE (backend integration test; no UI → D-block SKIPS)
- **claimed_task_ids:** [25523fb0] (+ possibly 02fa8011 real-PG tier — P-1 bundle decision)
- **Stale-claim cleanup done at P-0:** cleared wave_id on 6 parked M3 todos (02fa8011, 6a546c7b, d23a0740, 67881a58, c18b8089, 4e994e96) → seedable again.
- **02fa8011 dependency:** the real-PG harness this wave builds IS what 02fa8011 (real-PG integration tier) wants — P-1 may bundle them; V-3 flagged 02fa8011 3rd-recurrence escalation.
- **Autonomous mode:** automatic

## Open escalations carried into gate
none

## Gate verdict log
<appended by head-product at P-4>
