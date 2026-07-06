# Wave 58 — L-block observations ledger

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read: process/waves/wave-58/stages/ full artifact set (P-0-frame, P-0-problem-framer,
P-0-ceo-reviewer, P-0-mvp-thinner, P-1-decompose, P-2-spec, P-3-plan, P-4-gemini-review,
B-0-branch-and-schema, B-1-contracts, B-2-backend, B-3-frontend, B-4-wiring, B-5-verify,
B-6-review, B-6-review-output, C-1-pr-ci-merge, T-9-journey, V-1-karen, V-1-jenny,
V-1-summary, V-2-triage, V-3-fast-fix).
Gate verdicts checked: process/waves/wave-58/blocks/{P,B,T,V}/gate-verdict.md and
process/waves/wave-58/blocks/ci-cd/gate-verdict.md (all gates APPROVED; zero Critical/High/Medium
findings; V-2 triage: 1 cosmetic noise, 1 non-blocking learning; V-3 Phase 2 skipped).
Prior archives consulted: process/waves/_archive/wave-{53,54,55,56,57}/blocks/L/observations.md
(recurrence checks on soft-check/hard-assert class, prod-defect-exposed-by-test-hardening class,
e2e-baseURL-prod class, sub-floor override class, and all prior held HOLDs).
Principles files read: PRODUCT-PRINCIPLES.md (5 rules), BUILD-PRINCIPLES.md (10 rules),
CI-PRINCIPLES.md (10 rules), VERIFY-PRINCIPLES.md (4 rules), T-4.md (0 rules), T-5.md (3 rules).

---

- **[obs-1 — FIRST INSTANCE: hardening a pass-regardless soft-check into a gating assertion exposed
  a real, pre-existing, user-visible production defect; the spec's test-only contract under-anticipated
  this outcome and had to be expanded mid-wave]**

  The wave-58 seed was framed as a "test-only" change: replace a pass-regardless soft-check
  (`.waitFor().then(()=>true).catch(()=>false)` + `console.log`) in delete-any-message.spec.ts with
  a gating hard assertion. The spec contract declared `api: NONE (test-only, no production change)`.

  The hardened assertion immediately failed on first CI run (C-1-pr-ci-merge.md: CI run 28766329732,
  e2e job FAILED at spec:170 — B's message stayed VISIBLE after A's delete, 28 retries, never
  hidden). The probe step passed (B was subscribed and received message:new), confirming B was in the
  correct room. The assertion gated correctly — the same-room discrepancy exposed a pre-existing
  production defect: the client `message:deleted` handler matched on `payload.messageId`, but the
  gateway emits the full `MessageResponse` DTO keyed by `id` (no `messageId` field), so `m.id ===
  payload.messageId` compared against `undefined` and NEVER matched — cross-client tombstones were
  silently dropped in production (V-1-jenny.md: "The spec gap finding — root cause: old client
  handler matched deletes on `payload.messageId`, but the gateway emits the full MessageResponse DTO
  keyed by `id`; so the comparison always evaluated `m.id === undefined` and NEVER matched").
  Additionally a stuck optimistic own-message copy was left by a `drain()` re-entrancy guard
  swallowing `onDelivered` callbacks. Both defects were user-visible on a live moderation feature.

  The systemic structure: a soft-check that passes regardless of the real outcome is not merely
  "non-asserting" — it actively conceals the state of the behavior it was meant to verify. When the
  concealment is removed by replacing the soft-check with a hard assertion, the first green run
  requires the underlying behavior to actually work, which may require production fixes it was
  previously hiding. The spec's "test-only" framing was not wrong about intent; it was wrong about
  anticipation: honest hardening of a pass-regardless check routinely surfaces the defect the
  soft-check was papering over. The correct spec contract for such a conversion is `test + potential
  production-fix contingency pending B-block findings`, not a flat `api: NONE`.

  The positive outcome: the production defect was found, fixed, deployed, and verified this wave at
  the same merge (PR #73, SHA 65b92fb — karen V-1, jenny V-1, head-verifier all APPROVED). The fix
  required no DB migration (idempotency_key column pre-existed since wave-12 / commit 168c45f —
  V-1-karen.md Finding 4). The wave closed with a real bug fixed rather than merely a test-honesty
  cosmetic improvement.

  Structural recurrence check: searched wave-{53,54,55,56,57} archives for any L-2 observation of
  the class "hardening a pass-regardless soft-check surfaced a production defect masked by the
  softness." Not found. Searched VERIFY-PRINCIPLES (4 rules), PRODUCT-PRINCIPLES (5 rules),
  CI-PRINCIPLES (10 rules), BUILD-PRINCIPLES (10 rules), T-5.md (3 rules) for any rule encoding
  the "soft-check-to-hard-assert conversion creates a production-fix contingency" norm. Not found.
  PRODUCT-PRINCIPLES rule 1 ("Verify every seed claim about what exists or is absent in the code at
  P-0; decomposer prose drifts both ways") encodes code-entity existence/absence verification — it
  does NOT encode the soft-check contract risk class (which is a P-2 spec-authoring norm, not a
  P-0 premises check). VERIFY-PRINCIPLES rules 1-4: rule 1 (seeding ACs via create-path source),
  rule 2 (divergent-but-more-correct behavior → amend spec), rule 3 (re-verify fast-fix), rule 4
  (negative test needs positive control). None addresses this class. FIRST INSTANCE.

  Candidate rule shape for VERIFY-PRINCIPLES (pre-shaped for karen's reference, NOT a nomination):
    "5. When converting a pass-regardless soft-check to a gating assertion, budget a production fix;
       surfacing the masked defect is the expected outcome."
    Rule line = 104 chars. PASS (<=120).
    "   Why: A soft-check that passes regardless hides whether the behavior works; the first honest
       run may gate red."
    Why line WITH 3-space indent = 97 chars. PASS (<=100).
    No forbidden tokens (no `we`, `our`, `the team`, `wave-<N>`, em-dash). PASS.
    Near-dup check vs VERIFY rules 1-4: rule 2 is the closest ("when deployed behavior diverges from
    a spec AC and is more correct, amend the spec to match, not the code") — that rule addresses the
    post-delivery disposition of a divergence; this candidate addresses the pre-spec anticipation of
    what conversions will entail. Different axes (retrospective disposition vs prospective contract).
    Not a near-dup. PASS.

  Source artifacts:
  - process/waves/wave-58/stages/C-1-pr-ci-merge.md ("The hardened assertion RAN and correctly
    GATED: FAILED — B's message stayed VISIBLE (28 retries, never hidden). This EXPOSES a real,
    PRE-EXISTING fan-out gap.")
  - process/waves/wave-58/stages/V-1-jenny.md:88-123 (§ "The scope-expansion call: SPEC GAP (not
    drift)"; root cause analysis; "P-2 learning tag: When a spec hardens a 'pass-regardless'
    soft-check into a gating assertion, do NOT pre-declare `api: NONE / test-only`.")
  - process/waves/wave-58/stages/V-1-karen.md ("Antipattern watch — RESOLVED: spec said
    `contracts.api: NONE` but production changed. VERIFIED as legitimate scope expansion, not
    fabrication.")
  - process/waves/wave-58/stages/V-2-triage.md (finding 2: "spec-gap: spec declared test-only but
    hardening exposed real production defect; P-2 learning for next wave")
  - process/waves/wave-58/blocks/V/gate-verdict.md (§ Rationale: "jenny's DIAG-history evidence
    corroborates it gated red pre-fix; the correct engineering response (fix the surfaced defect
    rather than keep the assertion soft) was already taken.")

  Severity: strong (the gap caused a production defect to persist undetected in a live moderation
    feature; had the spec correctly anticipated the contingency the B-block planning would have been
    scoped to include the fix from the start rather than discovering it at C-1 gate-red; additionally
    the defect was user-visible — a moderator-deleted message continued to show on other members'
    screens).
  Candidate principles file: command-center/principles/VERIFY-PRINCIPLES.md (rule 5 candidate).
  Recurrence verdict: FIRST INSTANCE. No prior occurrence found in wave-{53,54,55,56,57} archives
    or in any promoted principles rule across VERIFY, PRODUCT, CI, BUILD, or T-1 through T-5.
  Promotion flag: HOLD — 1st instance; the 2-wave bar is not met. Log and watch for a second wave
    where converting a pass-regardless soft-check triggers a production fix contingency (or,
    conversely, where a spec correctly pre-declared the contingency and the B-block was prepared
    for the production-fix path).

---

- **[obs-2 — FIRST INSTANCE: an e2e suite whose `baseURL` targets deployed production cannot gate a
  pre-merge branch; a red e2e at C-1 against production proves the deployed binary is broken, not
  that the branch is broken]**

  The project's Playwright config has `baseURL` pointing at the live production URL
  (`web-production-bce1a8...`). This configuration means the CI e2e job always tests the DEPLOYED
  state, not the branch under test. At C-1, the e2e job was RED — correctly, because deployed prod
  still carried the bug. After the production fix was merged and deployed, the e2e passed (2 passed,
  8.4s / 11.3s — confirmed in V-1-jenny.md, V-1-karen.md, C-block gate verdict).

  The C-block gate verdict records this explicitly: "Non-required `e2e` was RED pre-merge BY DESIGN:
  playwright.config baseURL points at LIVE production (web-production-bce1a8), so the e2e tests
  deployed prod, which still carried the bug until this deploy. e2e is a post-deploy verification,
  not a pre-merge gate. Merging with required-green is correct."

  The systemic structure: a Playwright suite configured with a production `baseURL` is a post-deploy
  verification instrument, not a pre-merge gate. It answers "does the deployed binary satisfy the
  assertions?" not "does this branch's code satisfy the assertions?" This distinction matters for
  the CI job's role classification: such a suite MUST be a non-required check (failing it cannot
  block merge of a branch fix that will be deployed and then verified), and the deploy-then-verify
  sequence is the correct CI shape for this configuration. A team that marks a production-baseURL
  e2e as required would be unable to merge the fix that resolves the e2e failure, because the fix
  only takes effect after deployment.

  The correct engineering response in this wave was confirmed: (1) classify the e2e as non-required
  in CI (so the branch carrying the fix can merge through the required-green gate), (2) deploy both
  services at the merge SHA, (3) run the e2e against deployed prod as post-deploy verification. This
  is the only causally sound sequence when baseURL = production.

  Structural recurrence check: searched wave-{53,54,55,56,57} archives for any observation of the
  class "production-baseURL e2e cannot pre-gate a branch fix; it is post-deploy verification."
  Wave-45 obs-1 ("Browser resolution in committed playwright config") addresses Playwright config
  management but concerns the browser-path setting, not the baseURL targeting. Not the same class.
  Searched CI-PRINCIPLES (10 rules) — rules 1-10 address Railway deploy-state verification, PR gate
  mechanics, formatter gates, integration job liveness, migration ledger, and main-branch-push
  hygiene. No rule addresses the baseURL-determines-gate-role distinction. FIRST INSTANCE.

  Candidate rule shape for CI-PRINCIPLES (pre-shaped for karen's reference, NOT a nomination):
    "11. Classify an e2e suite whose baseURL targets deployed prod as non-required in CI; it is
       post-deploy verification, not a pre-merge gate."
    Rule line = 113 chars. PASS (<=120).
    "   Why: A production-baseURL e2e tests the deployed binary, not the branch; gating merge on it
       blocks the fix."
    Why line WITH 3-space indent = 99 chars. PASS (<=100).
    No forbidden tokens (no `we`, `our`, `the team`, `wave-<N>`, em-dash). PASS.
    Near-dup check vs CI rules 1-10: rule 1 (deploy-state verification endpoint), rule 2 (new-route
    404-to-gated flip), rule 3 (per-job CI conclusions), rules 4-10 (formatter gate, integration
    job liveness, main-push timing, Railway non-git deploy, flake stabilization, migration ledger,
    main-branch-push). None addresses baseURL configuration as a determinant of a suite's CI role.
    Not a near-dup. PASS.

  Source artifacts:
  - process/waves/wave-58/blocks/ci-cd/gate-verdict.md ("Non-required `e2e` was RED pre-merge BY
    DESIGN: playwright.config baseURL points at LIVE production... e2e is a post-deploy
    verification, not a pre-merge gate. Merging with required-green is correct.")
  - process/waves/wave-58/stages/C-1-pr-ci-merge.md ("CI run 28766329732 — e2e job FAILED at
    delete-any-message.spec.ts:170. The hardened assertion RAN... This EXPOSES a real, PRE-EXISTING
    fan-out gap. Iron Law: NOT fixed directly. Merge BLOCKED until root cause + fix committed.")
  - process/waves/wave-58/stages/B-6-review.md ("Residual note: The full 'fails when fan-out
    broken' proof is CI-only (e2e cannot run locally). head-ci-cd must confirm this spec runs and
    passes in the CI e2e job (not skipped/quarantined) before merge.")
  - process/waves/wave-58/stages/V-1-jenny.md (F3 evidence: "Live proof: `pnpm --filter
    @studyhall/web exec playwright test delete-any-message` against deployed prod → 2 passed
    (8.4s)." — confirms post-deploy is the correct verification point)

  Severity: warning (the baseURL configuration is correct for the project's sequential
    deploy-then-verify workflow, but if it is not properly classified as non-required it would
    block merging the very fix the e2e is meant to validate; this wave got the classification
    right, but the principle is not yet encoded).
  Candidate principles file: command-center/principles/CI-PRINCIPLES.md (rule 11 candidate).
  Recurrence verdict: FIRST INSTANCE. No prior occurrence found in wave-{53,54,55,56,57} archives
    or in any CI-PRINCIPLES rule (1-10).
  Promotion flag: HOLD — 1st instance; the 2-wave bar is not met. Watch for a second wave where the
    baseURL-as-post-deploy-verification principle is either applied correctly (confirmation) or
    missed (a production-baseURL e2e is marked required, creating a merge deadlock).

---

- **[obs-3 — RECURRING (9th instance): sub-floor single-spec wave resolved by override-ship via
  PRODUCT rule 5; recurrence count updated; rule functioning correctly]**

  Wave-58 P-1 tripped the single-spec floor (~20-50 LOC vs. 1,500-LOC threshold). Resolution:
  override-ship by rule (PRODUCT-PRINCIPLES rule 5; mvp-thinner floor_constraint_active + zero
  valid split candidates — single indivisible soft-check-to-hard-assert conversion, no valid split).
  P-1 records "obs-B 9th" explicitly.

  This obs is a STATUS UPDATE only: PRODUCT-PRINCIPLES rule 5 was promoted at wave-52 and covers
  the resolution path mechanically. The system is operating as designed. No new learning gap.

  Recurrence lineage:
  - wave-50 obs-B: 1st instance. wave-51 obs-B: 2nd instance. wave-52 obs-4: 3rd instance
    (PROMOTED as PRODUCT-PRINCIPLES rule 5). waves 53, 54, 55: instances 4, 5, 6.
    wave-56 obs-3: 7th instance. wave-57 obs-2: 8th instance. wave-58: 9th instance.
    Rule applied correctly each time; no override friction.

  Source artifacts:
  - process/waves/wave-58/stages/P-1-decompose.md (floor_resolution: "override-ship (PRODUCT
    rule 5 / obs-B 9th; test-honesty anti-pattern fix)")

  Severity: informational (rule 5 functioning correctly; zero override friction; no new gap).
  Candidate principles file: none (PRODUCT-PRINCIPLES rule 5 already exists and was applied).
  Recurrence: 9th instance. Rule 5 in force. No action needed.
  Promotion flag: NO — rule already promoted; this is a health-check confirmation.

---

- **[obs-4 — status check on prior held observations]**

  Updating carried status from wave-57 obs-3 and all prior HOLDs:

  | origin | obs | class | wave-58 status |
  |--------|-----|-------|----------------|
  | wave-57 obs-1 | Interactive nav/rail button shipped with no onClick from a prior wave; gap invisible to test suite; surfaced as UX papercut | NOT CONFIRMED. Wave-58 is a backend-fix + e2e-hardening wave; no new nav/rail interactive button introduced; no onClick gap. Not a confirming or falsifying instance. HOLD maintained. |
  | wave-56 obs-1 | P-0 three-reviewer convergence caught seed conflating scale-independent correctness cap with premature pagination UX; YAGNI split at P-0 | NOT CONFIRMED. Wave-58 P-0 is a clean PROCEED on a minimal test-honesty fix; no YAGNI challenge or scale-dependent bundling at P-0. Not a confirming instance. HOLD maintained. |
  | wave-56 obs-2 | ceo-reviewer explicitly retracted its own wave-55 N-2 seed nomination; first instance of P-0 agent self-correcting a prior-wave call | NOT CONFIRMED. Wave-58 ceo-reviewer output is a HOLD-SCOPE PROCEED; no prior-wave call to retract. Not a confirming instance. HOLD maintained. |
  | wave-55 obs-1 | Seed positive-only assertion redundant with existing control; load-bearing cell was the untested negative; 1st instance of false-coverage-value sub-class | NOT CONFIRMED. Wave-58 P-0 problem-framer confirmed the soft-check premise accurately (the soft-check was genuine, no false-coverage-value issue). Not a confirming instance. HOLD maintained. |
  | wave-54 obs-2 | Seed premise about entire WS info-disclosure vulnerability class being open was false; P-0 collapsed sweep to verify-only | NOT CONFIRMED. Wave-58 has no security sweep; seed premise was accurate (the soft-check was a real pass-regardless construct, verified by code inspection). Not a confirming instance. HOLD maintained. |
  | wave-52 obs-3 (a) | VERIFY: independently re-probe load-bearing claims at gate before accepting zero-finding verdict | CONFIRMED BY APPLICATION. V-1 karen and jenny each independently verified all load-bearing claims at source (payload.id match grep, idempotencyKey round-trip, outbox re-entrancy, deploy hash, gitleaks no-rule-disable). Head-verifier independently re-confirmed merge ancestry, no e2e suppression, and gating assertion. The behavior the proposed VERIFY rule 5 formalizes continues to occur correctly. Still no case where an unprobed zero-finding gate passed a defect through. Remains 1st-instance HOLD. |
  | wave-52 obs-3 (b) | Gate agent direct-writes to principles files | NOT CONFIRMED. No gate agent wrote directly to a principles file this wave. Remains 1st-instance HOLD. |
  | wave-50 obs-B | Parallel T-5 testers block on shared MCP Chrome profile | NOT CONFIRMED. T-5 (as distinct e2e swarm stage) was not separately invoked; e2e verification was via CI + post-deploy run. Remains multi-wave HOLD. |
  | wave-50 obs-C | P-4/plan review enumerate compute-on-read walk paths for new per-row parameter | NOT CONFIRMED. Wave-58 involves no compute-on-read walk for a new per-row parameter. Remains multi-wave HOLD. |
  | wave-49 obs-B | Socket.IO namespace mismatch invisible to mocked-both-sides unit suite; T-4.md rule 1 | NOT CONFIRMED directly as a new instance. Wave-58's production bug was a DTO field-name mismatch (payload.messageId vs payload.id), not a namespace mismatch; it is structurally adjacent but in a distinct class (payload key vs. namespace routing). Remains multi-wave HOLD. |
  | wave-49 obs-C | Responsive breakpoint not validated against D-3 adopted design at B-block | NOT CONFIRMED. D-block skipped (design_gap_flag false; test + production fix, no new surface). Remains multi-wave HOLD. |
  | wave-44 obs-1 | Responsive/layout fix introduces overlay without WCAG dialog contract | NOT CONFIRMED. No layout fix or overlay. Remains multi-wave HOLD. |
  | wave-45 obs-1 | Browser resolution in committed playwright config | NOT CONFIRMED. No playwright config change this wave. Remains multi-wave HOLD. |
  | wave-45 obs-2 | playwright test --list false-green for browser-resolution change | NOT CONFIRMED. No Playwright config change. Remains multi-wave HOLD. |
  | wave-47 obs-C | Display-identifier vs opaque-id mismatch | NOT CONFIRMED. No component rendering user identities via opaque-id introduced. Remains multi-wave HOLD. |
  | wave-41 obs-1 | V-3 redeploy false-green | NOT CONFIRMED. V-3 Phase 2 not triggered (fast-fix queue empty). Remains multi-wave HOLD. |
  | wave-41 obs-2 | Symbol-grep false-positive | NOT CONFIRMED. V-1 karen used file:line git-show inspection against deployed tree (payload.id match at specific line numbers, deploy hash). Remains multi-wave HOLD. |
  | wave-41 obs-3 | Parallel-path enforcement gap | NOT CONFIRMED. No new parallel sibling method. Remains multi-wave HOLD. |
  | wave-40 obs-1 | T-8 fix mechanism contradicts architectural decision | NOT CONFIRMED. No T-8 security-fix architectural conflict; wave fixes a client-side DTO field-name mismatch + outbox re-entrancy. Remains multi-wave HOLD. |
  | wave-40 obs-4 | Global 22P02 filter / text-keyed route params | NOT CONFIRMED. No text-keyed route params introduced. Remains multi-wave HOLD. |

  Severity: informational (status checks only).
  Candidate principles file: none.
  Promotion flag: NO.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Hardening a pass-regardless soft-check into a gating assertion exposed a pre-existing user-visible production defect; spec's "test-only" contract under-anticipated this — production-fix contingency should be budgeted | strong | 1st instance (no prior occurrence in wave-{53,54,55,56,57} archives; no rule in VERIFY/PRODUCT/CI/BUILD/T-1..T-5 covers this class) | VERIFY-PRINCIPLES (rule 5 candidate shape) | HOLD — 1st instance; watch for 2nd wave where a soft-check conversion triggers a production-fix contingency |
| obs-2 | e2e suite with production baseURL cannot pre-gate a branch fix; it is post-deploy verification; must be classified non-required in CI | warning | 1st instance (no prior occurrence in wave-{53,54,55,56,57}; no CI-PRINCIPLES rule 1-10 addresses baseURL-as-gate-role-determinant) | CI-PRINCIPLES (rule 11 candidate shape) | HOLD — 1st instance; watch for 2nd wave where baseURL = prod classification is applied or missed |
| obs-3 | Sub-floor single-spec wave resolved by PRODUCT rule 5 override-ship; 9th instance; rule functioning correctly | informational | 9th instance (waves 50-58); PRODUCT rule 5 already promoted at wave-52 | none | NO ACTION — rule 5 in force and correctly applied |
| obs-4 | Status check on prior held observations | informational | status checks | none | STATUS CHECK ONLY |

**Observations emitted: 4 (obs-1 through obs-4)**
**Severities: 1 strong (obs-1), 1 warning (obs-2), 1 informational (obs-3), 1 informational/status-check (obs-4)**
**Promotion-eligible this wave: NONE**
**Nominations for karen vetting: NONE this wave (both substantive observations are first-instance)**

---

## Explicit recurrence verdicts on the two named candidates

### Candidate 1 (jenny V-1 finding): "When hardening a pass-regardless soft-check into a gating
assertion, do NOT pre-declare the wave test-only — surfacing the masked production defect is the
expected outcome." (candidate target: VERIFY-PRINCIPLES or a test-layer file)

**Answer: FIRST-INSTANCE-HOLD.**

1. Archive search (waves 53-57 L-2 observations) for "soft-check", "pass-regardless", "test-only
   scope expansion", "hardened assertion surfaced production defect": no prior observation of this
   class in any of the five prior waves. The wave-55 obs-1 (false-coverage-value at P-0) and
   wave-54 obs-2 (false-code-state sweep premise) are related only in that they are also P-0/spec
   framing lessons — but neither involves a soft-check-to-hard-assert conversion causing a
   production-fix contingency. Wave-45 obs-2 involves a Playwright soft-check in a different sense
   (a `--list` command false-green from a config change) — structurally unrelated to the pattern of
   a test assertion's softness concealing a live bug. Not confirming instances.

2. Principles files (VERIFY 1-4, PRODUCT 1-5, CI 1-10, BUILD 1-10, T-5 1-3): no existing rule
   encodes "when converting a pass-regardless soft-check to a gating assertion, budget a production
   fix contingency." VERIFY rule 2 ("when deployed behavior diverges from a spec AC and is more
   correct, amend the spec") addresses the retrospective disposition of a discovered divergence — it
   does not address the prospective spec-authoring norm that the conversion itself should anticipate
   the contingency. Not already covered.

3. The candidate rule target is VERIFY-PRINCIPLES (rule 5 candidate) rather than a T-layer file
   because the lesson is a P-2 spec-authoring norm (how to declare the contract when hardening a
   soft-check) and a V-1/jenny recurring observation type, not a T-5 e2e-layer execution technique.
   VERIFY-PRINCIPLES covers the spec-verification interface; T-5 covers Playwright execution
   conventions. The learning is about *how the spec declares scope*, not *how the test runs*.

4. Pre-shaped candidate rule (for karen's reference when a second instance is confirmed):
   "5. When converting a pass-regardless soft-check to a gating assertion, budget a production fix;
      surfacing the masked defect is the expected outcome."
   Rule line = 104 chars. PASS (<=120).
   "   Why: A soft-check that passes regardless hides whether the behavior works; the first honest
      run may gate red."
   Why line WITH 3-space indent = 97 chars. PASS (<=100). No forbidden tokens. Not a near-dup of
   VERIFY rules 1-4. PASS.

**Recurrence verdict: FIRST INSTANCE. No prior confirming wave. HOLD.**

---

### Candidate 2 (C-block gate verdict + this wave's debugging): "An e2e whose baseURL targets
deployed prod cannot validate an undeployed branch fix — treat such e2e as post-deploy
verification, not a pre-merge gate." (candidate target: CI-PRINCIPLES)

**Answer: FIRST-INSTANCE-HOLD.**

1. Archive search (waves 53-57 L-2 observations) for "baseURL", "production URL", "post-deploy
   verification", "non-required e2e", "pre-merge gate", "deployed prod": no prior observation of
   the class "production-baseURL e2e is a post-deploy verification instrument and must be classified
   non-required in CI" found in any prior-five-wave archive.

2. Wave-45 obs-1 ("browser resolution in committed playwright config") is in the Playwright config
   domain but addresses the `PLAYWRIGHT_BROWSERS_PATH` / `channel` setting — not the `baseURL`
   pointing at a live environment and its consequence for merge-gate classification. These are
   orthogonal playwright.config.ts settings with different systemic consequences. Not a confirming
   instance.

3. CI-PRINCIPLES rules 1-10: rules address Railway deploy-state endpoint verification (rule 1),
   new-route 404-to-auth-gated flip (rule 2), per-job conclusions vs watch exit-status (rule 3),
   formatter-check at wiring (rule 4), integration job liveness assertion (rule 5), bypass-push CI
   scope (rule 6), non-git-connected service bundle marker (rule 7), parallel flake stabilization
   (rule 8), migration ledger verification (rule 9), main-branch-push before branching (rule 10).
   None addresses the baseURL-as-post-deploy-verification-classifier norm. Not already covered.

4. The candidate rule target is CI-PRINCIPLES (rule 11) because the lesson is about how a suite's
   configuration (its baseURL target) determines its valid CI role classification — a CI-workflow
   norm, not a test-authoring or verification-process norm. The question "is this e2e required or
   non-required at C-1?" is a CI-gate question.

5. Pre-shaped candidate rule (for karen's reference when a second instance is confirmed):
   "11. Classify an e2e suite whose baseURL targets deployed prod as non-required in CI; it is
      post-deploy verification, not a pre-merge gate."
   Rule line = 113 chars. PASS (<=120).
   "   Why: A production-baseURL e2e tests the deployed binary, not the branch; gating merge on it
      blocks the fix."
   Why line WITH 3-space indent = 99 chars. PASS (<=100). No forbidden tokens. Not a near-dup of
   CI rules 1-10. PASS.

**Recurrence verdict: FIRST INSTANCE. No prior confirming wave. HOLD.**
