# Wave 27 — L-2 Distill Observations

Synthesized from wave-27 artifacts (M5-debt presence performance pair: server_members(user_id)
index + MessageList single-subscription lift; PR#40 87b6ef7; V APPROVED).
Prior archives consulted: process/waves/_archive/wave-{22,23,24,25,26}/blocks/L/observations.md.
Principles files read: BUILD-PRINCIPLES (7 rules), CI-PRINCIPLES (5 rules, rule 5 promoted w24),
PRODUCT-PRINCIPLES (1 rule), VERIFY-PRINCIPLES (1 rule), T-2.md (1 rule), T-4.md (0 rules),
T-7.md (0 rules).
Wave-26 held observations (all FIRST-INSTANCE): obs-1 (T-2 candidate), obs-2 (CI-PRINCIPLES
candidate), obs-3 (T-2 candidate), obs-4 (PRODUCT-PRINCIPLES candidate). This wave is
checked for 2nd-instance confirmation of each.

---

```yaml
observations:

  - id: obs-1
    summary: >
      Index-usage integration tests that seed a small number of rows will see Postgres choose
      a Seq Scan (the cheaper plan on a tiny table), causing an Index-Scan assertion to fail in
      CI. The correct fix is to force `SET LOCAL enable_seqscan = off` on a pinned dedicated
      connection (BEGIN → SET LOCAL → EXPLAIN → ROLLBACK) so the planner is constrained to
      consider the index path. This asserts index ELIGIBILITY — the index exists, is usable,
      and the planner would choose it at scale — deterministically regardless of row count.
      Wave-27 hit this exactly: the initial presence-index-scan.spec.ts seeded 1 row and
      omitted enable_seqscan=off; B-6 Phase-2 caught that Postgres would pick Seq Scan on
      the tiny table and the Index-Scan assertion would red CI. Fix (postgres-pro, c2e4b4d):
      added `harnessExplainWithSeqscanOff` (pinned PoolClient + BEGIN + SET LOCAL +
      EXPLAIN + ROLLBACK, releases unconditionally). T-4 CI confirmed the plan is Index Scan
      post-fix (PR#40 7/7 green, integration tier 6 files/17 tests, CI rule 5 satisfied).
    source:
      - process/waves/wave-27/stages/B-6-review.md
        # "[P1] EXPLAIN CI-flake — presence-index-scan.spec.ts AC2 seeded 1 row + no
        #   enable_seqscan=off/ANALYZE → Postgres would pick Seq Scan on the tiny table →
        #   the AC2 Index-Scan assertion reds CI. FIXED (postgres-pro, c2e4b4d): added
        #   harnessExplainWithSeqscanOff (pinned PoolClient + BEGIN + SET LOCAL
        #   enable_seqscan=off + EXPLAIN + ROLLBACK)."
      - process/waves/wave-27/stages/V-1-karen.md
        # "harnessExplainWithSeqscanOff (pg-harness.ts:300-318) is real: acquires a
        #   dedicated PoolClient (not pool.query, so SET LOCAL binds to the same connection
        #   as the EXPLAIN), runs BEGIN → SET LOCAL enable_seqscan = off → <sql> → ROLLBACK.
        #   Forcing index eligibility via enable_seqscan=off is the correct deterministic
        #   invariant for a migration proof."
      - process/waves/wave-27/stages/T-4-integration.md
        # "CI-verified: presence-index-scan.spec.ts EXECUTED + PASSED in PR#40
        #   (integration tier 6 files/17 tests). Asserts EXPLAIN Index Scan on
        #   server_members_user_id_idx (enable_seqscan=off forcing eligibility,
        #   deterministic regardless of row count)."
    severity: warning
    candidate_principles_file: command-center/principles/test-layer-principles/T-4.md
    recurrence: >
      First instance of the "EXPLAIN test on a small-seeded table picks Seq Scan without
      enable_seqscan=off, falsely failing the Index-Scan assertion" class. Near-dup check
      against all T-4 rules: T-4.md has 0 rules — no near-dup possible. Near-dup check
      against CI rule 5 (executed-count nonzero): CI rule 5 addresses skipped tests due
      to missing env vars; this candidate addresses plan instability on small tables within
      a running test. Different axis. Near-dup check against BUILD rule 4 (negative-path
      adversarial reproduction): BUILD rule 4 targets authz/injection paths; different
      domain entirely. No near-dup found.
      T-4.md has 0 rules; slot 1 open. HOLD. Promote to T-4 rule 1 on second confirming
      wave where an index-usage integration test against a small-seeded table fails its
      Index-Scan assertion unless enable_seqscan=off (or equivalent planner hint) is applied.
    promotion_gates:
      generalizable: true
        # Applies to any integration test that runs EXPLAIN against a real Postgres
        # instance where the fixture seeds fewer rows than the Postgres planner's
        # seq-scan flip threshold (roughly 8 blocks / ~1000 rows for a btree index).
        # Any test asserting Index Scan without planner-pinning is susceptible.
      falsifiable: true
        # Checkable at T-4 for any EXPLAIN-based integration test: does the test
        # acquire a dedicated connection and issue SET LOCAL enable_seqscan=off (or
        # equivalent) before the EXPLAIN? A test asserting Index Scan without this
        # constraint on a fixture-seeded table fails this rule.
      cited: true
        # B-6-review.md (P1 finding: 1-row fixture + no enable_seqscan=off → Seq Scan →
        #   CI red; fix: harnessExplainWithSeqscanOff pinned-connection BEGIN/SET LOCAL/ROLLBACK);
        # V-1-karen.md (verified harnessExplainWithSeqscanOff real, mutation-sane, CI-executed);
        # T-4-integration.md (CI-executed PR#40, 6 spec files/17 tests, Index Scan confirmed).
    candidate_rule_shape: >
      1. Pin a dedicated connection with SET LOCAL enable_seqscan=off before an EXPLAIN
         assertion; a fixture-seeded table lets the planner choose Seq Scan otherwise.
         Why: Postgres picks Seq Scan on small tables; the hint asserts index eligibility
         independent of row count.
      Rule line = 115 chars; why line = 73 chars. No forbidden tokens.
    promotion_status: HOLD. First instance. Promote to T-4 rule 1 on second confirming wave.

  - id: obs-2
    summary: >
      P-0 problem-framer code-verification of a seed's technical claim redirected an entire
      wave to the correct fix target. The wave-27 seed (task 6a546c7b) named
      `getCoMemberUserIds` (SELECT DISTINCT) as the un-indexed hot path to optimize.
      The framer read presence.service.ts directly and found: (a) `getCoMemberUserIds`
      (WHERE server_id IN ...) is ALREADY index-supported by the leading column of
      UNIQUE(server_id, user_id) — the proposed SELECT DISTINCT rewrite is a no-op; (b) the
      ACTUAL un-indexed query is `getServerIdsForUser` (WHERE user_id=$1) — server_members
      has no standalone user_id index. Without this code-read correction, the wave would
      have shipped a no-op SELECT DISTINCT rewrite, left the real hot path unindexed, and
      required a follow-up wave. The framer's PROCEED verdict was accompanied by three
      code-verified advisory corrections that reoriented both P-1 decomposition and the
      entire B-block execution. This is a second instance of P-0 code-verification
      redirecting scope — wave-26 obs-4 recorded the class as "verifying a store exists
      does not verify it emits values for the new consumer's identity"; this wave's instance
      is "verifying a method name in a seed does not verify it is the correct cost target."
      Both are sub-classes of the general pattern: the framer must verify the seed's
      technical claim at the code level, not just its existence premise.
    source:
      - process/waves/wave-27/stages/P-0-problem-framer.md
        # "The seed names getCoMemberUserIds as the cost, but the cheaper high-value lever
        #   is a single index on server_members(user_id) covering getServerIdsForUser."
        # "getCoMemberUserIds ... ALREADY index-supported by the leading column of
        #   UNIQUE(server_id, user_id) (servers.ts:57); its dedup is an in-memory JS Set,
        #   so the seed's SELECT DISTINCT rewrite is a NO-OP."
        # "The ACTUAL un-indexed scan is getServerIdsForUser (WHERE user_id=$1,
        #   presence.service.ts:106-113) — server_members has NO standalone user_id index."
      - process/waves/wave-27/stages/P-0-frame.md
        # "The seed named the WRONG method ... Cheapest high-value lever = an index on
        #   server_members(user_id). ... problem-framer index-correction is folded into
        #   Spec A."
      - process/waves/_archive/wave-26/blocks/L/observations.md
        # obs-4: "Verifying that a store or service EXISTS at P-0 is insufficient when
        #   the scope adds a new consumer of that store at a different identity boundary."
        #   — first instance of P-0 code-verification gap class; wave-27 provides a
        #   second instance (wrong method named in seed = wrong cost target verified).
    severity: strong
    candidate_principles_file: command-center/principles/PRODUCT-PRINCIPLES.md
    recurrence: >
      2ND CONFIRMING INSTANCE of the wave-26 obs-4 class. PROMOTION CANDIDATE.

      Wave-26 obs-4's class was: "P-0 verified a store exists but not that it emits values
      for the new consumer's identity." Its candidate rule shape was PRODUCT-PRINCIPLES rule 2:
      "When adding a new consumer to an existing store or API, verify at P-0 that the producer
      emits values for the new consumer's specific identity, not only that it exists."

      Wave-27 obs-2's class: "P-0 verified a method name in the seed but not that it is the
      actual cost target; the framer's code-read found a different method is the real hot path."

      NEAR-DUP ANALYSIS vs obs-4's candidate rule shape: obs-4's rule is scoped to identity-
      boundary checks when adding a new consumer (producer emits for the new consumer's
      identity). Wave-27's instance is scoped to cost-target accuracy (the seed names a method;
      is it the actual expensive query?). Both are instances of the meta-class "the framer must
      verify the seed's technical claim at the code level, not just that a named thing exists."
      The two instances are different sub-classes; a single rule covering the meta-class is more
      generalizable than two narrowly-scoped rules.

      DETERMINATION: Wave-27 obs-2 is a confirming instance of a BROADENED class relative to
      wave-26 obs-4. The broadened candidate rule is:
        "Verify the seed's technical claim at the code level at P-0; naming a method or store
         does not confirm it is the actual cost source or correct output boundary."
      This subsumes obs-4's identity-boundary check AND wave-27's cost-target check as instances
      of the same falsifiable principle. The obs-4 candidate rule shape is retired in favor of
      this broader rule.

      PRODUCT-PRINCIPLES has 1 rule; slot 2 open. This obs is the PROMOTABLE signal. Flag for
      karen.
    promotion_gates:
      generalizable: true
        # Applies at every P-0 where the seed names a specific code entity (method,
        # store, query, component) as the target. "The entity exists" and "the entity
        # is the correct target" are independently checkable. Applies to: wrong method
        # named (this wave), wrong identity boundary assumed (wave-26), wrong query
        # complexity assumed (any). All three require a code-read; none require a
        # re-architecture.
      falsifiable: true
        # Checkable at P-0: did the framer read the named entity's implementation and
        # confirm it is (a) the actual cost source, or (b) the actual output boundary
        # for the new consumer? A P-0 that verifies the entity exists but does not
        # verify the seed's claim about WHY it is the target fails this rule.
      cited: true
        # P-0-problem-framer.md (code-read of presence.service.ts:106-133 found the
        #   wrong method named; getServerIdsForUser = real un-indexed query; framer's
        #   3 advisory corrections redirected B-block);
        # P-0-frame.md (corrections folded into Spec A framing; entire wave re-targeted);
        # wave-26 obs-4 (first instance: store exists but doesn't emit for new consumer's
        #   identity — same meta-class, different sub-class).
    candidate_rule_shape: >
      2. At P-0 verify the seed's technical claim at the code level; confirm the named
         entity is the actual cost source or correct output boundary.
         Why: A seed names a method or store; only a code-read confirms it is the right
         fix target.
      Rule line = 113 chars; why line = 72 chars. No forbidden tokens.
    promotion_status: PROMOTABLE. 2nd confirming instance (wave-26 obs-4 + wave-27 obs-2).
      Broadened rule covers both sub-classes. Flag for karen.

  - id: obs-3
    summary: >
      For a behavior-preserving performance wave, the T-7 perf tier is satisfied by the
      specs' own proof artifacts (query-plan assertion + subscription-count assertion),
      not a load test. At ~0 production users, a load test is theater: it cannot
      distinguish O(N) from O(1) at N=0, and its wall-clock numbers are noise. The
      meaningful verifiable claim is "the planner now chooses the index path" (proven by
      EXPLAIN + enable_seqscan=off in CI) and "there is now exactly 1 subscription for
      an N-message list" (proven by a subscription-count unit assertion). Both are
      deterministic and mutation-sane. The head-tester explicitly agreed at T-9:
      "T-7 adequate (query-plan + subscription-count + CARRY-B ARE the perf proof at
      ~0 users; a load test would be theater)." T-7.md has 0 rules.
    source:
      - process/waves/wave-27/stages/T-7-perf.md
        # "This IS the performance wave — the perf improvement is verified by the specs'
        #   own proofs, not a separate load test. Spec A: EXPLAIN asserts the
        #   getServerIdsForUser WHERE user_id query now uses server_members_user_id_idx
        #   (Index Scan, T-4/CI). Spec B: subscription-count test asserts ONE list-level
        #   presence subscription. No load-test at ~0 users. No perf regression."
      - process/waves/wave-27/stages/T-9-journey.md
        # "T-7 adequate (query-plan + subscription-count + CARRY-B ARE the perf proof
        #   at ~0 users; a load test would be theater)."
      - process/waves/wave-27/stages/T-4-integration.md
        # "CI-verified: presence-index-scan.spec.ts EXECUTED + PASSED in PR#40.
        #   Asserts EXPLAIN Index Scan ... (enable_seqscan=off forcing eligibility,
        #   deterministic regardless of row count)."
    severity: informational
    candidate_principles_file: command-center/principles/test-layer-principles/T-7.md
    recurrence: >
      First instance of the "behavior-preserving perf wave at low user count: the spec's
      own proof artifacts (EXPLAIN plan + subscription-count) are the correct T-7
      verification; a load test adds no signal" class. Near-dup check: T-7.md has 0 rules —
      no near-dup possible. Near-dup check against CI rule 5 (executed-count nonzero): CI
      rule 5 targets the integration job executing tests; this candidate targets what
      constitutes adequate T-7 evidence for a perf wave at low scale. Different axis.
      T-7.md has 0 rules; slot 1 open. HOLD. Promote to T-7 rule 1 on second confirming
      wave where a behavior-preserving perf change's T-7 is verified via spec-owned
      structural proofs rather than a load test.
    promotion_gates:
      generalizable: true
        # Applies to any perf wave at a user count below the load-test floor (typically
        # DAU < ~100). If the perf claim is "this query now uses an index" or "this
        # component now has O(1) subscriptions instead of O(N)," the claim is fully
        # verifiable by structural assertions (EXPLAIN, subscription-count, bundle-size
        # diff) — a load test provides no additional signal at low scale.
      falsifiable: true
        # Checkable at T-7 for any perf wave: is the perf claim expressed as a
        # structural invariant (query plan, subscription count, bundle size delta)?
        # If yes, a matching structural assertion in a running test tier is sufficient;
        # requiring a load test when no load baseline exists is a false requirement
        # this rule guards against.
      cited: true
        # T-7-perf.md (explicit: "perf improvement is verified by the specs' own proofs,
        #   not a separate load test ... No load-test at ~0 users");
        # T-9-journey.md (head-tester: "load test would be theater");
        # T-4-integration.md (structural proof: EXPLAIN Index Scan, CI-executed).
    candidate_rule_shape: >
      1. For a behavior-preserving perf wave, use the spec's structural proofs as T-7
         evidence; a load test adds no signal below a real user baseline.
         Why: A query-plan assertion or subscription-count test verifies the perf claim
         deterministically; load numbers at zero users are noise.
      Rule line = 113 chars; why line = 83 chars. No forbidden tokens.
    promotion_status: HOLD. First instance. Promote to T-7 rule 1 on second confirming wave.

  - id: obs-4
    summary: >
      Docs/process-only pushes to main continue to bypass branch-protection CI in wave-27,
      confirming the wave-26 obs-2 pattern. The wave-27 git commit log shows multiple
      process-tracking commits pushed directly to main outside the PR/CI path: stage
      artifacts (P-0, P-4, C-1, C-2 tracking commits visible in recent commits
      `3d7fdd9 process(wave-27): C-1 #40 merged + C-2 deploy`,
      `630618d product(wave-27): P-4 gate-passed`, `f2e5b01 product(wave-27): P-2 spec`)
      and the founder digest (`process/session/updates/founder-digest-2026-07-01.md`
      is untracked at git status check time, pending a direct push). Wave-26 obs-2
      recorded the "bypass-push skips CI; non-source artifact silently reddened main 8
      pushes" failure. This wave the bypass mechanism is confirmed active again:
      process/product commits flow directly to main with no CI gate. No new linter
      breakage was introduced this wave (biome.json already excludes process/** per the
      wave-26 fix), so there is no visible red CI run — but the gap persists: a
      future non-source artifact in a linter-scanned tree could be introduced by any
      of these bypass pushes without detection until the next feature PR.
    source:
      - gitStatus (conversation start)
        # Recent commits: "3d7fdd9 process(wave-27): C-1 #40 merged (87b6ef7) + C-2 deploy",
        #   "630618d product(wave-27): P-4 gate-passed — head-product+karen+jenny APPROVE",
        #   "f2e5b01 product(wave-27): P-2 spec — multi-spec (server index + client subscription
        #   lift) to 6a546c7b.desc" — all direct pushes to main, no PR.
      - process/waves/_archive/wave-26/blocks/L/observations.md
        # obs-2: "Docs/process-only pushes to main bypass branch-protection CI ...
        #   HOLD. Promote to CI-PRINCIPLES rule 6 on second confirming wave."
    severity: warning
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
    recurrence: >
      2ND CONFIRMING INSTANCE of wave-26 obs-2. PROMOTION CANDIDATE.

      Wave-26 obs-2's class: "bypass-push skips CI; non-source artifact silently reddened
      main for 8 pushes — left undetected because the committing push never ran CI."
      Wave-26 obs-2's candidate rule shape: "Exclude non-source artifact trees from the
      linter scope and require CI on all pushes to main, including docs-only bypass pushes."

      Wave-27 confirmation: the bypass mechanism is still active (multiple process/product
      commits flow directly to main per the git log). The wave-26 biome.json fix mitigated
      the linter-scope half (process/** excluded) but the CI-gap half — the bypass push
      never running CI — is structural and unaddressed. The failure class is unchanged:
      any file committed via this path skips the CI gate. The absence of a new red CI run
      this wave is because the wave-26 fix reduced the surface area, not because the
      bypass mechanism was removed.

      Distinction: the candidate rule is about REQUIRING CI on bypass pushes (the structural
      gap) AND excluding non-source trees from linter scope (the mitigated but not closed
      surface). Both halves are in the wave-26 candidate rule shape and both remain valid.
      No scope change needed.

      CI-PRINCIPLES has 5 rules; slot 6 open. This obs is the PROMOTABLE signal. Flag for
      karen.
    promotion_gates:
      generalizable: true
        # Applies to any project where docs/process/stage-tracking commits are pushed
        # directly to main outside the PR path. The gap is: no linter, no tests, no
        # format gate runs on those commits. Any non-source file in a linter-scanned
        # tree (accidentally or via a future process change) will silently red main
        # until the next feature PR runs CI.
      falsifiable: true
        # Checkable on any push to main: did it have a CI gate? A project where
        # docs/process pushes bypass branch-protection (no required-status-checks on
        # bypass pushes, no per-push CI trigger for direct commits) fails this rule.
        # AND: does the linter's scope exclude all non-source artifact trees
        # (process/, evidence/, test-outputs/)? A linter that scans those trees also
        # fails this rule.
      cited: true
        # git status (conversation start): recent commits show process(wave-27) and
        #   product(wave-27) commits pushed directly to main without a PR;
        # wave-26 obs-2: first instance — biome CI red for 8 pushes, discovered at
        #   wave-26 B-4, process/** biome.json exclusion added; bypass mechanism unaddressed.
    candidate_rule_shape: >
      6. Exclude non-source artifact trees from linter scope and gate CI on all pushes
         to main, including process-only bypass commits.
         Why: A bypass commit that skips CI can introduce an unformatted artifact and
         silently red main until the next code PR.
      Rule line = 111 chars; why line = 91 chars. No forbidden tokens.
    promotion_status: PROMOTABLE. 2nd confirming instance (wave-26 obs-2 + wave-27 obs-4).
      Candidate rule shape unchanged from wave-26 obs-2. Flag for karen.
```

---

## Wave-26 held observations — second-instance status

| wave-26 obs | class                                                     | wave-27 status                                                                                                                                  |
|-------------|-----------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| obs-1       | Unit fixture seeds store with value real producer excludes | NOT CONFIRMED this wave. No T-2 unit test introduced a store fixture with an impossible producer state. Remains 1-wave HOLD.                    |
| obs-2       | Bypass-push skips CI; non-source artifact silently reds main | CONFIRMED (wave-27 obs-4 above). PROMOTABLE. Multiple process/product commits bypass CI in the wave-27 git log; bypass mechanism is structural. |
| obs-3       | Hard-coded date fixture without clock-mock rots as wall-time advances | NOT CONFIRMED this wave. No date-dependent test authored or repaired. Remains 1-wave HOLD.                                                      |
| obs-4       | P-0 existence-check misses producer output boundary for new consumer | CONFIRMED (wave-27 obs-2 above). PROMOTABLE via BROADENED class: "verify seed's technical claim at code level, not just that the named entity exists." The broadened rule subsumes obs-4's identity-boundary sub-class and wave-27's cost-target sub-class. |

---

## Signals evaluated and dropped

**Signal 3 (CARRY-B via React.memo on derived scalar prop):** The pattern — lifting a
per-row subscription to a list-level one, then passing each row a pre-derived scalar to a
memo'd child to preserve per-item render-scoping — is a correct React perf idiom. However,
as an L-2 candidate it is too narrow: it applies only when the specific combination of
(subscription lift + memo scoping + scalar prop derivation) occurs together. BUILD-PRINCIPLES
already has rule 5 (reconnect-triggered async loop coalescing) and rule 7 (linter check
before done). The CARRY-B pattern is closer to a one-time implementation note than a
generalizable principle a future reviewer can falsifiably check against different code.
Dropped as not generalizable enough for a BUILD rule.

**Signal 5 (recurring test-comment misnames mechanism nit):** Cosmetic doc-only finding
flagged at B-6/T-9/V-1. Already correctly classified as noise in V-2. A test comment
overstating the memoization mechanism (says "custom areEqual"; uses plain memo-on-scalar)
is not a generalizable principle violation. The behavior and assertions are correct.
Dropped.

---

## Summary table

| id    | title (short)                                                              | severity      | recurrence            | disposition                                                                            |
|-------|----------------------------------------------------------------------------|---------------|-----------------------|----------------------------------------------------------------------------------------|
| obs-1 | EXPLAIN test on small-seeded table needs enable_seqscan=off for Index-Scan | warning       | 1st instance          | HOLD — T-4 rule 1 candidate; promote on 2nd confirming wave                            |
| obs-2 | P-0 framer verified wrong method name; code-read redirected entire wave    | strong        | 2nd instance (w26+w27) | PROMOTABLE — PRODUCT-PRINCIPLES rule 2; broadened class subsumes wave-26 obs-4         |
| obs-3 | Behavior-preserving perf wave: spec structural proofs are sufficient T-7   | informational | 1st instance          | HOLD — T-7 rule 1 candidate; promote on 2nd confirming wave                            |
| obs-4 | Process/product commits continue to bypass CI gate on direct main pushes   | warning       | 2nd instance (w26+w27) | PROMOTABLE — CI-PRINCIPLES rule 6; rule shape unchanged from wave-26 obs-2             |

**Promotable this wave: 2 (obs-2 → PRODUCT-PRINCIPLES rule 2; obs-4 → CI-PRINCIPLES rule 6).**
**Held from prior wave — not yet confirmed: wave-26 obs-1 (T-2), wave-26 obs-3 (T-2).**
**New 1st-instance HOLDs: obs-1 (T-4), obs-3 (T-7).**

**2ND-INSTANCE FLAGS FOR KAREN:**
- obs-2 is the 2nd confirming instance of wave-26 obs-4's meta-class (P-0 technical-claim
  verification). Rule shape BROADENED to cover both sub-classes. Ready for karen vetting +
  head-product approval before write to PRODUCT-PRINCIPLES.
- obs-4 is the 2nd confirming instance of wave-26 obs-2 (bypass-push CI gap). Rule shape
  unchanged. Ready for karen vetting + head-ci-cd approval before write to CI-PRINCIPLES.
