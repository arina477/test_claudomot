# V-1 Karen — wave-61 reality check (DM read throttle right-size + client 429 backoff)

**Verdict: APPROVE**

Reviewer: Karen (Project Reality Manager). Scope: verify the wave's load-bearing claims
in the merged/deployed state (merge `e0e842e` on `main`; api+web deployed SUCCESS @ `e0e842e`).
Method: git/grep/read of the actual merged source (HEAD = `e0e842e`, working tree clean for all
3 changed files — my Reads ARE the deployed source), both test suites executed locally, live /health probes,
coherence audit of the T-8 live probe. Did NOT run the `railway` CLI (per instruction).

---

## Provenance guard (the source I reviewed = the deployed source)

- `git rev-parse HEAD` → `e0e842e33d1932f0a2b54c00cb94e1af8226142d` (the exact merge under test).
- `git status --porcelain` on `dm.controller.ts`, `api.ts`, `retryOn429.ts` → clean (no working-tree drift).
- `git diff e0e842e` on the 3 files → empty. Every line I quote below is the merged/deployed line, not a local edit.

This closes the usual Karen escape hatch ("you reviewed your uncommitted working copy, not what shipped").

---

## Claim-by-claim

### Claim 1 — DM READ throttle override 60/60s on 3 read handlers, writes untouched, no @SkipThrottle — TRUE

`apps/api/src/dm/dm.controller.ts`:
- Import present: `import { Throttle } from '@nestjs/throttler';` (line 33). Correct package.
- Exactly 3 `@Throttle({ default: { limit: 60, ttl: 60_000 } })` decorators, all on GET read handlers:
  - `dm.controller.ts:93` — `listConversations` (`GET /dm/conversations`)
  - `dm.controller.ts:141` — `listMessages` (`GET /dm/conversations/:id/messages`)
  - `dm.controller.ts:182` — `getDmCandidates` (`GET /dm/candidates`)
- Constant is the literal `60` (not 120) on all three. No `limit: 120` anywhere in the file.
- POST/write handlers carry NO override — `createConversation` (`dm.controller.ts:65-79`) and
  `sendMessage` (`dm.controller.ts:112-127`) have zero `@Throttle`, so they keep the global 10/60s default.
- `grep -rn SkipThrottle apps/api/src/dm/` → no match. Override is a bounded ceiling raise, NOT a throttle removal.

Verdict: matches the claim exactly, numeral-for-numeral.

### Claim 2 — HttpError + retryOn429 wrapping exactly the 3 DM reads, writes NOT wrapped — TRUE

`apps/web/src/auth/retryOn429.ts`:
- Exists. Bounded exponential backoff — `DEFAULTS = { maxAttempts: 4, baseMs: 300, capMs: 10_000 }` (lines 28-32).
- Delay cap enforced: `Math.min(baseMs * 2 ** (attempt - 1), capMs)` (line 59).
- Retry-After honored: `Math.max(backoff, err.retryAfterMs)` when the header is present (line 60).
- Rethrows on exhaustion: `if (attempt >= maxAttempts) throw err;` (line 56).
- Retries ONLY on 429: `if (!(err instanceof HttpError) || err.status !== 429) throw err;` (line 53).

`apps/web/src/auth/api.ts`:
- `HttpError` subclass extends `Error`, carries `status` + optional `retryAfterMs` (lines 65-75). `name='HttpError'`.
- `request()` throws `HttpError` on non-2xx; `retryAfterMs` parsed from `Retry-After` ONLY on 429
  (lines 101-106; `parseRetryAfterMs` handles both delta-seconds and HTTP-date, lines 81-92).
- retryOn429 wraps EXACTLY the 3 DM reads:
  - `listDmConversations` (api.ts:759-762)
  - `listDmMessages` (api.ts:781-788)
  - `getDmCandidates` (api.ts:798)
- Writes are NOT wrapped: `createDmConversation` (api.ts:746-750) and `sendDmMessage` (api.ts:769-773)
  call bare `request(...)` with `method:'POST'`, no retry wrapper. Correct — retrying a mutating call is unsafe.
- App call sites (`useDm.ts`, `StartDmPicker.tsx`, `useMessages.ts`) go through the `api.*` methods, so the
  wrapping is at the single correct chokepoint, not duplicated/bypassed.

Verdict: matches the claim exactly. Reads wrapped, writes bare.

### Claim 3 — No error-handling regression; full web 477/477 + api dm/messaging 152/152 green — TRUE

- **Non-429 throw semantics identical:** `request()` throws `HttpError` on every non-2xx (same throw point as
  before, now a subclass of Error carrying status). `retryOn429` rethrows any non-429 immediately (line 53).
  Explicit regression coverage in `apps/web/src/auth/retryOn429.test.ts`: "does not retry on 500" (line 160)
  and "does not retry on 403" (line 171) — non-429 rethrows immediately, no retry loop.
- **Web suite — ran locally:** `30 passed (30)` files, `477 passed (477)` tests. Matches claim.
- **API dm/messaging — ran locally:** `src/dm/dm.service.spec.ts` + messaging specs → `4 passed (4)` files,
  `152 passed (152)` tests. Matches claim.

Verdict: green as claimed, independently reproduced.

### Claim 4 — Deploy serves the merge; api /health 200, web 200 — TRUE

- `curl https://api-production-b93e.up.railway.app/health` → **200**
- `curl https://web-production-bce1a8.up.railway.app/` → **200**
- C-block gate verdict (`blocks/C/gate-verdict.md`): C-1 PASS (PR #76, 7/7 CI, merged e0e842e),
  C-2 PASS (api+web SUCCESS @e0e842e). Consistent with the live probes.

Verdict: deploy is live and serving.

### Claim 5 — Throttle works LIVE; T-8 evidence coherent — TRUE (coherent + code-consistent)

Sanity-checked `process/waves/wave-61/stages/T-8-security.md`. The T-8 evidence is internally coherent and
consistent with the merged source:
- **Override live:** 18/18 `GET /dm/conversations` → 200. Pre-fix this shared the 10/60s bucket and would
  429 after ~10; 18 clean 200s prove the raised ceiling is deployed. Consistent with `dm.controller.ts:93`.
- **Global preserved:** `/me` burst → 200×8 then 429×6 (first 429 at index 8, +~2 prior discovery ≈ 10/60s
  ceiling). `/me` is NOT one of the 3 overridden routes, so it correctly still hits the global default.
- **Bucket isolation:** in ONE batch while `/me` was 429'ing, all 3 DM reads returned 200 — proving the
  override is route-scoped to exactly the 3 intended handlers, not a blanket throttle removal. This directly
  corroborates the "no @SkipThrottle" finding: the reads sit on a real, separate, higher-ceiling bucket.
- **Honest fallback disclosure:** T-8 flags that the exact numeral (60 vs 120) rests on code-verification
  rather than pushing a full 60-req live burst (to avoid over-hammering shared per-IP infra). I independently
  code-verified the numeral: literal `60` on all 3 decorators, no `120` anywhere. The fallback is sound and the
  numeral claim holds.

The T-8 probe methodology (positive override test + negative global-still-enforced test + same-batch bucket
isolation) is exactly the shape that rules out the two failure modes that matter here: (a) override didn't
deploy, and (b) override leaked / blanket-disabled throttling. Both ruled out. Evidence is coherent.

---

## Gaps / severity

None at any severity. All 5 load-bearing claims verified against the merged source, both suites reproduced
green locally, deploy confirmed live, and the T-8 live evidence is coherent and code-consistent.

- Critical: none
- High: none
- Medium: none
- Low: none

Note (non-blocking, not a wave gap): the DM read throttle is a per-IP ceiling raise; behind a shared NAT/egress
IP many clients share the 60/60s bucket. That is an accepted, documented property of the design (the decorator
comments at `dm.controller.ts:87-90` state the reads-only bounded rationale), not a regression this wave
introduced. No action required.

---

## Verdict

**APPROVE.** The rate-limit correctness fix is real, scoped, and shipped. The 60/60s override is present on
exactly the 3 DM read handlers with the literal constant 60 (writes keep global 10/60s, no @SkipThrottle);
the client-side bounded 429 backoff wraps exactly the 3 DM reads and leaves writes bare; error-handling
semantics are unchanged for non-429s with explicit test coverage; web 477/477 + api dm/messaging 152/152
reproduced green; deploy serves the merge (api/health 200, web 200); and the T-8 live probe evidence is
coherent and corroborated by the merged source. What was claimed is what actually shipped.
