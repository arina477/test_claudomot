# Wave 49 — L-block observations ledger

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read: process/waves/wave-49/ full artifact set (B-6-review, B-6-review-output,
B-6/gate-verdict, C-1-pr-ci-merge, T-1-static, T-2-unit, T-4-integration, T-5-tester-2,
T-6-layout, T-8-security, T-block/findings-aggregate, V-1-karen, V-1-jenny, V-2-triage,
V-3-fast-fix, V-block/gate-verdict).
Prior archives consulted: process/waves/_archive/wave-{45,46,47,48}/blocks/L/observations.md
(recurrence checks on B-5 CI command parity, realtime socket testing, responsive design
validation, and all prior held HOLDs).
Principles files read: BUILD-PRINCIPLES (9 rules), CI-PRINCIPLES (9 rules),
VERIFY-PRINCIPLES (4 rules), T-2.md (1 rule), T-4.md (0 rules), T-5.md (2 rules),
T-8.md (2 rules).

---

- **[obs-A — RECURRING (3rd failure instance): B-5 absent / CI command parity gap letting lint+test escapes reach C-1]**

  B-5 produced no deliverable and had not run the exact CI commands (`pnpm lint` == `biome ci .`,
  `pnpm test:ci`) before B-6 APPROVED. Four fix-up cycles were consumed at C-1 (lint: backtick
  SQL, dm.service.ts non-null assertion, flaky server-roles; test: real-PG integration failure
  from the pause ends_at production bug). C-1 explicitly notes: "B-5 verify deliverable absent
  — flagged for L-2 (CI-command parity gap let lint/test escapes reach C-1)." T-1 also flags it
  directly for L-2.

  Recurrence lineage:
  - wave-38 obs-1: B-5 specialist omits `biome ci .`; 3 deterministic Biome errors reach CI; 1
    fix-up commit. FIRST INSTANCE. HOLD.
  - wave-42 obs-2: test-automator pushes T-4 spec after tsc only; biome lint fails; 1 fix-up
    commit. SECOND FAILURE INSTANCE. PROMOTION-ELIGIBLE per wave-42 L-2 (BUILD rule 9 slot was
    taken by integration-spec-deferral candidate; wave-42 obs-2 was not promoted; class carried).
  - wave-49 (this wave): B-5 has NO deliverable and ran neither `biome ci .` nor `pnpm test:ci`
    before B-6 exit; 4 fix-up cycles at C-1. THIRD FAILURE INSTANCE.

  The class is not specialist-specific (wave-38 = B-5 build specialist; wave-42 = test-automator;
  wave-49 = B-5 entire stage missing). Three failure instances across distinct waves and agents
  confirm the class is structural. The candidate rule (wave-38 obs-1 shape, confirmed by wave-42
  obs-2) remains unapplied to BUILD-PRINCIPLES. Promotion path: BUILD rule 7 scope extension
  (adds "before exiting B-5" and specifies the exact command) or new rule 10.

  Source artifacts:
  - process/waves/wave-49/stages/C-1-pr-ci-merge.md (fix_up_cycles: 4; "B-5 verify deliverable
    absent — flagged for L-2")
  - process/waves/wave-49/stages/T-1-static.md (§ Discipline note: "B-5 verify must run the
    CI-identical commands (`pnpm lint`==`biome ci .`, `pnpm test:ci`) before B-6 APPROVED")
  - process/waves/_archive/wave-38/blocks/L/observations.md (obs-1, 1st instance)
  - process/waves/_archive/wave-42/blocks/L/observations.md (obs-2, 2nd instance, promotion-eligible)

  Severity: strong (3rd confirmed failure instance; 4 fix-up cycles cost; production bug
  exposure window extended by the absent verify step).
  Candidate principles file: command-center/principles/BUILD-PRINCIPLES.md (rule 10 or sharpen
  of rule 7).
  Candidate rule shape:
    10. At B-5, run `biome ci .` and the full test suite with the same env CI uses; do not exit
        B-5 without a verify deliverable.
        Why: An absent or partial verify lets deterministic lint and test failures reach C-1,
        costing fix-up cycles and hiding real production bugs.

  **L-2 wave-49 promotion outcome: karen APPROVE, but promotion blocked by linter; candidate dropped at L-2 wave-49 (reason: linter:why>100, 2 failures 104→101, 1 over the ≤100 cap after the cap-1 karen rewrite).** Per L-2 Action 6 "no second rewrite" the candidate drops; the lesson stays here as a STRONG 3rd-instance and re-nominates on next recurrence (a 4th instance, or a future L-2 promoting a pre-trimmed ≤100-char why line for BUILD rule 10). NOT lost — deferred on a 1-char format technicality, not a semantic rejection.
    Rule line = 100 chars; why line = 98 chars. No forbidden tokens.
  Recurrence: RECURRING — 3rd failure instance (waves 38, 42, 49). PROMOTION-ELIGIBLE.
  Promotion flag: YES — meets the 2+ wave bar; all three instances are cited; rule is
  generalizable and falsifiable (checkable: does the B-5 stage produce a verify deliverable
  that shows `biome ci .` exit 0 and the test suite passing?).

---

- **[obs-B — FIRST INSTANCE: realtime Socket.IO namespace mismatch invisible to mocked-both-sides tests; caught only at B-6]**

  B-6 attempt-1 REWORK: the frontend socket client used the `/messaging` namespace while the
  study-timer gateway was on `/study-timer`. Realtime sync and presence were silently dead
  end-to-end. This was not caught by the unit test suite because (a) the widget test mocked the
  socket module (`studyTimerSocket.ts` mocked entirely — no real namespace string was exercised),
  and (b) the backend integration test called the service directly without going through a real
  Socket.IO connection. No test performed a client-server namespace round-trip that would have
  forced the two sides to share the same path string.

  The generalizable class: a new Socket.IO gateway on a dedicated namespace needs at least one
  test asserting the client connects to the same namespace string the gateway listens on, via a
  real socket.io-client connection (not a mock). Mocking the socket module on the client and
  calling the service directly on the backend are both valid unit strategies, but together they
  leave a namespace-identity gap that unit coverage cannot detect. A real round-trip in T-4 (two
  socket.io-client instances joining the gateway's actual namespace) closes this gap.

  Near-dup check against T-2 rule 1 ("Assert what a non-sender recipient receives via the real
  fan-out routing, not a mocked room or topic join"): rule 1 addresses multi-client fan-out
  topology via real rooms. The namespace-identity class is orthogonal: it concerns whether
  client and server agree on the namespace path string, not fan-out routing within a correct
  namespace. Not a near-dup.
  Near-dup check against T-4.md (0 rules): no near-dup.
  Near-dup check against BUILD rules 1-9: no rule addresses socket namespace identity
  verification as an integration boundary. Not a near-dup.

  Source artifacts:
  - process/waves/wave-49/stages/B-6-review.md (§ Phase 1 — "Attempt 1: REWORK — Socket.IO
    namespace mismatch (frontend rode /messaging, gateway on /study-timer)")
  - process/waves/wave-49/blocks/B/gate-verdict.md (attempt 1 REWORK narrative; namespace fix
    commit a586ee4)
  - process/waves/wave-49/stages/T-2-unit.md (§ Coverage audit: "studyTimerSocket /study-timer
    namespace + reconnect re-join — regression test" added AFTER B-6 caught the mismatch)
  - process/waves/wave-49/stages/T-4-integration.md (no real socket connection in integration
    spec; gateway tested indirectly via service calls)

  Severity: warning (silent end-to-end failure in a shipped realtime feature; caught at B-6
  not T-block; a regression guard was added after the fact).
  Candidate principles file: command-center/principles/test-layer-principles/T-4.md (rule 1 —
  currently empty; a real namespace round-trip is an integration boundary, not a unit concern).
  Candidate rule shape:
    1. For a new Socket.IO gateway, assert client and server share the same namespace in a test
       that makes a real socket.io-client connection.
       Why: Mocking the socket module on both sides hides a namespace string mismatch that
       kills realtime silently.
    Rule line = 113 chars; why line = 95 chars. No forbidden tokens.
  Recurrence: FIRST INSTANCE. HOLD — promote on a second wave where a new Socket.IO gateway's
  client namespace diverges from the server namespace and a unit-only test suite misses it.

---

- **[obs-C — FIRST INSTANCE: B-block responsive implementation not validated against adopted D-3 design at each specified breakpoint]**

  F-1 (T-5/T-6, medium/non-blocking): the slim-bar phase indicator at `<1024px` was specified
  in the adopted D-3 design (`design/study-timer.html` adopts a distinct slim-bar visual for
  narrow viewports). The B-3 implementation set an inline `border` shorthand on the widget root
  that expanded to override `border-left`, causing the stylesheet's `.timer-phase-work` breakpoint
  rule to lose to inline specificity at all viewports. The adopted design breakpoint was never
  validated during B-3 or B-5. B-6 Phase-1 did not check responsive states against the adopted
  design. T-5 and T-6 caught it live on deployed state. V-3 head-verifier explicitly flagged it
  for L-block: "F-1 is a regression against a design the D-3 gate already adopted — capture at L
  whether the B-block responsive implementation validated against the adopted slim-bar mockup."

  The generalizable class: when a D-3 adopted design specifies distinct responsive states at
  named breakpoints, the B-block implementation must validate each of those breakpoint states
  against the adopted design (not just desktop widths) before B-6 APPROVED. An implementation
  that validates only at the largest viewport can ship a correct desktop experience while the
  narrow-viewport design contract is silently broken by a CSS specificity collision.

  Near-dup check against wave-44 obs-1 ("responsive/layout fix introduces overlay without full
  WCAG dialog contract; BUILD rule 10 candidate"): obs-1 is about a fix introducing an overlay
  that needs a WCAG dialog contract — the gap is an a11y obligation omitted from a fix-scoped
  surface. This class is about the responsive states of a NEW feature's B-3 implementation not
  being validated against the adopted design at each breakpoint. Different axis (design-contract
  validation vs. a11y contract completeness). Not a near-dup.
  Near-dup check against BUILD rules 1-9: no rule addresses responsive-breakpoint validation
  against the adopted D-3 design as a B-block exit condition. Not a near-dup.

  Source artifacts:
  - process/waves/wave-49/stages/T-5-tester-2.md (§ BUG-1: "inline border shorthand on
    StudyTimerWidget.tsx:476 outranks .timer-phase-work border-left in globals.css:310")
  - process/waves/wave-49/stages/T-6-layout.md (§ Diff findings: "BUG-1 — slim-bar absent
    <1024px; root cause: CSS specificity collision; non-blocking")
  - process/waves/wave-49/stages/V-3-fast-fix.md (§ L-block watch: "F-1 is a regression
    against a design the D-3 gate already adopted")
  - process/waves/wave-49/stages/V-2-triage.md (F-1 disposition: non-blocking; fast-follow
    task ffd98a36)

  Severity: warning (shipped to production with a design regression at a specified breakpoint;
  requires a follow-up fix task).
  Candidate principles file: command-center/principles/BUILD-PRINCIPLES.md (rule 10 slot,
  competing with wave-44 obs-1 which is a 4-wave HOLD for the same slot).
  Candidate rule shape:
    10. Validate each D-3-specified responsive breakpoint against the adopted design before
        B-6; a desktop-only validation can ship a broken narrow-viewport contract.
        Why: An inline style that passes desktop review can clobber a stylesheet breakpoint
        rule via specificity, silently removing the narrow-viewport affordance.
    Rule line = 110 chars; why line = 98 chars. No forbidden tokens.
  Recurrence: FIRST INSTANCE. HOLD — promote on a second wave where a B-block responsive
  implementation ships a narrow-viewport regression against an adopted D-3 breakpoint design.

---

- **[obs-D — confirmation-by-application: real-PG integration test caught pauseTimer ends_at production bug invisible to mocked units]**

  C-1 cycle 2 surfaced a real production bug: `pauseTimer` left `ends_at` populated with a stale
  future timestamp instead of setting it to null, causing all members to receive an incorrect
  remaining time and creating a resume-math risk. This was caught only by the real-Postgres
  integration test (`study-timer.integration.spec.ts` `doPhaseAdvance when paused`). The 638
  API unit tests, including 27 study-timer service cases, all passed without surfacing it — units
  mock the DB and cannot exercise the actual `ends_at` column state on pause. T-4
  confirms: "also caught the C-1 pause `ends_at` prod bug — only the real-PG test surfaced it."

  This is a direct confirmation-by-application of BUILD rule 9 ("Author an integration spec
  exercising every new service or DB boundary in the B-block, before the C-1 merge"). The
  integration spec was authored in the B-block (BUILD rule 9 followed), and the real-PG exercise
  caught a state-transition bug the mock-based unit suite was structurally incapable of catching.

  Source artifacts:
  - process/waves/wave-49/stages/C-1-pr-ci-merge.md (§ Fix-up cycle 2: "PRODUCTION BUG:
    pauseTimer left ends_at populated... Cleared the real-PG integration failure")
  - process/waves/wave-49/stages/T-4-integration.md (§ Boundary coverage: "also caught the
    C-1 pause ends_at prod bug — only the real-PG test surfaced it")
  - process/waves/wave-49/stages/T-2-unit.md (638 api unit passing without catching the bug)

  Severity: informational (BUILD rule 9 confirmed by correct application; no new principle
  class).
  Candidate principles file: none (BUILD rule 9 already encodes this obligation).
  Recurrence: CONFIRMATION-BY-APPLICATION of BUILD rule 9. Not a new candidate.

---

## Prior held observations — second-instance status check (wave-49)

| origin | obs | class | wave-49 status |
|--------|-----|-------|----------------|
| wave-44 obs-1 | Responsive/layout fix introduces overlay without full WCAG dialog contract; BUILD rule 10 | NOT CONFIRMED. Wave-49's F-1 is a different class: new feature's responsive breakpoint not validated against D-3 adopted design, not a fix introducing an overlay. Remains 5-wave HOLD (BUILD rule 10 candidate). |
| wave-45 obs-1 | Browser resolution in committed playwright config; T-5 rule 3 | NOT CONFIRMED. T-5 launched cleanly; no browser-resolution issue. Remains 4-wave HOLD. |
| wave-45 obs-2 | `playwright test --list` false-green for browser-resolution change; BUILD rule 10 | NOT CONFIRMED. No browser-resolution config change this wave. Remains 4-wave HOLD. |
| wave-47 obs-C | Display-identifier vs opaque-id mismatch; "Unknown user" sentinel; BUILD rule 10 | NOT CONFIRMED. No component rendering user identities via opaque-id mismatch this wave. Remains 2-wave HOLD. |
| wave-41 obs-1 | V-3 redeploy false-green; CI rule 7 | NOT CONFIRMED. No V-3 fast-fix redeploy (V-3 Phase 2 skipped). Remains 8-wave HOLD. |
| wave-41 obs-2 | Symbol-grep false-positive; VERIFY rule 5 slot | NOT CONFIRMED. No bundle verification via symbol-name grep. Remains 8-wave HOLD. |
| wave-41 obs-3 | Parallel-path enforcement gap; BUILD rule 10 | NOT CONFIRMED. No parallel-method enforcement boundary introduced this wave. Remains 8-wave HOLD. |
| wave-40 obs-1 | T-8 fix mechanism contradicts architectural decision; PRODUCT rule 4 | NOT CONFIRMED. No T-8-sourced architectural conflict. Remains 9-wave HOLD. |
| wave-40 obs-4 | Global 22P02 filter / text-keyed route params; BUILD rule 10 | NOT CONFIRMED. Non-UUID serverId → 500 found (T-8 rule 2 flagged it as accepted-debt inherited convention). Not a new instance of the specific text-column NUL-byte class; remains 9-wave HOLD. |
| wave-38 obs-1 / wave-42 obs-2 | B-5 CI command parity gap (biome ci + test suite); BUILD rule 10 | CONFIRMED — THIRD FAILURE INSTANCE. See obs-A above. Wave-49 B-5 had no deliverable and ran neither command; 4 fix-up cycles at C-1. Promotion-eligible carry from wave-42 obs-2 now strengthened to 3 confirmed instances. |

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-A | B-5 absent / CI command parity gap; lint + test escapes reach C-1; 4 fix-up cycles | strong | 3rd failure instance (waves 38, 42, 49); PROMOTION-ELIGIBLE | BUILD-PRINCIPLES rule 10 (or rule 7 sharpen) | PROMOTION CANDIDATE — 3 confirmed failures across distinct waves/agents; generalizable; falsifiable; cited |
| obs-B | Socket.IO namespace mismatch silent end-to-end; mocked-both-sides unit suite invisible to namespace string drift | warning | 1st instance | T-4.md rule 1 | HOLD — promote on 2nd confirming wave |
| obs-C | Responsive breakpoint not validated against D-3 adopted design at B-block; narrow-viewport contract broken by CSS specificity collision | warning | 1st instance | BUILD-PRINCIPLES rule 10 | HOLD — promote on 2nd confirming wave |
| obs-D | Real-PG integration caught pauseTimer ends_at production bug; units structurally cannot catch DB state-transition bugs | informational | confirmation-by-application of BUILD rule 9 | none (rule 9 already encodes) | NOT A NEW CANDIDATE |

**Observations emitted: 4 (obs-A through obs-D)**
**Severities: 1 strong (obs-A), 2 warning (obs-B, obs-C), 1 informational (obs-D)**
**Promotion-eligible: obs-A (3rd failure instance; BUILD-PRINCIPLES rule 10)**
**Nomination for karen vet: obs-A only (other observations are first-instance HOLDs or confirmations)**
