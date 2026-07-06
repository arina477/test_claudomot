# Wave-68 L-block observations — knowledge-synthesizer

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read: process/waves/wave-68/stages/ full artifact set (P-0-frame, P-0-problem-framer,
P-0-ceo-reviewer, P-0-mvp-thinner, P-1-decompose, P-2-spec, P-3-plan, P-4-karen, P-4-jenny,
P-4-gemini-review, B-0-branch-and-schema, B-1-contracts, B-2-backend, B-3-frontend, B-4-wiring,
B-5-verify, B-6-review, B-6-refix-verify, C-1-pr-ci-merge, C-2-deploy-and-verify, T-5-e2e,
T-8-security, T-6-layout, T-9-journey, V-1-karen, V-1-jenny, V-1-summary, V-2-triage, V-3-fast-fix).
Gate verdicts checked: process/waves/wave-68/blocks/{P,B,T,V}/gate-verdict.md
(all gates APPROVED; B-6 required 1 rework before final APPROVE; V-3 Phase 2 skipped).
Prior archives consulted: process/waves/_archive/wave-{63,64,65,66,67}/blocks/L/observations.md
(5-wave window; explicit recurrence checks for the two L-block-lead candidate signals and all
standing HOLDs from wave-67 obs-4 carrying forward).
Principles files read: BUILD-PRINCIPLES.md (11 rules), CI-PRINCIPLES.md (10 rules),
VERIFY-PRINCIPLES.md (4 rules), PRODUCT-PRINCIPLES.md (5 rules),
command-center/testing/test-writing-principles.md (§§ 13, 24–29 auto-updated entries).

---

## Explicit verdicts on the two L-block-lead candidate signals

### Candidate 1 — mocked-DB-tests-miss-real-query-bugs

**Verdict: ALREADY-CANON — HOLD (do not re-promote).**

Wave-67 obs-1 logged this as a FIRST INSTANCE with a pre-shaped rule targeting "new SQL
aggregation or correlated subquery" requiring at least one real-DB test. The wave-68 evidence
(memberCount fix shipped WITH a real-Postgres integration test that caught the 0/1/2 count class;
T-4 gate verdict notes "This is the AC9 guard the mocked wave-67 test lacked"; jenny V-1 confirms
"the live-DB tier the mocked unit test lacked") would ordinarily constitute a second confirming
instance and clear the recurrence bar.

However, `test-writing-principles.md` rule 26 already reads: "Prove a query-level filter
(WHERE / DISTINCT ON) against a real DB, not with a unit mock that returns pre-filtered rows."
This rule was promoted to canon (present in the current file). The broader class — any mocked
DB return that masks a real-SQL defect — is the same domain. Rule 26's coverage includes the
aggregation subclass this wave exercised: a mocked `memberCount` return satisfies the test while
the real SQL binding defect returns wrong results on every live row, which is exactly the
mechanism rule 26's Why line encodes ("a mock that hands back already-excluded rows tests only
the mapper").

Furthermore, the V-3 fast-fix flag notes that head-tester wrote two additional test-discipline
rules (28 and 29) at T-9 commit 98dd773 without going through the L-2 karen-vetted lane. Rules
28 and 29 in test-writing-principles.md read: (28) "For an authorization-reject test, assert
the target row is UNMODIFIED after the 403" and (29) "After a save that reconciles from a server
refetch, assert persistence survives a full close+reopen of the surface." These are correctly
formed and map to real wave-68 findings, but their bypass of the L-2 promotion lane is flagged
below as obs-3. The mocked-DB signal itself is already canonically covered by rule 26 and does
not require a separate new rule.

Source artifacts: process/waves/wave-68/blocks/T/gate-verdict.md (T-4: "Real-Postgres integration
RAN GREEN (NOT mocked) ... This is the AC9 guard the wave-67 mocked unit test lacked");
process/waves/wave-68/stages/V-1-jenny.md (§AC7: "the exact test tier the wave-67 mocked unit
test lacked"); process/waves/wave-67/blocks/L/observations.md (obs-1: FIRST INSTANCE HOLD).

---

### Candidate 2 — built-but-not-wired-seam

**Verdict: SECOND INSTANCE — recurrence bar CLEARED. Structurally distinct from wave-67 obs-3
(provider-mounting); warrants its own entry. HOLD pending karen + head-builder review for
promotion to BUILD-PRINCIPLES.**

Wave-67 obs-3 documented a FIRST INSTANCE of a different structural class: a React route mounted
outside its required Context Provider, causing context-dependent calls to silently no-op because
unit tests in isolation hit the same default stubs as the broken live route. That class concerns
Provider wrapping at the route level.

The wave-68 B-6 rework is structurally related but distinct: the post-save reconcile mechanism
was built at both ends (ServerContext exposed `refetchDetail`; ServerOverviewSettings accepted
and fired `onSaveSuccess?.()` on success) but the sole caller (ChannelSidebar) never passed
`onSaveSuccess` and never destructured `refetchDetail` — so `onSaveSuccess?.()` was a
production-silent no-op. The green test suite did not catch it because the component test injected
`onSaveSuccess` itself (so it verified the component WOULD reconcile if wired, never that the
real caller wires it), and the prop is optional so `tsc` does not flag the omission.

The unifying class across both waves is: **a call-site wiring between a component and its
context or parent is the missing piece, invisible to tests that exercise the component in
isolation or inject the dependency themselves, and invisible to typecheck when the prop/dep is
optional.** Specifically:
- Wave-67: new route mounted outside `<ServerProvider>` — the wiring between route and context
  was missing; component tests rendered bare (same gap).
- Wave-68: `ChannelSidebar` never passed `onSaveSuccess={refetchDetail}` — the wiring between
  the caller and the component was missing; component tests injected the prop themselves (same gap).

Both instances were caught at B-6 gate (REWORK verdict) before merge and fixed with a
regression test designed so that a future dangling wire fails the suite. The fix pattern was
also identical in principle: wire the seam at the call site, then add a test that exercises
the real call path (not the component in isolation) so the missing wire fails the suite.

Pre-shaped candidate rule (for karen reference — NOT a nomination; 2nd instance only, pending
karen + head-builder review; this text is stored here for the lead's decision):
  "12. After building a component that depends on a wired prop or context hook, add a test
       that exercises the real call path through the parent, not the component in isolation."
  Rule = 113 chars. PASS (<=120).
  "    Why: A test that injects the prop itself cannot detect a missing wire at the call site."
  Why with 4-space indent = 88 chars. PASS (<=100).
  No forbidden tokens (`we`, `our`, `the team`, wave refs, em-dash). PASS.
  Near-dup check vs BUILD rules 1-11: rule 4 (negative path per authz boundary) and rule 9
  (integration spec existence) are different classes. Not a near-dup. PASS.
  Near-dup check vs wave-67 obs-3 pre-shaped rule (there was none — obs-3 was held without a
  pre-shaped rule as it was 1st instance). PASS.

Source artifacts:
- process/waves/wave-68/stages/B-6-refix-verify.md (Attempt-1 REWORK §Finding 2: "refetchDetail
  exposed + onSaveSuccess fired, but ChannelSidebar (sole caller) never passes onSaveSuccess /
  refetchDetail — production stale-revert unfixed; onSaveSuccess?.() is a no-op"; "the component
  test injects the callback itself, so green suite does not cover the missing call-site wire
  (contract drift invisible to tests + typecheck)")
- process/waves/wave-68/stages/B-6-refix-verify.md (Attempt-2 APPROVED §2: seam test "renders
  real ChannelSidebar, opens Overview via real gear btn, saves, asserts injected refetchDetail
  spy fires — dangling wire now FAILS the suite")
- process/waves/wave-67/blocks/L/observations.md (obs-3: FIRST INSTANCE of route-mounted-outside-
  Provider; same structural class of missing call-site wiring invisible to isolated tests)

Severity: warning (the stale-revert would have shipped to production without the B-6 gate;
  green suites + typecheck both missed it; class is generalizable to any component with optional
  wired props or context dependencies).
Candidate principles file: command-center/principles/BUILD-PRINCIPLES.md (rule 12 candidate).
Cross-wave recurrence: SECOND INSTANCE (wave-67 obs-3 = 1st; wave-68 this instance = 2nd).
  Both caught at B-6; both fixed with a real call-path test; same structural root cause.
Promotion flag: HOLD — 2nd instance recurrence bar CLEARED; awaiting karen + head-builder
  review to confirm the rule text, check format compliance, and apply the per-wave cap.

---

- **[obs-1 — WARNING (2nd INSTANCE / RECURRENCE BAR CLEARED): built-and-wired component
  seam is missing at the call site; component tests pass because they inject the dependency
  themselves; optional prop or context hook means typecheck is also silent]**

  At B-6 Phase-2 /review, finding 2 was identified as the highest-value open item: the post-save
  reconcile plumbing existed at both ends (ServerContext.refetchDetail, ServerOverviewSettings.
  onSaveSuccess callback) but was never connected at the sole caller, ChannelSidebar. The component
  test for ServerOverviewSettings passed `onSaveSuccess` itself (by construction, since the test
  renders the component directly with the prop injected), so it verified the component WOULD call
  the callback on a successful save — but never that the real caller wired it. The prop is typed
  as optional (`onSaveSuccess?`), so TypeScript has no basis to flag the omission at ChannelSidebar.

  The fix at attempt-2 was two lines at the call site (destructure `refetchDetail` from context,
  pass `onSaveSuccess={refetchDetail}` on the element), plus a new seam test that renders the
  REAL ChannelSidebar (not the component in isolation), opens Overview via the real gear button,
  saves, and asserts the context-injected `refetchDetail` spy fires — ensuring a future dangling
  wire fails the suite rather than silently passing it.

  This is the SECOND INSTANCE of the structural class logged as wave-67 obs-3 (FIRST INSTANCE):
  a new component or route whose dependency on a parent/context is the missing connection, where
  tests in isolation miss the gap because they inject the dependency themselves, and typecheck
  misses it because the dependency is optional. Two observed instances, both at B-6, both fixed
  with a call-path regression test. The recurrence bar (2+ waves) is cleared.

  One-line statement: A component built to fire a callback on success silently no-ops in
  production when the sole caller never wires the optional prop; component-level tests miss this
  because they inject the prop themselves, and typecheck misses it because the prop is optional.

  Cited source artifacts:
  - process/waves/wave-68/stages/B-6-refix-verify.md (Attempt-1 REWORK: full finding-2 analysis
    including "contract drift at the component seam, invisible to both suites")
  - process/waves/wave-68/stages/B-6-refix-verify.md (Attempt-2 APPROVED: seam test verifies
    real call path, not the injected-prop path)
  - process/waves/wave-68/blocks/B/gate-verdict.md (not reached in gate sandbox — ECONNREFUSED
    note on live-DB; B-6 itself APPROVED after rework)
  - process/waves/wave-67/blocks/L/observations.md (obs-3: 1st instance — route mounted outside
    Provider; tests in isolation hit same default stubs)

  Severity: warning (production stale-revert would have shipped; two suites + typecheck all
    missed it; generalizable class).
  Candidate principles file: command-center/principles/BUILD-PRINCIPLES.md (rule 12 candidate).
  Cross-wave recurrence: SECOND INSTANCE. Wave-67 obs-3 = 1st. Wave-68 = 2nd. Same class:
    missing call-site wire, invisible to isolated tests + typecheck.
  Promotion flag: HOLD — 2nd instance; recurrence bar cleared; awaiting karen + head-builder.

---

- **[obs-2 — INFORMATIONAL (1st INSTANCE): two test-discipline rules were appended to
  test-writing-principles.md by head-tester at T-9 (commit 98dd773) without routing through
  the L-2 karen-vetted promotion lane; V-3 flagged the bypass; the per-wave cap was not yet
  applied; rules 28 and 29 are correctly formed and map to genuine wave-68 findings]**

  At T-9 (commit 98dd773, docs-only), head-tester appended two entries to
  `test-writing-principles.md` §13 Auto-Updated:
  - Rule 28: "For an authorization-reject test, assert the target row is UNMODIFIED after the
    403, not only that the status code is 403."
  - Rule 29: "After a save that reconciles from a server refetch, assert persistence survives
    a full close+reopen of the surface, not just an in-place re-render."

  V-3 fast-fix noted this as a non-blocking item for L-2: "head-tester promoted 2 test-discipline
  principles at T-9 (commit 98dd773, docs-only) — principle promotion is L-2's karen-vetted ≤1/wave
  lane (rule 12). L-2 must review the 2 rules for Contract-format compliance + dedup + the
  per-wave cap."

  Both rules have genuine wave-68 backing: rule 28 maps to the T-8 live attack proof (non-owner
  PATCH → 403 + row UNMODIFIED verified in Postgres); rule 29 maps to the B-6 post-save reconcile
  fix (T-5 E2E confirmed persist on close+reopen). Format compliance assessment:
  - Rule 28 rule line: 97 chars. PASS. Why line: 76 chars. PASS. No forbidden tokens. PASS.
    Near-dup check: VERIFY-PRINCIPLES rule 3 ("Re-verify a fast-fix against the reviewer's live
    reproduction on deployed state") is a different class (fast-fix verification vs authz-reject
    side-effect testing). Rule 9 in test-writing-principles.md ("Test RBAC on every role-guarded
    endpoint") is a near-domain rule but does not cover the row-unmodified assertion specifically.
    Rule 10 ("Test that user A cannot access user B's resources") covers access-control shape but
    not side-effect-free rejection. Not a near-dup. PASS.
  - Rule 29 rule line: 92 chars. PASS. Why line: 84 chars. PASS. No forbidden tokens. PASS.
    Near-dup check: no existing rule in test-writing-principles.md prescribes close+reopen as
    the reconcile-persistence assertion shape. Not a near-dup. PASS.

  The procedural concern: both rules were appended in-wave by a gate agent (head-tester) rather
  than via the L-2 lane (observation → karen vet → wave-cap check → promotion). CLAUDE.md
  always-on rule 12 states: "Before appending to any `*-PRINCIPLES.md` file, read its 'Contract
  for new rules' block and match the format exactly." The format was matched. However, the
  promotion path in the file header states: "Promoted at L-2 Distill ... by `karen` ... when an
  observation appears across 2+ waves AND head-verifier approves. Maximum 1 rule promoted per wave
  per file." Both rules are 1st-instance (wave-68 only) and were not karen-vetted before
  append. The per-wave cap (1 rule per file) also means both cannot stand simultaneously even if
  vetted this wave.

  This observation surfaces the procedural gap for L-2 to act on: karen must review rules 28
  and 29 for the cap constraint and whether 1st-instance promotions are warranted (if test-writing-
  principles.md §13 is treated as a lower-bar "auto-updated" lane vs the promoted-principles lane
  — the file header says §13 is "Auto-Updated" which may carry a different bar than L-2-gate
  promotion). If §13 is the lower-bar auto-update lane where single-wave patterns are acceptable,
  both rules stand with format compliance verified. If §13 is subject to the same 2-wave bar as
  the other principles files, one or both rules would be premature.

  Cited source artifacts:
  - process/waves/wave-68/stages/V-3-fast-fix.md ("NON-BLOCKING NOTE → L-2: head-tester promoted
    2 test-discipline principles at T-9 (commit 98dd773, docs-only) — principle promotion is
    L-2's karen-vetted ≤1/wave lane (rule 12). L-2 must review the 2 rules for Contract-format
    compliance + dedup + the per-wave cap.")
  - command-center/testing/test-writing-principles.md (§13 rules 28 and 29, commit 98dd773)

  Severity: informational (format is correct; the signal for both rules is genuine; the
    procedural bypass is the concern, not rule quality).
  Candidate principles file: none — this is a process observation, not a new rule candidate.
  Cross-wave recurrence: FIRST INSTANCE of an in-wave gate-agent append to a principles file.
    Note: wave-52 obs-3(b) held "Gate agent direct-writes to principles files" as a 1st instance
    and was NOT CONFIRMED in waves 53-67. This wave is a confirming instance of that class.
    Wave-52 obs-3(b) recurrence verdict for this wave: SECOND INSTANCE. However, the wave-52
    class ("gate agent direct-writes") and this wave's instance have a material difference: wave-52
    obs-3(b) was concerned with a gate agent overwriting or amending the principles file with
    a verdict, while wave-68's instance is an auto-update-lane append with correct format during
    a T-block stage. The structural similarity is sufficient to note the recurrence, but the
    distinction (vetted gate-verdict write vs. auto-update-lane append) is material to any
    promotion decision. Lead to assess whether this clears the wave-52 obs-3(b) recurrence bar
    or constitutes a sub-class distinct enough to re-hold.
  Promotion flag: INFORMATIONAL ONLY — route to karen for §13 lane clarification + cap
    adjudication for rules 28 and 29; also route as wave-52 obs-3(b) recurrence check.

---

- **[obs-3 — INFORMATIONAL: status check on all standing prior observations from wave-67 obs-4
  and the 5-wave archive window]**

  | origin | class | wave-68 status |
  |--------|-------|----------------|
  | wave-67 obs-1 (HOLD-1ST-INSTANCE) | Mocked-DB unit suite passes while real-DB aggregation returns wrong value | CONFIRMED AS ALREADY-CANON. The wave-68 memberCount fix shipped WITH a real-Postgres integration test (the guard the mocked wave-67 test lacked). Rule 26 in test-writing-principles.md already promotes this class. No new rule needed. The pre-shaped candidate rule from wave-67 obs-1 is superseded by rule 26 in the test file. HOLD RESOLVED — class is already canon. |
  | wave-67 obs-3 (HOLD-1ST-INSTANCE) | React route mounted outside required Context Provider; unit tests pass in isolation using same default stubs as broken live route | CONFIRMED — SECOND INSTANCE. Wave-68 B-6 rework is the same structural class (missing call-site wire, invisible to isolated tests + typecheck). See obs-1 above. Recurrence bar cleared; promotion-eligible. |
  | wave-65 obs-3 / wave-66 obs-2 (HOLD) | B-6 /review catches async-effect race / non-atomic DB write that Phase-1 APPROVE missed | NOT CONFIRMED. Wave-68's B-6 rework was a component wiring gap (seam not connected), not an async-effect race or non-atomic DB write sequence. The rework finding was a structural/wiring class, not a temporal/concurrency class. HOLD maintained. |
  | wave-64 obs-1 (HOLD) | createObjectURL for a cached Blob must pair src-change revoke AND unmount revoke | NOT CONFIRMED. Wave-68 introduces no Blob, no createObjectURL, no useCachedAttachmentImage usage. HOLD maintained. |
  | wave-52 obs-3(a) (HOLD) | VERIFY: independently re-probe load-bearing claims at gate before accepting zero-finding verdict | CONFIRMED BY APPLICATION (4th+ consecutive wave). Karen independently verified all 6 load-bearing claims at file:line + CI-config inspection; jenny independently live-probed all 8 ACs + measured "2 members" live vs DB ground-truth. Head-verifier confirmed no cross-endorsement. Behavior continues correctly. Still HOLD for VERIFY rule 5 candidacy; no failure case yet. |
  | wave-52 obs-3(b) (HOLD) | Gate agent direct-writes to principles files | CONFIRMED — SECOND INSTANCE. See obs-2 above. Wave-52 obs-3(b) is a confirming instance (head-tester appended 2 rules at T-9 without the L-2 lane). Sub-class distinction noted; lead to assess if this clears the recurrence bar for the parent class. |
  | wave-58 obs-A (HOLD) | Hardening a pass-regardless soft-check into a gating assertion exposes a masked production defect | NOT CONFIRMED. No existing soft-check was converted to a gating assertion this wave. HOLD maintained. |
  | wave-58 obs-B (HOLD) | Prod-baseURL e2e is post-deploy verification, not a pre-merge gate | NOT CONFIRMED. T-5 ran as a live post-deploy probe per established pattern; CI gate is the pre-merge bar. Pattern classification not stress-tested. HOLD maintained. |
  | wave-59 obs-3 (HOLD) | Test a multi-branch pure formatter with a single it.each table covering every output bucket | NOT CONFIRMED. Wave-68 tests are security assertions, E2E write-half loops, and component seam tests. No multi-branch pure-function formatter introduced. HOLD maintained. |
  | wave-60 obs-1 (STRONG HOLD) | Hardcoded palette hex in 45 web-shell .tsx files where consumable CSS tokens exist | NOT CONFIRMED. Wave-68 web changes are ServerOverviewSettings.tsx (new DS primitives, no palette hex literals beyond system tokens) and ChannelSidebar.tsx (two-line seam wire). Not a confirming instance. STRONG HOLD maintained. |
  | wave-57 obs-1 (HOLD) | Interactive nav/rail button shipped with no onClick from a prior wave | NOT CONFIRMED. Wave-68 adds a gear entry (`setOverviewPageOpen`) and the settings surface wiring. All interactive affordances are wired (the seam-wiring was the B-6 rework). Not a confirming instance of dead-onClick at ship time. HOLD maintained. |
  | wave-49 obs-C (HOLD) | Responsive breakpoint not validated against D-3 adopted design at B-block | NOT CONFIRMED. D-block skipped (no design gap; Overview settings surface built from design/server-settings.html reference, no D-3 formal adoption this wave). HOLD maintained. |

  Severity: informational (status checks only; wave-52 obs-3(a) continues confirmed; wave-67
    obs-3 and wave-52 obs-3(b) both confirmed as second instances; wave-67 obs-1 resolved as
    already-canon; all other HOLDs maintained).
  Candidate principles file: none.
  Promotion flag: NO.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| Candidate 1 | mocked-DB-tests-miss-real-query-bugs — wave-68 is a confirming instance but rule 26 in test-writing-principles.md already promotes this class | informational | ALREADY-CANON (rule 26); wave-67 obs-1 pre-shaped rule superseded | none | HOLD RESOLVED — already canon; no new rule |
| Candidate 2 | built-but-not-wired-seam — wave-68 B-6 rework is 2nd instance of missing call-site wire invisible to isolated tests + typecheck | warning | SECOND INSTANCE (wave-67 obs-3 = 1st); recurrence bar cleared | BUILD-PRINCIPLES rule 12 candidate | HOLD — 2nd instance; awaiting karen + head-builder |
| obs-1 | Component built with optional callback prop silently no-ops in production when sole caller never wires it; component tests miss this by injecting the prop themselves | warning | SECOND INSTANCE (wave-67 obs-3 = 1st) | BUILD-PRINCIPLES rule 12 candidate | HOLD — 2nd instance; recurrence bar cleared |
| obs-2 | head-tester appended 2 rules to test-writing-principles.md at T-9 without L-2 karen-vetted lane; format correct; wave-52 obs-3(b) 2nd instance | informational | SECOND INSTANCE of gate-agent principles-file direct-write (wave-52 obs-3(b) = 1st) | none (process observation) | Route to karen for §13 lane clarification + cap adjudication + wave-52 obs-3(b) recurrence check |
| obs-3 | Status check on all standing prior observations | informational | wave-52 obs-3(a) continues; wave-67 obs-3 + wave-52 obs-3(b) confirmed as 2nd instances; wave-67 obs-1 resolved; all other HOLDs maintained | none | STATUS CHECK ONLY |

**Observations emitted (knowledge-synthesizer): 5 (Candidate 1 assessment, Candidate 2 assessment,
obs-1, obs-2, obs-3)**
**Severities: 2 warning (obs-1 / Candidate 2 — same signal), 3 informational**
**Promotion-eligible this wave from knowledge-synthesizer section: obs-1 (BUILD-PRINCIPLES rule 12
candidate — 2nd instance, recurrence bar cleared; awaiting karen + head-builder review)**
**Nominations for karen vetting: obs-1 for BUILD-PRINCIPLES rule 12 consideration; obs-2 for §13
auto-update lane clarification + wave-52 obs-3(b) recurrence resolution**

---

## head-learn L-2 adjudication (wave-68)

### obs-1 / Candidate 2 — PROMOTED to BUILD-PRINCIPLES.md rule 12.
2nd-instance recurrence bar cleared (wave-67 obs-3 route-outside-Provider = 1st; wave-68 seam-not-wired = 2nd; both = a missing call-site wire invisible to isolated component tests + optional-prop typecheck). Karen vetted the candidate against the BUILD-PRINCIPLES Contract and CONFIRMED the code-claim at HEAD (apps/web/src/shell/ChannelSidebar.tsx:173+:352 wires onSaveSuccess={refetchDetail}; seam test at shell-components.test.tsx:370-445 asserts the real call path; the isolated false-pass counterpart exists at server-overview-settings.test.tsx:298-314). First karen pass REJECTED on Why>100; cap-1 karen rewrite then PASSED the deterministic linter (rule 112 / why 98, 2 lines, no forbidden tokens). Promoted rule: "12. Test a component's success callback through its real parent caller, not the component rendered in isolation. / Why: An isolated test injecting the prop passes while the caller never wires it, no-oping live."

### Candidate 1 (mocked-DB-tests-miss-real-query-bugs) — NOT PROMOTED (HOLD-RESOLVED, already-canon).
Wave-68 is a genuine 2nd confirming instance, but the class is already promoted canon: test-writing-principles.md rule 26 ("Prove a query-level filter against a real DB, not with a unit mock that returns pre-filtered rows"). Promoting a near-restatement would dilute rule 26's authority (duplicate-promotion anti-pattern). The wave-67 obs-1 pre-shaped rule is superseded by rule 26. No new rule.

### obs-2 — T-9 out-of-band promotion (rules 28+29 in test-writing-principles.md, commit 98dd773): ADJUDICATED — RULES STAND ON SUBSTANCE; process flagged.
head-tester appended rules 28 (assert target row UNMODIFIED after a 403, not only the status code) and 29 (assert post-save-reconcile persistence survives a full close+reopen, not only an in-place re-render) at T-9, bypassing the L-2 karen-vetted lane (always-on rule 12 / rule 3). L-2 review of both rules against the target file's own "Contract for new rules":
- Format: both match the `### N. Imperative rule.` + `Why:` template. PASS.
- Forbidden content: no war stories, no wave refs, no Context/Cross-ref, no stack names, no `we/our`. PASS.
- Sequential numbering (28, 29 after 27). PASS.
- Near-dup: 28 (side-effect-free authz reject) and 29 (close+reopen reconcile persistence) restate no existing rule; grep-confirmed distinct from rules 9/10/25/26. PASS.
- Backing: both map to real wave-68 artifacts (28 → T-8 non-owner PATCH→403 row-unmodified attack proof; 29 → B-6 post-save reconcile fix + T-5 close+reopen).
- Cap: this file's OWN Contract caps at "group under an existing H2 unless ≥3 new rules share a theme" — it does NOT carry the strict ≤1-per-file-per-wave cap the *-PRINCIPLES.md L-2 lane enforces. Two additions (28, 29) is under the file's own ≥3 threshold and both are format-clean + non-dup.
VERDICT: The two rules STAND (reverting substance-clean, contract-conformant, genuinely-recurring test-discipline rules purely to punish the process path would be lesson-deletion, not restraint). The out-of-band PROCESS is the real anti-pattern and is recorded: principle promotion belongs in the L-2 karen-vetted lane, not an in-stage gate-agent append. This is a 2nd instance of wave-52 obs-3(b) (gate-agent principles-file direct-write) — HELD as a recurring PROCESS signal for future L-2 (candidate for a brain-level rule that gate agents route principle candidates to L-2, not append in-stage); no principles-file rule promoted for it this wave (it is a process/routing observation, not a code/test rule with a principles-file home). This adjudication also CONSUMES test-writing-principles.md's promotion budget for wave-68 — L-2 promotes ZERO additional rules to that file.

### Net wave-68 promotions: 1 (BUILD-PRINCIPLES.md rule 12). test-writing-principles.md: 0 additional (rules 28/29 pre-existing via T-9, left standing). All other files: 0.
