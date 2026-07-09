# Wave-82 L-block observations — knowledge-synthesizer

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND the head-X gate approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms, UNLESS a strong 1st instance clears the bar on
its own merit (head-X discretion, per the wave-78 BUILD-17 precedent).

---

## Inputs read

- Wave-82 deliverables: `process/waves/wave-82/stages/` (P-0-frame, P-0-ceo-reviewer,
  P-0-problem-framer, P-1-decompose, P-2-spec, P-3-plan, P-4-gemini-review, B-0, B-1, B-2, B-4,
  B-5, B-6-review, B-6-review-output, B-6, C-1-pr-ci-merge, C-2-deploy-and-verify, T-1..T-9,
  V-1-karen, V-1-jenny, V-1-summary, V-2-triage, V-3-fast-fix).
- Gate verdicts: `blocks/P/gate-verdict.md` (APPROVED, both phases), `blocks/B/gate-verdict.md`
  (REWORK attempt 1 → APPROVE attempt 2), `blocks/T/gate-verdict.md` (APPROVED), `blocks/V/*`.
- Prior archives consulted (most recent 5): wave-81, wave-80, wave-79, wave-78, wave-77 —
  `process/waves/_archive/wave-<N>/blocks/L/observations.md` for each.
- Principles files read: `command-center/principles/BUILD-PRINCIPLES.md` (18 rules),
  `command-center/principles/CI-PRINCIPLES.md` (12 rules),
  `command-center/principles/test-layer-principles/T-1.md` (0 rules),
  `command-center/principles/test-layer-principles/T-2.md` (1 rule).

**Wave outcome:** Transient-401 auth bounce fix (AuthGuard settle-then-recheck). B-6 attempt 1
REWORK (primary fix was a no-op for the real NOT_EXISTS transient); B-6 attempt 2 APPROVE (correct
settle-then-`doesSessionExist` poll replacing the boolean-gated path). PR #101 merged; 762 web
tests green; deployed live. C-1 attempt 1 was a whole-run infra cancellation; attempt 2 green.

**De-dup up front (existing rules this wave touched):**
- BUILD rule 4 (reproduce a negative path at B-6 Phase-2): B-6 attempt-1 REWORK is a confirming
  instance — the B-3 no-op passed the Phase-1 head-builder gate AND a green unit suite, and was
  caught ONLY by the Phase-2 adversarial re-review. No new rule; recorded in obs-4 below.
- BUILD rule 17 (fail-closed hidden-vs-error branch): not directly touched this wave (this is an
  auth-resilience fix, not a UI privacy-state branch). No re-promotion.
- CI rule 8 (file a stabilization task for a test failing parallel 3+ runs): the C-1 infra
  cancellation (obs-3) is a DIFFERENT class — a run-level infrastructure event, not a code/suite
  flake. Adjacent, not the same rule.
- CI rule 12 (grant flake re-run only to a test in the B-5 flakes ledger): the C-1 re-run was for
  an infra cancellation, not a test flake — also a different class (obs-3).
- T-2 rule 1 (assert what a non-sender recipient receives via real fan-out): not touched this wave.

---

## obs-1 — Before adding a platform retry/refresh seam, trace whether the SDK already covers the transient; if it does, the new seam may be a no-op for the exact failure it targets

**What happened:**
The P-3 plan called for adding a `withRefreshRetry` seam inside `api.ts request()` / `requestNoContent()` to catch the transient-401 bounce. The seam was correctly shaped (single-flight, retry-once, genuine-logout guard), built, and tested green at B-3 / B-5. B-6 attempt 1 gave a REWORK verdict because the primary failure mode — `onSessionExpired` firing during a concurrent-refresh burst — is driven by SuperTokens' own `SessionAuth` / UNAUTHORISED event path, not by the api-client layer. In that path, the fix gates the "don't bounce" decision on `attemptRefreshingSession()` returning `true`. But when local state is `NOT_EXISTS` (the exact transient that fires the event), `attemptRefreshingSession()` re-reads local state, hits the same NOT_EXISTS short-circuit, and returns `false` without any network call. Result: the new seam's primary path short-circuits to redirect anyway — a no-op for the real transient, not a fix. The correct fix (settle-then-recheck `doesSessionExist` directly) required understanding that the SDK's boolean is not the right liveness oracle in this state.

The P-4 Phase-2 gate (Karen) had mandated an "interceptor-trace-first" binding condition before building. The B-3 specialist performed the trace and correctly identified the mechanism — but the trace's load-bearing Mechanism-3 conclusion was only half right (it correctly identified the NOT_EXISTS transient but did not trace that `attemptRefreshingSession` itself also short-circuits on NOT_EXISTS, making the gating condition a no-op). The fix landed only after B-6 identified the half-wrong conclusion and prescribed the settle-then-recheck approach.

**Why it generalizes:**
When fixing a transient caused by SDK-internal state (token writes, lock acquisition, event sequencing), the new application-layer seam operates ON TOP OF the SDK, not instead of it. The SDK's own error path may already intercept or short-circuit the exact condition being fixed, making the new seam redundant at best and a no-op at worst for the real transient. The trace obligation is: for the specific failure path the fix targets, follow the SDK source (not just the public API contract) to confirm the new seam is actually reachable and decisive in that path — not merely net-additive-safe.

**Falsifiable:** Does the fix trace to confirmation that the new seam IS consulted and IS decisive in the production-dominant failure path, not just that it is net-additive-safe (doesn't worsen things)?

**Source artifacts:**
- `process/waves/wave-82/blocks/P/gate-verdict.md` Phase 2 — Karen "interceptor-trace-first" binding condition
- `process/waves/wave-82/blocks/B/gate-verdict.md` attempt 1 (REWORK), § "Heuristic 5 + Iron-Law — the fix does NOT resolve the transient"
- `process/waves/wave-82/blocks/B/gate-verdict.md` attempt 2 (APPROVE), § "1 — Settle-then-recheck resolves the dominant path"
- `process/waves/wave-82/stages/B-6-review.md` (REWORK rationale)

**Severity:** strong — the fix was a no-op on the production-dominant path, caught by the B-6 Phase-2 mandatory review. Without the Phase-2 pass, a green test suite (11 new tests, all passing) would have shipped a fix that did not actually fix the reported bounce.

**Candidate principles file:** BUILD-PRINCIPLES.md (rule 19 — build/implementation seam obligation).

**Cross-wave recurrence:** FIRST INSTANCE. No prior wave's L-observations names the "trace that your new seam is decisive for the real failure path, not merely net-additive-safe" class. Must HOLD for a 2nd instance unless head-learn judges the strong-1st bar (security-relevant, silent-by-green-tests, caught only by the mandatory B-6 Phase-2 pass). Pre-shaped wording for a future promotion (karen must re-verify char counts and wording):

```
19. Before adding a retry or refresh seam over an SDK, trace the SDK source to confirm the seam is decisive in the target failure path, not merely net-additive-safe.
    Why: An SDK-internal short-circuit can make a new seam a no-op for the exact transient it was built to fix.
```

Rule line = 158 chars — OVER. Tighter form needed at promotion (karen to author). Working form:

```
19. For an SDK-internal transient, trace the SDK source to confirm the fix is decisive in that path, not just net-additive-safe.
    Why: An SDK short-circuit on the exact failing state can make a new application-layer seam a no-op.
```

Rule line = 120 chars (=120). Why line = 98 chars. PASS both. No forbidden tokens. Karen must re-verify final char counts.

**Disposition:** HOLD — 1st instance. Strong candidate on merit (silent, green-test-confirmed, caught only by mandatory Phase-2). Recommend head-learn CONSIDER via strong-1st discretion if a security-relevant SDK-integration wave is not expected soon; otherwise hold for a 2nd instance.

---

## obs-2 — Assert resolution on the production-dominant path, not a call on the incidental passing branch

**What happened:**
B-3 authored 11 unit tests for the `refreshAndRetry` seam and `AuthGuard.onSessionExpired` handler. All 11 passed green. B-6 attempt 1 REWORK found that the AuthGuard tests mocked `attemptRefreshingSession` to resolve `true` — exercising the branch where the refresh succeeds and heals the session, i.e., the timing-accident branch where the front-token write lands before the second `getLocalSessionState` call. In the production-dominant path (NOT_EXISTS local state at the moment of `attemptRefreshingSession`), the function returns `false` without a network call. The tests did not exercise that branch. The `doesSessionExist()` guard at `AuthGuard.tsx:40` was AND-gated behind `refreshed`, so when `refreshed === false` (the real transient), the guard was never consulted. The B-6 REWORK verdict stated: "The tests conceal this ... they exercise the timing-accident branch, not the reliable NOT_EXISTS→SESSION_EXPIRED→false branch that dominates in production. This is exactly the 'call-only / wrong-path no-op passes green' failure."

The fix (attempt 2) replaced the boolean-gated path with settle-then-recheck and added a DOMINANT PATH test that drives `attemptRefreshingSession → false` and `doesSessionExist` returning `false → false → true` across settle ticks, asserting no redirect. The T-9 gate confirmed: "The T-2 claim rests on `AuthGuard.test.tsx` DOMINANT PATH case, and it holds under inspection: it drives `attemptRefreshingSession → false` while `doesSessionExist` returns false → false → true across settle ticks, then asserts `redirectToAuth` was NOT called."

**Why it generalizes:**
When a fix has two behavioral paths — an incidental passing branch and a production-dominant branch — mocking a dependency to exercise only the incidental branch produces tests that pass a no-op. The obligation: identify the production-dominant failure path (the one the fix targets) and assert the RESOLUTION on that path (the post-fix, post-settle source-of-truth), not that a function was called. The falsifiable check: in the test for the primary fix, does the mock configuration exercise the dominant production path (including the condition that was failing), and does the assertion prove the fix resolved it?

**Source artifacts:**
- `process/waves/wave-82/blocks/B/gate-verdict.md` attempt 1, § "Heuristic 5 + Iron-Law" and § "The tests conceal this"
- `process/waves/wave-82/blocks/B/gate-verdict.md` attempt 2, § "3 — The new test proves the DOMINANT branch"
- `process/waves/wave-82/stages/T-2-unit.md` (coverage audit citing the dominant-path test)
- `process/waves/wave-82/blocks/T/gate-verdict.md` (T-9 verdict, § "Dominant-path coverage is genuine")

**Severity:** warning — the tests passed green on a no-op for the real transient. This was caught by B-6 Phase-2 (mandatory review), not by the test suite itself. A future wave where Phase-2 is lighter could ship a test suite that passes on a fix that doesn't fix anything.

**Candidate principles file:** T-2.md (unit test layer, rule 2). T-2.md currently has 1 rule (rule 1 about non-sender recipients). This is a distinct class: not about what topology to use, but about which path to exercise and what to assert.

**Cross-wave recurrence:** FIRST INSTANCE. The wave-81 obs-3 (timer-component flake needing fake timers + waitFor) is adjacent but distinct — that was about a real-timer open handle causing a suite hang, not about mocking a dependency to the wrong branch and proving a no-op. No prior wave's L-observations names the "mock exercises the incidental branch, not the dominant production path" class. Must HOLD for a 2nd instance.

Pre-shaped wording for future promotion (karen must verify char counts):

```
2. For a behavioral fix with a dominant and an incidental path, assert resolution on the dominant path with a mock configuration that exercises the actual failing condition.
   Why: A mock set to the incidental passing branch proves a no-op for the real failure while the suite stays green.
```

Rule line = 161 chars — OVER. Tighter form:

```
2. Assert resolution of the production-dominant failure path; do not mock a dependency to a value that exercises only the incidental passing branch.
   Why: A mock set to the incidental value proves a no-op for the real failure while the suite stays green.
```

Rule line = 147 chars — still over. Continue tightening:

```
2. Assert that the fix resolves the dominant failure path; configure mocks to exercise that path, not the incidental passing branch.
   Why: A mock that skips the dominant path proves a no-op for the real failure while the suite passes.
```

Rule line = 130 chars — still over. Tighter:

```
2. Mock dependencies to the production-dominant failing condition and assert resolution; not just that a function was called on the passing branch.
   Why: A mock set only to the incidental passing branch proves a no-op for the real failure.
```

Rule line = 144 chars — over. Karen must author a conforming form at L-2. The concept is clear; the char limit requires tightening at distill time.

**Disposition:** HOLD — 1st instance. Real, generalizable, falsifiable, cited. T-2.md has only 1 rule, so a slot exists. Hold for a 2nd instance (any wave where a unit test suite passes because a mock is configured to an incidental passing branch, not the dominant failure path).

---

## obs-3 — All CI jobs cancelled at an identical instant after a uniform wall-clock duration with zero steps and no logs is a runner-infrastructure timeout, not a code or suite defect

**What happened:**
C-1 PR #101 CI attempt 1 (run `29013089878`) showed all 7 required jobs concluding `cancelled` at the exact same instant (2026-07-09T11:08:58Z), each having run for a uniform 15m1s, with ZERO steps recorded and no logs or annotations retained (API returned `BlobNotFound` for all job logs). No newer commit existed for the SHA; no superseding run was present. This signature — all jobs killed together at a fixed wall-clock ceiling, no step data, no log output — is a run-level / runner-infrastructure cancellation event, not a test assertion failure, not a fail-fast sibling cancellation (which would have shown logs and varying durations), and not the project's known study-timer flake (which fails on test assertions, not a uniform no-step kill). A single `gh run rerun` cleared it (attempt 2: all 7 jobs success with normal durations 17s–2m4s).

The C-1 stage correctly classified this and documented: "classification: ci-infrastructure (whole-run cancellation, NOT a code defect, NOT the study-timer flake)." The action was a one-shot fresh rerun (analogous to a lost/cancelled-run policy), with fix-up-cycles=0 because no code was touched.

**Why it generalizes:**
The diagnostic signature for a runner-infrastructure cancellation is reliable and distinct: (1) ALL jobs in the run conclude cancelled at the SAME instant; (2) all show the SAME uniform wall-clock duration (runner timeout value); (3) zero steps are recorded in any job; (4) logs are absent or return BlobNotFound. If even one job shows step data or a different duration, fail-fast sibling cancellation or a code failure is more likely. The correct response to this signature is a single fresh re-run — no specialist routing, no fix-up commits.

**Falsifiable:** Check the failing run: do all jobs share one cancellation timestamp, a uniform wall-time, and zero steps? If yes, trigger a single re-run before routing to a specialist. If any job shows steps or varying duration, the cause is different.

**Source artifacts:**
- `process/waves/wave-82/stages/C-1-pr-ci-merge.md` § `infra_reruns` (full diagnostic evidence and action)

**Severity:** informational — the wave handled it correctly; no fix-up cycles were needed. The value of recording it is to prevent a future C-1 reviewer from routing a pure runner-infrastructure cancellation to a code specialist, wasting a fix cycle on code that has no defect.

**Candidate principles file:** CI-PRINCIPLES.md (rule 13). CI-PRINCIPLES.md currently has 12 rules; rule 8 is about filing a stabilization task for a test flake (3+ runs, parallel-suite failure), which is a distinct class. Rule 12 is about the flake re-run allowance requiring a B-5 ledger entry. Neither covers the "all-jobs-uniform-cancelled-at-wall-time = infra event, re-run once" diagnostic.

**Cross-wave recurrence:** FIRST INSTANCE. No prior wave's L-observations names this infrastructure-cancellation signature or the one-shot-rerun response. Must HOLD for a 2nd instance.

Pre-shaped wording for future promotion (karen must verify char counts):

```
13. If all CI jobs conclude cancelled at the same instant with a uniform wall-time and zero steps, it is an infra timeout; re-run once, no specialist routing.
    Why: The uniform-killed signature proves no code ran; a fix cycle is wasted when the runner, not the code, failed.
```

Rule line = 160 chars — OVER. Tighter form:

```
13. Treat all jobs cancelled at the same instant with a uniform wall-time and no steps as a runner timeout; re-run once without a specialist.
    Why: Zero step data proves no code ran; routing to a specialist wastes a cycle on code that is not defective.
```

Rule line = 140 chars — still over. Tighter:

```
13. A run where all jobs cancel at the same instant with no step data is a runner timeout; one re-run suffices, no specialist.
    Why: Zero steps across all jobs proves no code ran; a fix cycle is wasted if the runner, not the code, failed.
```

Rule line = 124 chars — close. Continue:

```
13. All jobs cancelled simultaneously at a uniform wall-time with no step data signals an infra timeout; re-run once, no code fix.
    Why: Zero steps across all jobs proves no code ran; routing to a specialist wastes a cycle on clean code.
```

Rule line = 129 chars — still over. Karen must author the final conforming form at L-2.

**Disposition:** HOLD — 1st instance. Clean diagnostic signature, cited, falsifiable. Promote if a 2nd wave encounters the same uniform-cancelled-at-wall-time runner event.

---

## obs-4 — INFORMATIONAL: B-6 Phase-2 adversarial review again caught what Phase-1 + green unit suite missed (4th confirming instance of BUILD rule 4)

**Source artifacts:**
- `process/waves/wave-82/blocks/B/gate-verdict.md` attempt 1 (REWORK): Phase-1 head-builder APPROVED;
  11 unit tests green; Phase-2 adversarial re-review found the no-op.
- `process/waves/wave-82/blocks/B/gate-verdict.md` attempt 2 (APPROVE): rationale confirms the
  mechanism was re-derived from SDK source independently.

**Assessment:** The B-6 attempt-1 REWORK verdict notes that the Phase-1 gate and the green test suite (11 tests) both passed a fix that was a no-op for the production-dominant path. The fix was caught only by the mandatory B-6 Phase-2 adversarial review (the head-builder re-reviewing independently and tracing the SDK source). This is the 4th confirming instance of BUILD rule 4 ("Reproduce one negative path per authz or injection boundary at B-6 Phase-2; a Phase-1 code-read APPROVE is not sufficient"): wave-78 (privacy-oracle fail-open, missed by Phase-1), wave-79 (3 High crypto findings, all missed by Phase-1 and unit suite), and now wave-82 (SDK no-op, green test suite). No new rule — BUILD rule 4 is already shipped. Recorded to maintain the archive's visible count of Phase-2's load-bearing catches.

**Severity:** informational — confirms BUILD rule 4; no new rule.
**Candidate principles file:** none.
**Cross-wave recurrence:** confirming-in-practice of BUILD rule 4 (4th instance).
**Promotion flag:** NO.

---

## Standing-HOLD status check

| origin | class | wave-82 status |
|---|---|---|
| wave-81 obs-1 (HOLD, strong 1st) | CI rule 12 — grant C-1 flake re-run only to a test in B-5 flakes ledger | CONFIRMED SHIPPED (CI rule 12 now exists). No further tracking needed. |
| wave-81 obs-2 (HOLD — 1st) | SW-cached SPA serves stale bundle for one post-deploy navigation | NOT CONFIRMED. This wave is frontend-only JS (no Workbox/SW precache change). HOLD maintained. |
| wave-81 obs-3 (HOLD — 1st, no target file) | Timer-component tests need fake timers + waitFor-polled derived reads | NOT CONFIRMED as independent class. This wave has no timer-component tests. T-2.md exists as a target file now (though it had 0 rules at the time; now has rule 1). HOLD maintained — still 1st instance. |
| wave-80 obs-2 (HOLD — 1st) | Full-replace PUT clobbers concurrent field change | NOT CONFIRMED. No settings PUT / partial-update surface this wave. HOLD maintained. |
| wave-80 obs-3 (HOLD — 1st) | Realtime toggle must proactively emit state change, not rely on passive gating | NOT CONFIRMED. No realtime feature this wave. HOLD maintained. |
| wave-79 obs-3 (HOLD — 1st) | No destructive/irreversible state change as a side effect of a read or decrypt path | NOT CONFIRMED. No decrypt/read-side-effect surface this wave. HOLD maintained. |
| wave-79 obs-5 (HOLD — 1st) | Prove server-blind invariant via separate-connection read-back (NULL col + count-0) | NOT CONFIRMED. No persistence-blindness invariant this wave. HOLD maintained. |
| wave-78 obs-2 (HOLD — 1st) | Verify a fix by content in the merge tree, not commit-hash ancestry under squash-merge | NOT CONFIRMED as an active false-negative. V-1-karen and V-1-jenny this wave verified behavior via live probe and source inspection, not hash-ancestry. HOLD maintained. |

---

## Summary table

| # | Title (short) | Severity | Recurrence | Candidate file | Disposition |
|---|---|---|---|---|---|
| obs-1 | Trace SDK source to confirm the fix is decisive in the real failure path, not just net-additive-safe | strong | 1st INSTANCE | BUILD-PRINCIPLES.md (rule 19) | HOLD — 1st instance; CONSIDER strong-1st if no SDK-integration wave expected soon |
| obs-2 | Assert resolution on the dominant failure path; configure mocks to that path, not the incidental passing branch | warning | 1st INSTANCE | T-2.md (rule 2) | HOLD — 1st instance |
| obs-3 | All-jobs-uniform-cancel at wall-time with no steps = runner infra timeout; re-run once, no code fix | informational | 1st INSTANCE | CI-PRINCIPLES.md (rule 13) | HOLD — 1st instance |
| obs-4 | B-6 Phase-2 adversarial review caught what Phase-1 + green suite missed (4th BUILD rule 4 confirming instance) | informational | confirms BUILD rule 4 | none | NO — existing rule |

**Recommendation to head-learn / L-2 karen:** 3 candidate observations (obs-1..obs-3) — all first instances. Zero recur across 2+ prior waves. No standing HOLD from prior waves gained a confirming 2nd instance this wave. The correct expected outcome is zero promotions this wave. obs-1 is the strongest individual candidate (strong severity, silent-by-green-tests, security-relevant, caught only by mandatory Phase-2) and could be considered for strong-1st discretion if head-learn judges the BUILD-18/BUILD-17 precedent applies; the pre-shaped rule requires char-limit tightening before it can promote. obs-2 is a genuine and falsifiable class but the char-limit challenge on any single-line formulation is substantial — karen should author the rule text before committing to promotion. obs-3 is informational and clean but a pure first-sighting.
