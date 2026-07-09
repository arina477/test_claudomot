# Wave 82 — B-block review artifacts
**Block:** B (Build) · **Wave topic:** DM/global transient-401 refresh-and-retry (interceptor-trace-first) · **Gate:** B-6 · **Status:** in-progress
## Stage deliverables
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| B-0 | ... | done | branch only |
| B-1 | ... | skipped |
| B-2 | ... | skipped |
| B-3 | stages/B-3-frontend.md | pending | supertokens-integration (trace-then-fix) |
| B-4/5/6 | ... | pending | |
## Block-specific context
- Spec: task 0e58af8e (DB, incl. P-4 BINDING CORRECTIONS). Branch wave-82-api-401-refresh-retry. claimed_task_ids [0e58af8e].
- **LOAD-BEARING (P-4/karen): interceptor-trace-first** — SuperTokens Session.init already installs a global fetch auto-refresh interceptor with single-flight+bounded-retry; B-3 must trace whether the escaping 401 is interceptor-EXHAUSTED (fix=no-op → address the REAL cause) or interceptor-skipped (explicit seam helps). Tests prove resolution-to-200, not just refresh-called. Genuine-logout guard (refresh=false→propagate). T-9 mark F-T5-1 self-healed.
## Gate verdict log
<B-6>

## Build-block exit handoff
```yaml
build_block_status:    complete
branch:                wave-82-api-401-refresh-retry
stages_run:            [B-0, B-3, B-4, B-5, B-6]
stages_skipped:        [B-1 (no contract change), B-2 (frontend-only)]
review_verdict:        APPROVE
deviations_logged:     ["B-3 plan framed fix as request()-level; trace proved Mechanism-3 (SessionAuth), primary fix moved to AuthGuard — folded per P-4 interceptor-trace mandate", "B-6 attempt-1 REWORK: attemptRefreshingSession-boolean gate was a no-op for NOT_EXISTS; corrected to settle-then-recheck"]
last_commit_sha:       673eb221
ready_for_ci:          true
review_status:         gate-passed
```
