# Wave 61 — L-block observations ledger

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read: process/waves/wave-61/stages/ full artifact set (P-0-frame, P-0-problem-framer,
P-0-ceo-reviewer, P-0-mvp-thinner, P-1-decompose, P-2-spec, P-3-plan, P-4-gemini-review,
B-0-branch-and-schema, B-2-backend, B-3-frontend, B-4-wiring, B-5-verify, B-6-review-output,
C-1-pr-ci-merge, C-2-deploy-and-verify, T-8-security, T-9-journey, V-1-karen, V-1-jenny,
V-1-summary, V-2-triage, V-3-fast-fix).
Gate verdicts checked: process/waves/wave-61/blocks/{P,B,C,T,V}/gate-verdict.md (all five gates
APPROVED; zero findings across all blocks; V-2 triage empty; V-3 fast-fix queue empty).
Prior archives consulted: process/waves/_archive/wave-{56,57,58,59,60}/blocks/L/observations.md
(recurrence checks on false-root-cause-at-P-0 class, soft-check-hardening class, prod-baseURL e2e
class, dead-onClick class, YAGNI/premature-scope class, and all prior held HOLDs).
Also consulted: process/waves/_archive/wave-54/blocks/L/observations.md (wave-54 obs-2 conclusion
that PRODUCT-PRINCIPLES rule 1 already covers premise-falsification at P-0 including security and
code-entity variants; wave-54 obs-2 explicitly concluded "this is therefore logged as a FIRST
INSTANCE of the security-class-premise-falsification variant, with a note that rule 1 already
partially covers it").
Principles files read: PRODUCT-PRINCIPLES.md (5 rules), BUILD-PRINCIPLES.md (10 rules),
CI-PRINCIPLES.md (10 rules), VERIFY-PRINCIPLES.md (4 rules); T-layer principles files consulted
to confirm no existing rule covers the relevant candidates.

---

- **[obs-1 — CONFIRMED-BY-APPLICATION of PRODUCT-PRINCIPLES rules #1 and #2: seed hypothesized a
  false root cause (two throttle buckets to align); P-0 code-inspection falsified it; corrected
  framing resolved at P-0 before spec was written]**

  The wave-61 seed (874bd233) identified the symptom correctly (DM read-path 429s on legitimate
  page-load bursts) but named a fabricated root cause: it claimed `/dm/candidates` had its own
  ~4/burst throttle bucket distinct from `/dm/conversations`. P-0 problem-framer inspected the
  actual code before accepting the premise. Code showed exactly ONE global throttler
  (ThrottlerModule.forRoot at limit:10 / ttl:60s per IP in apps/api/src/app.module.ts:30-35,
  wired as APP_GUARD across all routes), with NO @Throttle override on any DM controller route.
  There were no "two buckets to align" — the proposed fix would have changed nothing. The
  problem-framer issued a REFRAME verdict (round 1), then after the framing was corrected issued
  PROCEED (round 2). The corrected framing — shared bucket exhaustion; fix via a bounded per-route
  @Throttle override following the users.controller.ts:62 precedent — was what actually shipped.

  Source artifacts:
  - process/waves/wave-61/stages/P-0-problem-framer.md (round 1: verdict REFRAME,
    matched_antipatterns [1, 2], "the seed's central hypothesis...is factually contradicted
    by the code. There is exactly ONE throttler"; round 2: verdict PROCEED, "cause now
    correctly named")
  - process/waves/wave-61/stages/P-0-frame.md (Reframe section: "the seed's central hypothesis
    — that /dm/candidates carries its own ~4/burst throttle bucket — is factually contradicted
    by the code"; "CORRECTED framing (problem-framer round-2 PROCEED)")
  - process/waves/wave-61/blocks/P/gate-verdict.md (Phase 1 Rationale: "The seed's original
    'two buckets to align' premise was wrong; the P-0 problem-framer REFRAME→round-2 PROCEED
    correctly re-grounded it")

  Coverage assessment: PRODUCT-PRINCIPLES rule 1 states "Verify every seed claim about what
  exists or is absent in the code at P-0; decomposer prose drifts both ways." Rule 2 states
  "Verify at P-0 that the seed's named entity is the real cost source or output boundary, not
  merely that it exists." The wave-61 instance is a clean, direct application of both rules
  simultaneously: the seed's named entity (a per-route DM throttle config) was verified absent
  (rule 1 — false-present), and the real cost source was correctly identified as the global
  APP_GUARD bucket (rule 2 — wrong entity). Wave-54 obs-2 reached the identical conclusion about
  a structurally similar REFRAME: "PRODUCT-PRINCIPLES rule 1 already encodes the core lesson."
  No new rule is needed or warranted.

  Severity: informational (the system worked as designed; rules 1 and 2 fired at P-0, produced the
    correct REFRAME verdict, and the corrected framing shipped successfully; zero B-block rework;
    all gates APPROVED first attempt).
  Candidate principles file: none — PRODUCT-PRINCIPLES rules #1 and #2 already cover this class.
  Recurrence verdict: CONFIRMED-BY-APPLICATION of existing rules #1 and #2 (wave-54 obs-2 also
    confirmed this class is within rule 1's scope; wave-61 is a second clean application). NOT a
    new promotable rule — the mechanism is already canon.
  Promotion flag: none — existing rules apply; no new rule warranted.

---

- **[obs-2 — HOLD UPDATE (wave-58 obs-1, 1st instance): hardening a pass-regardless soft-check
  into a gating assertion surfaces a masked production defect — NO-CONFIRM this wave; HOLD
  maintained]**

  Wave-58 obs-1 (FIRST INSTANCE) documented: when a pass-regardless soft-check is converted to a
  gating hard assertion, the first honest CI run may gate red because a pre-existing production
  defect previously concealed by the softness is now exposed. The pre-shaped VERIFY-PRINCIPLES
  rule 5 candidate is held pending a confirming wave.

  Wave-61 assessment: this wave makes no changes to any test or assertion. The entire scope is a
  per-route @Throttle decorator on 3 backend GET handlers and a bounded fetch-retry wrapper on 3
  frontend read calls. No existing soft-check was converted; no new test was added. CI ran 7/7 green
  on first attempt. V-2 triage was empty; no production defect was found or fixed. The structural
  prerequisite for obs-A to fire (an existing pass-regardless check being converted to a hard
  assertion) is entirely absent from this wave's diff.

  Determination: NOT CONFIRMED. Wave-61 is not a confirming instance of the wave-58 obs-A class.

  Source artifacts: C-1-pr-ci-merge.md (7/7 CI green), V-2-triage.md (empty fast-fix queue),
  V-1-karen.md (zero findings at any severity), V-1-jenny.md (no spec drift, no spec gap).

  Candidate rule shape preserved from wave-58 (NOT a nomination — still 1st instance only):
    "5. When converting a pass-regardless soft-check to a gating assertion, budget a production fix;
       surfacing the masked defect is the expected outcome."
    Rule = 104 chars. PASS. Why = "A soft-check that passes regardless hides whether the behavior
    works; the first honest run may gate red." Why with indent = 97 chars. PASS.
    No forbidden tokens. Not a near-dup of VERIFY rules 1-4. PASS.

  Severity: informational (status update; wave structure orthogonal to the class being watched).
  Candidate principles file: command-center/principles/VERIFY-PRINCIPLES.md (rule 5 candidate).
  Recurrence verdict: NO-CONFIRM this wave. Still FIRST INSTANCE (wave-58 only). HOLD maintained.
  Promotion flag: HOLD — 1st instance; watch for a wave where a pass-regardless check is converted
    to a gating assertion and triggers a production-fix contingency.

---

- **[obs-3 — HOLD UPDATE (wave-58 obs-2, 1st instance): a prod-baseURL e2e is post-deploy
  verification, not a pre-merge gate — NO-CONFIRM this wave; HOLD maintained]**

  Wave-58 obs-2 (FIRST INSTANCE) documented: a Playwright suite whose baseURL targets the live
  production URL is a post-deploy verification instrument; marking it required in CI would block the
  branch fix that resolves the failing e2e.

  Wave-61 assessment: CI ran 7/7 green including the e2e check (C-1-pr-ci-merge.md confirms all
  checks passed). The wave's behavioral change is a rate-limit ceiling raise + client fetch-retry
  wrapper. Neither the merge-time prod binary nor the deployed post-merge binary produced an e2e
  failure that would have stressed the baseURL classification. No e2e-red-then-fix cycle occurred;
  no situation arose where the production-baseURL classification was decision-relevant.

  Determination: NOT CONFIRMED. Wave-61 is not a confirming or falsifying instance of the wave-58
  obs-B class. The wave's clean CI run does not exercise the classification distinction.

  Source artifacts: C-1-pr-ci-merge.md (7/7 CI green), C-2-deploy-and-verify.md (api+web SUCCESS).

  Candidate rule shape preserved from wave-58 (NOT a nomination — still 1st instance only):
    "11. Classify an e2e suite whose baseURL targets deployed prod as non-required in CI; it is
       post-deploy verification, not a pre-merge gate."
    Rule = 113 chars. PASS. Why = "A production-baseURL e2e tests the deployed binary, not the
    branch; gating merge on it blocks the fix." Why with indent = 99 chars. PASS.
    No forbidden tokens. Not a near-dup of CI rules 1-10. PASS.

  Severity: informational (status update; wave structure orthogonal to the class).
  Candidate principles file: command-center/principles/CI-PRINCIPLES.md (rule 11 candidate).
  Recurrence verdict: NO-CONFIRM this wave. Still FIRST INSTANCE (wave-58 only). HOLD maintained.
  Promotion flag: HOLD — 1st instance; watch for a wave where baseURL = prod classification is
    applied correctly or missed.

---

- **[obs-4 — HOLD UPDATE (wave-59 obs-3, 1st instance): test a multi-branch pure-formatter as a
  single it.each table covering every output bucket — NO-CONFIRM this wave; HOLD maintained]**

  Wave-59 obs-3 (FIRST INSTANCE) documented: for an exhaustive multi-branch pure formatter, a
  single it.each table covering every output bucket is the correct T-1 unit shape; a row per bucket
  makes any single-branch drift fail deterministically. T-1.md currently has 0 rules.

  Wave-61 assessment: this wave adds no unit tests and no pure-function formatters. The diff is
  entirely a NestJS @Throttle decorator on 3 existing GET handlers and a fetch-retry utility in the
  web client. No new multi-branch pure function was introduced; no existing one was tested. Wave-61
  does not exercise the T-1 it.each-table-per-bucket pattern in any direction.

  Determination: NOT CONFIRMED. Wave-61 is not a confirming instance of wave-59 obs-3.

  Source artifacts: V-1-jenny.md (design_gap_flag=false; no route/screen delta; no new test files
  beyond retryOn429.test.ts, which tests async retry logic not a pure formatter), V-1-karen.md
  (3 changed files: dm.controller.ts, api.ts, retryOn429.ts; no branch-formatter coverage issue).

  Candidate rule shape preserved from wave-59 (NOT a nomination — still 1st instance only):
    "1. Test a multi-branch pure formatter with a single it.each table covering every output
       bucket; add one row per boundary transition."
    Rule = 97 chars. PASS. Why = "A table makes a missing bucket visible as a missing row; N
    separate it() calls can omit a bucket silently." Why with indent = 97 chars. PASS.
    No forbidden tokens. Not a near-dup. PASS.

  Severity: informational (status update; wave structure orthogonal to the class).
  Candidate principles file: command-center/principles/test-layer-principles/T-1.md (rule 1
    candidate — T-1.md currently has 0 rules).
  Recurrence verdict: NO-CONFIRM this wave. Still FIRST INSTANCE (wave-59 only). HOLD maintained.
  Promotion flag: HOLD — 1st instance; watch for a second wave where a multi-branch pure formatter
    is tested with an it.each table or where a missing bucket is omitted by N separate it() calls.

---

- **[obs-5 — status check on prior held observations]**

  Updating carried status from wave-60 obs-6 and all prior HOLDs:

  | origin | obs | class | wave-61 status |
  |--------|-----|-------|----------------|
  | wave-60 obs-1 | Hardcoded palette hex in 45 web-shell .tsx files where consumable CSS tokens exist; shade drift is documented cost; token-consumption antipattern (STRONG HOLD per karen ruling: REJECT/HOLD pending token-migration wave + correct file target) | NOT CONFIRMED. Wave-61 is a backend throttle config + client fetch-retry wave; no .tsx component edits; no hex-literal or CSS token changes. Not a confirming instance. HOLD maintained. |
  | wave-58 obs-1 / obs-A | Hardening a pass-regardless soft-check into a gating assertion exposes a masked production defect | NOT CONFIRMED. No test changes; no assertion conversions; CI 7/7 green. See obs-2 above. HOLD maintained. |
  | wave-58 obs-2 / obs-B | Prod-baseURL e2e is post-deploy verification, not a pre-merge gate | NOT CONFIRMED. CI 7/7 green; classification not stress-tested. See obs-3 above. HOLD maintained. |
  | wave-59 obs-3 | Test a multi-branch pure formatter as an it.each table covering every output bucket | NOT CONFIRMED. No pure-formatter introduced or tested. See obs-4 above. HOLD maintained. |
  | wave-57 obs-1 | Interactive nav/rail button shipped with no onClick from a prior wave; gap invisible to tests; surfaced as UX papercut | NOT CONFIRMED. Wave-61 makes no UI component changes; no onClick gap introduced or fixed. Not a confirming instance. HOLD maintained. |
  | wave-56 obs-1 | P-0 three-reviewer convergence caught seed conflating scale-independent correctness cap with premature pagination UX; YAGNI split at P-0 | NOT CONFIRMED. Wave-61 P-0 was a REFRAME on a false-root-cause premise, not a YAGNI/scale-dependent UX bundling. Structurally distinct class. HOLD maintained. |
  | wave-56 obs-2 | ceo-reviewer explicitly retracted its own prior-wave N-2 seed nomination | NOT CONFIRMED. Wave-61 ceo-reviewer output is HOLD-SCOPE PROCEED; no prior-wave call to retract. Not a confirming instance. HOLD maintained. |
  | wave-55 obs-1 | Seed positive-only assertion redundant with existing control; load-bearing cell was the untested negative; 1st instance of false-coverage-value sub-class | NOT CONFIRMED. Wave-61 P-0 is a root-cause falsification, not a coverage-value claim. Not a confirming instance. HOLD maintained. |
  | wave-54 obs-2 | Seed premise about entire WS info-disclosure vulnerability class being open was false; P-0 collapsed sweep to verify-only | NOT CONFIRMED as a second instance of the security-class variant. Wave-61 is a throttle-config P-0 falsification (false-root-cause), not a security-class-sweep-status falsification. Structurally adjacent but in a distinct variant class. Remains 1st-instance HOLD for the security-class variant specifically. |
  | wave-52 obs-3 (a) | VERIFY: independently re-probe load-bearing claims at gate before accepting zero-finding verdict | CONFIRMED BY APPLICATION. Karen independently verified all 5 load-bearing claims at exact source lines (dm.controller.ts:93/141/182 for @Throttle literal 60, writes unchecked, no @SkipThrottle; api.ts:759/781/788 for retryOn429 wrap sites; api.ts:746/769 for write call-sites bare; deploy hash e0e842e confirmed). Jenny independently verified AC-by-AC with live-vs-code evidence split (4 ACs live; AC5 code+unit). Head-verifier independently confirmed convergence. Behavior continues correctly. Remains 1st-instance HOLD for VERIFY-PRINCIPLES rule 5 candidate. |
  | wave-52 obs-3 (b) | Gate agent direct-writes to principles files | NOT CONFIRMED. No gate agent wrote directly to a principles file this wave. Remains 1st-instance HOLD. |
  | wave-50 obs-B | Parallel T-5 testers block on shared MCP Chrome profile | NOT CONFIRMED. T-5 not separately invoked as a parallel Playwright swarm; T-8 used a single Playwright session. Remains multi-wave HOLD. |
  | wave-50 obs-C | P-4/plan review enumerate compute-on-read walk paths for new per-row parameter | NOT CONFIRMED. No compute-on-read walk; wave is throttle decorator + client fetch-retry only. Remains multi-wave HOLD. |
  | wave-49 obs-B | Socket.IO namespace mismatch invisible to mocked-both-sides unit suite; T-4.md rule 1 | NOT CONFIRMED. Wave-61 has no new Socket.IO gateway. Remains multi-wave HOLD. |
  | wave-49 obs-C | Responsive breakpoint not validated against D-3 adopted design at B-block | NOT CONFIRMED. D-block skipped (design_gap_flag false; backend throttle + client retry, no new surface). Remains multi-wave HOLD. |
  | wave-44 obs-1 | Responsive/layout fix introduces overlay without WCAG dialog contract | NOT CONFIRMED. No layout fix or overlay. Remains multi-wave HOLD. |
  | wave-45 obs-1 | Browser resolution in committed playwright config | NOT CONFIRMED. No Playwright config change. Remains multi-wave HOLD. |
  | wave-45 obs-2 | playwright test --list false-green for browser-resolution change | NOT CONFIRMED. No Playwright config change. Remains multi-wave HOLD. |
  | wave-47 obs-C | Display-identifier vs opaque-id mismatch | NOT CONFIRMED. No component rendering user identities. Remains multi-wave HOLD. |
  | wave-41 obs-1 | V-3 redeploy false-green | NOT CONFIRMED. V-3 Phase 2 not triggered (fast-fix queue empty). Remains multi-wave HOLD. |
  | wave-41 obs-2 | Symbol-grep false-positive | NOT CONFIRMED. V-1 karen used file:line inspection against deployed tree at e0e842e. Remains multi-wave HOLD. |
  | wave-41 obs-3 | Parallel-path enforcement gap | NOT CONFIRMED. No new parallel sibling method. Remains multi-wave HOLD. |
  | wave-40 obs-1 | T-8 fix mechanism contradicts architectural decision | NOT CONFIRMED. No architectural conflict; wave is a narrowly scoped rate-limit + backoff fix with established in-repo precedent. Remains multi-wave HOLD. |
  | wave-40 obs-4 | Global 22P02 filter / text-keyed route params | NOT CONFIRMED. No text-keyed route params. Remains multi-wave HOLD. |

  Severity: informational (status checks only; wave-52 obs-3(a) continues confirmed by application
    each wave without a failure case surfacing).
  Candidate principles file: none.
  Promotion flag: NO.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Seed hypothesized fabricated root cause (two throttle buckets); P-0 code-inspection falsified it; corrected framing resolved at P-0 before spec; both PRODUCT rules #1 and #2 applied correctly | informational | CONFIRMED-BY-APPLICATION of PRODUCT-PRINCIPLES rules #1 and #2 (wave-54 obs-2 reached same conclusion for analogous REFRAME class; wave-61 is a second clean application) | none — rules #1 and #2 already in force | none — existing rules cover the class; not a new promotable rule |
| obs-2 | wave-58 obs-A (soft-check-hardening class) — NO-CONFIRM this wave; 1st instance only (wave-58) | informational | NO-CONFIRM wave-61; still 1st instance | VERIFY-PRINCIPLES rule 5 candidate shape | HOLD |
| obs-3 | wave-58 obs-B (prod-baseURL e2e = post-deploy verification class) — NO-CONFIRM this wave; 1st instance only (wave-58) | informational | NO-CONFIRM wave-61; still 1st instance | CI-PRINCIPLES rule 11 candidate shape | HOLD |
| obs-4 | wave-59 obs-3 (T-1 it.each-table-per-bucket class) — NO-CONFIRM this wave; 1st instance only (wave-59) | informational | NO-CONFIRM wave-61; still 1st instance | T-1.md rule 1 candidate shape | HOLD |
| obs-5 | Status check on prior held observations | informational | status checks | none | STATUS CHECK ONLY |

**Observations emitted: 5 (obs-1 through obs-5)**
**Severities: all informational (clean correctness-fix wave; P-0 REFRAME resolved before spec; all gates APPROVED first attempt; T-8 LIVE probe PASS; zero findings; zero fix-up cycles)**
**Promotion-eligible this wave: NONE**
**Nominations for karen vetting: NONE this wave**

---

## Explicit recurrence verdict on the key candidate per brief

**Question:** Does wave-61's P-0 REFRAME (seed's hypothesized root cause was factually wrong; code
inspection falsified it; corrected framing resolved before spec) constitute a new promotable lesson,
or is it CONFIRMED-BY-APPLICATION of existing PRODUCT-PRINCIPLES rules #1 and #2?

**Answer: CONFIRMED-BY-APPLICATION of existing rules — NOT a new promotable rule.**

1. PRODUCT-PRINCIPLES rule 1 states "Verify every seed claim about what exists or is absent in the
   code at P-0." The wave-61 seed claimed a per-route DM throttle config existed for /dm/candidates
   (false-present claim). The problem-framer verified this was absent in code — exactly the mechanism
   rule 1 encodes. Rule 1 fires directly.

2. PRODUCT-PRINCIPLES rule 2 states "Verify at P-0 that the seed's named entity is the real cost
   source or output boundary, not merely that it exists." The seed named the (non-existent)
   per-route DM throttle config as the cost source. The real cost source was the single global
   APP_GUARD ThrottlerModule bucket. Rule 2 fires directly.

3. Wave-54 obs-2 reached the same conclusion for an analogous REFRAME (false premise about a
   vulnerability class being open): "PRODUCT-PRINCIPLES rule 1 already encodes the core lesson
   ('Verify every seed claim about what exists or is absent in the code at P-0')." The obs-2 entry
   explicitly noted this is "a FIRST INSTANCE of the security-class-premise-falsification variant,
   with a note that rule 1 already partially covers it." Wave-61 is not even the security-class
   variant — it is a plain false-root-cause-entity claim, which is the core class rules #1 and #2
   were promoted to cover.

4. The lesson "confirm the seed's hypothesized root cause in code before speccing the fix" is NOT
   a gap not covered by existing rules — it is a direct restatement of rules #1 and #2 combined.
   Promoting a new rule would be a near-duplicate of both, which the Contract for new rules
   explicitly prohibits ("Before adding: grep for the concept; do not add a near-dup").

5. The correct observation is: the rules are working. The system caught a false-root-cause premise
   at P-0 and corrected it before any speculative build scope was authored. This is the expected
   behavior of rules #1 and #2 in force. No gap exists; no new rule is warranted.

**Recurrence verdict: CONFIRMED-BY-APPLICATION. The wave-61 REFRAME instance is a clean, documented
second application of PRODUCT-PRINCIPLES rules #1 and #2 (wave-54 obs-2 is the first documented
application of this observation class). No new observation is held; no promotion is flagged.**
