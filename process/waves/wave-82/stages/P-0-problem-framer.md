# P-0 Problem-Framer — wave-82 (task 0e58af8e)

## Verdict: **PROCEED** — with a binding scope correction (global api-client layer, NOT DM-only)

The bug is real, user-facing, and confirmed live. The wave should proceed to P-1/P-2, but
the fix layer is **the shared api-client (`request()` / `requestNoContent()`)**, not the DM
view. Framing the wave as "fix the DM bounce" is a symptom-frame that would leave every other
authenticated route exposed to the same transient-401 bounce. Reframe the problem statement to
"a transient/expired-token 401 on any authenticated read/write is surfaced to `SessionAuth` as a
hard session loss instead of being refresh-and-retried, causing a spurious redirect to `/`."

---

## Confirmed root cause

The orchestrator's four candidates map to the code as follows (citations below):

- **(a) raw `fetch` bypasses the SuperTokens interceptor — FALSE (rejected).**
  `initSuperTokens()` runs at module-load in `apps/web/src/App.tsx:10`, before any `api.*` call.
  SuperTokens `^0.51.2` (`apps/web/package.json:27`) `Session.init()`
  (`apps/web/src/auth/supertokens.ts:27`) installs a global `window.fetch` override via the
  underlying `supertokens-website` layer. The raw `fetch` inside `request()`
  (`apps/web/src/auth/api.ts:128`) therefore DOES pass through the interceptor. So the interceptor
  is present — this is not a "bypass" bug.

- **(c) a DM-view error handler bounces on any error — FALSE (rejected).**
  `useDm.ts` swallows every thrown error and falls back to the offline cache; it does NOT
  navigate. `fetchConversations` catch → cache fallback (`apps/web/src/shell/useDm.ts:297-311`);
  `fetchMessages` catch → cache fallback (`useDm.ts:346-363`). `DmHome.tsx` has no redirect on
  error. The DM view is an innocent bystander, which is precisely why a DM-only patch would fix
  nothing.

- **(d) `SessionAuth` re-validates and redirects — TRUE, but as the *visible effect*, not the
  cause.** The DM surface (`/app`) is wrapped in `<AuthGuard>` = `<SessionAuth requireAuth
  overrideGlobalClaimValidators={() => []}>` (`apps/web/src/auth/AuthGuard.tsx:18-24`;
  `apps/web/src/router.tsx:80-85`). When the session-context flips to `doesSessionExist=false`,
  `SessionAuth` redirects to `/`, which is the public `LandingPage` (`router.tsx:47`). This is the
  observed "bounce to /". But `SessionAuth` only flips after an un-recovered 401 has already
  convinced the SDK the session is gone — it is downstream of the real defect.

- **(b) concurrent-refresh race on a burst of simultaneous 401s — TRUE (root cause).**
  On `/app` mount shortly after login, several independent components each fire their own
  interceptor-wrapped `fetch` in the same tick: ProfileContext (`getProfile`/`getMe`,
  `apps/web/src/shell/ProfileContext.tsx`), `getServers`, `useDm.listDmConversations`
  (`useDm.ts:287`, via `retryOn429` → `request`), plus the messaging socket auth
  (`messagingSocket.ts`). When the access token has *just* expired, multiple of these 401
  (`TRY_REFRESH_TOKEN`/`UNAUTHORISED`) at once. The backend emits clean SDK-owned 401s
  (`apps/api/src/auth/auth.exception.filter.ts:30-34`). The prod topology is **cross-origin**
  (web-production-* vs api-production-* Railway subdomains) with `cookieSameSite: 'none'`
  (`apps/api/src/auth/supertokens.config.ts:108-123`). In that burst, the refresh-lock in
  `supertokens-website` occasionally lets one already-dispatched request surface its 401 to the
  `request()` caller *before/around* the shared refresh settling — the un-retried 401 throws
  `HttpError(401)`, the session context flips, and `SessionAuth` bounces to `/`. "Recovers on
  re-navigation" fits exactly: the second navigation runs after the refreshed token is in place.

**Precise cause:** a transient/expired-token 401 during a concurrent request burst is surfaced by
the api-client `request()` wrapper as a terminal error, without an explicit refresh-and-retry
guard, so `SessionAuth` treats a recoverable token-expiry as a session loss and redirects to `/`.

---

## Symptom-vs-cause + right-layer analysis

- **Cause-level fix (REQUIRED): api-client layer.** In `request()` and `requestNoContent()`
  (`apps/web/src/auth/api.ts:127-158`), on a `401`, explicitly call the SDK's
  `Session.attemptRefreshingSession()` and, if it returns `true` (refresh succeeded → session is
  still valid), retry the original request ONCE before throwing. If refresh returns `false`
  (genuinely unauthenticated), throw as today so `SessionAuth` performs a *correct* redirect to
  login. This makes the client resilient to the burst-race for every route, not just DM.

- **Symptom patch (FORBIDDEN as the whole fix): DM-view band-aid.** Catching the 401 inside
  `useDm` and "not navigating" would (1) fix nothing — `useDm` already doesn't navigate; the
  bounce is `SessionAuth`, not `useDm`; and (2) leave `/discover`, `/settings/profile`,
  `/settings/privacy`, and every server/channel/notification read exposed to the identical bounce.
  This is the **wrong-layer antipattern** and **demo-path tunnel-vision** (fixing only the one
  surface the tester happened to report).

**Answer to the framing question:** this is a **global api-client gap**, not a DM-specific bug.
DM merely surfaced it because DM entry fires a dense burst of reads at mount right after login.

---

## Antipatterns red-team (PRODUCT-PRINCIPLES § Antipatterns)

- **Wrong-layer:** avoided by mandating the fix in `request()`/`requestNoContent()`, not `useDm`.
- **Demo-path tunnel-vision:** avoided by requiring the fix to cover all authenticated routes and
  by requiring a regression guard on a NON-DM route.
- **PRODUCT-PRINCIPLES rule 1 (verify seed claims):** the seed's premise that `request()` has "NO
  refresh-and-retry" is CONFIRMED at `api.ts:127-142`; the seed's implication that the interceptor
  is *absent/bypassed* is CORRECTED — the interceptor is present but the raced 401 escapes it, so
  an explicit client-level guard is still the right fix.

---

## Binding refinements for P-2 (spec) / P-3 (plan)

1. **Scope = global api-client.** The single fix site is `request()` + `requestNoContent()` in
   `apps/web/src/auth/api.ts`. No DM-view edits. `deleteAccount`/`exportAccountData` (their own raw
   `fetch`es) are out of scope unless trivially covered by a shared helper.

2. **Refresh-and-retry contract (AC):** on HTTP 401, call
   `Session.attemptRefreshingSession()`; if `true`, retry the ORIGINAL request exactly ONCE;
   if the retry also 401s OR refresh returns `false`, throw `HttpError(401)` as today. Retry
   applies to 401 ONLY — never 403/404/409/429 (429 keeps its existing `retryOn429` path). Cap at
   one retry to avoid loops. Idempotency: reads are safe; for writes, the existing
   `idempotencyKey` on DM/channel sends makes a single retry safe — SPEC MUST state that only a
   401-driven single retry is added and no new retries for non-idempotent writes lacking a key.

3. **Do NOT regress a genuine 401 → login.** When `attemptRefreshingSession()` returns `false`
   (real session loss: revoked, deleted-user re-auth block per `supertokens.config.ts:124+`,
   logged-out), the client must still throw so `SessionAuth` redirects to `/login`. A test MUST
   assert this path: genuine-401 → refresh-fails → error surfaces → redirect still happens.

4. **Deterministic transient-401-then-refresh test (T-1/T-2 unit/contract):** mock `fetch` to
   return `401` on the first call and `200` on the second; mock
   `Session.attemptRefreshingSession` to resolve `true`. Assert the caller receives the `200`
   body and `fetch` was called exactly twice. Second test: `attemptRefreshingSession` resolves
   `false` → assert the `HttpError(401)` propagates and `fetch` called once. Third (regression):
   a NON-DM route (e.g. `getServers`) exercises the same retry path — proves the fix is global.
   Concurrency test: fire N concurrent `request()` calls that all 401-then-refresh; assert a
   single shared refresh resolves all N (no thundering-herd of refreshes, no leaked bounce).

5. **T-4 E2E (optional, high-value):** simulate an expired access token on DM entry (or force a
   401 on the first `/dm/conversations`) and assert the user STAYS on `/app` and the DM list
   loads, never landing on `/`.

---

## Confidence + residual risk

Confidence in mechanism (b)+(d): high. The concurrent-burst + cross-origin `SameSite=None`
topology + no explicit client retry is a well-known SuperTokens edge. Residual uncertainty: the
exact interleaving inside `supertokens-website`'s refresh lock is version-internal; the fix does
NOT depend on reproducing that internal race — an explicit client-side refresh-and-retry on 401 is
correct regardless of whether the interceptor *should* have caught it, and is strictly safer than
today. B-block should still add a console/network capture at repro to confirm the burst-401 shape
before finalizing, but this does not block PROCEED.
