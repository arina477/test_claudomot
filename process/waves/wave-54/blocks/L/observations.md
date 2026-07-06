# Wave 54 — L-block observations ledger

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read: process/waves/wave-54/stages/ full artifact set (P-0-frame, P-0-problem-framer,
P-0-ceo-reviewer, P-0-mvp-thinner, P-1-decompose, P-2-spec, P-3-plan, B-0-branch-and-schema,
B-1-contracts, B-2-backend, B-4-wiring, B-5-verify, B-6-review, B-6-review-output, C-1-pr-ci-merge,
C-2-deploy-and-verify, T-1-static, T-2-unit, T-3-contract, T-4-integration, T-5-e2e, T-6-layout,
T-7-perf, T-8-security, T-8-evidence/pentest-report.md, T-9-journey, V-1-karen, V-1-jenny,
V-1-summary, V-2-triage, V-3-fast-fix).
Gate verdicts checked: process/waves/wave-54/blocks/{P,B,T,V}/gate-verdict.md (none found at
those paths — wave-54 gate verdicts are embedded in stage files per V-3-fast-fix and V-1 APPROVE).
Prior archives consulted: process/waves/_archive/wave-{49,50,51,52,53}/blocks/L/observations.md
(recurrence checks on branch-hygiene, premise-falsification at P-0, T-8 live-socket verification,
and all prior held HOLDs as carried forward in wave-53 obs-4).
Principles files read: CI-PRINCIPLES.md (9 rules), BUILD-PRINCIPLES.md (10 rules),
PRODUCT-PRINCIPLES.md (5 rules), VERIFY-PRINCIPLES.md (4 rules), T-5.md (3 rules), T-8.md (2 rules).

---

- **[obs-1 — SECOND INSTANCE: branch created from local main carrying unpushed process/principle
  commits; squash-merge again bundled non-code content with the code change]**

  The wave-54 branch `wave-54-ws-error-regression-lock` was created before all wave-53 + wave-54
  P/B process commits had been pushed to origin/main. The squash-merge at C-1 produced
  `97c8e99059f3a0488aeca0837951141b918ad2a5`, which bundled the WS regression-lock production code
  together with wave-54 P/B process files (P-0-frame, P-0-problem-framer, P-3-plan, B-2-backend,
  etc.). The C-1 artifact records this explicitly: "branch-hygiene — squash again bundled P/B
  process + code (branched before pushing main process commits). 2nd instance (wave-53+54) →
  L-2 promotion candidate."

  The structural pattern is identical to wave-53 obs-1: process/principle/archive commits
  accumulate on local main between the prior N-3 close and the push to origin; if the new wave
  branches before that push, the carried-in commits ride into the branch history and land together
  in the squash. No data is lost and CI passes — the squash bundle contains everything that should
  be on main, just mixed together rather than separated. The hygiene cost is: the squash commit's
  diff is harder to read in code review (mixes process docs with production code), and the local
  main requires a `git reset --hard origin/main` after merge.

  Recurrence confirmation: wave-53 obs-1 is the explicit first instance — same structural class,
  same trigger (branching before pushing accumulated main-side commits), same consequence (squash
  bundles process commits with code). The C-1 stage file for wave-54 itself identifies this as the
  "2nd instance (wave-53+54)." The class is not coincidental: the wave-loop mechanics generate this
  pattern whenever N-3 writes process files to local main and the worker proceeds to branch without
  an intervening push.

  The mitigation remains the same: push main to origin immediately after N-3 closes, before
  creating the next wave's feature branch. Or: accept the bundled squash as benign when it occurs
  (all content lands correctly).

  Near-dup check against BUILD-PRINCIPLES: BUILD rule 2 ("Push the branch to origin after every
  B-block and D-block stage before starting the next stage") addresses a different gap —
  unpushed work on a feature branch being lost on worker restart. It does not address pushing main
  to origin before creating the next feature branch. The candidate rule would be a companion
  (different obligation, different actor, different timing). Not a near-dup.

  Near-dup check against CI-PRINCIPLES: no existing rule covers this merge-hygiene class. CI rules
  address deploy verification, PR CI gate mechanics, and Railway-specific deploy checks. Not a
  near-dup.

  Source artifacts:
  - process/waves/wave-54/stages/C-1-pr-ci-merge.md (note: "branch-hygiene — squash again
    bundled P/B process + code (branched before pushing main process commits). 2nd instance
    (wave-53+54) → L-2 promotion candidate.")
  - process/waves/_archive/wave-53/blocks/L/observations.md (obs-1 — 1st instance; same
    structural class; "HOLD — 1st instance; watch for 2nd wave")

  Severity: informational (no data lost; CI green; correct outcome; but adds per-wave confusion
  to the squash commit's readable diff and requires a post-merge reset --hard).
  Candidate principles file: command-center/principles/CI-PRINCIPLES.md (rule 10 candidate —
  git-workflow/merge discipline; CI-PRINCIPLES has no dedicated H2 for this but has 9 rules + a
  Contract-for-new-rules header; the class is a CI/merge-workflow discipline, not a build
  implementation gap, so CI-PRINCIPLES is a better home than BUILD-PRINCIPLES).
  Candidate rule shape (pre-shaped for linter awareness, NOT a nomination):
    "10. Push main to origin immediately after N-3 closes, before creating the next wave branch."
    Rule line = 79 chars. PASS (<=120).
    "   Why: An unpushed main lets process commits ride into the next wave's squash, mixing non-code with code."
    Why line WITH 3-space indent = 104 chars. OVER (>100). Trim:
    "   Why: An unpushed main lets process commits ride into the next wave's squash."
    Why line WITH 3-space indent = 79 chars. PASS (<=100).
    No forbidden tokens (no `we`, `our`, `the team`, `wave-<N>`, em-dash). PASS.
    Near-dup check vs CI rules 1-9: none address main-branch-push-before-branching. Not a near-dup.
  Recurrence: SECOND INSTANCE (wave-53 obs-1 first; wave-54 second — same structural class, both
    confirmed by the C-1 stage file's explicit note). 2-wave bar met.
  Promotion flag: PROMOTION-ELIGIBLE — 2-wave bar met; generalizable (any squash-merge workflow
    where N-3 writes files to local main); falsifiable (checkable: does the C-1 squash commit
    contain only production code, or does it also carry process/principle/archive files?); cited
    (C-1-pr-ci-merge.md both waves, wave-53 obs-1).

---

- **[obs-2 — FIRST INSTANCE: seed premise about an entire vulnerability class being open was false;
  P-0 code-verification collapsed the sweep to verify-only]**

  The wave-54 seed `c52a7a52` was framed as an "app-wide sweep — apply the wave-53 isUuid guard
  to all remaining client-id → uuid-cast sites that may leak raw Drizzle errors." The seed's
  operative premise was that the info-disclosure class was still open at study-timer, messaging,
  and potentially other gateways.

  The problem-framer executed a REFRAME (verdict: REFRAME, matched_antipatterns: [1, 7]) after
  directly verifying the code: the 22P02-to-client leak class was already CLOSED. The wave-53
  fix's load-bearing mechanism was `safeErrorMessage` (catching raw `err.message` forwarding),
  not `isUuid` (defense-in-depth). The two "candidate gap" gateways — study-timer.gateway.ts:189
  and messaging.gateway.ts:133 — already emitted hard-coded literal strings from their catch
  blocks and never forwarded `err.message` to clients. A full grep for the actual leak signature
  returned only the study-room site, already fixed. Gap count: zero, not "2-3 gateways."

  The reframe redirected the wave from a multi-file fix sweep (antipattern #7 validation theater)
  to a verify-only regression-lock: prove the class is closed, don't re-guard against a leak that
  does not exist. This is a structurally different variant of premise-falsification from the
  PRODUCT-PRINCIPLES rule 1 class. Rule 1 encodes: "Verify every seed claim about what exists or
  is absent in the code at P-0." The wave-54 instance extends that: the false premise was not
  about the presence/absence of a code entity (a function, a guard, an endpoint), but about the
  open/closed status of an entire vulnerability class. The P-0 check prevented execution of a
  sweep that would have produced green tests against non-existent gaps — validation theater with
  real LOC and PR cost.

  Recurrence check: searched all prior wave L-2 observations and P-0-problem-framer files across
  the archive for prior instances of a seed premise about a vulnerability class being open being
  falsified by P-0 code inspection. Relevant cases found:

  - wave-38 obs (from wave-38 P-0-problem-framer.md): FALSE-ABSENT premise — server-side 2MB
    avatar enforcement claimed missing, already implemented. The wave became verify-only.
    Structural class: same (false premise about absence of a shipped behavior → sweep becomes
    verify-only). However, wave-38 was captured at wave-38's L-2 as a confirming application of
    PRODUCT-PRINCIPLES rule 1 (the rule was promoted after wave-20), not as a new first-instance
    observation. The wave-38 case supports rule 1's coverage of the false-absent variant.

  - wave-54 (this wave): FALSE class-status premise — vulnerability class claimed open, already
    closed. Structural class: similar (false "gap" claim → sweep becomes verify-only), but the
    scope is a security vulnerability class, not a specific code feature. The specific antipattern
    (#7 validation theater, in addition to #1) is new: the sweep would have produced redundant
    guards that test nothing real, not just redundant code that reimplements shipped logic.

  Assessment: PRODUCT-PRINCIPLES rule 1 already encodes the core lesson ("Verify every seed claim
  about what exists or is absent in the code at P-0"). The wave-54 instance is an application of
  that rule, extended to a security-class-level claim rather than a feature-presence claim. It is
  not a new structural gap but a variant. The addition of antipattern #7 (validation theater) as a
  co-matched pattern is wave-54-specific color. This does not constitute a second instance of a
  new pattern class distinct from rule 1 — it confirms rule 1's breadth applies to security-class
  claims, not only feature-presence claims.

  This is therefore logged as a FIRST INSTANCE of the security-class-premise-falsification variant,
  with a note that rule 1 already partially covers it. A second wave where a security sweep's
  premise is falsified at P-0 (distinct from general false-present/false-absent code-entity claims)
  would strengthen a candidate that distinguishes the security-class variant explicitly.

  Source artifacts:
  - process/waves/wave-54/stages/P-0-problem-framer.md (verdict: REFRAME; matched_antipatterns:
    [1, 7]; "the wave-53 leak's load-bearing fix was safeErrorMessage, NOT isUuid"; "The
    info-disclosure class is ALREADY CLOSED — zero remaining leaking sites.")
  - process/waves/wave-54/stages/P-0-frame.md (Reframe section: "validated theater (#7):
    it guards against a leak that the existing literal-string catch blocks already prevent";
    "The 'app-wide guard sweep' framing does NOT survive — no leaking sites exist to guard.")

  Severity: informational (no production consequence; the reframe was resolved at P-0 before any
  sweep was implemented; the wave shipped as verify-only, which was the correct scope).
  Candidate principles file: none at this time — PRODUCT-PRINCIPLES rule 1 already encodes the
  core lesson; a distinguishing rule for the security-class variant would require a second
  confirming instance before it is meaningful.
  Recurrence: FIRST INSTANCE of the security-class-level premise-falsification variant. Rule 1
    covers the parent class; this is a first-instance child. HOLD.
  Promotion flag: HOLD — 1st instance of the security-class variant; rule 1 provides partial
    coverage; promote a distinguishing rule on 2nd confirming wave where a security sweep's
    class-level premise is falsified at P-0 and the reframe collapses a sweep to verify-only.

---

- **[obs-3 — status check on prior held observations]**

  Updating the carried status from wave-53 obs-4 and all prior waves:

  | origin | obs | class | wave-54 status |
  |--------|-----|-------|----------------|
  | wave-53 obs-1 | Branch created from unpushed local main; squash bundled process/principle commits with code fix | CONFIRMED — SECOND INSTANCE. See obs-1 above. C-1-pr-ci-merge.md explicitly records "2nd instance (wave-53+54)." Promotion-eligible on 2-wave bar. |
  | wave-53 obs-2 | REST-layer pg-error utility reused at WS gateway layer; no duplicate detection logic | NOT CONFIRMED (different axis). Wave-54's WS error hardening did NOT introduce a new pg-error-util reuse; the production change was a string constant swap. The isUuid/safeErrorMessage approach from wave-53 was deliberately NOT extended (B dropped per P-0 reframe). Remains 1st-instance HOLD. |
  | wave-53 obs-3 | T-8 drove real authenticated live socket probe to verify WS error-path fix; distinct from T-5 rule 3 | CONFIRMED — SECOND INSTANCE. Wave-54 T-8 drove 5/5 live authenticated Socket.IO probes on prod (97c8e99), verifying the regression-lock at study-timer and messaging namespaces. This is pattern B (active), exactly the fix-verification-via-live-socket class wave-53 obs-3 described. The wave-54 probe verified the WS_GENERIC_ERROR constant is live, authz denials are PRESERVED (Forbidden: strings intact), and no leak tokens surface on malformed input — all against a real live socket connection, not a unit assertion. |
  | wave-52 obs-3 (a) | VERIFY: independently re-probe load-bearing claims at gate before accepting zero-finding verdict | CONFIRMED BY APPLICATION. V-1 karen independently grepped all 7 load-bearing claims (ws-errors.ts, both gateway swap sites, 3 spec files) against the deployed tree at 97c8e99. V-1 jenny independently re-derived the deployed-vs-tree drift check rather than trusting T-8's code-path corroboration. Both reviewers probed claims directly — the behavior the proposed VERIFY rule 5 formalizes. Not a second failure instance (still no case where an unprobed clean verdict passed a defect through); remains 1st-instance HOLD. |
  | wave-52 obs-3 (b) | Gate agent direct-writes to principles files | NOT CONFIRMED. No gate agent wrote to principles files this wave. Remains 1st-instance HOLD. |
  | wave-49 obs-B | Socket.IO namespace mismatch invisible to mocked-both-sides tests; T-4.md rule 1 | NOT CONFIRMED. Wave-54 is a test-addition-only wave on existing gateways; no new namespace introduced. Remains 5-wave HOLD. |
  | wave-49 obs-C | Responsive breakpoint not validated against D-3 adopted design at B-block | NOT CONFIRMED. D-block skipped (no UI changes; test + string-constant only). Remains 5-wave HOLD. |
  | wave-50 obs-B | Parallel T-5 testers block on shared MCP Chrome profile | NOT CONFIRMED. T-5 scope was trivial (no UI changes; skipped in substance). Remains 4-wave HOLD. |
  | wave-50 obs-C | P-4/plan review enumerate compute-on-read walk paths for new per-row parameter | NOT CONFIRMED. No compute-on-read walk; wave is test/string-constant only. Remains 4-wave HOLD. |
  | wave-44 obs-1 | Responsive/layout fix introduces overlay without WCAG dialog contract | NOT CONFIRMED. No layout fix or overlay. Remains 10-wave HOLD. |
  | wave-45 obs-1 | Browser resolution in committed playwright config | NOT CONFIRMED. No Playwright config change; T-5 skipped substance. Remains 9-wave HOLD. |
  | wave-45 obs-2 | `playwright test --list` false-green for browser-resolution change | NOT CONFIRMED. No Playwright config change. Remains 9-wave HOLD. |
  | wave-47 obs-C | Display-identifier vs opaque-id mismatch | NOT CONFIRMED. No component rendering user identities. Remains 7-wave HOLD. |
  | wave-41 obs-1 | V-3 redeploy false-green | NOT CONFIRMED. V-3 Phase 2 not triggered (fast-fix queue empty). Remains 13-wave HOLD. |
  | wave-41 obs-2 | Symbol-grep false-positive | NOT CONFIRMED. V-1 karen used file:line git-show inspection against deployed tree. Remains 13-wave HOLD. |
  | wave-41 obs-3 | Parallel-path enforcement gap | NOT CONFIRMED. No new parallel sibling method. Remains 13-wave HOLD. |
  | wave-40 obs-1 | T-8 fix mechanism contradicts architectural decision | NOT CONFIRMED. No architectural conflict; wave is verify-only. Remains 14-wave HOLD. |
  | wave-40 obs-4 | Global 22P02 filter / text-keyed route params | NOT CONFIRMED. No text-keyed route params introduced; the 22P02 class is now confirmed closed across all WS gateways. Remains 14-wave HOLD. |

  Note on wave-53 obs-3 promotion status: this is now confirmed as a second instance.
  The obs-3 T-8.md rule 3 candidate shape from wave-53 is now promotion-eligible. Reproducing
  the pre-shaped entry here for karen's vetting:
    "3. Verify a WS error-envelope fix with a live authenticated socket probe, not only unit
       assertions."
    Rule line = 82 chars. PASS (<=120).
    "   Why: A unit assertion on error content cannot confirm the fix is live on the deployed binary."
    Why line WITH 3-space indent = 96 chars. PASS (<=100).
    No forbidden tokens. Not a near-dup of T-8 rule 1 (authz path, fixture-verified) or T-8 rule
    2 (REST :id param → 400 vs 500). This rule targets WS error-envelope fix-verification
    specifically. PASS.
  Candidate principles file: command-center/principles/test-layer-principles/T-8.md (rule 3).
  Promotion flag (wave-53 obs-3, now confirmed by wave-54): PROMOTION-ELIGIBLE.

  Severity: informational (status checks only, plus one promotion-eligibility update).
  Candidate principles file: none (status check + wave-53 obs-3 carry).
  Promotion flag: NO (this obs is a status check; the promotion-eligible item is wave-53 obs-3
    carried forward via this wave's confirming instance).

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Squash-merge again bundled P/B process commits with code; branch created before main push (wave-53+54 both) | informational | 2nd instance (wave-53 obs-1 first; wave-54 C-1 explicit "2nd instance") | CI-PRINCIPLES (rule 10 candidate) | PROMOTION-ELIGIBLE — 2-wave bar met; generalizable; falsifiable; cited |
| obs-2 | Seed premise about entire WS info-disclosure class being open was false; P-0 code-check collapsed sweep to verify-only | informational | 1st instance of security-class-level variant (PRODUCT-PRINCIPLES rule 1 covers parent class) | none at this time | HOLD — 1st instance of variant; rule 1 provides partial coverage; watch for 2nd confirming wave |
| obs-3 | Status checks on prior HOLDs; wave-53 obs-3 (T-8 live WS fix-verification) confirmed as 2nd instance by wave-54 T-8 | informational | status checks + wave-53 obs-3 now promotion-eligible | T-8.md (rule 3) via wave-53 obs-3 carry | STATUS CHECK + promotion-eligibility update for wave-53 obs-3 |

**Observations emitted: 3 (obs-1 through obs-3)**
**Severities: all informational (no strong or warning this wave — verify-and-harden wave with clean gates, no defects, no rework cycles)**
**Promotion-eligible this wave: TWO items — obs-1 (CI-PRINCIPLES rule 10, branch-hygiene 2nd instance) AND wave-53 obs-3 carried via obs-3 status-check (T-8.md rule 3, WS fix-verification 2nd instance)**
**Nominations for karen vetting: obs-1 (CI-PRINCIPLES rule 10) AND wave-53 obs-3 (T-8.md rule 3, confirmed by wave-54 T-8 live probe). No slot conflict: different files.**

Candidate verdicts per head-learn brief:
- (a) BRANCH HYGIENE: PROMOTION-ELIGIBLE — second instance (wave-53 obs-1 first; wave-54
  C-1 explicit "2nd instance (wave-53+54)"). Pre-shaped rule 10 for CI-PRINCIPLES passes
  linter checks (rule 79 chars, why 79 chars, no forbidden tokens, 2-line format).
  Near-dup check against CI rules 1-9 complete — no rule addresses main-branch-push timing
  before feature-branch creation. NOMINATE for karen.
- (b) PREMISE-VERIFICATION (security-class variant): HOLD — 1st instance of the specific
  security-class-level variant. PRODUCT-PRINCIPLES rule 1 already covers the parent class
  (verify seed claims about code presence/absence). Wave-54 extends this to a class-level
  security claim; not a new gap but a demonstrably broader application. No distinguishing
  rule warranted at 1st instance. Watch for wave where a security sweep's class-status premise
  is falsified at P-0 to confirm the variant's distinctness from rule 1.
- (wave-53 obs-3 carry) T-8 WS FIX-VERIFICATION: PROMOTION-ELIGIBLE — second instance
  (wave-53 obs-3 is first; wave-54 T-8 5/5 live socket probes is second; both are fix-
  verification of a WS error-path change on live prod, not discovery probes). Pre-shaped
  T-8.md rule 3 from wave-53 obs-3 passes linter checks. NOMINATE for karen.

---

## L-2 promotion outcome (head-learn)

- obs-1 (branch hygiene) → PROMOTED as CI-PRINCIPLES.md rule 10. karen APPROVE, linter OK, committed d903506.
- wave-53 obs-3 carry (WS live-socket fix-verification) → PROMOTED as T-8.md rule 3. karen APPROVE, linter OK, committed e46a857.
- obs-2 (security-class premise-falsification variant) → HELD (1st instance; PRODUCT-PRINCIPLES rule 1 covers parent class). Watch for 2nd confirming wave.

Two promotions this wave, to two distinct files (per-file cap = 1 each; no per-file conflict).
