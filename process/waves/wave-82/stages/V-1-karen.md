# V-1 Karen — Source-Claim Verification (wave-82: transient-401 auth bounce fix)

```yaml
stage: V-1
role: karen
wave: 82
scope: truth-of-claims (NOT spec-conformance — that is jenny's lane)
verdict: APPROVE
findings_critical: 0
findings_high: 0
findings_medium: 0
findings_low: 0
claims_verified: 6/6
tests_run: PASS (15/15 — refreshAndRetry 11 + AuthGuard 4)
deploy: live + fresh (index-CesvhXg_.js, HTTP 200)
merge_commit_verified: 30bad9149985f67651fcd06f3023df0bc86e2bd8 (squash of PR #101), in HEAD history
```

## VERDICT: **APPROVE**

Every load-bearing claim is TRUE against the merged main tree (HEAD `3e4b7d69`) and the live deploy. All 6 claims confirmed with file:line + command evidence. Zero orphan claims, zero decorative tests, zero silent deviations. The one plan-vs-implementation deviation (request()-level → AuthGuard) is explicitly documented.

---

## Claim-by-claim findings

### Claim 1 — `refreshAndRetry.ts` exports — **CONFIRMED**
- File exists: `apps/web/src/auth/refreshAndRetry.ts` (4251 bytes).
- `sharedRefreshSession(): Promise<boolean>` exported at `refreshAndRetry.ts:47`; module-level single-flight `inFlightRefresh` promise declared at `:36`, set at `:49`, cleared in `.finally` at `:51-53`. Reuses the SDK global lock via `Session.attemptRefreshingSession()`; app-level de-dup collapses a burst to one promise.
- `withRefreshRetry<T>(fn): Promise<T>` exported at `:76`. Retry-once-on-401 logic at `:77-91`: catches, gates on `err instanceof HttpError && err.status === 401` (`:81`), awaits shared refresh (`:83`), **genuine-logout guard `if (!refreshed) throw err;` at `:86`**, retries `fn()` exactly once at `:90` (retry has no inner refresh → no infinite loop).

### Claim 2 — `AuthGuard.tsx` settle-then-recheck handler — **CONFIRMED**
- `onSessionExpired` handler wired onto `<SessionAuth onSessionExpired={onSessionExpired}>` at `AuthGuard.tsx:94-98`.
- Fast-path `if (await Session.doesSessionExist()) return;` at `:68`.
- `await sharedRefreshSession();` at `:75` (boolean deliberately ignored — comment `:71-74`).
- **Bounded loop:** `const SETTLE_RECHECK_TICKS = 5;` — a fixed module-level constant at `:58` (NOT unbounded); loop `for (let i = 0; i < SETTLE_RECHECK_TICKS; i += 1)` at `:82`, re-checking `doesSessionExist()` each tick at `:84`.
- Redirect `redirectToAuth({ redirectBack: true })` only reached at `:90` after the bounded settle exhausts with the session still absent (genuine logout). Bound is a fixed constant — CONFIRMED.

### Claim 3 — `api.ts` routing + 429 preservation — **CONFIRMED**
- `import { withRefreshRetry } from './refreshAndRetry';` at `api.ts:77`.
- `request<T>()` routes through `withRefreshRetry(() => doFetch(path, init))` at `:159`.
- `requestNoContent()` routes through `withRefreshRetry(() => doFetch(path, init))` at `:165`.
- 429 handling **preserved inside `doFetch`**: `parseRetryAfterMs` at `:115`; `doFetch` computes `retryAfterMs = res.status === 429 ? parseRetryAfterMs(...) : undefined` at `:142-143` and threads it into `new HttpError(..., retryAfterMs)` at `:144`. Non-401 (incl. 429) errors propagate untouched through `withRefreshRetry` (`:81` gate).

### Claim 4 — Tests exist and are real — **CONFIRMED**
- `refreshAndRetry.test.ts` — **11 tests** (5 describe blocks; test 1 asserts caller RECEIVES the 200 payload `expect(result).toBe(ok)` `:58`, not merely that refresh was called; genuine-logout propagation `:78`; retry-exactly-once `:97-99`; burst→one-refresh `:143`; non-401 unaffected `.each([429,500,403])` + generic error; sharedRefreshSession single-flight/failure-isolation/fresh-after-settle).
- `AuthGuard.test.tsx` — **4 tests** (dominant-path + fast-path + genuine-logout + boundedness).
- **DOMINANT-PATH test verified genuine** (`AuthGuard.test.tsx:84-106`): `attemptRefresh` mocked to resolve **false**, `doesSessionExist` → false (fast-path), false (first recheck), then **true** (settle). It asserts **`expect(mockRedirectToAuth).not.toHaveBeenCalled()` `:103`** — i.e. NO redirect on the false→settle→true branch, exactly as claimed. It does NOT merely assert refresh was called; it asserts the no-bounce outcome plus that the direct source-of-truth was consulted (`:105`).
- **No `.skip` / `.only` / `.todo` / `xit` / `xdescribe`** in either file (grep clean).
- **Live run PASS:** `pnpm exec vitest run` in `apps/web` → `2 passed (2)`, `15 passed (15)` — refreshAndRetry 11 + AuthGuard 4. No skips, no failures.

### Claim 5 — Deploy serves the merge commit, fresh — **CONFIRMED**
- `curl https://web-production-bce1a8.up.railway.app/` → **HTTP 200**; `<title>StudyHall</title>`; `<div id="root">` present.
- Serves **`/assets/index-CesvhXg_.js`** — matches the claimed bundle hash exactly — plus `/assets/index-Dd6fIRQx.css`.
- Bundle fetched: HTTP 200, 2,062,952 bytes; contains `redirectToAuth` (×3) and `attemptRefreshingSession` (×4) — the fix symbols are present in the shipped bundle (freshness cross-check).
- **Commit provenance reconciled:** the prompt's squash commit `30bad914…` (PR #101, "fix: transient-401 auth bounce — settle-then-recheck refresh") IS in HEAD history. The C-2 deploy record pins deployment `9a66622e…` to commit `b22457a9…` ("docs: C-1 deliverable (PR #101 merged)"), which is the immediate child of the squash commit; `30bad914` is an **ancestor** of `b22457a9`, and the two commits have **byte-identical** `apps/web/src/auth/` trees (`git diff` empty). Both are byte-identical to current HEAD's auth sources. So the deployed bundle was built from a tree containing the exact fix. Not a discrepancy — the docs commit carries the fix unchanged. (Behavioral proof of the fix is jenny/T-block's lane; C-2's bar was fresh 200-serving bundle at a fix-carrying commit — met.)

### Claim 6 — No orphan claims / documented deviation — **CONFIRMED**
- The plan framed the fix as request()-level; the primary fix moved to AuthGuard. This is **explicitly logged**, not a silent orphan:
  - `blocks/B/review-artifacts.md:24` `deviations_logged`: *"B-3 plan framed fix as request()-level; trace proved Mechanism-3 (SessionAuth), primary fix moved to AuthGuard — folded per P-4 interceptor-trace mandate"* AND *"B-6 attempt-1 REWORK: attemptRefreshingSession-boolean gate was a no-op for NOT_EXISTS; corrected to settle-then-recheck"*.
  - `blocks/B/gate-verdict.md` documents the full REWORK→correction cycle: the first attempt's boolean-gate no-op was caught (`:25-31`), corrected to settle-then-recheck (`:42-46`), and re-verified (`:66` 762 tests, `:78-89` mechanism confirmations). The request()-seam is retained as documented defense-in-depth (byte-identical to B-3 baseline per `:62`, `:87`).
- The request()-level machinery (`withRefreshRetry` in api.ts) is NOT dead/orphan code — it is intentional Mechanism-1 defense-in-depth, tested by the 11 refreshAndRetry tests, and the module docstring (`refreshAndRetry.ts:15-27`) states the two-surface rationale.

---

## Antipattern catalog sweep — all CLEAR
- **Claimed-but-fake:** none. Every claimed file/export/symbol exists at the cited line.
- **Decorative tests:** none. Dominant-path test asserts the actual no-redirect outcome; resolution tests assert the received payload, not just a call count. Tests run green live.
- **Deferred-but-undocumented:** none. The plan→AuthGuard relocation and the retained request()-seam are both explicitly documented in deviations_logged + gate-verdict.
- **Green-by-suppression:** none. No skip/only/todo markers; 15/15 pass on a clean run.
- **Timing-accident masking:** the exact failure the B-6 gate caught in attempt-1 (boolean-gate no-op that only healed on a race accident) was rejected and corrected; the shipped code polls `doesSessionExist` directly after a bounded settle.

## Notes for downstream (non-blocking)
- Commit-hash mismatch between the prompt (`30bad914`, squash) and the C-2 deploy record (`b22457a9`, docs child) is reconciled above — same auth tree, both in HEAD history. No action needed.
```
