# Wave 66 — B-block review artifacts
**Block:** B (Build)
**Wave topic:** offline empty-state copy polish — split ChannelSidebar detailStatus==='error' by connection state (offline→neutral, online→error)
**Block exit gate:** B-6
**Status:** gate-passed
## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch + claim; no schema |
| B-1 | stages/B-1-contracts.md | skipped | no contract change |
| B-2 | stages/B-2-backend.md | skipped | no server change |
| B-3 | stages/B-3-frontend.md | done | ChannelSidebar copy split + 3 tests; 565 pass |
| B-4 | stages/B-4-wiring.md | done | typecheck 4/4 |
| B-5 | stages/B-5-verify.md | done | lint clean, 565/565, build ok |
| B-6 | stages/B-6-review.md | done | Phase1 APPROVED; /review 0 findings |
## Block-specific context
- **Spec contract:** tasks row 6018bdee-1b99-47b2-8235-b3786c29c2d5; pointer stages/P-2-spec.md
- **Branch name:** wave-66-offline-empty-state-copy
- **claimed_task_ids:** [6018bdee-1b99-47b2-8235-b3786c29c2d5]
- **New deps:** none  **New env vars:** none  **Schema changes:** none
- **CARRY-FORWARD (P-4 karen):** B-3/B-5 must mock useConnectionState deterministically per case (jsdom socket disconnected → derives 'offline'; else the online-error assertion is untestable)
## Open escalations carried into gate
none
## Gate verdict log
<appended by fresh head-builder spawn at B-6>
