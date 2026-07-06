# Wave 57 — L-block observations ledger

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read: process/waves/wave-57/stages/ full artifact set (P-0-frame, P-0-problem-framer,
P-0-ceo-reviewer, P-0-mvp-thinner, P-1-decompose, P-2-spec, P-3-plan, B-6-review-output,
T-5-e2e, T-9-journey, V-1-karen, V-1-jenny, V-1-summary, V-2-triage, V-3-fast-fix,
B-0-branch-and-schema, B-1-contracts, B-2-backend, B-3-frontend, B-4-wiring, B-5-verify,
C-1-pr-ci-merge, C-2-deploy-and-verify, T-1-static, T-2-unit, T-3-contract, T-4-integration,
T-6-layout, T-7-perf, T-8-security, P-4-gemini-review).
Gate verdicts checked: process/waves/wave-57/blocks/{P,B,T,V}/gate-verdict.md (all four gates
APPROVED; zero Critical/High/Medium findings across B-6 + V-block; V-2 triage empty;
V-3 Phase 2 skipped).
Prior archives consulted: process/waves/_archive/wave-{52,53,54,55,56}/blocks/L/observations.md
(recurrence checks on dead-onClick/no-op interactive handler class, YAGNI/premature-scope class,
ceo-reviewer self-correction class, floor-override class, and all prior held HOLDs).
Principles files read: PRODUCT-PRINCIPLES.md (5 rules), BUILD-PRINCIPLES.md (10 rules),
CI-PRINCIPLES.md (10 rules), VERIFY-PRINCIPLES.md (4 rules),
T-1.md, T-2.md, T-3.md, T-4.md, T-5.md (3 rules), T-6.md, T-7.md, T-8.md (3 rules), T-9.md.

---

- **[obs-1 — FIRST INSTANCE: an interactive nav/rail button shipped with no onClick handler from
  a prior wave; the handler gap was invisible to the test suite and surfaced as a UX papercut a
  follow-up wave later]**

  The ServerRail Home button (`ServerRail.tsx:125`) was wired with no `onClick` handler as of its
  original introduction. It rendered visually correctly (the button element was present, styled,
  and keyboard-focusable) but was a no-op — clicking it did nothing. The P-4 gate-verdict for this
  wave independently caught and flagged this in its builder carry note (P/gate-verdict.md Phase 2):
  "ServerRail.tsx:120-131 has NO onClick today — ADD a fresh onClick calling onExitDmHome; do not
  assume an existing handler." Karen also called it at P-4 Phase 2: "Home button ServerRail.tsx:
  120-131 has NO onClick (decorative) — builder must ADD one, not extend." The V-1-karen prevention
  note (V-1-karen.md:52-53) frames the systemic conclusion: "The Home button was decorative
  (no onClick) from a prior wave and only surfaced as a papercut later. Recommend a lightweight
  lint/test convention flagging interactive rail buttons that render with no handler, so
  'decorative-looking but should-be-live' controls are caught at B-6 rather than a follow-up wave."

  The structural pattern: a nav control (Home button in the server rail) was introduced on a
  prior wave as a visual element without a corresponding interaction contract. Because it was not
  the focus of that wave, no AC enumerated its onClick behavior, no test asserted that clicking it
  does anything, and the TypeScript type declared the prop optional (with React silently accepting
  onClick={undefined}). The gap was undetectable by static analysis, typecheck, unit tests, and
  visual inspection — the button simply did nothing on click. It only surfaced when a new wave
  needed the Home button to participate in a specific interaction flow (exiting DmHome), at which
  point it was discovered to be a no-op.

  The generalizable class: interactive UI controls in shell/nav components that are introduced
  without an interaction requirement can accumulate as silent dead controls. The cost of a
  dead-handler in a nav rail is not a crash or a test failure — it is a user interaction that
  does nothing, which may be acceptable at introduction but creates a latent papercut when the
  surrounding flow is extended. The detection gap is the absence of a B-6 or test norm that
  asks "does every interactive-looking button in a nav/rail component actually have a handler?"

  Recurrence check (the load-bearing question): the brief notes that the wave-52 `subscribe_
  server_rooms` hit from the archives is a realtime-subscribe gateway handler (a Socket.IO
  `@SubscribeMessage` verb on the backend), not an interactive UI button onClick. The wave-52
  class is "a client-browser socket never emitted the initial subscribe verb because mocked-both-
  sides unit tests assumed the subscription already succeeded" — a wire-protocol handshake gap,
  not a UI button with no interaction contract. Confirmed by direct grep of the archives
  (wave-52/blocks/L/observations.md obs-1 and T-5-tester-1.md): "client connected to /study-room
  but NEVER emitted a 'subscribe to the server's rooms' handshake." The subscribe_server_rooms
  entity is a WS gateway verb; the wave-57 Home button is a rendered interactive DOM element.
  These are structurally unrelated classes. The wave-52 hit is NOT a confirming instance of the
  dead-onClick/no-op interactive handler pattern.

  Broader archive grep (waves 52-56, and grepping all principles files) for "no onClick",
  "decorative button", "dead handler", "no-op button", "interactive.*no handler", "missing.*
  onClick": no prior wave's L-2 observations record an instance of an interactive shell/nav
  button shipping without an onClick handler and later surfacing as a UX papercut. BUILD-
  PRINCIPLES rules 1-10, PRODUCT-PRINCIPLES rules 1-5, CI-PRINCIPLES rules 1-10, VERIFY-
  PRINCIPLES rules 1-4, and T-1 through T-9 principles contain no rule touching dead-onClick,
  handler-less interactive nav controls, or the B-6 norm of verifying click contracts. This
  is FIRST INSTANCE of the dead-interactive-nav-handler class.

  Near-dup check: BUILD-PRINCIPLES rule 4 ("Reproduce one negative path per authz or injection
  boundary at B-6 Phase-2") addresses adversarial negative-path testing at security/authz
  boundaries. The dead-onClick class is a positive-interaction gap (clicking should do something
  but does not), not an authz/injection boundary. Different axis. NOT a near-dup.

  Candidate rule shape for BUILD-PRINCIPLES (pre-shaped for linter awareness, NOT a nomination
  at first instance; for karen's reference if a second confirming wave surfaces):
    "11. At B-6, verify every interactive-looking nav or rail button has a wired onClick; a
         decorative shell element is a latent papercut, not a benign gap."
    Rule line = 116 chars. PASS (<=120).
    "   Why: An onClick-less nav button passes typecheck and renders correctly but does nothing
       on click, surfacing as a papercut on the next wave that needs it to act."
    Why line WITH 3-space indent = 115 chars. OVER (>100). Trim:
    "   Why: An onClick-less nav button passes typecheck but does nothing on click."
    Why line WITH 3-space indent = 78 chars. PASS (<=100).
    No forbidden tokens (no `we`, `our`, `the team`, `wave-<N>`, em-dash). PASS.
    Near-dup check vs BUILD rules 1-10: rule 4 (authz negative path) closest; different class
    (interaction contract vs authz boundary). Not a near-dup. PASS.

  Source artifacts:
  - process/waves/wave-57/blocks/P/gate-verdict.md (§ "Builder note": "Home button in
    ServerRail.tsx lines 120-131 currently has NO onClick handler"; "B-3 CARRY: the
    ServerRail Home button has NO onClick today — ADD a fresh onClick calling onExitDmHome")
  - process/waves/wave-57/stages/V-1-karen.md:52-53 (Prevention note: "The Home button was
    decorative (no onClick) from a prior wave and only surfaced as a papercut later. Recommend
    a lightweight lint/test convention flagging interactive rail buttons that render with no
    handler")
  - process/waves/wave-57/stages/B-6-review-output.md:22 ("Prior state: Home button had no
    onClick at all (the reported no-op); now wired.")
  - process/waves/wave-57/stages/V-1-jenny.md:16 ("The B-carry was correct: Home previously
    had NO onClick (decorative); now wired.")

  Recurrence verdict: FIRST INSTANCE. No prior occurrence found in waves 52-56 archives or in
    any promoted principles file across BUILD, PRODUCT, CI, VERIFY, or T-1 through T-9.
    The wave-52 subscribe_server_rooms grep hit is a WS gateway verb (backend), NOT a UI button
    onClick — confirmed structurally distinct.
  Severity: warning (the gap caused a follow-up wave; the fix was minimal but could have been
    prevented at the wave that introduced the button; V-1-karen flagged it as a forward-
    prevention candidate).
  Candidate principles file: command-center/principles/BUILD-PRINCIPLES.md (rule 11 candidate).
  Promotion flag: HOLD — 1st instance; the 2-wave bar is not met. Log and watch for a second
    wave where an interactive shell/nav button ships without an onClick (or, conversely, where
    a B-6 handler-check catches a no-op button that would otherwise have become a papercut).

---

- **[obs-2 — RECURRING (8th instance): sub-floor single-spec wave resolved by override-ship via
  PRODUCT rule 5; recurrence count updated; rule functioning correctly]**

  Wave-57 P-1 tripped the single-spec floor (~100 LOC vs. 1,500-LOC threshold). Resolution:
  override-ship by rule (PRODUCT-PRINCIPLES rule 5; mvp-thinner floor_constraint_active + zero
  valid split candidates — the fix is a single coherent root cause with two mandatory co-handlers;
  splitting one path produces a half-fix). The sub-floor override is a direct application of rule 5.

  This obs is a STATUS UPDATE only: PRODUCT-PRINCIPLES rule 5 was promoted at wave-52 and covers
  the resolution path mechanically. The system is operating as designed. No new learning gap.

  Recurrence lineage:
  - wave-50 obs-B: 1st instance (multi-spec sub-floor, feature-completion + V-2-debt fix).
  - wave-51 obs-B: 2nd instance (single-spec sub-floor, DM layout defect fix).
  - wave-52 obs-4: 3rd instance. Promoted as PRODUCT-PRINCIPLES rule 5 at wave-52 L-2.
  - waves 53, 54, 55: instances 4, 5, 6 (rule correctly applied; status checks in respective
    ledgers absorbed them).
  - wave-56 obs-3: 7th instance. Rule applied correctly; no override friction.
  - wave-57: 8th instance. Rule applied correctly; no override friction beyond logging.

  Source artifacts:
  - process/waves/wave-57/stages/P-0-frame.md (P-0 disposition PROCEED, minimal targeted fix;
    mvp-thinner OK; floor override expected on a single-root-cause 2-handler fix)
  - PRODUCT-PRINCIPLES.md rule 5 (promoted wave-52 L-2; in force)

  Severity: informational (rule 5 functioning correctly; zero override friction; no new gap).
  Candidate principles file: none (PRODUCT-PRINCIPLES rule 5 already exists and was applied).
  Recurrence: 8th instance. Rule 5 in force. No action needed.
  Promotion flag: NO — rule already promoted; this is a health-check confirmation.

---

- **[obs-3 — status check on prior held observations]**

  Updating carried status from wave-56 obs-4 and all prior HOLDs:

  | origin | obs | class | wave-57 status |
  |--------|-----|-------|----------------|
  | wave-56 obs-1 | P-0 three-reviewer convergence caught seed conflating scale-independent correctness cap with premature pagination UX; YAGNI split at P-0 before B-block | NOT CONFIRMED. Wave-57 is a deterministic single-root-cause UX papercut fix; no YAGNI challenge or scale-dependent UX bundling at P-0. All three P-0 reviewers converged on PROCEED with minimal targeted fix (same direction for different reasons). Not a confirming or falsifying instance of the YAGNI-split class. Wave-56 obs-1 HOLD maintained. |
  | wave-56 obs-2 | ceo-reviewer explicitly retracted its own wave-55 N-2 seed nomination; first instance of P-0 agent self-correcting a prior-wave call | NOT CONFIRMED. Wave-57 ceo-reviewer output: PROCEED/HOLD-SCOPE on the deterministic papercut; no prior-wave call to retract (the wave-57 seed was a pre-existing F-1 from the journey-map, not a prior-wave ceo-reviewer nomination). Wave-56 obs-2 HOLD maintained. |
  | wave-55 obs-1 | Seed positive-only assertion redundant with existing control; load-bearing cell was the untested negative; 1st instance of false-coverage-value sub-class | NOT CONFIRMED. Wave-57 is not a test-only wave; no seed-coverage-value claim was made or falsified at P-0. Not an instance of the false-coverage-value class. Wave-55 obs-1 HOLD maintained. |
  | wave-54 obs-2 | Seed premise about entire WS info-disclosure vulnerability class being open was false; P-0 collapsed sweep to verify-only | NOT CONFIRMED. Wave-57 has no security sweep; seed is a pre-existing UX bug verified in code at P-0. Not a security-class-premise-falsification instance. Wave-54 obs-2 HOLD maintained. |
  | wave-52 obs-3 (a) | VERIFY: independently re-probe load-bearing claims at gate before accepting zero-finding verdict | CONFIRMED BY APPLICATION. V-3 head-verifier independently reconfirmed all source lines (AppShell.tsx:59/:119-123; ServerRail.tsx:97/100/125/161/240-243), byte-identity of CI sha to live (git diff --stat 5ddbeec 1361c49 = empty), and mutation genuineness (revert fails 3/4) before accepting the APPROVE. Karen and jenny each verified AC-by-AC from deployed code at source, not from each other's reports. The behavior the proposed VERIFY rule 5 formalizes continues to occur correctly. Still no case where a zero-finding gate passed a defect through unprobed. Remains 1st-instance HOLD. |
  | wave-52 obs-3 (b) | Gate agent direct-writes to principles files | NOT CONFIRMED. No gate agent wrote to principles files this wave. Remains 1st-instance HOLD. |
  | wave-50 obs-B | Parallel T-5 testers block on shared MCP Chrome profile | NOT CONFIRMED. T-5 ran as Pattern-A (component-fidelity + CI e2e green + live-serves smoke); no parallel live Playwright swarm this wave. Remains multi-wave HOLD. |
  | wave-50 obs-C | P-4/plan review enumerate compute-on-read walk paths for new per-row parameter | NOT CONFIRMED. Wave-57 is a 2-line nav-state wiring change; no compute-on-read walk. Remains multi-wave HOLD. |
  | wave-49 obs-B | Socket.IO namespace mismatch invisible to mocked-both-sides unit suite; T-4.md rule 1 | NOT CONFIRMED. Wave-57 has no new Socket.IO gateway. Remains multi-wave HOLD. |
  | wave-49 obs-C | Responsive breakpoint not validated against D-3 adopted design at B-block | NOT CONFIRMED. D-block skipped (design_gap_flag false; state-transition fix, no new surface). Remains multi-wave HOLD. |
  | wave-44 obs-1 | Responsive/layout fix introduces overlay without WCAG dialog contract | NOT CONFIRMED. No overlay introduced. Remains multi-wave HOLD. |
  | wave-45 obs-1 | Browser resolution in committed playwright config | NOT CONFIRMED. No Playwright config change. Remains multi-wave HOLD. |
  | wave-45 obs-2 | playwright test --list false-green for browser-resolution change | NOT CONFIRMED. No Playwright config change. Remains multi-wave HOLD. |
  | wave-47 obs-C | Display-identifier vs opaque-id mismatch | NOT CONFIRMED. No component rendering user identities via opaque-id. Remains multi-wave HOLD. |
  | wave-41 obs-1 | V-3 redeploy false-green | NOT CONFIRMED. V-3 Phase 2 not triggered (fast-fix queue empty). Remains multi-wave HOLD. |
  | wave-41 obs-2 | Symbol-grep false-positive | NOT CONFIRMED. V-1 karen used file:line git-show inspection against deployed tree (AppShell.tsx:59, ServerRail.tsx:125/240-243). Remains multi-wave HOLD. |
  | wave-41 obs-3 | Parallel-path enforcement gap | NOT CONFIRMED. No new parallel sibling method. Remains multi-wave HOLD. |
  | wave-40 obs-1 | T-8 fix mechanism contradicts architectural decision | NOT CONFIRMED. No architectural conflict; frontend-only nav-state wiring. Remains multi-wave HOLD. |
  | wave-40 obs-4 | Global 22P02 filter / text-keyed route params | NOT CONFIRMED. No text-keyed route params. Remains multi-wave HOLD. |

  Severity: informational (status checks only).
  Candidate principles file: none.
  Promotion flag: NO.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Interactive Home button in ServerRail shipped with no onClick from a prior wave; no test convention detected the gap; wired as part of this wave's fix | warning | 1st instance (no prior occurrence in wave-{52,53,54,55,56} archives; wave-52 subscribe_server_rooms hit confirmed as WS gateway verb, structurally distinct class; no rule in BUILD/PRODUCT/CI/VERIFY/T-{1..9} touches dead-onClick interactive nav controls) | BUILD-PRINCIPLES (rule 11 candidate shape) | HOLD — 1st instance; watch for 2nd wave where an interactive shell/nav button ships without a handler or a B-6 norm catches one |
| obs-2 | Sub-floor single-spec wave resolved by PRODUCT rule 5 override-ship; 8th instance; rule functioning correctly | informational | 8th instance (waves 50-57); PRODUCT rule 5 already promoted at wave-52 | none | NO ACTION — rule 5 in force and correctly applied |
| obs-3 | Status check on prior held observations | informational | status checks | none | STATUS CHECK ONLY |

**Observations emitted: 3 (obs-1 through obs-3)**
**Severities: 1 warning (obs-1), 1 informational (obs-2), 1 informational/status-check (obs-3)**
**Promotion-eligible this wave: NONE**
**Nominations for karen vetting: NONE this wave**

---

## Explicit recurrence verdict on the candidate per brief

**Question:** Is the dead-interactive-handler / no-op onClick on a nav/rail button a FIRST
INSTANCE or a 2nd+-instance of something already seen in prior-5-wave observations or
already covered by a promoted principles rule?

**Answer: FIRST-INSTANCE-HOLD.**

1. The wave-52 subscribe_server_rooms grep hit (wave-52/blocks/L/observations.md obs-1;
   T-5-tester-1.md) is a Socket.IO `@SubscribeMessage` backend gateway handler for a WS verb
   emitted from the browser. The class is "mocked-both-sides socket tests miss the initial
   client-emits-verb/server-pushes-snapshot handshake" — a realtime wire-protocol subscribe
   flow, not a DOM button element with no onClick. The wave-52 instance has nothing to do with
   an interactive UI control being decorative. Confirmed structurally distinct by direct reading
   of wave-52 obs-1 and T-5-tester-1.md ("client connected to /study-room but NEVER emitted a
   'subscribe to the server's rooms' handshake"). NOT a confirming instance.

2. Broader archive scan across waves 52-56 L-2 observations and all promoted principles files
   (BUILD rules 1-10, PRODUCT rules 1-5, CI rules 1-10, VERIFY rules 1-4, T-1 through T-9)
   returned no prior observation or rule of the class "interactive nav/rail button shipped
   without an onClick; gap undetectable by tests; surfaced as UX papercut." No existing rule
   encodes a B-6 norm for verifying interaction contracts on interactive-looking shell elements.

3. Wave-57 is the FIRST TIME this pattern surfaced as a structural L-2 observation. Carry to a
   second wave for confirmation before promotion. The candidate BUILD-PRINCIPLES rule 11 shape
   is pre-shaped above for karen's reference when a second instance is confirmed.
