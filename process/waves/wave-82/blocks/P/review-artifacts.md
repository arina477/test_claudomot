# Wave 82 — P-block review artifacts
**Block:** P (Product) · **Wave topic:** Fix DM auth-guard bounce-to-home on a transient 401 (SuperTokens refresh-and-retry) · **Gate:** P-4 · **Status:** in-progress
## Stage deliverables
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| P-0 | ... | done | discovery + reframe (bug root-caused) |
| P-1 | ... | done | |
| P-2 | ... | done | |
| P-3 | ... | done | |
| P-4 | stages/P-4-gemini-review.md | pending | |
## Block-specific context
- **Wave topic:** DM auth-guard transient-401 bounce (founder bug-fix phase; roadmap complete)
- **Spec-contract short-circuit:** no-prior-spec
- **Roadmap milestone:** NONE (14/14 done). Task 0e58af8e milestone_id NULL. mvp-thinner SKIPPED (no product-feature milestone).
- **design_gap_flag:** unset — likely false (auth/api-client fix, no new UI surface)
- **claimed_task_ids:** [0e58af8e] — final at P-2
- **Autonomous mode active during P-block:** automatic
## Open escalations carried into gate
- ROOT CAUSE (orchestrator, to verify): `apps/web/src/auth/api.ts request()` (raw fetch, ~L127) throws HttpError(401) on a stale-token 401 with NO SuperTokens refresh-and-retry. SuperTokens Session.init() (supertokens.ts) normally installs a global fetch interceptor that auto-refreshes on 401 — but these DM fetches either bypass it OR lose a concurrent-refresh race, so a transient 401 (valid refresh token) bounces to home/login instead of silently refreshing. AuthGuard = <SessionAuth requireAuth> (redirects on no-session). FIX direction: ensure a transient 401 attempts Session.attemptRefreshingSession() + retries once before treating it as unauthenticated; don't hard-bounce on a single transient 401. supertokens-integration + react-specialist.
## Gate verdict log
<P-4>
