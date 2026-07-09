# Wave 82 — P-3 Plan
## Approach
- **Changed — api.ts shared seam:** request()/requestNoContent() wrap the fetch so a 401 triggers a single-flight Session.attemptRefreshingSession(); on true → retry once; on false → throw HttpError(401) (genuine logout). A module-level shared `refreshPromise` (single-flight) so N concurrent 401s await ONE refresh, then each retries once. **Alt:** per-call refresh — REJECTED (thundering herd of refreshes + the exact race we're fixing). **Alt:** DM-view catch — REJECTED (wrong layer; useDm already doesn't navigate; leaves every other route exposed). **Chosen:** the shared seam, mirroring the existing retryOn429 shape. Failure-domain: client auth-resilience only; no server/API/schema change.
## Data / API / deps
- None (Session.attemptRefreshingSession is already available via the initialized Session recipe).
## Plan (by B-stage)
- **B-0 Branch** `wave-82-api-401-refresh-retry`. No schema. | orchestrator.
- **B-1 Contracts** — SKIP (no contract/type change; internal helper).
- **B-2 Backend** — SKIP (frontend-only).
- **B-3 Frontend** — | **supertokens-integration** (owns the SuperTokens session-refresh seam) with **react-specialist** consult if needed | api.ts request()/requestNoContent() 401 refresh-and-retry + single-flight shared refresh; tests (401→refresh-true→retry-200 asserting 2 fetches; 401→refresh-false→propagate/genuine-logout; retry-once-only; N-concurrent→one-refresh; a non-DM route for global coverage; no 429/offline regression). Mirror retryOn429's structure.
- **B-4 Wiring / B-5 Verify / B-6 Review** — standard.
## Specialist routing (AGENTS.md)
supertokens-integration (session-refresh seam) [+ react-specialist consult]. Present. No D-block, B-1/B-2 skipped.
## Self-consistency
Every AC → the request()/requestNoContent() seam + tests. design_gap false. Alternatives (per-call-refresh + DM-catch rejected). No deps/API/data. ✓
**Binding:** single-flight shared refresh (burst-401s); genuine-logout guard (refresh=false → propagate, T-8); retry once only on 401; deterministic tests incl. non-DM route + concurrency; scope = the seam.

## P-4 Phase-2 binding corrections (fold into B-3)
- **INTERCEPTOR-INTERACTION (Iron Law, before coding):** SuperTokens' Session.init already installs a global fetch auto-refresh interceptor with its own single-flight lock + bounded retry. B-3 (supertokens-integration) MUST first trace whether the escaping 401 is interceptor-EXHAUSTED (a 2nd refresh = no-op → the plan fixes nothing; address the REAL cause: local-session-state short-circuit / SessionAuth claim re-validation racing the interceptor) OR interceptor-skipped (explicit seam helps). The seam is net-additive-safe (shared SDK lock), but must not ship a no-op.
- **Tests prove RESOLUTION not just refresh-called:** 401→refresh-true→retry→200 asserts the caller gets 200 (2 fetches) vs a realistic interceptor-aware mock; a call-only assertion would pass a no-op (forbidden). N-concurrent→one-refresh→all-resolve.
- **Redirect destination:** reconcile / (LandingPage, per P-0) vs /login (AuthGuard/SessionAuth default) — assert the ACTUAL route.
- **T-9:** mark journey-map F-T5-1 (~L296) self-healed.
