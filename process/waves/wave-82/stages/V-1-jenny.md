# V-1 jenny — semantic-spec verification (wave-82)

**Wave:** 82 — Fix DM (and global) transient-401 auth bounce via api-client refresh-and-retry + AuthGuard settle-then-recheck
**Task:** `0e58af8e-efed-43cb-b3eb-f1b962066c51`
**Deployed:** https://web-production-bce1a8.up.railway.app (web bundle `index-CesvhXg_.js`) · API origin `https://api-production-b93e.up.railway.app`
**Method:** spec-contract intent vs deployed behavior. Live browser (Playwright MCP) was UNAVAILABLE (see caveat); verified via merged source + deployed-bundle fingerprinting + live API HTTP probes + T-block unit evidence.

## VERDICT: **APPROVE**

The deployed behavior is consistent with every acceptance-criterion INTENT. The fix is a GENUINE resolution (not the cosmetic no-op P-4 warned about) — the B-3 trace correctly pivoted from the boolean-gated approach (which would have no-op'd in the production-dominant NOT_EXISTS case) to a settle-then-recheck on `Session.doesSessionExist()`. The genuine-logout inverse (AC-2) is preserved and confirmed live at the API layer. No spec drift found. One minor spec-gap-adjacent observation (non-blocking, below).

---

## Live-verification caveat (honest disclosure)
The Playwright MCP browser profile (`mcp-chrome-for-testing-51e10da`) was held under a single-profile lock by a concurrent V-1 agent (karen) for the entire run; every instance (1/3/10) returned "Browser is already in use … use --isolated". Per the standing rule I did NOT `browser_close` (that would kill the peer's session). Per my directive ("if you cannot log in live, say so honestly and assess from the merged source + T-block evidence instead") I substituted three independent evidence channels that DO exercise deployed reality:
1. **Deployed-bundle fingerprinting** — confirmed the wave-82 fix (settle-then-recheck loop + single-flight refresh) is compiled into the LIVE bundle `index-CesvhXg_.js` (the exact SHA the journey-map claims).
2. **Live API HTTP probes** — confirmed the genuine-401 inverse (AC-2) against the real API origin.
3. **T-block unit evidence** — the client-internal ACs (retry-once, single-flight burst, non-401, dominant NOT_EXISTS settle path) are resolution-asserted, not call-asserted.

This is weaker than a live login→DM click-through for AC-1's user-observable surface; I flag it as a coverage caveat, not a divergence. The deployed-bundle + API + unit triangulation is sufficient to judge spec-conformance and I found no divergence.

---

## Findings per AC

### AC-1 — Transient 401 on authed request + valid refresh → silent refresh + retry → NO bounce  — **MATCH (intent satisfied)**
The B-3 trace (documented in `apps/web/src/auth/refreshAndRetry.ts` header + `AuthGuard.tsx` header) correctly identified that the real DM-after-login bounce is NOT `request()` throwing 401 (useDm swallows those into offline-cache and never navigates) — it is the SuperTokens `SessionAuth` guard reacting to the interceptor's `UNAUTHORISED` event during the non-atomic-token-write race on `/app` mount, and redirecting.

The fix (`apps/web/src/auth/AuthGuard.tsx:66-91`) on a transient expiry: (1) suppresses the redirect, (2) awaits the shared in-flight refresh, (3) bounded-rechecks `Session.doesSessionExist()` for `SETTLE_RECHECK_TICKS=5` macrotask ticks, (4) redirects ONLY if the session is still genuinely absent. Deep defense-in-depth also wraps `request()`/`requestNoContent()` via `withRefreshRetry` (`api.ts:158-166`).

**Deployed confirmation:** the LIVE bundle contains the exact compiled loop:
`for(let n=0;n<Vq;n+=1)if(await $q(),await kf.doesSessionExist())return;await nk.redirectToAuth({redirectBack:!0})`
— i.e. the settle loop over `doesSessionExist()` with the guarded redirect. The deployed web bundle is `index-CesvhXg_.js`, matching the journey-map's claimed fix SHA (merge `30bad914` / PR #101). Behavior is consistent with stable authed navigation to the DM surface (no bounce). Mark: **not drift.** (Live click-through deferred per caveat; the underlying race is non-deterministic and I did not fabricate a reproduction.)

### AC-2 — GENUINE-LOGOUT GUARD (load-bearing): real 401 still routes to no-session redirect  — **MATCH (confirmed LIVE at API layer)**
The semantic inverse the fix must preserve. In source, the settle loop exhausts its bounded ticks with `doesSessionExist()` staying false → `await redirectToAuth({ redirectBack: true })` fires (`AuthGuard.tsx:90`). At the api-client seam, `withRefreshRetry` propagates the original `HttpError(401)` unchanged when the refresh returns false (`refreshAndRetry.ts:86`).

**Live confirmation:** unauthed requests to the real API origin return a genuine `401 {"message":"unauthorised"}` (application/json) on `/me`, `/dm/conversations`, `/dm/candidates`. This is the exact signal that drives the deployed guard's redirect path (`redirectToAuth({redirectBack:!0})` present in the live bundle). The fix does NOT mask or delay a legitimate logout. Mark: **not drift.** (T-8 journey-map already records live genuine-logout preservation: "real logout still redirects + stays out".)

### AC-3 — Retry EXACTLY ONCE, ONLY on 401; non-401 unaffected  — **MATCH (unit-covered; consistent)**
`withRefreshRetry` retries the factory exactly once after a successful refresh; a second 401 has no inner refresh-retry so it propagates — no infinite loop (`refreshAndRetry.ts:88-90`). Non-401 / non-HttpError errors rethrow before any refresh (`:81`). Unit-covered with resolution assertions: `refreshAndRetry.test.ts` Test 3 (second-401 propagates, fn called 2×) and Test 5 (429/500/403 + generic error → no refresh, no retry). The AuthGuard settle loop is bounded to 5 ticks (`AuthGuard.test.tsx` "bounded / no-infinite-loop" asserts ≤8 `doesSessionExist` calls, redirect exactly once). Client-internal — assessed consistent with intent, unit-covered. Mark: **not drift.**

### AC-4 — Burst of concurrent 401s → ONE shared refresh (single-flight)  — **MATCH (unit-covered; deployed)**
`sharedRefreshSession` reuses one in-flight promise (`refreshAndRetry.ts:47-56`), and `attemptRefreshingSession()` additionally shares the SDK global lock. Unit-covered: `refreshAndRetry.test.ts` Test 4 (5 concurrent 401s → exactly ONE refresh, all resolve to retried result) + the `sharedRefreshSession` single-flight/failure-isolation suite.

**Deployed confirmation:** the live bundle contains the single-flight fingerprint `kf.attemptRefreshingSession().catch(()=>!1).finally(()=>{tv=null})` — the shared in-flight promise with null-reset. Client-internal — assessed consistent, unit-covered. Mark: **not drift.**

### AC-5 — No 429/offline regression  — **MATCH**
`retryOn429` is untouched (`retryOn429.ts` unchanged; still wraps the DM read call sites in `api.ts`). The 401 seam is a distinct wrapper composed OUTSIDE retryOn429 (`withRefreshRetry` inside `request()`, `retryOn429` wrapping specific api methods) — the two do not interfere (401 ≠ 429 branch predicates are disjoint). Offline-cache fallbacks in `useDm` are unchanged. Mark: **not drift.**

### AC-6 / P-4 Phase-2 binding correction — fix must RESOLVE, not no-op  — **MATCH (this is the load-bearing win)**
The P-4 REJECT-risk was that a second `attemptRefreshingSession` could be a redundant no-op if the escaping 401 was interceptor-EXHAUSTED. B-3 traced the actual escape to the interceptor's NOT_EXISTS short-circuit (`st-last-access-token-update` written, non-atomic `frontToken` write not yet landed), where `attemptRefreshingSession()` re-enters the SAME short-circuit and returns `false` WITHOUT a network call. The corrected fix therefore does NOT gate on that boolean — it awaits-then-rechecks `doesSessionExist()` directly (the source of truth once the write settles). This is a genuine behavioral resolution, not a cosmetic refresh call. The `AuthGuard.test.tsx` "DOMINANT PATH" test explicitly proves the no-op case the OLD design would have failed (refresh=false but session settles true after a tick → NO redirect). Mark: **genuine resolution — not a no-op.**

---

## user-journey-map.md — F-T5-1 entry  — **MATCHES deployed reality**
F11 (Direct messages) records: **F-T5-1 RESOLVED / self-healed as of wave-82** — "FIXED by the AuthGuard.onSessionExpired settle-then-recheck + shared single-flight refresh (merge 30bad914 / PR #101, bundle index-CesvhXg_.js deployed LIVE to web-production-bce1a8)". Verified:
- Deployed bundle SHA `index-CesvhXg_.js` — **CONFIRMED live** (curl of `/` root).
- Settle-then-recheck + single-flight — **CONFIRMED compiled into that live bundle** (fingerprints above).
- Genuine-logout preserved (T-8) — **CONFIRMED live** (API returns real 401 unauthed).
The entry is accurate and not overstated. No correction needed.

---

## Spec drift vs gap summary
- **Drift (deployed wrong vs spec):** NONE.
- **Gap (spec silent on a revealed case):** NONE material. The spec's own P-4 Phase-2 correction #1 anticipated the interceptor-interaction and B-3 resolved it correctly — the spec did NOT under-anticipate.
- **Coverage caveat (not a divergence):** AC-1's user-observable live click-through (login→DM) was not exercised in-browser this run due to the shared-profile lock held by the concurrent V-1 agent. Mitigated by deployed-bundle fingerprinting (fix IS live) + AC-2 live API confirmation + full unit coverage. T-9 journey-map already records a live wave-82 login→DM no-bounce probe ("stable login→DM with NO bounce … 0 console errors"). Recommend V-2/head-verifier note the live re-exercise as already-covered-by-T-9 rather than re-blocking.

## Recommendation
**APPROVE** — proceed to V-2 triage. Zero blocking findings. The fix genuinely resolves the founder bounce and preserves the genuine-logout inverse; both are verifiable in the deployed artifact.
