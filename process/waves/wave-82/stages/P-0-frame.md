# Wave 82 — P-0 Frame

## Discover section
- **wave_db_id:** d51126a0-3266-4bd0-b9f8-68fa5664da7c (wave_number 82; milestone_id NULL — roadmap complete, founder bug-fix phase)
- **Prior-work citation:** bug surfaced at wave-79 T-5 (F-T5-1) + wave-80 V-1 jenny; the api client's `request()`/`requestNoContent()` (api.ts) + SuperTokens Session.init (supertokens.ts) + AuthGuard SessionAuth. The `retryOn429` seam at this same layer is the fix precedent.
- **Roadmap milestone:** NONE (14/14 done). Task 0e58af8e milestone_id NULL. mvp-thinner SKIPPED (no product-feature milestone).
- **Spec-contract short-circuit:** no-prior-spec.

## Reframe section
- **Original framing:** entering the DM view shortly after login intermittently bounces the SPA to "/" on a transient 401 (stale token, valid cookie); should silently refresh + retry, not bounce.
- **problem-framer: PROCEED (scope to global api-client).** Confirmed ROOT CAUSE **(b) concurrent-refresh race, surfacing as (d) SessionAuth redirect**. Rejected (a) interceptor-bypass (initSuperTokens runs at App.tsx:10 before any api call; Session.init installs the global fetch override — the raw fetch DOES go through it) + (c) DM-view-bounces (useDm.ts:297-363 swallows errors to offline cache, never navigates — innocent bystander). Real mechanism: on /app mount post-login, ProfileContext + getServers + listDmConversations (useDm.ts:287) + socket auth fire interceptor-wrapped fetches in the same tick; with a just-expired token in the cross-origin prod topology (cookieSameSite:'none'), one raced 401 escapes the refresh lock un-retried → request() (api.ts:127-142) throws HttpError(401) → session context flips → SessionAuth (AuthGuard.tsx:18-24) redirects to / (LandingPage). "Recovers on re-navigation" fits exactly.
- **ceo-reviewer: SELECTIVE-EXPANSION → PROCEED (cause-layer).** Real trust-wound bug on a core surface (kicked to home seconds after login) on an offline-first product. Root cause is GLOBAL — every authed call funnels through the one request()/requestNoContent() helper (~60 methods, 30+ modules); a DM-only patch leaves the identical bounce latent behind messages/servers/assignments/timers/notifications. Precedent: `retryOn429` already wraps reads with bounded backoff at this exact layer → extend one status code over. Ceiling: "resilient 401 refresh-and-retry, once, bounded" — NO auth redesign/token-lifecycle/proactive-refresh/client-rewrite.
- **Mediation:** both PROCEED, converge on the global api-client cause-layer fix. No conflict.
- **Disposition:** **PROCEED** (global api-client refresh-and-retry).
- **Final framing:** in `api.ts request()`/`requestNoContent()`, on a 401 attempt `Session.attemptRefreshingSession()` and retry the request EXACTLY ONCE; if refresh succeeds → retry (transient 401 resolved silently, no bounce); if refresh returns false → propagate the 401 (genuine logout → login). A single shared refresh must resolve N concurrent burst-401s (no thundering-herd of refreshes).

### Binding refinements carried to P-2/P-3 (LOAD-BEARING)
1. Retry ONLY on 401, EXACTLY ONCE, bounded (mirror the retryOn429 pattern's shape).
2. **Genuine-logout guard (correctness-critical, T-8):** if `attemptRefreshingSession()` returns false (refresh token expired/revoked) → throw/propagate so a REAL 401 still routes to /login. The fix must NOT mask or delay a legitimate logout. Tested.
3. Concurrency: a single shared in-flight refresh resolves a burst of simultaneous 401s (don't fire N refreshes; don't let one racer escape un-retried).
4. Deterministic tests: 401→refresh(true)→200 (assert 2 fetch calls, body returned, no navigate); 401→refresh(false) (assert error propagates, genuine logout preserved); a NON-DM route through the same path (prove global coverage); a concurrency test (N burst-401s → one shared refresh → all retry).
5. Scope: the shared api-client seam ONLY. No auth redesign.

**claimed_task_ids:** [0e58af8e-efed-43cb-b3eb-f1b962066c51]
