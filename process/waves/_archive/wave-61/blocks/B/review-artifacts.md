# Wave 61 — B-block review artifacts
**Block:** B (Build) — **Wave topic:** DM read throttle right-size (@Throttle 60/60s) + client 429 backoff
**Block exit gate:** B-6 — **Status:** gate-passed
## Stage deliverables
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch + claim; no schema |
| B-1 | stages/B-1-contracts.md | skipped | no contract SHAPE change (@Throttle decorator + client retry); fast-path B-2∥B-3 approved |
| B-2 | stages/B-2-backend.md | done | @Throttle(60/60s) 3 DM reads; writes untouched; 26/26 |
| B-3 | stages/B-3-frontend.md | done | retryOn429 helper + HttpError; 3 DM reads wrapped; writes not; 10+18 tests |
| B-4 | stages/B-4-wiring.md | done | full web 477/477; HttpError no drift |
| B-5 | stages/B-5-verify.md | done | tsc+477 web+152 api+biome clean |
| B-6 | stages/B-6-review.md | done | head-builder APPROVED; 0 findings |
## Block-specific context
- Spec: 874bd233; Branch: wave-61-dm-throttle; claimed_task_ids: [874bd233]
- Schema/deps/env: none. B-1 fast-path approved: true (no contract shape change; B-2 backend + B-3 client disjoint files)
- Security surface: rate-limit → T-8 applies; T-8 carry-forward: verify writes 10/60s, reads 60/60s, constant=60, no route un-throttled

## Final Status (post B-6)
build_block_status: complete
branch: wave-61-dm-throttle
stages_run: [B-0, B-2, B-3, B-4, B-5, B-6]
stages_skipped: [B-1 (no contract shape change; fast-path)]
review_verdict: APPROVE (head-builder Phase 1 APPROVED; Phase 2 0 findings)
last_commit_sha: 7b8c923
gate_status: gate-passed
ready_for_ci: true
