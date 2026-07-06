# Wave 61 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, Phase 1)
**Reviewed against:** process/waves/wave-61/blocks/B/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

The build faithfully implements task 874bd233 — DM read-route throttle right-sizing plus a bounded client-side 429 backoff — with every reviewer-flagged risk verified at the source, not just from the deliverable prose.

**B-2 (backend, commit 3771e5c):** Confirmed at `apps/api/src/dm/dm.controller.ts` that exactly the 3 DM READ handlers carry `@Throttle({ default: { limit: 60, ttl: 60_000 } })` — `listConversations` (:92-93), `listMessages` (:140-141), `getDmCandidates` (:181-182). The constant is **60** (NOT the reviewer-flagged 120). `Throttle` is imported from `@nestjs/throttler`. Both WRITE handlers are UNTOUCHED and carry no rate decorator: `@Post() createConversation` (:65) and `@Post(':id/messages') sendMessage` (:112) — they keep the global 10/60s limit, which is the stricter, correct posture for mutations. No `@SkipThrottle` was added to DM; the only `@SkipThrottle` in the API tree is the pre-existing `/health` exemption (`apps/api/src/health/health.controller.ts`), unrelated to this wave.

**B-3 (frontend, commit 7b8c923) — the higher-risk shared-helper change:** `request()`/`requestNoContent()` now throw `HttpError` (extends Error, adds `status` + optional `retryAfterMs`) instead of a plain `Error`. Non-429 behavior is preserved because (a) `HttpError extends Error` so `err instanceof Error` stays true, and (b) `super(message)` is passed the identical `` `${res.status} ${res.statusText}: ${body}` `` string. Every existing caller across `apps/web/src` uses the `err instanceof Error ? err.message : …` pattern (InviteJoinPage, ProfilePage, AssignmentCard/Form, CreateServerModal, MemberListPanel, ServerRolesPage, SessionDetail/Form, StudyTimerWidget, SubmissionsRoster, etc.) — all remain correct. The one other `HttpError` grep hit (`voice-occupancy.test.tsx`) is a pre-existing wave-32 local helper `mockFetchHttpError`, a name collision only, not a reference to the new class. This is empirically backed by B-5's full web suite 477/477. `retryOn429` is BOUNDED: `maxAttempts` default 4 (1 + 3 retries) with `if (attempt >= maxAttempts) throw err` — no infinite loop; exponential backoff `baseMs·2^(attempt-1)` capped at `capMs` 10_000ms; Retry-After honored as a floor via `Math.max(backoff, retryAfterMs)` with negative/past-date guarding in `parseRetryAfterMs`. It retries ONLY on `HttpError` with `status === 429`; every other error (including plain network Errors) rethrows immediately. It wraps EXACTLY the 3 DM read GETs (verified: 3 `retryOn429(` sites in api.ts, all reads) — the DM write POSTs are NOT wrapped, eliminating any 429 double-send risk. Reads are idempotent, so retrying them is safe.

**B-5:** tsc clean (web+api), full web 477/477, api dm/messaging 152/152, biome clean.

This is contract-correct, low-value M8-tail drainage with no schema/contract shape change (B-1 fast-path was legitimately taken). No idempotency, unguarded-door, or offline-contract regression. Scope size is not grounds for rework. All B-6 stage-exit checks pass.

## T-8 carry-forward (rate-limit security surface)
Live-verify at T-8:
- DM WRITE routes (createConversation, sendMessage POSTs) enforce the global **10/60s** limit.
- DM READ routes (conversations, :id/messages, candidates GETs) enforce **60/60s**, constant = 60.
- No DM route is left un-throttled and none carries `@SkipThrottle`.
- Client `retryOn429` bounded backoff triggers only on 429 for the 3 read GETs and never retries writes.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
