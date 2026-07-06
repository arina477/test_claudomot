# V-1 jenny — wave-61 DM read-path throttle right-sizing + 429 backoff

**Verdict: APPROVE**
**Classification: NO DRIFT, NO GAP.** Every acceptance-criterion intent is met by the deployed code + the T-8 live probe. `design_gap_flag=false` is correct.

Task: `874bd233-e5fc-4c29-a851-4474b330c0e6` (spec read from DB `tasks.description`).
Merge under test: `e0e842e` (api + web deployed SUCCESS per prompt; the `railway` CLI was NOT run per instruction).
Method: spec-contract read from DB, deployed source inspection (dm.controller.ts, api.ts, retryOn429.ts), T-8 live-probe corroboration, and a local re-run of the retryOn429 unit suite (10/10 green).

---

## AC-by-AC compliance

### AC1 — 3 DM READ routes carry bounded @Throttle(60/60s per IP), reads only — MET (live + code)
- Code: `apps/api/src/dm/dm.controller.ts:93` (`@Get()` listConversations), `:141` (`@Get(':id/messages')` listMessages), `:182` (`@Get('candidates')` getDmCandidates) each carry `@Throttle({ default: { limit: 60, ttl: 60_000 } })`. All three are `@Get` handlers — reads only.
- Live (T-8): 18/18 `GET /dm/conversations` → 200 on prod where the pre-fix shared 10/60s bucket would 429 after ~10 (`T-8-security.md:19-24`). The 60/60s override is deployed and active.
- Verified: **live** (behavioral) + **code** (exact numeral 60, all 3 routes).

### AC2 — page-load burst of concurrent DM reads no longer 429s under global 10/60s — MET (live)
- Live (T-8) bucket-isolation cross-check: in a SINGLE batch while the global `/me` bucket was actively 429'ing, all three DM reads (`/dm/conversations`, `/dm/candidates`, `/dm/conversations/:id/messages`) returned 200 (`T-8-security.md:36-44`). A concurrent DM-read burst fits the new 60/60s budget and does not exhaust the global ceiling.
- Verified: **live**.

### AC3 — throttle RIGHT-SIZED not removed: exceeding budget still 429s (finite cap) — MET (live boundedness + code numeral)
- Live: DM reads sit on a real, separate throttler bucket (200s while global bucket exhausted, `T-8-security.md:42-44`) — they are on a throttler, NOT `@SkipThrottle`d. Throttling is present and route-scoped, so a >60/60s burst would still 429.
- Code: the cap is a hardcoded finite `limit: 60` literal (dm.controller.ts:93/141/182); no env var / configurable knob (satisfies the spec edge-case "no knob without a named consumer").
- The exact ceiling of 60 (vs 120) is the one item resting on code-verification rather than live-hammering — an acceptable deterministic-NestJS-@Throttle fallback declined at T-8 to avoid over-hammering shared per-IP infra (`T-8-security.md:46-53`). Boundedness itself is live.
- Verified: **live** (bounded, scoped) + **code** (exact numeral 60).

### AC4 — non-DM-read routes + DM writes keep global 10/60s — MET (live + code)
- Live (T-8): 14× `GET /me` burst → `[200×8, 429×6]`, first 429 at index 8 (~global ceiling accounting for ~2 prior discovery calls) (`T-8-security.md:29-32`). The global 10/60s limit is genuinely still enforced on non-overridden routes; the override did not leak.
- Code: DM WRITE `POST :id/messages` (dm.controller.ts:112 `sendMessage`) carries NO `@Throttle` — it inherits the global default. `POST /dm/conversations` (create) likewise has no override. Loosening is scoped to the read path only.
- Verified: **live** (`/me` 429 proves global retained) + **code** (write routes carry no override).

### AC5 — client DM read fetches honor 429 with bounded exponential backoff + Retry-After; writes NOT retried — MET (code) — the one AC the server probe does not cover
- `apps/web/src/auth/retryOn429.ts`: retries ONLY when `err instanceof HttpError && err.status === 429` (line 53) — any other error rethrows immediately (no retry). Exponential backoff `baseMs * 2^(attempt-1)` capped at `capMs` (line 59). Retry-After honored via `Math.max(backoff, err.retryAfterMs)` when present (line 60). Bounded: `if (attempt >= maxAttempts) throw err` (line 56); default `maxAttempts: 4` (line 29) — no infinite loop.
- Retry-After parsing: `api.ts:81-92` (`parseRetryAfterMs`) handles delta-seconds and HTTP-date; `request`/`requestNoContent` attach `retryAfterMs` on 429 only (api.ts:103-105, 121-123).
- Wrapped ONLY on the 3 DM reads: `listDmConversations` (api.ts:759-762), `listDmMessages` (api.ts:781-788), `getDmCandidates` (api.ts:798). Each passes a factory `() => request(...)` so each retry issues a fresh network call — no message-list refresh gap.
- Writes NOT wrapped: `sendDmMessage` (api.ts:769-773) and `createDmConversation` (api.ts:746-750) call `request()` directly with no retryOn429 wrapper — a 429 on a write surfaces immediately, never retried. Consistent with the spec edge-case "writes go through the outbox/its own path, unchanged."
- Unit tests genuinely assert the contract (`retryOn429.test.ts`, re-run locally 10/10 green):
  - 429→retry→success (call count 2) — test:48-63.
  - Exhaust maxAttempts → throws 429; call counts exactly 4 (default) and 2 (custom) — test:69-94 (asserts boundedness, no infinite retry).
  - Retry-After honored: `setTimeout` delay spy asserts a delay ≥ 5000ms when retryAfterMs=5000 — test:100-121; and computed backoff (300ms) used when absent — test:123-140.
  - Non-429 (401/500/403) → immediate throw, call count 1 (no retry) — test:147-181; generic non-HttpError → immediate throw — test:187-196.
  - Writes-excluded: write fn returning 429 is called exactly once, never wrapped — test:203-218.
- Verified: **code** (source + passing unit tests). Not a server-observable behavior, so live-probe coverage is not applicable; the T-8 note that AC5 is B-6 source-verified (`T-8-security.md:60-61`) is correct.

---

## Drift vs gap
- **No spec drift.** Every AC's *intent* is satisfied by the deployed implementation. The only spec-noted deviation is the B-3 `HttpError` subclass (vs ad-hoc props) — a minor type-safety improvement, no behavioral or contract change (`B-3-frontend.md:6`).
- **No spec gap.** No AC is unaddressed; edge-cases (bounded, writes-not-retried, hardcoded-constant-no-knob, Retry-After-honored) are each covered in code + tests.
- **design_gap_flag=false is correct.** No route added/removed, no screen or journey delta — a decorator + a client fetch-retry wrapper on existing DM routes. Contracts section confirms "No request/response SHAPE change." No user-journey-map regeneration owed.

## Live-verified vs code-verified summary
- **AC1** — live (behavioral) + code (numeral).
- **AC2** — live.
- **AC3** — live (bounded + scoped) + code (exact 60).
- **AC4** — live (global retained) + code (writes no override).
- **AC5** — code (source + 10/10 unit tests); not server-observable, no live-probe applicable.

## Recommendation
APPROVE. Shipped behavior meets the spec's acceptance criteria (four ACs live-verified on prod, AC5 code-verified as it is client-side and not server-observable). No REWORK items for V-2 triage.
