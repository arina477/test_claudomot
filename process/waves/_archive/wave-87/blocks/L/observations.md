# Wave-87 L-block observations — knowledge-synthesizer

Append-only. L-2 Distill (karen + head-learn) reads these; promotes to `*-PRINCIPLES.md` ONLY
when an observation recurs across 2+ waves AND the head-X gate approves (max 1 rule/file/wave).
Single-wave observations stay here until a second wave confirms, UNLESS a strong 1st instance
clears the bar on its own merit (head-X discretion, per the wave-78 BUILD-17 precedent).

---

## Inputs read

- Wave-87 deliverables: `process/waves/wave-87/stages/` (P-0-frame, P-0-problem-framer,
  P-0-ceo-reviewer, B-5-verify, C-1-pr-ci-merge, T-2-unit, T-4-integration, V-3-fast-fix) +
  `blocks/{P,B,T,V}/{gate-verdict,review-artifacts}.md` + `blocks/T/findings-aggregate.md` +
  `escalations/board-P-1-floor-merge-wave-87*.md`.
- Prior archives consulted (most recent 5): wave-82, 83, 84, 85, 86 —
  `process/waves/_archive/wave-<N>/blocks/L/observations.md`.
- Principles files read for de-dup: `BUILD-PRINCIPLES.md` (19 rules), `CI-PRINCIPLES.md` (13),
  `PRODUCT-PRINCIPLES.md`, `test-layer-principles/T-1.md` (0), `T-2.md` (1).

**Wave outcome:** Behavior-preserving data-hygiene. New server-member joins now stamp the
server's existing all-flags-false default 'Member' role (was `role_id`=NULL) in a shared
membership-insert core. P-0 REFRAMED a seed's "RBAC security gap" framing into an optional
hygiene convergence (NULL is intended-safe). P-1 floor WAIVED by BOARD 7/7 (already logged to
product-decisions). A pre-existing, CI-blocking study-timer web-unit flake was root-caused +
fixed on-branch to unblock merge (PR #107 → 1d2ef9df). T-4 real-Postgres integration test
couldn't run locally (no PG) so it landed via follow-up PR #108 where CI provisions postgres:16.

**De-dup up front (existing rules this wave brushed):**
- BUILD rule 3 ("any seed applied by a backfill must also appear in the create transaction,
  column-for-column") — wave-87 is a *live confirmation* of that rule's value: the whole wave
  converges new-join `role_id` onto what `backfill-roles.ts` already enforces. Not re-proposing.
- BUILD rule 16 (delegate authz to the shared tested seam) — the fix applies `role_id` in a
  shared join core (`resolveDefaultRoleId`), consistent with the rule. Confirmation, not new.
- CI rules 11 / 12 (prod-baseURL e2e non-required; flake re-run only for B-5-ledgered tests) —
  both applied cleanly at C-1. Confirmation, not new.
- No existing rule covers the vitest per-test-timeout vs asyncUtilTimeout invariant (obs-1) or
  the "re-verify an old finding's security framing against current code" obligation (obs-2).

---

## obs-1 — A withRealTimers `waitFor` per-test timeout must exceed its asyncUtilTimeout, or the test aborts mid-helper and leaks real timers

**Finding:**

The CI-blocking `test`-job failure on PR #107 was a PRE-EXISTING web-unit flake in
`apps/web/src/shell/study-timer.test.tsx` (`StudyTimerWidget`), unrelated to wave-87's API
change. Root cause (fixed in commit 7d45bd62): vitest's default per-test `testTimeout` (5000ms)
was EQUAL to the effective `asyncUtilTimeout` (5000ms) used by the Testing Library `waitFor`
polling under `withRealTimers`. Under CI load a `waitFor` polling right up to ~5s trips the
per-test timeout at the same instant it would have resolved, aborting the test mid-helper and
leaving real timers + an un-unmounted render alive. The abort then cascades: the `afterEach`
`vi.runOnlyPendingTimers()` throws (`Timers are not mocked`) because real timers are active, and
the leaked mount produces a "Found multiple elements by [data-testid]" error in the *next* test.
Two symptoms (timeout + multi-element), one cause (timeout budget ≤ async-util budget). The fix:
raise the per-test timeout to 15000 (> asyncUtilTimeout 5000) AND guard the `afterEach` teardown
so `runOnlyPendingTimers()` cannot fire under real timers. Local after fix: study-timer 37/37,
web 788/788, api 828/828.

The generalizable invariant: for any test that polls with real timers (a `waitFor` /
`waitForElementToBeRemoved` under `withRealTimers` or with fake timers disabled), the per-test
timeout MUST strictly exceed the async-util polling timeout. When they are equal, the per-test
timeout can win the race and abort the polling helper before it resolves, leaving real timers and
renders alive to corrupt sibling tests. Equally: an `afterEach` that calls a fake-timer-only API
(`runOnlyPendingTimers` / `runAllTimers`) must guard on fake timers being active, so a test that
exits under real timers does not throw in teardown.

**Source artifacts:**
- `process/waves/wave-87/stages/C-1-pr-ci-merge.md` (§blocking-failure classification + fix-up
  cycle 1: commit 7d45bd62, "per-test timeout 15000 > asyncUtilTimeout 5000, guarded afterEach")
- `process/waves/wave-87/stages/T-2-unit.md` (stabilized study-timer.test.tsx, 788/788 web)
- `apps/web/src/shell/study-timer.test.tsx:226` (afterEach `vi.runOnlyPendingTimers()` under real
  timers — the teardown throw site)

**Recurrence check:** No prior L-obs (waves 82–86) names the vitest per-test-timeout vs
asyncUtilTimeout race or the real-timer teardown-guard class. FIRST INSTANCE. Waves 82 (transient
auth flake) and 86 dealt with async settle/coalescing but at the app-logic layer, not the
test-harness timeout-budget layer. Distinct.

**Severity:** warning — the flake was pre-existing and non-blocking to product behavior, but it
BLOCKED a clean merge (required `test` check red) and cost a fix-up cycle. The invariant is
falsifiable and reusable across every real-timer polling test in the web suite.

**Candidate principles file:** `test-layer-principles/T-1.md` (unit-layer test-harness rule) —
alt `BUILD-PRINCIPLES.md`.

**Disposition:** HOLD — 1st instance, but clean + falsifiable (check: does every real-timer
`waitFor` test have `testTimeout > asyncUtilTimeout`, and is every fake-timer-only teardown call
guarded on active fake timers?). Pre-shaped wording for future confirmation (karen must verify
char counts before any promotion):

```
N. Set a real-timer waitFor test's per-test timeout strictly above its async-util timeout, and guard fake-timer-only teardown on active fake timers.
   Why: An equal timeout aborts the poll mid-helper, leaking real timers and renders that corrupt sibling tests.
```
Rule line is OVER 120 chars — must be split or tightened at promotion. Tighter single-invariant form:
```
N. Keep a real-timer waitFor test's per-test timeout above its async-util timeout.
   Why: An equal timeout can abort the poll at the instant it resolves, leaking real timers into sibling tests.
```

---

## obs-2 — An old finding's security/robustness FRAMING must be re-verified against current code before it becomes the wave target; it can have evaporated

**Finding:**

The wave-87 seed (dc4abee3) framed NULL `role_id` on join as a possible "RBAC security/correctness
gap." At P-0, problem-framer verified against live code that NULL `role_id` is the INTENDED SAFE
base-member state: RBAC has two lanes — `rbac.service.ts` `can()` default-denies NULL (correct for
privileged routes) and `canViewChannel()` treats NULL as implicit base member — so NULL ≡ the
all-flags-false default 'Member' role at the permission layer. The security framing EVAPORATED; the
wave reduced to optional, behavior-preserving data-hygiene (converge new-join `role_id` onto the
existing default role so the live tree matches the `backfill-roles.ts` invariant). A blind "assign
a default role because the finding said so" would have been RBAC churn with no behavior change.

This is the THIRD instance of a recurring class where a bug-fix-phase seed cites a prior finding
whose security/robustness framing does not survive contact with the current code/SDK:
- wave-84 obs-3: BOARD reframe prevented a naive security fix that would trade MEDIUM XSS for HIGH
  auth-reliability regression (framing was harmful-if-taken-literally).
- wave-86 obs-2: seed's `antiCsrf: VIA_TOKEN` (from wave-49) was a wrong-not-stale value once
  header transport landed; SDK source showed antiCsrf is never reached in header mode.
- wave-87 (this): seed's "NULL role = RBAC gap" framing evaporated once the two RBAC lanes were
  read; NULL is intended-safe.

The convergent, falsifiable obligation across all three: before adopting a prior finding's
security/robustness framing as the wave's target, re-verify that framing against the CURRENT code
+ installed SDK — the finding may predate later architecture changes, or may have been
mis-framed, such that its literal ask is a no-op, wrong, or harmful.

**Source artifacts:**
- `process/waves/wave-87/stages/P-0-frame.md` §Reframe + §Grounding evidence (RBAC two-lane
  verification at `rbac.service.ts`; NULL ≡ default-role at permission layer)
- `process/waves/wave-87/stages/P-0-problem-framer.md` (REFRAME verdict, antipatterns #1 + #6)
- `process/waves/_archive/wave-86/blocks/L/observations.md` §obs-2 (security-config value vs SDK —
  prior instance, HOLD 1st)
- `process/waves/_archive/wave-84/blocks/L/observations.md` §obs-3 (BOARD reframe prevented
  harmful option — prior instance, HOLD informational)

**Recurrence check:** The BROAD class ("re-verify an old finding's framing against current code
before adopting it") now has 3 instances (84, 86, 87). BUT the prior two were logged as distinct
narrow sub-classes (84 = BOARD prevented a harmful *option*; 86 = verify a security-config *value*
against SDK) and both remain HOLD. Wave-87 is the "framing evaporates / literal ask is a no-op"
sub-class. Whether these three are one promotable class or three adjacent ones is a head-learn /
karen judgement call at L-2. If treated as one class, it clears the 2+-wave recurrence bar.

**Severity:** warning — mis-adopting the literal framing here would have been harmless RBAC churn,
but across the three instances the same error class ranges up to shipping a harmful config
(wave-86 footgun) or a severity-trading regression (wave-84). The class is repeatable on every
bug-fix-phase seed sourced from an aged finding.

**Candidate principles file:** `PRODUCT-PRINCIPLES.md` (a P-0 framing-verification obligation) —
this is where a cross-wave plan/framing rule belongs, distinct from wave-86's BUILD-layer
"verify a config value" sub-proposal.

**Disposition:** HOLD-pending-head-learn-judgement. Recurrence is present at the broad-class level
(3 waves); promotion turns on whether L-2 rules the three instances the same class. Pre-shaped
wording for karen (verify char counts):

```
N. Re-verify a prior finding's security or robustness framing against current code before making it a wave target.
   Why: A finding predates later changes; its framing can be evaporated, wrong, or harmful if taken literally.
```

---

## obs-3 (informational, not promotion-worthy) — real-Postgres integration test that can't run locally lands via a CI-provisioned follow-up PR

Wave-87's T-4 real-Postgres integration test (`join-default-role.integration.spec.ts`,
no DB mocking) could not execute in the brain environment (port 5433 ECONNREFUSED; no
initdb/docker), so it was authored on-branch and landed via follow-up PR #108, where CI
provisions postgres:16 + DATABASE_URL_TEST; its required `test` job ran the 4 cases GREEN against
real Postgres (509aae84). This is a clean, already-correct workaround (author locally, verify in
CI) rather than a defect. Source: `process/waves/wave-87/stages/T-4-integration.md`. ONE-OFF /
environmental — not generalizable to a falsifiable rule (the "don't mock the DB in integration
tests" principle already exists as BUILD rule 4 / the T-1 GOOD example). No promotion; recorded
for completeness only.

---

## Summary

- **3 observations** written (obs-1, obs-2 promotion-relevant; obs-3 informational-only).
- **obs-1** (real-timer per-test-timeout > asyncUtilTimeout + guarded fake-timer teardown):
  FIRST INSTANCE, warning, HOLD. Clean/falsifiable; promotes on a 2nd occurrence. Candidate T-1.
- **obs-2** (re-verify an old finding's security/robustness framing against current code): broad
  class now at 3 waves (84/86/87) but logged prior as narrow sub-classes; whether promotable as
  one class is a head-learn/karen call. Candidate PRODUCT-PRINCIPLES. **The one to weigh for
  promotion this wave.**
- **obs-3**: one-off env workaround, informational only, no promotion.
- Floor-waive (BOARD 7/7) intentionally NOT recorded as an observation — already a settled
  product-decision (apply-by-citation), not a new principle.
