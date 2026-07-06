# Wave 59 — L-block observations ledger

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read: process/waves/wave-59/stages/ full artifact set (P-0-frame, P-0-problem-framer,
P-0-ceo-reviewer, P-0-mvp-thinner, P-1-decompose, P-2-spec, P-3-plan, P-4-gemini-review,
B-0-branch-and-schema, B-3-frontend, B-4-wiring, B-5-verify, B-6-review-output, C-1-pr-ci-merge,
C-2-deploy-and-verify, T-9-journey, V-1-karen, V-1-jenny, V-1-summary, V-2-triage, V-3-fast-fix).
Gate verdicts checked: process/waves/wave-59/blocks/{P,B,T,C,V}/gate-verdict.md (all five gates
APPROVED; zero findings across all blocks; V-2 triage empty; V-3 Phase 2 skipped).
Prior archives consulted: process/waves/_archive/wave-{54,55,56,57,58}/blocks/L/observations.md
(recurrence checks on soft-check/hard-assert class, prod-baseURL e2e class, table-driven
transition-table class, and all prior held HOLDs).
Principles files read: PRODUCT-PRINCIPLES.md (5 rules), BUILD-PRINCIPLES.md (10 rules),
CI-PRINCIPLES.md (10 rules), VERIFY-PRINCIPLES.md (4 rules), T-1.md (0 rules — empty).

---

- **[obs-1 — HOLD UPDATE (obs-A from wave-58, 1st instance): hardening a pass-regardless
  soft-check into a gating assertion surfaced a pre-existing production defect — NO-CONFIRM
  this wave; HOLD maintained]**

  Wave-58 obs-1 (FIRST INSTANCE) documented the class: when a pass-regardless soft-check is
  converted to a gating hard assertion, the first honest CI run may gate red because a
  pre-existing production defect (previously concealed by the softness) is now visible. The
  pre-shaped VERIFY-PRINCIPLES rule 5 candidate is held pending a confirming wave.

  Wave-59 assessment: this wave adds a brand-new unit test on a function that was already
  correct — `buildTypingLabel` has been shipping its 5-branch output since wave-45; the test
  does NOT harden a prior pass-regardless check into a gating assertion. There is no pre-existing
  soft-check being converted. The CI gate ran 7/7 green on first attempt (C-1-pr-ci-merge.md:
  "CI: all 7 checks GREEN"). The wave-58 class (conversion of soft-check causing a production-fix
  contingency) is entirely absent from this wave's structure.

  Evidence against confirming: wave-59 is a net-new contract test, not a conversion of a
  previously soft-checking test. No production defect was found or fixed this wave. No
  production logic changed beyond the `export` keyword (a runtime-inert visibility change,
  confirmed by V-1-karen.md claim 2 and V-1-jenny.md §3). B-6-review-output.md records
  "Findings: none (critical/high: 0)." V-2-triage.md: "Blocking: NONE. Fast-fix queue: EMPTY."

  Determination: NOT CONFIRMED. Wave-59 is not a confirming instance of the wave-58 obs-A
  soft-check-hardening class. The class requires an existing pass-regardless check being
  converted to a hard assertion; this wave has no such prior check.

  Source artifacts: C-1-pr-ci-merge.md (7/7 green), V-2-triage.md (empty), B-6-review-output.md
  (no findings), V-1-karen.md (claim 2: export-only, branches byte-identical), V-1-jenny.md
  (§3: prod change exactly the export keyword).

  Candidate rule shape preserved from wave-58 (NOT a nomination — still 1st instance only):
    "5. When converting a pass-regardless soft-check to a gating assertion, budget a production
       fix; surfacing the masked defect is the expected outcome."
    Rule = 104 chars. PASS. Why = "A soft-check that passes regardless hides whether the
    behavior works; the first honest run may gate red." Why with indent = 97 chars. PASS.
    No forbidden tokens. Not a near-dup of VERIFY rules 1-4. PASS.

  Severity: informational (status update; no new evidence; wave structure is orthogonal to the
    class being watched).
  Candidate principles file: command-center/principles/VERIFY-PRINCIPLES.md (rule 5 candidate).
  Recurrence verdict: NO-CONFIRM this wave. Still FIRST INSTANCE (wave-58 only). HOLD maintained.
  Promotion flag: HOLD — 1st instance; watch for a wave where a pass-regardless check is
    converted to a gating assertion and triggers a production-fix contingency.

---

- **[obs-2 — HOLD UPDATE (obs-B from wave-58, 1st instance): a prod-baseURL e2e is post-deploy
  verification, not a pre-merge gate — NO-CONFIRM this wave; HOLD maintained]**

  Wave-58 obs-2 (FIRST INSTANCE) documented the class: a Playwright suite whose baseURL targets
  the live production URL is a post-deploy verification instrument; marking it required in CI
  would block the branch fix that resolves the failing e2e. Wave-59's C-1/C-2 were checked for
  any evidence of this pattern recurring.

  Wave-59 assessment: CI was 7/7 green including the e2e check on first attempt (C-1-pr-ci-merge.md:
  "all 7 checks GREEN"). No e2e-red-then-fix cycle occurred. There was no observable situation
  where the production-baseURL e2e classification (required vs. non-required) was relevant to this
  wave's merge decisions. The wave's sole production change was a runtime-inert `export` keyword
  and a test file — neither touches the deployed binary in a way that could cause a behavioral
  regression detectable by a user-flow e2e. The deploy was SUCCESS at 42c95bc (C-2-deploy-and-verify.md);
  the e2e had no reason to gate differently between pre-deploy and post-deploy.

  Evidence against confirming: no e2e failure, no classification decision about the baseURL suite's
  required/non-required status, no situation where the prod-baseURL distinction affected anything.
  This wave does not confirm or falsify the obs-B class — it is simply not an exercising instance
  of that pattern.

  Determination: NOT CONFIRMED. Wave-59 provides no confirming evidence for the wave-58 obs-B
  class (prod-baseURL e2e as post-deploy verification). The wave's clean CI run means the
  classification distinction was never stress-tested.

  Source artifacts: C-1-pr-ci-merge.md (7/7 green, no e2e gate issue), C-2-deploy-and-verify.md
  (web SUCCESS, e2e not separately re-run as a post-deploy check this wave).

  Candidate rule shape preserved from wave-58 (NOT a nomination — still 1st instance only):
    "11. Classify an e2e suite whose baseURL targets deployed prod as non-required in CI; it is
       post-deploy verification, not a pre-merge gate."
    Rule = 113 chars. PASS. Why = "A production-baseURL e2e tests the deployed binary, not the
    branch; gating merge on it blocks the fix." Why with indent = 99 chars. PASS.
    No forbidden tokens. Not a near-dup of CI rules 1-10. PASS.

  Severity: informational (status update; wave structure orthogonal to the class being watched;
    no confirming or falsifying evidence).
  Candidate principles file: command-center/principles/CI-PRINCIPLES.md (rule 11 candidate).
  Recurrence verdict: NO-CONFIRM this wave. Still FIRST INSTANCE (wave-58 only). HOLD maintained.
  Promotion flag: HOLD — 1st instance; watch for a wave where baseURL = prod classification is
    applied correctly or missed (creating a merge deadlock).

---

- **[obs-3 — FIRST INSTANCE: "test a multi-branch pure-function transition table as a table"
  (it.each over a {input,expected} fixture) is the correct T-1 unit shape; a row per output
  bucket makes any single-branch drift fail deterministically — HOLD, 1st instance]**

  Wave-59 is the first wave where the explicit T-1 design decision "test a transition table as
  a table" surfaced as a clean, standalone delivered artifact. `buildTypingLabel` is a 5-branch
  pure function (`useTyping.ts:65-84`) whose entire contract is a finite input-to-output map.
  The delivered test (`useTyping.test.ts`) uses `it.each(TABLE)` over a `{typers, expected}`
  fixture with 6 rows (0/1/2/3/4/5 typers), each asserting `.toBe(expected)` verbatim. Key
  structural features: (a) all 5 output buckets are represented; (b) verbatim display-name
  strings in rows 1-3 catch separator/word-order drift the function does not currently have
  but could acquire; (c) a 5-typer row is added alongside the 4-typer row, proving the 4+
  bucket is a true `>3` fallthrough rather than a `===4` special-case (B-6-review-output.md:
  "The 4+ bucket carries BOTH a 4-typer and a 5-typer row, proving it is a true >= 4 fallthrough";
  V-1-karen.md claim 1: "proves 4+ is a TRUE fallthrough"; V-1-jenny.md: "This is the strongest
  form of the AC's 'drift fails deterministically' intent").

  The structural pattern: for a pure N-branch formatter whose branches are exhaustive and
  mutually exclusive, a single `it.each` over a `{input, expected}` table covering every
  output bucket is strictly superior to N separate `it()` calls — it forces consistent assertion
  shape across all branches, makes a missing bucket visible as a missing row, and lets the test
  description iterate naturally (the formatter is invoked identically for each row, with only the
  fixture data varying). The P-0-problem-framer explicitly named this shape: "the exact
  'transition table tested as a table' shape T-1 flags" (P-0-problem-framer.md). The P-4 gate
  verdict confirms it: "the seed calls for" the transition-table-as-a-table shape (P/gate-verdict.md
  Phase 1 Rationale). T-1.md currently has 0 rules — this class has never been promoted to T-1.

  Archive search (waves 54-58 L-2 observations AND broader grep across all archived observations.md
  files): searched for "table.driven", "it.each", "transition.table", "TABLE.*test", "test.*table"
  across process/waves/_archive/**/blocks/L/observations.md. No prior L-2 observation of the class
  "pure-function multi-branch output encoded as an it.each TABLE with one row per bucket" was
  found. The wave-27 obs-1 hits in the grep results ("EXPLAIN test on small-seeded table needs
  enable_seqscan=off") concern Postgres planner behavior on small fixture tables — an integration
  test layer (T-4) concern, structurally unrelated to a T-1 pure-function formatter's branch
  coverage shape. Not a prior confirming instance. This is FIRST INSTANCE of the T-1
  transition-table-as-table pattern.

  Principles search: T-1.md has 0 rules. No existing T-1 rule addresses the "test a multi-branch
  pure function's output buckets as an it.each table" norm. No near-dup in BUILD, VERIFY, PRODUCT,
  CI rules, or T-1 through T-9 files.

  Near-dup check: test-writing-principles.md §27 (promoted mid-block at wave-47) encodes
  "Drive a feature's entry-point flow through the real UI affordance, never via a direct API
  call." That rule is about T-5 e2e entry-point realism, not T-1 unit test structure for a
  pure formatter. Not a near-dup.

  Candidate rule shape for T-1.md (pre-shaped for karen's reference, NOT a nomination — 1st
  instance only):
    "1. Test a multi-branch pure formatter with a single it.each table covering every output
       bucket; add one row per boundary transition."
    Rule = 97 chars. PASS (<=120).
    "   Why: A table makes a missing bucket visible as a missing row; N separate it() calls
       can omit a bucket silently."
    Why line WITH 3-space indent = 97 chars. PASS (<=100).
    No forbidden tokens (no `we`, `our`, `the team`, `wave-<N>`, em-dash). PASS.
    Near-dup check vs T-1 (0 rules): no near-dup possible. PASS.
    Near-dup check vs test-writing §27 and T-{2..9}: none address the it.each-table-per-bucket
    norm for pure formatters. PASS.

  Source artifacts:
  - process/waves/wave-59/stages/P-0-problem-framer.md ("the exact 'transition table tested
    as a table' shape T-1 flags")
  - process/waves/wave-59/blocks/P/gate-verdict.md (Phase 1 Rationale: "the seed calls for"
    the transition-table-as-a-table shape; Phase 2 builder carry: "the test must assert
    VERBATIM display-name strings")
  - process/waves/wave-59/stages/B-3-frontend.md ("describe + single it.each over 6 rows
    (0/1/2/3/4/5 typers) asserting verbatim display-name strings for buckets 1-3 and the
    'Several people are typing' constant for 4 AND 5")
  - process/waves/wave-59/stages/V-1-karen.md (claim 1, claim 5; antipattern watch CLEARED:
    "load-bearing, not count-only / always-true")
  - process/waves/wave-59/stages/V-1-jenny.md (§1: "This is the strongest form of the AC's
    'drift fails deterministically' intent")
  - process/waves/wave-59/blocks/B/gate-verdict.md ("The 4+ bucket carries BOTH a 4-typer and
    a 5-typer row, proving it is a true >= 4 fallthrough rather than an exact-4 match")

  Severity: informational (the pattern was executed correctly first time; no harm arose from
    its absence historically; the observational value is that T-1.md has 0 rules and this is
    a clean, citable first instance of a falsifiable T-1-scoped norm).
  Candidate principles file: command-center/principles/test-layer-principles/T-1.md (rule 1
    candidate — the file currently has 0 rules and is explicitly waiting for L-2 distill input).
  Recurrence verdict: FIRST INSTANCE. No prior L-2 observation of this class in any archived
    wave. Not covered by any existing promoted rule across T-1 through T-9, BUILD, VERIFY,
    PRODUCT, or CI. HOLD.
  Promotion flag: HOLD — 1st instance; the 2-wave bar is not met. Log and watch for a second
    wave where a pure-function multi-branch formatter is tested with an it.each table (or,
    conversely, where N separate it() calls are used and a bucket is silently omitted).

---

- **[obs-4 — RECURRING (10th instance): sub-floor single-spec wave resolved by override-ship
  via PRODUCT rule 5 (wave-16 test-coverage exemption path); recurrence count updated;
  rule functioning correctly]**

  Wave-59 P-1 tripped the single-spec floor (~50 LOC vs. 1,500-LOC threshold). Resolution:
  floor waived under the standing wave-16 product-decision ("Test-coverage waves are exempt from
  the feature-LOC floor" — command-center/product/product-decisions.md:233). P-1-decompose.md
  explicitly records "Floor WAIVED" under the standing wave-16 precedent; "override-ship per P-1
  §2b(a), kept single-task." No BOARD required (resolve-by-rule; P-0 reframe trio all PROCEED).

  This obs is a STATUS UPDATE only: PRODUCT-PRINCIPLES rule 5 (promoted at wave-52) covers the
  general floor-override-by-rule path; the wave-16 product-decision carve-out (test-coverage waves
  exempt from the feature-LOC floor) is the specific applicable exemption here. The system is
  operating as designed. No new learning gap.

  Recurrence lineage:
  - wave-50 obs-B: 1st instance. wave-51 obs-B: 2nd instance. wave-52 obs-4: 3rd instance
    (PROMOTED as PRODUCT-PRINCIPLES rule 5). waves 53, 54, 55: instances 4, 5, 6.
    wave-56 obs-3: 7th instance. wave-57 obs-2: 8th instance. wave-58 obs-3: 9th instance.
    wave-59: 10th instance. Rule applied correctly each time; no override friction.

  Source artifacts:
  - process/waves/wave-59/stages/P-1-decompose.md ("Floor WAIVED under the standing wave-16
    product-decision... override-ship per P-1 §2b(a)")

  Severity: informational (rule 5 functioning correctly; zero override friction; no new gap).
  Candidate principles file: none (PRODUCT-PRINCIPLES rule 5 already exists and was applied).
  Recurrence: 10th instance. Rule 5 in force. No action needed.
  Promotion flag: NO — rule already promoted; this is a health-check confirmation.

---

- **[obs-5 — status check on prior held observations]**

  Updating carried status from wave-58 obs-4 and all prior HOLDs:

  | origin | obs | class | wave-59 status |
  |--------|-----|-------|----------------|
  | wave-58 obs-1 / obs-A | Hardening a pass-regardless soft-check into a gating assertion exposes a masked production defect | NOT CONFIRMED. Wave-59 adds a net-new contract test on an already-correct function; no pre-existing soft-check was converted; CI 7/7 green first attempt. See obs-1 above. HOLD maintained. |
  | wave-58 obs-2 / obs-B | Prod-baseURL e2e is post-deploy verification, not a pre-merge gate | NOT CONFIRMED. CI 7/7 green; no e2e gate issue; baseURL classification not stress-tested. See obs-2 above. HOLD maintained. |
  | wave-57 obs-1 | Interactive nav/rail button shipped with no onClick; gap invisible to test suite; surfaced as UX papercut | NOT CONFIRMED. Wave-59 touches no UI component; sole change is export keyword + test file. Not an exercising instance. HOLD maintained. |
  | wave-56 obs-1 | P-0 three-reviewer convergence caught seed conflating scale-independent correctness cap with premature pagination UX; YAGNI split at P-0 | NOT CONFIRMED. Wave-59 P-0 was a clean PROCEED on a minimal test-debt seed; no YAGNI challenge or scale-dependent scope at P-0. Not a confirming instance. HOLD maintained. |
  | wave-56 obs-2 | ceo-reviewer explicitly retracted its own wave-55 N-2 seed nomination; first instance of P-0 agent self-correcting a prior-wave call | NOT CONFIRMED. Wave-59 ceo-reviewer is a HOLD-SCOPE PROCEED; no prior-wave call to retract. Not a confirming instance. HOLD maintained. |
  | wave-55 obs-1 | Seed positive-only assertion redundant with existing control; load-bearing cell was the untested negative; 1st instance of false-coverage-value sub-class | NOT CONFIRMED. Wave-59 P-0 is a clean PROCEED on a correctly framed test-coverage seed. Not a confirming instance. HOLD maintained. |
  | wave-54 obs-2 | Seed premise about entire WS info-disclosure vulnerability class being open was false; P-0 collapsed sweep to verify-only | NOT CONFIRMED. Wave-59 has no security sweep; seed premise was accurate. Not a confirming instance. HOLD maintained. |
  | wave-52 obs-3 (a) | VERIFY: independently re-probe load-bearing claims at gate before accepting zero-finding verdict | CONFIRMED BY APPLICATION. Karen independently grepped and verified each load-bearing claim at source (merge tree, git show, CI run job IDs, Railway deployment API). Jenny independently traced each branch body byte-for-byte and ran vitest live (6/6). Head-verifier independently reconfirmed merge ancestry, no skip/suppress, mutation-genuine evidence (5-typer row). The behavior the proposed VERIFY rule 5 formalizes continues to occur correctly. Still no case where an unprobed zero-finding gate passed a defect through. Remains 1st-instance HOLD. |
  | wave-52 obs-3 (b) | Gate agent direct-writes to principles files | NOT CONFIRMED. No gate agent wrote directly to a principles file this wave. Remains 1st-instance HOLD. |
  | wave-50 obs-B | Parallel T-5 testers block on shared MCP Chrome profile | NOT CONFIRMED. T-5 journey regen was a no-op (non-UI wave). Remains multi-wave HOLD. |
  | wave-50 obs-C | P-4/plan review enumerate compute-on-read walk paths for new per-row parameter | NOT CONFIRMED. Wave-59 has no compute-on-read walk. Remains multi-wave HOLD. |
  | wave-49 obs-B | Socket.IO namespace mismatch invisible to mocked-both-sides unit suite; T-4.md rule 1 | NOT CONFIRMED. Wave-59 has no new socket gateway. Remains multi-wave HOLD. |
  | wave-49 obs-C | Responsive breakpoint not validated against D-3 adopted design at B-block | NOT CONFIRMED. D-block skipped (test-only; design_gap_flag false). Remains multi-wave HOLD. |
  | wave-44 obs-1 | Responsive/layout fix introduces overlay without WCAG dialog contract | NOT CONFIRMED. No layout fix or overlay. Remains multi-wave HOLD. |
  | wave-45 obs-1 | Browser resolution in committed playwright config | NOT CONFIRMED. No Playwright config change. Remains multi-wave HOLD. |
  | wave-45 obs-2 | playwright test --list false-green for browser-resolution change | NOT CONFIRMED. No Playwright config change. Remains multi-wave HOLD. |
  | wave-47 obs-C | Display-identifier vs opaque-id mismatch | NOT CONFIRMED. No component rendering user identities. Remains multi-wave HOLD. |
  | wave-41 obs-1 | V-3 redeploy false-green | NOT CONFIRMED. V-3 Phase 2 not triggered (fast-fix queue empty). Remains multi-wave HOLD. |
  | wave-41 obs-2 | Symbol-grep false-positive | NOT CONFIRMED. V-1 karen used file:line git-show inspection against deployed tree. Remains multi-wave HOLD. |
  | wave-41 obs-3 | Parallel-path enforcement gap | NOT CONFIRMED. No new parallel sibling method. Remains multi-wave HOLD. |
  | wave-40 obs-1 | T-8 fix mechanism contradicts architectural decision | NOT CONFIRMED. No T-8 security surface; wave is test + visibility-only export. Remains multi-wave HOLD. |
  | wave-40 obs-4 | Global 22P02 filter / text-keyed route params | NOT CONFIRMED. No text-keyed route params. Remains multi-wave HOLD. |

  Severity: informational (status checks only; wave-52 obs-3(a) continues to be confirmed
    by application each wave without surfacing a failure case).
  Candidate principles file: none.
  Promotion flag: NO.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | wave-58 obs-A (soft-check-hardening class) — NO-CONFIRM this wave; 1st instance only | informational | NO-CONFIRM wave-59; still 1st instance (wave-58) | VERIFY-PRINCIPLES rule 5 candidate shape | HOLD — watch for soft-check-to-hard-assert conversion causing a production-fix contingency |
| obs-2 | wave-58 obs-B (prod-baseURL e2e = post-deploy verification class) — NO-CONFIRM this wave; 1st instance only | informational | NO-CONFIRM wave-59; still 1st instance (wave-58) | CI-PRINCIPLES rule 11 candidate shape | HOLD — watch for baseURL classification being applied or missed |
| obs-3 | "Test a multi-branch pure formatter as an it.each table covering every output bucket" — clean T-1 first instance | informational | 1st instance; not found in any prior archive wave or promoted rule | T-1.md rule 1 candidate shape | HOLD — 1st instance; watch for 2nd wave where this shape recurs or a bucket is silently omitted by using separate it() calls |
| obs-4 | Sub-floor test-coverage wave resolved by wave-16 exemption / PRODUCT rule 5; 10th instance; rule functioning correctly | informational | 10th instance (waves 50-59); PRODUCT rule 5 already promoted at wave-52 | none | NO ACTION — rule 5 in force and correctly applied |
| obs-5 | Status check on prior held observations | informational | status checks | none | STATUS CHECK ONLY |

**Observations emitted: 5 (obs-1 through obs-5)**
**Severities: all informational (clean test-only tail-drainage wave; all gates APPROVED first attempt; zero findings; zero fix-up cycles; 7/7 CI green; no production logic changed)**
**Promotion-eligible this wave: NONE**
**Nominations for karen vetting: NONE this wave (all substantive observations are first-instance HOLDs or status updates)**

---

## Explicit recurrence verdicts on the two named candidates (wave-58 obs-A and obs-B)

### obs-A: "hardening a pass-regardless soft-check into a gating assertion surfaces a masked
production defect" (VERIFY-PRINCIPLES rule 5 candidate)

**Wave-59 verdict: NO-CONFIRM.**

Wave-59's sole deliverable is a brand-new `it.each` contract test on `buildTypingLabel`, a
function that has been shipping correctly since wave-45. The test adds coverage where none existed
before — it does NOT convert an existing test assertion from soft (pass-regardless) to hard
(gating). The structural prerequisite for obs-A to fire is the presence of an existing
pass-regardless check; wave-59 has no such check anywhere in its diff (2 files: a 1-token
visibility change to `useTyping.ts` and a new `useTyping.test.ts`). CI ran 7/7 green on first
attempt with no red-then-fix cycle (C-1-pr-ci-merge.md). No production defect was found,
fixed, or disclosed. The wave-58 obs-A class is not exercised by this wave in any direction
(confirming or falsifying).

HOLD maintained. Pre-shaped VERIFY-PRINCIPLES rule 5 candidate unchanged from wave-58.

---

### obs-B: "a prod-baseURL e2e is post-deploy verification, not a pre-merge gate"
(CI-PRINCIPLES rule 11 candidate)

**Wave-59 verdict: NO-CONFIRM.**

Wave-59's C-block ran cleanly: 7/7 CI checks green at C-1 including the e2e job, which ran against
deployed prod (the `export` keyword change is runtime-inert and the test file is not bundled, so
deployed prod was identical in behavior to pre-wave). No e2e-red-then-fix cycle. No scenario arose
where the production-baseURL classification of the e2e suite as non-required was relevant to merge
decisions. A confirming instance of obs-B requires a situation where an e2e red at C-1 is caused
by a pre-deploy behavioral state on prod (not by the branch under test); wave-59 had no such event.
The wave is not a falsifying instance either — the e2e running green on a behavior-inert change
provides no information about how the classification rule would behave on a behavior-changing wave.

HOLD maintained. Pre-shaped CI-PRINCIPLES rule 11 candidate unchanged from wave-58.

---

## Assessment: T-1 "transition table tested as a table" recurrence check

**Question:** Is the wave-59 "it.each TABLE over all output buckets for a multi-branch pure
formatter" pattern a 1st instance or a 2nd+-instance of something already seen in prior wave
archives or covered by a promoted rule?

**Answer: FIRST INSTANCE — HOLD.**

1. Archive grep (process/waves/_archive/**/blocks/L/observations.md) for "table.driven",
   "it.each", "transition.table", "TABLE.*test", "test.*table": results returned only the
   wave-27 "EXPLAIN test on small-seeded table needs enable_seqscan=off" class (a T-4
   Postgres planner concern about seq-scan vs index-scan on small fixture tables) and an
   unrelated wave-15 "association table" reference (an ORM join-table spec norm). Neither
   matches the T-1 pure-function multi-branch output table class. No prior L-2 observation
   records a wave where a formatter's branches were encoded as an it.each fixture table as
   a structural T-1 norm. NOT found in waves 54-58 (the mandatory 5-wave check) nor in any
   earlier wave.

2. Principles files: T-1.md has 0 rules. No existing T-1 rule addresses the "test a
   multi-branch pure function's output buckets as an it.each table" norm. No near-dup in
   BUILD-PRINCIPLES (rules 1-10), VERIFY-PRINCIPLES (rules 1-4), PRODUCT-PRINCIPLES (rules
   1-5), CI-PRINCIPLES (rules 1-10), or T-{2..9} files. test-writing §27 (T-5 entry-point
   realism) is structurally unrelated. PASS — not already covered.

3. The pattern is genuinely T-1-scoped: it addresses the internal structure of a T-1 unit
   test for a specific function shape (exhaustive multi-branch pure formatter), not an e2e
   concern, not a build or CI norm, and not a product-framing norm. T-1.md is the correct
   target if this observation is promoted.

4. Wave-59 is the FIRST time this pattern surfaced as a clean, standalone L-2-observable
   instance. Carry to a second wave for confirmation.
