# Wave 82 — V-3 Verdict

**Reviewer:** head-verifier (fresh spawn, V-block exit gate)
**Reviewed against:** process/waves/wave-82/blocks/V/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

Independent review of the two V-1 reviewer verdicts, the V-2 triage, and the upstream spec + B-6/T-9 gate records confirms the wave meets every acceptance criterion in DEPLOYED behavior, and both APPROVEs are earned rather than shallow. **karen's APPROVE is load-bearing-verified, not a rubber-stamp:** she confirmed both exported functions at file:line, the fixed `SETTLE_RECHECK_TICKS=5` bound as a module-level constant (not unbounded), the `api.ts` `withRefreshRetry` seam with 429 preserved inside `doFetch`, a live 15/15 vitest run with no `.skip/.only/.todo`, and — decisively — that the dominant-path test asserts `redirectToAuth NOT called` on the `false→settle→true` branch (a resolution assertion, not a call assertion). She also reconciled the prompt's squash commit `30bad914` against the C-2 deploy record `b22457a9` (byte-identical `apps/web/src/auth/` trees, both in HEAD), so the deployed bundle provably carries the exact fix. **jenny's APPROVE is likewise substantive:** she fingerprinted the compiled settle-loop (`for(let n=0;n<Vq;n+=1)if(await $q(),await kf.doesSessionExist())return;await nk.redirectToAuth(...)`) and the single-flight `attemptRefreshingSession().catch(()=>!1).finally(()=>{tv=null})` directly in the LIVE bundle `index-CesvhXg_.js`, and confirmed the genuine-logout inverse (AC-2) live at the API origin (unauthed `/me`, `/dm/*` → real `401 unauthorised`). She disclosed the one honest gap — no in-browser login→DM click-through this run (Playwright profile locked by the concurrent karen; correctly no `browser_close`) — and covered it with bundle-fingerprint + live-API + unit triangulation plus the already-recorded T-9 live no-bounce probe. **V-2 triage is correctly bucketed:** 0 blocking is justified by both 0-finding APPROVEs, no spec drift, and no critical T-finding; the PWA icon 404 is a genuine non-blocking cosmetic item (filed as task `024a1483`, orthogonal to the auth change); the fixture test-data cruft is genuine noise (test-account state, not a product-code defect). Nothing load-bearing was downgraded.

**On the not-reproduced race (the central judgment call):** passing verification without a live before/after reproduction is CORRECT here, not a gap, for three converging reasons. (1) **Feasibility** — the transient-401 is a non-deterministic frontToken-write-ordering window; a headless probe genuinely cannot reliably force it, and a fabricated repro would be worse than an honest negative (H-V flaky-retry-masking, inverted). (2) **The coverage does not actually rest on the timing accident** — this is the key point the B-6 attempt-2 record establishes from installed SuperTokens source: the production-dominant burst path heals via the SDK's `REFRESH_TOKEN_USE` lock serialization (the frontToken write is committed inside the refresh promise BEFORE the lock releases), so `doesSessionExist()` is already true on the fast-path return, deterministically, independent of the 5-tick bound. The bound only backstops the pathological >1s lock-timeout case, and since `FrontToken.setItem` is a fully-awaited storage write there is no async write that can lag 5 macrotasks. So the fix is deterministic on the path that matters — the race being "not live-reproduced" does not leave the resolution unproven; the mechanism is proven at source and the compiled artifact is fingerprinted live. (3) **The exact no-op the P-4 mandate feared was caught and corrected** — B-6 attempt-1 REJECTED the boolean-gated `attemptRefreshingSession` version precisely because it no-op'd on the dominant NOT_EXISTS case and only healed on a timing accident; attempt-2's settle-then-recheck ignores that boolean and polls `doesSessionExist()` directly, and the dominant-path unit test now exercises the `false→settle→true` branch the old suite skipped. That REWORK→correction cycle is exactly the acceptance-by-assertion / green-by-suppression failure mode the gate exists to catch, and it was caught upstream and closed. AC-by-AC on the deployed binary: AC-1 (silent refresh+retry, no bounce) — settle-loop compiled live + stable-flow evidence; AC-2 (genuine-logout guard) — confirmed live at API + unit + T-8; AC-3 (retry-once, 401-only) — unit resolution-asserted; AC-4 (single-flight burst) — fingerprinted live + unit; AC-5 (no 429/offline regression) — `retryOn429` byte-unchanged, disjoint predicates; AC-6/P-4 "must resolve not no-op" — the load-bearing win, genuinely resolved. No reviewer false-negative, no spec drift, no runaway fix loop.

## Rework instructions  (only if REWORK)
n/a (APPROVED)

## Escalation  (only if ESCALATE)
n/a (APPROVED)

## Phase 2 (fast-fix)
Skipped — V-2 `fast_fix_queue` is empty (0 blocking findings). Per V-3 Action 2, the skip is recorded and the block exits on the Phase-1 APPROVED verdict. The 2 LOW non-blocking items (PWA icon 404 → task `024a1483`; fixture cruft → noise) carry forward outside this wave; the 4 code-robustness fast-follows were already filed at B-6 as task `fd2dc5a7`.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
