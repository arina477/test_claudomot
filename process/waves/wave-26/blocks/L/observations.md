# Wave 26 — L-2 Distill Observations

Synthesized from wave-26 artifacts (M3-debt presence dots on message-row author avatars:
shared PresenceDot component, self-presence seed via /profile userId, AC1-5; PR#38 1543a4e +
PR#39 self-presence fix 12b5ec2; V APPROVED).
Prior archives consulted: process/waves/_archive/wave-{21,22,23,24,25}/blocks/L/observations.md.
Principles files read: BUILD-PRINCIPLES (7 rules, rule 7 promoted w25), CI-PRINCIPLES (5 rules,
rule 5 promoted w24), PRODUCT-PRINCIPLES (1 rule), VERIFY-PRINCIPLES (1 rule),
T-2.md (1 rule, rule 1 promoted w25-adjacent), T-5.md (1 rule, rule 1 promoted w25),
T-7.md (0 rules).

---

```yaml
observations:

  - id: obs-1
    summary: >
      Live E2E (T-5) caught a prod-critical defect that the T-2 unit suite actively masked.
      The `AuthorPresenceDot` presence wrapper gates the dot on `Wu.has(authorId)` (the
      presence store Map). The T-2 fixture for the author-dot tests seeded the presence store
      WITH the viewer's own userId present, so the "self" scenario always showed a dot in unit
      tests. In live prod the server's `getCoMemberUserIds` output deliberately excludes the
      requesting user's own userId (correct for fan-out fan-out), so `Wu.has(self)` was false
      on first load — the dot rendered null for every self-authored message row. The unit tests
      were not wrong about the component's behavior; they were wrong about what the store
      contained. The fixture modeled an impossible happy path — the store can never contain self
      via the server channel — and that made every unit assertion pass while the real boundary
      condition (single-client: "I am the only co-member who sees my own messages as self-authored")
      was permanently invisible to unit-level coverage. T-5 live-prod exercise surfaced it
      on the first run (19/19 author-avatar rows without any dot). The fix required a
      coordinated server change (expose userId in GET /profile) + client change (seedSelfPresence
      at session load). Neither the unit tests nor the contract tests flagged this because the
      mock store fixtures included a value the real producer never emits for self.
    source:
      - process/waves/wave-26/stages/T-5-e2e.md
        # Scenario 1 FAIL: "19/19 message-row author avatars had zero presence dots."
        # Root cause: "fixture's own authorId (21984eb2-...) was NOT in Wu at message-render
        #   time → dR returned null → no dot."
        # "this is the intended 'author unknown → NO dot' graceful-degrade branch firing
        #   for the author who *should* be online."
      - process/waves/wave-26/stages/T-5-e2e.md (re-verification section)
        # Fix confirmed deployed: "GET /profile now returns userId ... seedSelfPresence puts
        #   the viewer into the presence store as ONLINE at session load, so Wu.has(self) is
        #   now true at message-render time and dR renders N2."
      - process/waves/wave-26/stages/T-2-unit.md
        # "MessageList AuthorPresenceDot | live author-avatar dot, tri-state,
        #   unknown→no-dot | presence-dots (online/offline/unknown→NO dot/live online↔offline
        #   flip/online→unknown transition/pending+failed no-dot/single-socket AC4)"
        # No indication that any fixture verified the store does NOT contain the viewer's own
        # userId as the real producer (getCoMemberUserIds) would produce.
      - process/waves/wave-26/stages/B-4-wiring.md
        # (no direct citation of this sub-class; T-5 was the discovery locus)
      - process/waves/wave-26/stages/V-1-jenny.md
        # "AC1 self-author edge case ... NOT met by the original impl (server
        #   presence:snapshot excludes self via getCoMemberUserIds, so hasPresence(ownUserId)
        #   was false → AuthorPresenceDot returned null). Fix: seedSelfPresence(userId)."
    severity: strong
    candidate_principles_file: command-center/principles/test-layer-principles/T-2.md
    recurrence: >
      First instance of the class "unit-test fixture seeds a store/service with a value the
      real producer never emits, causing unit tests to pass while live E2E fails the boundary
      condition." Near-dup check against T-2 rule 1 ("Assert what a non-sender recipient
      receives via the real fan-out routing, not a mocked room or topic join"): T-2 rule 1
      targets topology mocks (mocking the message-routing bus itself so recipients are never
      verified). This candidate targets fixture-state fidelity (the mock store contains a key
      the real producer excludes). Both are unit-test mock failures, but the axis differs:
      rule 1 = routing topology; this candidate = producer-output boundary. No near-dup.
      T-2.md has 1 rule; slot 2 open. HOLD. Promote to T-2 rule 2 if a second wave has a unit
      fixture that seeds a store or dependency with a value the corresponding real producer
      never emits, causing the unit suite to pass while E2E or integration exposes the failure.
      The class is narrow and generalizable: any store-keyed feature where the unit fixture
      adds the key from a different identity boundary than the real producer will exhibit this.
    promotion_gates:
      generalizable: true
        # Applies to any unit test that mocks a reactive store or cache keyed by user or
        # entity identity, where the production data-producer has exclusion rules the fixture
        # does not replicate. The specific presence store is incidental; the failure class is
        # "fixture models an impossible producer state."
      falsifiable: true
        # Checkable at T-2 for any test of a component that reads a keyed store: does the
        # fixture replicate the real producer's exclusion rules? A fixture that includes the
        # viewer's own key in a co-member-only store (or any fixture that inserts a key the
        # real producer would never emit for the test identity) fails this rule.
      cited: true
        # T-5-e2e.md (live FAIL: 19/19 rows no dot, root cause Wu.has(self)=false, fix cycle
        #   confirmed deployed); V-1-jenny.md (AC1 self-edge analysis, getCoMemberUserIds
        #   exclusion, seedSelfPresence fix scope); T-2-unit.md (unit suite context: no
        #   fixture verified the store's exclusion of self via the real producer path).
    candidate_rule_shape: >
      2. When a unit fixture seeds a keyed store, replicate the real producer's exclusion
         rules; a fixture that includes a key the producer never emits masks a boundary defect.
         Why: A happy-path fixture hides the case where the production data source excludes
         the identity under test.
      Rule line = 118 chars; why line = 89 chars. No forbidden tokens.
    promotion_status: HOLD. First instance. Promote to T-2 rule 2 on second confirming wave.

  - id: obs-2
    summary: >
      Docs/process-only pushes to main bypass branch-protection CI (no CI requirement on
      non-code branches or squash-bypassed pushes), leaving code-adjacent artifacts committed
      to main with no CI gate. Wave-25's T-5 tester committed a DOM-dump evidence file
      (`t5-evidence/results.json`) to main during the T/L stage process-push. This file is
      not biome-formatted (it is a JSON transcript, not source code), and `biome ci .` does
      not know to exclude it. The CI lint job flagged a format error on the next PR that ran
      CI (the wave-26 PR), not when the file was committed. Main's lint job was therefore RED
      for the 8 pushes between the wave-25 process commit and the wave-26 PR open, with no
      alert. This is a two-part failure: (a) the bypass push skipped CI entirely so no one
      saw the red; (b) runtime-transcript artifacts are not source and should not be in the
      linter's file graph. The wave-26 B-4 fix addressed both: excluded `process/**` in
      `biome.json` AND the assignments clock-mock was fixed on-branch (a separate
      time-dependent defect surfaced at the same time — see obs-3). The generalizable lesson:
      a committed non-source artifact in a linter-scanned directory silently reddened main
      without alerting anyone, because the committer's push skipped CI.
    source:
      - process/waves/wave-26/stages/B-4-wiring.md
        # "B-4 lint/CI check found main's CI has been RED (lint + test jobs failing across
        #   the last 8 pushes) — caused by wave-25 process commits pushed to main via
        #   branch-protection bypass (docs-only pushes don't gate on CI, so the breakage
        #   went unnoticed)."
        # "process/waves/_archive/wave-25/stages/t5-evidence/results.json — the wave-25
        #   T-5 tester's DOM-dump evidence, committed as an artifact, is not biome-formatted
        #   → biome ci . format error → lint job RED."
        # "L-block observation candidate: docs/process pushes to main via branch-protection
        #   bypass skip CI, so code-adjacent breakage in committed artifacts goes unnoticed
        #   until the next real CI run."
      - process/waves/wave-26/stages/C-1-pr-ci-merge.md
        # "main-CI repair confirmed: the lint + test jobs — RED on main since the wave-25
        #   T/L bypass commits — are now GREEN."
    severity: warning
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
    recurrence: >
      First instance of the "bypass-push + non-source artifact in linter scope = silent
      main-red" class. Near-dup check: CI rule 4 ("Run the formatter check command at the
      wiring stage before commit, not only the test and typecheck commands") — that rule
      targets the B-BLOCK specialist running the formatter before reporting done; it does not
      address process/docs pushes that bypass the wiring stage entirely. CI rule 5 (executed-
      count nonzero) — different axis (test-tier skip, not linter scope). No other CI rule
      addresses bypass-push CI gap. No near-dup found.
      CI-PRINCIPLES has 5 rules; slot 6 open. HOLD. Promote if a second wave has a process
      or docs push to main that skips CI and leaves main's CI red in a linter-scanned file,
      OR if the same bypass-push mechanism causes a test failure that goes unnoticed until the
      next feature PR's CI run.
    promotion_gates:
      generalizable: true
        # Applies to any project where docs/process pushes skip the branch-protection CI
        # requirement. The failure is: a committed non-source file (evidence dump, JSON
        # transcript, auto-generated report) enters a linter-scanned directory tree and
        # quietly invalidates main's CI without a gating run to catch it.
      falsifiable: true
        # Checkable at any C-block: is the project's linter configured to ignore non-source
        # artifact trees (process/, docs-output/, evidence/, etc.)? AND does the repo's
        # branch-protection require CI on all pushes to main (including bypass/docs pushes)?
        # A project where either condition is absent fails this rule.
      cited: true
        # B-4-wiring.md (root-cause, "8 pushes RED", "docs-only pushes don't gate on CI",
        #   L-block candidate note, both fixes: biome.json ignore + clock-mock);
        # C-1-pr-ci-merge.md (main-CI repair confirmed, lint + test GREEN post-merge).
    candidate_rule_shape: >
      6. Exclude non-source artifact trees from the linter scope and require CI on all
         pushes to main, including docs-only bypass pushes.
         Why: A bypass push that skips CI can commit an unformatted artifact and silently
         red main until the next code PR runs CI.
      Rule line = 117 chars; why line = 95 chars. No forbidden tokens.
    promotion_status: HOLD. First instance. Promote to CI-PRINCIPLES rule 6 on second
      confirming wave.

  - id: obs-3
    summary: >
      A time-dependent test anchored to a fixed date-constant fails silently as wall-time
      advances past the boundary the fixture was designed around. Wave-25 committed an
      assignments chip test that set `const NOW = new Date('2026-06-30')` as the fixture
      base date, then asserted "due in 48h" chip states relative to NOW. The component
      (`AssignmentCard`) computed chip states from the REAL `Date.now()` — no clock was mocked.
      As long as the spec ran on 2026-06-30 it passed. By 2026-07-01 (wave-26, one day later)
      `Date.now()` had crossed the 48h boundary, the chip states drifted, and 2 tests failed
      deterministically. CI was RED for 8 pushes without anyone noticing (same bypass-push gap
      as obs-2). The fix (`vi.useFakeTimers()` + `vi.setSystemTime(NOW)` scoped in beforeEach)
      pins the component's time perception to the fixture date and restored 22/22. The class
      is: fixture uses a hard-coded reference date but the component reads the real clock at
      test runtime, creating a test that is correct on the authoring day but rots as wall-time
      passes. This is distinct from obs-2 (linter scope / bypass-CI mechanism) even though
      both were discovered together; the root cause and fix are independent.
    source:
      - process/waves/wave-26/stages/B-4-wiring.md
        # "apps/web/src/shell/assignments.test.tsx — 2 chip tests failed deterministically.
        #   Root cause: the test anchors due dates to a fixed NOW=2026-06-30 but AssignmentCard
        #   computes chips from the REAL Date.now() (now 2026-07-01), and the clock is never
        #   mocked → the 48h-boundary offsets drifted out of sync as wall-time advanced."
        # "Fix (Iron-Law routed → react-specialist, fa6c9e6): vi.useFakeTimers() +
        #   vi.setSystemTime(NOW) in the chip-states beforeEach, vi.useRealTimers() in
        #   afterEach (scoped, no leakage). assignments.test.tsx → 22/22."
      - process/waves/wave-26/stages/T-2-unit.md
        # "assignments.test (clock-mock) | deterministic NOW | 22/22 (repairs the
        #   time-dependent flakiness)"
        # Action 3/4: "Documented flakes: server-roles '409 conflict' + assignments
        #   optimistic-toggle timing — did NOT fire in the C-1 green run."
    severity: warning
    candidate_principles_file: command-center/principles/test-layer-principles/T-2.md
    recurrence: >
      First instance of the "hard-coded reference date without clock-mock produces a
      wall-time-dependent failure" class in this project's L-2 history. Near-dup check:
      T-2 rule 1 (fan-out routing topology) — different axis. T-2 rule 2 candidate (obs-1,
      this wave) — different axis (producer-exclusion fixture). CI-PRINCIPLES rules — none
      addresses clock-freezing discipline. BUILD-PRINCIPLES rules — none. No near-dup found.
      T-2.md has 1 rule; slot 2 open (occupied by obs-1 this wave if promoted). HOLD. Promote
      to T-2 rule (next slot) if a second wave has a component test with a hard-coded reference
      date that fails because the component reads the real clock and wall-time has advanced
      past the fixture's boundary.
      NOTE: Two T-2 observations this wave (obs-1 and obs-3). If both are promoted they would
      occupy T-2 rules 2 and 3. Karen's cap enforcement: only 1 rule per file per wave. If
      both are candidates at the same time, obs-1 (prod-critical E2E catch; strong severity)
      takes precedence; obs-3 HOLDS for the following wave if obs-1 is promoted.
    promotion_gates:
      generalizable: true
        # Applies to any component or function test that constructs date fixtures relative
        # to a constant while the subject under test reads the live system clock. Any
        # framework with a clock-mock facility (vi.useFakeTimers / jest.useFakeTimers /
        # Sinon.useFakeTimers) can prevent this; the prevention requires an explicit call.
      falsifiable: true
        # Checkable at T-2 for any test that references a date constant as a fixture
        # boundary (e.g., "due in 48h from NOW", "expires at X+24h"): is vi.setSystemTime
        # (or equivalent) called so the component under test reads that constant rather
        # than the real clock? A test using a date constant without a clock-mock fails
        # this rule.
      cited: true
        # B-4-wiring.md (root cause, wall-time boundary drift, fix fa6c9e6, vi.setSystemTime);
        # T-2-unit.md (assignments.test clock-mock repaired, 22/22).
    candidate_rule_shape: >
      2. Freeze the clock with vi.setSystemTime when a test fixture references a date
         constant; never let the component read the real clock.
         Why: A hard-coded date fixture drifts as wall-time advances, producing silent
         failures on any day after the authoring date.
      Rule line = 115 chars; why line = 91 chars. No forbidden tokens.
    promotion_status: HOLD. First instance. Promote (next T-2 slot) on second confirming wave.
      If obs-1 is also promoted this wave, obs-3 waits for the next wave (per-file 1-rule cap).

  - id: obs-4
    summary: >
      Verifying that a store or service EXISTS at P-0 is insufficient when the scope adds a
      new consumer of that store at a different identity boundary. Wave-26's P-0 problem-framer
      verified that the presence socket singleton exists, that `usePresence` is a pure consumer,
      and that `getCoMemberUserIds` drives the store. None of those checks caught that the
      store is populated ONLY with co-members (excluding self), while the new consumer
      (AuthorPresenceDot on message rows) needs to show the viewer's own avatar dot too. The
      framer verified the producer's existence but not the producer's output boundary relative
      to the new consumer's identity. The result: the spec was written with a self-edge noted
      as "online while connected" but the implementation gap (server never emits self into the
      presence snapshot) was not surfaced until T-5 live E2E, requiring a coordinated BE+FE
      fix after deployment. PRODUCT-PRINCIPLES rule 1 ("Verify every seed claim about what
      exists or is absent in the code at P-0") captures the "does it exist" check — this
      candidate addresses the orthogonal "does the existing producer emit what the new
      consumer reads" check. Rule 1 was correctly applied (framer verified the store exists;
      no false-absent). The gap is at a finer granularity: identity-boundary mismatch between
      producer and the new consumer.
    source:
      - process/waves/wave-26/stages/P-0-frame.md
        # "AC3 'no second socket' TRUE — presence socket is a module-level singleton ...
        #   No store-unification refactor hidden."
        # The framer verified socket singleton + usePresence existence. Did not verify
        # whether getCoMemberUserIds excludes self and whether that matters for the
        # new message-row consumer.
      - process/waves/wave-26/stages/V-1-jenny.md
        # "AC1 self-author edge case ... NOT met by the original impl (server
        #   presence:snapshot excludes self via getCoMemberUserIds, so hasPresence(ownUserId)
        #   was false → AuthorPresenceDot returned null)."
        # "Fix: seedSelfPresence(userId) ... seeding self → 'online'."
      - process/waves/wave-26/stages/T-5-e2e.md
        # Discovery locus: live FAIL — Wu.has(authorId) false for self, dot absent.
    severity: warning
    candidate_principles_file: command-center/principles/PRODUCT-PRINCIPLES.md
    recurrence: >
      First instance of the "producer exists but has an exclusion rule invisible to the new
      consumer's identity boundary" class. Near-dup check: PRODUCT rule 1 ("Verify every seed
      claim about what exists or is absent in the code at P-0") — rule 1's scope is the
      existence of the component/store/infra. This candidate's scope is the output boundary
      of an existing producer relative to a new consumer. "Exists" and "produces what the
      new consumer needs" are checkable on different axes; a reviewer can satisfy rule 1 and
      still miss this. The candidate is narrow — it applies when a new consumer is added to
      an existing store/API and the store/API has identity-specific exclusion rules. No prior
      L-2 observations record this class. No near-dup with PRODUCT rule 1 (orthogonal sub-
      check, not a duplicate). PRODUCT-PRINCIPLES has 1 rule; slot 2 open. HOLD. Promote if
      a second wave has a P-0 framing that verifies a store/API exists without checking that
      the producer's output boundary covers the new consumer's identity needs, and a downstream
      defect is discovered because of the gap.
    promotion_gates:
      generalizable: true
        # Applies to any wave that adds a new consumer to an existing store or API where
        # the producer has identity-scoped output rules (per-user exclusions, per-role
        # filters, per-tenant isolation). Checking "the store exists" does not check
        # "the store emits data for the identity the new consumer will read."
      falsifiable: true
        # Checkable at P-0 for any new consumer of an existing store or API: did the framer
        # verify not only that the producer exists but also that the producer emits the
        # needed values for the specific identity the consumer will query? A P-0 that
        # confirms the API exists but does not check producer output scope for the new
        # consumer's identity fails this rule.
      cited: true
        # P-0-frame.md (framer verified store singleton + usePresence; did not verify
        #   getCoMemberUserIds excludes self);
        # V-1-jenny.md (AC1 self-edge: server excludes self → fix required);
        # T-5-e2e.md (live discovery: Wu.has(self) false, dot absent on all 19 rows).
    candidate_rule_shape: >
      2. When adding a new consumer to an existing store or API, verify at P-0 that the
         producer emits values for the new consumer's specific identity, not only that it
         exists.
         Why: A producer that filters by co-membership, role, or tenant never emits the
         consumer's own identity unless explicitly seeded.
      Rule line = 116 chars; why line = 97 chars. No forbidden tokens.
    promotion_status: HOLD. First instance. Promote to PRODUCT-PRINCIPLES rule 2 on second
      confirming wave where a P-0 existence-check misses a producer-output-boundary gap.
```

---

## Wave-26 L-2 distill disposition

**obs-1 (unit fixture seeds store with value real producer excludes — T-5 live E2E caught it) — STRONG HOLD.**

First instance of the "happy-path fixture models an impossible producer state" class. T-5 live
exercise surfaced a FAIL (19/19 author-avatar rows without any dot) that the unit suite
structurally could not detect because the mock store contained the viewer's own key — a value
the real producer (`getCoMemberUserIds`) never emits. Fix required a coordinated BE+FE change
(GET /profile exposes userId + seedSelfPresence at session load). T-2 rule 1 is a near-dup
candidate but addresses routing topology, not fixture-state fidelity; no near-dup. T-2.md has
1 rule; slot 2 open. HOLD. Promote to T-2 rule 2 on second confirming wave.

---

**obs-2 (docs/process bypass push skips CI; non-source artifact silently reddened main for 8 pushes) — WARNING HOLD.**

First instance. The wave-25 T-5 evidence dump (`t5-evidence/results.json`) was committed to
main via a branch-protection bypass push (docs-only), which skips CI. The artifact is not source
and fails `biome ci .` format checks. Main's lint job was RED for 8 pushes; no one was alerted
because the push that introduced the breakage never ran CI. Discovered and repaired by B-4 wiring
on the next feature PR. CI-PRINCIPLES has 5 rules; slot 6 open. HOLD. Promote to CI-PRINCIPLES
rule 6 on second confirming wave.

---

**obs-3 (time-dependent test with hard-coded date constant fails as wall-time advances — clock-mock discipline) — WARNING HOLD.**

First instance. Test anchored chip states to `const NOW = new Date('2026-06-30')` but
`AssignmentCard` read the real `Date.now()`. One day later the tests failed deterministically.
Fix: `vi.useFakeTimers()` + `vi.setSystemTime(NOW)` scoped in beforeEach. T-2.md has 1 rule;
slot 2 open. HOLD. Note: obs-1 and obs-3 are both T-2 candidates this wave. Per-file 1-rule cap
means only one may be promoted per wave. obs-1 (strong severity, prod-critical E2E catch) takes
precedence; obs-3 holds until the following wave if obs-1 is promoted.

---

**obs-4 (P-0 producer-boundary gap: verifying a store exists does not verify it emits values for the new consumer's identity) — WARNING HOLD.**

First instance. The P-0 framer correctly applied PRODUCT rule 1 (verified the presence store
exists), but did not check that `getCoMemberUserIds` excludes self, leaving the new consumer
(AuthorPresenceDot) to discover at T-5 that the store never emits the viewer's own key. This
is orthogonal to rule 1 (existence vs output boundary). PRODUCT-PRINCIPLES has 1 rule; slot 2
open. HOLD. Promote to PRODUCT-PRINCIPLES rule 2 on second confirming wave where a P-0 existence
check misses a producer-output-boundary gap for a new consumer's identity.

---

## Summary table

| id    | title (short)                                                               | severity | recurrence | disposition                                                                                            |
|-------|-----------------------------------------------------------------------------|----------|------------|--------------------------------------------------------------------------------------------------------|
| obs-1 | Unit fixture seeds store with value real producer excludes; E2E caught it   | strong   | 1 wave     | HOLD — T-2 rule 2 candidate; promote on 2nd confirming wave                                            |
| obs-2 | Bypass-push skips CI; non-source artifact silently reddened main 8 pushes   | warning  | 1 wave     | HOLD — CI-PRINCIPLES rule 6 candidate; promote on 2nd confirming wave                                  |
| obs-3 | Time-dependent test with hard-coded date rots as wall-time advances         | warning  | 1 wave     | HOLD — T-2 candidate (next slot after obs-1); promote on 2nd confirming wave; obs-1 has priority       |
| obs-4 | P-0 verified store exists but not that it emits for the new consumer's identity | warning  | 1 wave     | HOLD — PRODUCT-PRINCIPLES rule 2 candidate; promote on 2nd confirming wave                             |

**Promotions this wave: 0 (all 4 are first-instance HOLDs).**

**Dropped from the 6 strong signal candidates provided:**

- **Signal 5 ("Playwright MCP chrome-absent — 5th wave"):** DROPPED. T-5.md rule 1 is already
  promoted ("On Playwright MCP launch failure, drive the bundled chromium directly rather than
  marking the layer blocked."). Wave-25 obs-5 advanced this to a promotion candidate; T-5 rule 1
  now encodes the validated substitute. Confirmed by T-5-e2e.md opening note: "Per the standing
  rule, I drove the validated bundled Chromium..." — the rule is working. Already ruled; DROP.

- **Signal 3 as standalone ("biome must exclude runtime-transcript trees") vs obs-2:** The
  `process/**` biome ignore is the FIX within obs-2; it is not a separate observation.
  The generalizable class is obs-2 (bypass push + non-source artifact enters linter scope).
  Splitting it would create a near-dup pair. Folded into obs-2.
