# B-6 Gate Verdict — wave-82 (api-401-refresh-retry)

- **Reviewer:** head-builder (fresh independent review; supertokens-integration specialist consulted for source-level Mechanism-3 adjudication)
- **Reviewed-against:** task `0e58af8e-efed-43cb-b3eb-f1b962066c51` spec incl. `## P-4 Phase-2 BINDING CORRECTIONS` (interceptor-trace-first mandate, resolution-not-call test mandate)
- **Attempt:** 1
- **Branch:** wave-82-api-401-refresh-retry
- **Gate checks (run by reviewer, not trusted from report):**
  - `pnpm --filter @studyhall/web test` → **PASS** (57 files, 761 tests; incl. refreshAndRetry.test.ts 11 + AuthGuard.test.tsx 3)
  - `tsc --noEmit` (web) → **PASS** (exit 0)
  - `pnpm biome ci apps packages` → **PASS** (401 files, no fixes)

## Verdict: REWORK

Green suite, clean types/lint, and a correctly-shaped single-flight + retry-once mechanism — but the **primary fix is a no-op for the exact transient it targets**, verified against installed SuperTokens source. The P-4 mandate explicitly forbade shipping this class unverified; the trace's load-bearing Mechanism-3 conclusion is only *half* right, and the half that's wrong is the half that fixes the bounce.

### Rationale

**Heuristic 1 — Mechanism-3 correctness (PARTIALLY-CORRECT → fails):**
Verified against `supertokens-website@20.1.6/lib/build/fetch.js` and `supertokens-auth-react@0.51.2/lib/build/index2.js`.

- The *mechanism identification* is correct: during a concurrent-refresh burst the interceptor's `NOT_EXISTS` short-circuit (`fetch.js:734-745`) genuinely fires `UNAUTHORISED{sessionExpiredOrRevoked:false}` with a still-valid refresh token. `NOT_EXISTS` is a transient local-state inconsistency: `saveTokensFromHeaders` writes the access token + `st-last-access-token-update` BEFORE `FrontToken.setItem` (fetch.js:~1206→1222), so a racer reading `getLocalSessionState` in that gap sees `lastAccessTokenUpdate` present + `frontToken` absent → `NOT_EXISTS` (fetch.js:1010-1014). Real, and reachable without any refresh-token expiry.
- The event DOES reach `onSessionExpired`: on the DM sub-route (post-mount, `context.loading===false`), the UNAUTHORISED handler at `index2.js:2610-2621` calls `props.onSessionExpired()` instead of `redirectToLogin()`. Coverage matches the founder repro ("DM view shortly after login" = sub-route of already-mounted /app). Good so far.

**Heuristic 5 + Iron-Law — the fix does NOT resolve the transient (the load-bearing defect):**
The `onSessionExpired` handler heals only if `sharedRefreshSession()` → `Session.attemptRefreshingSession()` returns `true`. But when local state is `NOT_EXISTS` (the very condition that fired the event), `attemptRefreshingSession` (fetch.js:662) → `getLocalSessionState(false)` → `onUnauthorisedResponse(preRequestLSS)`; inside, it re-reads `postLockLSS` via `getLocalSessionState(false)` (fetch.js:731) and — if the transient window is still open — hits the SAME `NOT_EXISTS` short-circuit at `fetch.js:734`, returning `SESSION_EXPIRED` **without any network refresh**. `attemptRefreshingSession` then returns `false` (fetch.js:680). `refreshed===false` short-circuits AuthGuard.tsx:40 (`refreshed && doesSessionExist()`), and control falls through to `redirectToAuth` — **the bounce still happens.** It only accidentally heals in the timing-window where the front-token write lands between the two `getLocalSessionState` calls (→ `postLockLSS===EXISTS` → early RETRY at fetch.js:756-760). That is a race accident, not a fix.

- The `doesSessionExist()` fail-safe at AuthGuard.tsx:40 does not rescue this: it is AND-gated behind `refreshed`, which is `false` in the common transient path, so it is never consulted when it would matter.
- **The tests conceal this.** Both suites mock `attemptRefreshingSession` to resolve `true` (refreshAndRetry.test.ts:45; AuthGuard.test.tsx:73) — i.e. they exercise the timing-accident branch, not the reliable `NOT_EXISTS→SESSION_EXPIRED→false` branch that dominates in production. So the "resolution proof" proves resolution of a path that rarely fires, not the real transient. This is exactly the "call-only / wrong-path no-op passes green" failure the P-4 Phase-2 correction #2 forbids. (The request()-seam tests are internally correct for Mechanism-1 defense-in-depth; the defect is the AuthGuard primary path.)

**Heuristics 2, 3, 4, 6 — PASS (retain in rework):**
- Genuine-logout guard holds: `refresh=false → throw`/`redirectToAuth` (refreshAndRetry.ts:86; AuthGuard.tsx:44). Not weakened.
- Single-flight correct: one in-flight promise, cleared in `.finally` (refreshAndRetry.ts:47-56); burst test proves one refresh for N=5. No lock leak; `.catch(()=>false)` isolates rejection.
- Retry-once bounded: second 401 propagates, no inner refresh on retry (refreshAndRetry.ts:88-90). No loop.
- No 429/offline regression: `doFetch` factory preserves `retryAfterMs` parse; `withRefreshRetry` only acts on status 401, leaving 429 to `retryOn429` and non-HttpError untouched (api.ts:133-166; refreshAndRetry.ts:81). Nesting order (retryOn429 wraps request → request wraps withRefreshRetry) is safe.

Net: the fix is net-additive-safe (it never worsens behavior, and the shared SDK lock prevents double-refresh), but "safe no-op on the primary bounce" is precisely what the interceptor-trace-first mandate was written to catch. Ship-blocking.

### Rework instructions

**Owner:** route to `supertokens-integration` (specialist domain: auth interceptor + SessionAuth event semantics). Consult `head-builder` on re-review.

1. **[Heuristic 1 + 5 — primary]** Fix the AuthGuard `onSessionExpired` path so it heals the real `NOT_EXISTS` transient, not just the timing-accident. Do NOT gate the no-bounce decision on `attemptRefreshingSession()`'s boolean (it returns `false` on the transient NOT_EXISTS state without hitting the network). Instead: on the transient event, suppress the redirect, yield at least one tick (microtask or `setTimeout(0)`) to let the interceptor's front-token write settle, then re-check `Session.doesSessionExist()` **directly** (re-reads storage) — redirect ONLY if that is still false after the settle. Keep the genuine-logout guard: if `doesSessionExist()` is false after the settle+retry budget, redirect. Bound the settle retries (e.g. ≤2 short re-checks) so a genuine logout is not delayed perceptibly. (Alternative acceptable approaches: drive the recovery off a real network `Session.attemptRefreshingSession` only when local state has resolved to EXISTS/MAY_EXIST; or a documented SDK-config approach — but any approach MUST be validated against fetch.js NOT_EXISTS semantics.)

2. **[Heuristic 5 — tests must prove the REAL path]** Add/adjust tests so the AuthGuard suite exercises the production-dominant branch: `attemptRefreshingSession` (or the underlying local-state read) resolves the transient case where the first check reports no-session and a subsequent `doesSessionExist()` (after settle) reports true → assert NO redirect. The existing `attemptRefresh→true` happy-path test is insufficient on its own because it skips the NOT_EXISTS short-circuit. Prove RESOLUTION on the settle-then-true path, not merely that a refresh was requested.

3. **[Trace fidelity]** Update the module docstrings in refreshAndRetry.ts / AuthGuard.tsx to state the corrected mechanism: `attemptRefreshingSession` is a no-op while local state is NOT_EXISTS; recovery must poll `doesSessionExist` after the front-token write settles. The current docstrings assert the shared refresh "restores a live session," which is not what the SDK does in this state.

4. Retain the request()-seam defense-in-depth and the single-flight/retry-once/429-safety exactly as-is (they pass). Re-run all three gates (test / tsc / biome) after rework.

Source citations for the specialist: fetch.js:662 (attemptRefreshingSession), :671/:731 (getLocalSessionState false×2), :734-745 (NOT_EXISTS short-circuit, no network), :756-760 (EXISTS→RETRY race window), :1010-1014 (NOT_EXISTS = frontToken cleared + lastAccessTokenUpdate present), :1195-1238 (non-atomic token writes); index2.js:2411-2412 (mount redirect), :2617-2621 (onSessionExpired vs redirectToLogin), :2632-2636 (event listener only when context.loading===false).

---
verdict_complete: true
rework_attempt_cap_remaining: 2

---

# B-6 Gate Verdict — wave-82 (api-401-refresh-retry) — ATTEMPT 2 (post-rework)

- **Reviewer:** head-builder (fresh independent spawn; did NOT assume agreement with the attempt-1 author — re-derived the mechanism from installed SuperTokens source)
- **Reviewed-against:** task `0e58af8e-efed-43cb-b3eb-f1b962066c51` spec incl. `## P-4 Phase-2 BINDING CORRECTIONS`
- **Rework under review:** commit `68524e4a` — AuthGuard.tsx + AuthGuard.test.tsx ONLY (130 +/37 −). Retained code (api.ts request()-seam, refreshAndRetry.ts single-flight/retry-once, retryOn429.ts) is byte-identical to the B-3 baseline `7986fc65` — `git diff 7986fc65 68524e4a` shows no change outside the two AuthGuard files.
- **Attempt:** 2
- **Branch:** wave-82-api-401-refresh-retry
- **Gate checks (run by reviewer, not trusted from report):**
  - `pnpm --filter @studyhall/web test` → **PASS** (57 files, **762 tests**; AuthGuard.test.tsx now 4 tests: dominant-path + fast-path + genuine-logout + boundedness)
  - `cd apps/web && tsc --noEmit` → **PASS** (exit 0)
  - `pnpm biome ci apps packages` → **PASS** (401 files, no fixes)

## Verdict: APPROVE

The rework replaces the boolean-gated no-op with a settle-then-recheck that heals the DOMINANT NOT_EXISTS transient deterministically. I re-verified the mechanism from source rather than trusting the attempt-1 finding — and the source shows the fix is actually *more* robust than the attempt-1 rework instructions assumed, because the burst case heals via the SDK's refresh lock, not via tick-timing luck.

### Rationale

**1 — Settle-then-recheck resolves the dominant path (verified `supertokens-website@20.1.6/fetch.js`):**
The decisive detail is the **lock serialization** in `onUnauthorisedResponse`. It acquires `lock.acquireLock("REFRESH_TOKEN_USE", 1000)` (fetch.js case 2/3) BEFORE reading `postLockLSS` (case 5). The refreshing racer performs its `saveTokensFromHeaders` — which **awaits `FrontToken.setItem` → `setFrontToken` (the frontToken write), fetch.js:346-380 / case 4-5** — at case 11, then releases the lock only in the `finally` at case 19. So the frontToken write is **committed before the lock is released**.
- Common burst case: AuthGuard's `await sharedRefreshSession()` → `attemptRefreshingSession` blocks on `acquireLock` until the racer releases it; by then `postLockLSS === EXISTS` → RETRY → returns `true` AND `doesSessionExist()` is already true. The handler heals on the fast-path `return` (line 68) or the first recheck. This branch does **not depend on the 5-tick bound at all** — it is deterministic via the lock.
- Only pathological case (lock-acquire times out at 1000ms → case 21 NOT_EXISTS → SESSION_EXPIRED false) leaves a settling window, and the 5 macrotask rechecks cover it. Since `FrontToken.setItem` is a fully-awaited storage write (no deferred/queued/microtask-lagged write — it resolves its waiters synchronously to the promise, fetch.js:373-375), there is **no async write that can lag 5 macrotasks**. The prompt's "could the write take longer than 5 ticks under load" risk does not materialize: the write is awaited *inside* the refresh promise, so by the time control returns from `await sharedRefreshSession()` in the lock-contended path the write is already done. **5 ticks is a sound bound — generous, not flaky-short, and not unbounded.** Ignoring `attemptRefreshingSession`'s boolean is correct: in NOT_EXISTS it resolves false without a network call, so `doesSessionExist()` is the only valid source of truth. **CONFIRMED.**

**2 — Genuine logout not swallowed:** On a real revoke, `doesSessionExist()` stays false through the fast-path + all 5 rechecks → `redirectToAuth({redirectBack:true})` fires (AuthGuard.tsx:90). Test `genuine logout: session stays absent through the whole settle → redirect DOES fire` asserts exactly one redirect with the correct args. Guard holds. **CONFIRMED + tested.**

**3 — The new test proves the DOMINANT branch:** `DOMINANT PATH` test sets `attemptRefresh→false` and `doesSessionExist` sequence `false`(fast-path)→`false`(first recheck, write not landed)→`true`(settled), asserts NO redirect and that `doesSessionExist` was consulted. This exercises the exact `false→settle→true` path the old suite skipped — not the refresh→true accident. Satisfies P-4 Phase-2 correction #2 (prove RESOLUTION, not call). **CONFIRMED.**

**4 — Boundedness:** `bounded / no-infinite-loop` test: session never returns → terminates, redirects exactly once, `doesSessionExist` calls `≤8` (1 fast-path + 5 rechecks + margin, matching `SETTLE_RECHECK_TICKS=5`). No hang/spin. **CONFIRMED + tested.**

**5 — Retained-and-still-green:** api.ts request()-seam, sharedRefreshSession single-flight (one in-flight promise, cleared in `.finally`), withRefreshRetry retry-once + genuine-logout propagation, and 429/offline paths are byte-identical to the validated B-3 baseline (diff confirms) and pass within the 762. No regression. **CONFIRMED.**

**6 — BUILD-PRINCIPLES / trace fidelity:** Docstrings in AuthGuard.tsx now state the corrected mechanism (attemptRefreshingSession no-op in NOT_EXISTS; recovery polls doesSessionExist after the write settles) — matching source. Fix is minimal, net-additive-safe, no gold-plating. Clean types/lint.

### Independent judgment on the 5-tick bound under load
Robust. The bound is **belt-and-suspenders, not load-bearing**: the production-dominant burst heals via the SDK refresh lock (frontToken write committed before lock release), so it heals on tick 0-1 regardless of the bound. The 5-tick window only backstops the >1s lock-timeout pathological case, and because the frontToken write is a fully-awaited (non-deferred) storage write, no realistic load stretches it past 5 macrotasks after the refresh has already resolved. A genuine logout deterministically exhausts the bound and redirects once. No flake risk, no scale risk, no residual bounce.

### Rework-if-any
None. Ship.

---
verdict_complete: true
rework_attempt_cap_remaining: 1
