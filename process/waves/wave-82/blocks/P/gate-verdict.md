# Wave 82 — P-4 Gate Verdict (Phase 1)

- **Block:** P (Product)
- **Gate:** P-4
- **Attempt:** 1
- **Phase:** 1 (P-block product-quality gate)
- **Verdict:** **APPROVED**
- **head:** head-product
- **agentId:** head-product / claude-opus-4-8 / 2026-07-09T10:18:36Z
- **Mode:** automatic (founder bug-fix phase; roadmap 14/14 done)
- **wave_db_id:** d51126a0-3266-4bd0-b9f8-68fa5664da7c
- **claimed_task_ids:** [0e58af8e-efed-43cb-b3eb-f1b962066c51]

## Verdict summary
Framing, scope, spec, and plan are internally consistent and grounded in the real
code. The fix is pinned at the correct layer (the shared api-client `request()` /
`requestNoContent()` seam), the load-bearing genuine-logout guard is a hard AC with a
dedicated test, single-flight concurrency handling is specified as the root-cause
remedy, and retry is bounded (exactly once, 401-only). Wrong-layer (DM-scoped)
patches are explicitly rejected. No structural issue. **APPROVED for B-block.**

## Judge findings (5 criteria)

### 1. Root cause + fix layer — CORRECT (global seam, not DM band-aid) ✓
- Verified against source: `apps/web/src/auth/api.ts` `request()` (L127-142) and
  `requestNoContent()` (L145-158) both throw `HttpError(status)` on any non-2xx with
  **no** 401 refresh-and-retry today. ~60 api methods funnel through these two
  helpers → a 401 escaping the refresh lock throws → `SessionAuth` (AuthGuard) bounces
  to `/`. Root cause is confirmed at exactly the layer P-0 names.
- The global scope is real, not asserted: DM reads (`listDmConversations`,
  `listDmMessages`, `getDmCandidates`) are wrapped in `retryOn429` — but that is
  **429-only** (retryOn429.ts L53 rethrows any non-429 immediately), so it does
  nothing for the 401 race. Every non-DM authed call (getServers, notifications,
  assignments, timers, messages) has the identical latent bounce. A DM-view catch
  would leave all of them exposed — correctly REJECTED in both P-0 and P-3.
- The `retryOn429` precedent is genuine: same factory-based single-attempt-retry
  shape, same status-gated rethrow, same bounded loop — "extend one status code over"
  is an accurate characterization, not hand-waving.
- `Session` is imported and `.init()`'d in supertokens.ts;
  `attemptRefreshingSession()` is a valid `supertokens-auth-react/recipe/session` API,
  currently unused → a clean, correct seam. **Wrong-layer patch rejected. PASS.**

### 2. Genuine-logout guard (LOAD-BEARING) — PINNED as hard AC + tested ✓
- Spec AC #2 (task 0e58af8e): "if attemptRefreshingSession() returns false … the 401
  propagates unchanged (throws HttpError(401)) so a truly-logged-out user still routes
  to /login. The fix does NOT mask or delay a legitimate logout." Tagged T-8,
  LOAD-BEARING in P-0 refinement #2, P-2, and P-3 Binding.
- Test pinned: edge-case "401 → refresh false → propagate HttpError(401): genuine
  logout preserved → /login" (spec edge-cases + P-3 B-3 test list). This is the
  correctness anchor — without it the fix would silently swallow real logouts.
  **PASS.**

### 3. Concurrency — SINGLE shared in-flight refresh specified ✓
- Spec AC #4 + contracts.types: "a SINGLE shared in-flight refresh — not N refreshes;
  no racer escapes un-retried (the root cause)." P-3 Approach: "module-level shared
  `refreshPromise` (single-flight) so N concurrent 401s await ONE refresh, then each
  retries once." Per-call refresh explicitly REJECTED (thundering herd = re-creates
  the exact race). This directly targets the confirmed root cause (one racer escaping
  the refresh lock un-retried), not merely the symptom. Test pinned: "N concurrent
  401s → ONE shared refresh → all retry once." **PASS.**

### 4. Retry bounded — exactly once, 401-only, no loop / no regression ✓
- Spec AC #3: "EXACTLY ONCE and ONLY on 401. A second 401 after a successful refresh
  propagates (no infinite retry). Non-401 errors are unaffected." Edge-case
  "401 → refresh true → retry → 401 again: propagate." **PASS.**
- No-regression AC #5: "429 retry (retryOn429), offline-cache fallbacks, and all
  existing api behavior unchanged." Verified compatible: the 401 seam is orthogonal to
  the 429 path (retryOn429 wraps the request factory at the call site; a 401-refresh
  seam inside request() surfaces a resolved-or-propagated result to that wrapper);
  offline-cache fallbacks in useDm swallow the *propagated* error unchanged. Edge-case
  "network error / non-401 → unchanged" pins the negative. **PASS.**

### 5. Plan concreteness — every AC → step → real specialist ✓
- **AC → step → owner:** all five ACs route to B-3 (the request()/requestNoContent()
  seam + single-flight helper + tests). Owner = **supertokens-integration** (owns the
  SuperTokens session-refresh seam per AGENTS.md) with **react-specialist** consult —
  both present in the catalog, correctly matched to the seam.
- **design_gap false — CORRECT:** api-client/auth-resilience fix, no new UI surface.
  No D-block. Confirmed against source (no component/route added).
- **B-1/B-2 skipped — CORRECT:** no contract/type/DTO change (internal helper, no
  wire-shape change), frontend-only (no backend/schema/API change). Data/API/deps =
  none (attemptRefreshingSession already available via the initialized Session recipe).
- **Deterministic tests — all five pinned:** (a) 401→refresh-true→retry-200 asserting
  2 fetch calls + body returned + no navigate; (b) 401→refresh-false→propagate
  (genuine logout); (c) retry-once-only (second 401 propagates); (d)
  N-concurrent→one-shared-refresh; (e) a non-DM route (getServers/notifications) for
  global coverage; plus no-429/offline-regression. Determinism achievable via the
  retryOn429.test.ts precedent (fetch mock + fake timers). **PASS.**

## Scope discipline (bug-fix phase)
- Ceiling honored: "resilient 401 refresh-and-retry, once, bounded" — NO auth
  redesign / token-lifecycle change / proactive-refresh / client-rewrite. P-1 floor
  waiver correct (founder-directed bug fix; one shared seam = no valid split; roadmap
  complete = no milestone to expand-merge). No gold-plating observed.

## Conditions carried to B-block (binding, not blocking)
1. Single-flight `refreshPromise` must be reset after settle (success OR failure) so a
   later independent 401 can trigger a fresh refresh — verify the promise is not
   permanently cached. (Implementation detail for supertokens-integration; the AC
   "N concurrent → one refresh" + "later request retries once" jointly enforce it.)
2. The retry must re-issue a NEW fetch (factory pattern, per retryOn429) — not replay
   a consumed Response. Covered by the "asserts 2 fetch calls" test.
3. `requestNoContent()` gets the identical seam (not just `request()`) — several
   mutating/void calls (DELETE/logout-adjacent) go through it. Both named in every
   artifact; hold B-3 to both.

## Verdict
**APPROVED** — proceed to B-block (B-0 branch `wave-82-api-401-refresh-retry` → B-3
via supertokens-integration + react-specialist; B-1/B-2 skipped; no D-block).

<P-4>APPROVED — Attempt 1, Phase 1. Global api-client refresh-and-retry seam confirmed
correct-layer; genuine-logout guard pinned as hard AC + tested; single-flight
concurrency targets the root cause; retry bounded once/401-only; no 429/offline
regression; plan concrete with real specialist routing. DM-scoped patch rejected.</P-4>

---
## Phase 2 — Karen + jenny + Gemini (appended)
**Phase 2 verdict: PASS** (Karen APPROVE-conditional + jenny APPROVE 0-drift, corrections folded; Gemini UNAVAILABLE 429 → degraded). No BLOCK.
- **Karen:** 6/6 claims VERIFIED (request()/requestNoContent() throw 401 no-refresh; retryOn429 429-only precedent; attemptRefreshingSession():Promise<boolean> available @ supertokens-auth-react 0.51.2; ~80 funnel sites; SessionAuth bounce; specialists present). **CRITICAL interceptor-interaction finding:** Session.init already installs a global fetch auto-refresh interceptor with a single-flight lock — so the plan's fix could be a no-op if the escaping 401 is interceptor-exhausted; B-3 must trace it first + the tests must prove resolution-to-200. Net-additive-safe (shared SDK lock, no double-refresh). Genuine-logout guard sound. → folded as binding B-3 conditions.
- **jenny:** 0 DRIFT — conforms to the shipped SuperTokens rotating-refresh / SameSite / httpOnly posture (product-decisions:64); no "401 always logout" decision; preserves explicit-logout (map:109); global scope matches the uniform auth boundary; consistent with E2E-key-fetch + SessionNoVerifyGuard. GAP: T-9 mark F-T5-1 (map:296) self-healed.
- **Gemini:** UNAVAILABLE 429, degraded.

## Gate result: APPROVED — P-block exits → B-0 (design_gap false, D skipped). B-3 carries the interceptor-trace-first mandate.
