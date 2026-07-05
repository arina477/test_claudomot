# Wave 52 — L-block observations ledger

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read: process/waves/wave-52/ full artifact set (P-1-decompose, B-6-review, B/gate-verdict,
T-5-e2e, T-5-tester-1, T/gate-verdict, V-1-karen, V-1-jenny, V-2-triage, V-3-fast-fix,
V/gate-verdict).
Prior archives consulted: process/waves/_archive/wave-{49,50,51}/blocks/L/observations.md
(recurrence checks on mocked-both-sides socket class, floor carve-out class, gate-agent
discipline class, and all prior held HOLDs).
Principles files read: BUILD-PRINCIPLES.md (10 rules), PRODUCT-PRINCIPLES.md (4 rules),
VERIFY-PRINCIPLES.md (4 rules), T-4.md (0 rules), T-5.md (2 rules).

---

- **[obs-1 — RECURRING (2nd instance): mocked-both-sides socket unit tests leave realtime wire contracts unverified; T-5 E2E caught a live-blocking bug the full unit suite missed]**

  The focus-room panel shipped stuck permanently on its loading skeleton in live production.
  Root cause: the client connected to `/study-room` but never emitted the initial
  `subscribe_server_rooms` handshake; the backend only pushed the open-rooms list on receipt
  of that verb — a chicken-and-egg that the loading skeleton depended on resolving. The unit
  test suite (43 service + 10 gateway + 24 frontend tests) did not catch this because both
  sides of the socket were mocked: the frontend test mocked `studyRoomSocket.ts` entirely, and
  the backend spec called the service directly. No test exercised a real client emitting the
  subscribe verb and receiving the snapshot response — i.e. no test exercised the initial-state
  handshake that a real browser client must complete before any rooms event arrives.

  This is the second instance of the mocked-both-sides realtime class. The first instance is
  wave-49 obs-B: a frontend socket mocked to `/messaging` while the gateway lived at
  `/study-timer`; the namespace mismatch was invisible to all tests because neither side made
  a real socket.io-client connection. Both instances share the same structural gap: unit tests
  mock both the client socket module AND the backend event dispatch, so they cannot detect a
  failure in the actual client-server wire protocol (whether a wrong namespace, a missing
  initial verb, or a missing initial push).

  Wave-49 obs-B was framed narrowly (namespace string mismatch, T-4 candidate). Wave-52
  widens the class: the gap is not namespace-specific — it is any initial realtime handshake
  that a real client must perform to receive its first server-push snapshot. Both instances are
  prevented by the same remedy: a real-socket E2E (T-5 or T-4) that exercises the full
  client-initiates-connect-emits-verb-receives-snapshot flow, not just individual event
  round-trips within an already-subscribed session. T-5 caught it because T-5 drives a real
  browser over a real WebSocket to a live server.

  The fix (PR #67, `725f7b6`) was a production code change, not a test-only patch: backend
  `subscribe_server_rooms` handler + frontend emit-on-mount + reconnect re-subscribe. The
  sibling study-timer feature avoids this class because `join_timer_room` is emitted on mount
  and the first push is unconditional.

  Source artifacts:
  - process/waves/wave-52/stages/T-5-tester-1.md (FAIL root cause: "client connected to
    /study-room but NEVER emitted a 'subscribe to the server's rooms' handshake; unit tests
    mocked the socket + fired events directly -> missed the initial-snapshot flow")
  - process/waves/wave-52/stages/T-5-e2e.md (fix-up cycle 1 narrative; L-2 note flagged)
  - process/waves/_archive/wave-49/blocks/L/observations.md (obs-B — 1st instance; same
    mocked-both-sides structural gap; different symptom: namespace string mismatch at B-6)

  Severity: strong (live-blocking in production; all unit tests passed; fix required a
  production code change and redeployment; prevented from shipping only by T-5 E2E against
  real deployed state).
  Candidate principles file: command-center/principles/test-layer-principles/T-5.md (rule 3).
  Candidate rule (pre-trimmed, char-counted):
  ```
  3. A realtime feature's initial subscribe-and-snapshot flow needs a real-socket E2E; event-mocked unit tests assume the subscription already succeeded.
     Why: A mocked socket never exercises the initial client verb that triggers the first server push, leaving that path untested.
  ```
  Rule line: "3. A realtime feature's initial subscribe-and-snapshot flow needs a real-socket E2E; event-mocked unit tests assume the subscription already succeeded." = 153 chars. OVER 120. Trim:
  "3. Cover a realtime feature's initial server-push handshake with a real-socket E2E, not only event-round-trip unit tests." = 121 chars. OVER by 1. Trim:
  "3. Cover a realtime feature's initial server-push handshake with a real-socket E2E, not event-round-trip unit tests." = 116 chars. PASS (<=120).
  Why line: "   Why: A mocked socket never fires the client verb that triggers the first push, so the skeleton-resolve path is untested." = 122 chars WITH indent. OVER. Trim:
  "   Why: A mocked socket skips the initial client verb, leaving the first-push path untested." = 93 chars. PASS (<=100).
  No forbidden tokens. No near-dup with T-5 rules 1-2. PASS.
  Recurrence: SECOND INSTANCE (wave-49 obs-B first; wave-52 second — both mocked-both-sides
    socket, different symptom but same structural gap and same remedy).
  Promotion flag: YES — 2-wave bar met; generalizable (any realtime feature with an
    initial subscribe handshake); falsifiable (checkable: does T-5 or a real-socket test
    exercise the client emitting the initial subscribe verb and receiving the first server push
    on a live server, not a mocked socket?); cited (T-5-tester-1 + T-5-e2e + wave-49 obs-B).
  NOMINATION for karen vetting at L-2 (T-5.md rule 3).

---

- **[obs-2 — POSITIVE CONFIRMATION: wave-49 namespace-mismatch lesson applied correctly; regression-guard test held]**

  The studyRoomSocket client was connected to `/study-room` (matching the gateway namespace),
  and a regression-guard test in `studyRoomSocket.test.ts:35-55` asserts the URL ends with
  `/study-room` and is NOT `/messaging` or `/study-timer`. B-6 and karen V-1 both verified
  this. The wave-49 namespace-mismatch class (obs-B) was not repeated.

  This is a confirmation-by-correct-application. The lesson from wave-49 obs-B was not
  promoted to T-4.md (first instance, no second failure at the time). Wave-52 does not provide
  a second failure instance of the namespace-mismatch sub-class; it provides a positive
  application. The held obs-B HOLD from wave-49 remains on hold pending a second failure
  instance (a new gateway whose client namespace diverges from the server namespace and where
  the unit test suite fails to catch it). This wave reduces that risk — but a positive
  application does not confirm the promotion bar.

  Source artifacts:
  - process/waves/wave-52/stages/V-1-karen.md (MUST-LOCK 2: "studyRoomSocket.ts:88 connects
    to /study-room; regression-guard test asserts URL ends /study-room and NOT /messaging or
    /study-timer")
  - process/waves/wave-52/blocks/B/gate-verdict.md (MUST-LOCK 2 verified)

  Severity: informational (no new failure; positive application of prior learning).
  Candidate principles file: none (wave-49 obs-B HOLD unchanged; not a new candidate).
  Promotion flag: NO — confirmation-by-application; hold maintained on wave-49 obs-B.

---

- **[obs-3 — FIRST INSTANCE: gate agents attempt direct principles-file writes; sound lesson proposed but routed incorrectly]**

  The V-3 head-verifier correctly identified a generalizable VERIFY lesson — that a gate agent
  should independently re-grep a zero-finding pass on a load-bearing change, not accept a clean
  verdict unprobed — and then appended it directly to VERIFY-PRINCIPLES.md, bypassing L-2 and
  the karen-vet + linter gate (rule 12 violation). The orchestrator reverted the append. The
  proposed lesson itself was sound: the head-verifier DID independently re-grep all 3 MUST-locks
  this wave and confirmed clean; the proposed rule would formalize that behavior as a gate norm.

  Two separable points:

  (a) The VERIFY lesson (independently re-verify a zero-finding pass on load-bearing claims
  before closing the gate) is a legitimate first-instance candidate. The head-verifier's own
  behavior this wave is a single data point. The lesson needs a second wave where a zero-finding
  pass on a load-bearing claim was accepted without independent re-verification and something
  slipped through to confirm the causal link. HOLD.

  (b) The rule-12 discipline gap — gate agents writing to principles files directly — is a
  first-instance process observation. It is not the first time a gate agent has proposed a
  principle; it is the first time one has written it directly to the file. Process-discipline
  observations of this class (agent exceeds authority boundary) are logged but not promoted
  unless they become recurring enough to warrant a stated norm. HOLD at informational.

  Source artifacts:
  - process/waves/wave-52/stages/V-3-fast-fix.md (§ Note: "head-verifier ALSO directly
    appended a rule 5 to VERIFY-PRINCIPLES.md — DISCIPLINE VIOLATION; orchestrator REVERTED
    the unauthorized append; the lesson is a legitimate L-2 candidate to be considered
    properly at L-2")
  - process/waves/wave-52/blocks/V/gate-verdict.md (head-verifier independently re-grepped
    3 MUST-locks and confirmed clean — the behavior that motivated the proposed rule)

  Severity: informational (no production consequence; lesson reverted; proposed rule was
  sound but process was wrong).
  Candidate principles file (sub-point a): VERIFY-PRINCIPLES.md rule 5 — first instance, HOLD.
  Candidate rule shape (sub-point a):
    "5. Before closing a gate with zero findings on a load-bearing claim, independently re-grep or re-probe the claim; do not accept a clean verdict unprobed." = 151 chars. OVER.
    "5. Independently re-verify a zero-finding pass on every load-bearing claim at gate; a clean verdict accepted without probing is not evidence." = 141 chars. OVER.
    "5. At any gate, independently re-probe load-bearing claims before accepting a zero-finding verdict." = 100 chars. PASS (<=120).
    Why: "   Why: A reviewer who reports clean without probing may have missed what a re-grep would surface." = 98 chars. PASS (<=100).
    No forbidden tokens. PASS shape.
  Promotion flag: HOLD — first instance; needs a second wave where a zero-finding gate
    pass on a load-bearing claim was accepted unprobed and missed a real defect.

---

- **[obs-4 — RECURRING (3rd instance): reuse-heavy multi-spec waves mechanically trip the sub-floor; override-ship is correct but adds per-wave cognition cost]**

  Wave-52 P-1 estimated ~2,200 net LOC for a 3-task bundle (multi-spec wave type), tripping the
  multi-spec floor threshold of >2,500 LOC or >=6 tasks. Override-ship was correct: the only
  split candidate (room-timer, ~700-900 LOC) would drive the residual below BOTH multi- AND
  single-spec floors; all three P-0 reviewers scope-endorsed the bundle; and the feature is a
  genuine founder-directed headline feature (ceo-reviewer HOLD-SCOPE'd against expansion). The
  actual shipped LOC was approximately 5,000 (the ~2,200 estimate was conservative for a new
  realtime namespace + presence + rooms-CRUD + UI panel + room-timer). The floor tripped on the
  estimate, not the actual. Even on the estimate, override was the only legal path.

  This is the third consecutive wave of the same class: wave-50 (multi-spec, custom-duration
  feature-completion + V-2-debt regression fix, first instance); wave-51 (single-spec, DM layout
  V-2-debt fix, ~<100 LOC, second instance); wave-52 (multi-spec, joinable focus room, third
  instance). All three are legitimately-substantial or legitimately-small high-value waves that
  the floor's stated purpose (blocking wasteful greenfield micro-waves) does not cover. All three
  resolved identically: override-ship by rule (mvp-thinner floor_constraint_active + zero valid
  split candidates + unanimous P-0 scope endorsement = no BOARD, no decomposer expand).

  The recurring cognition cost is: P-1 must run the floor rubric, log a floor trip, log a
  product-decision entry, and justify the override explicitly — all for a wave that a human
  reviewing the feature description would immediately recognize as legitimate. The floor rubric
  has no carve-out for reuse-heavy slices where the LOC estimate underestimates actual scope, or
  for V-2-debt fixes with no expansion path, or for in-memory features that reuse existing
  infrastructure heavily. A PRODUCT-PRINCIPLES rule encoding the override-by-rule condition
  would make the resolution path mechanical rather than requiring per-wave re-argumentation.

  Source artifacts:
  - process/waves/wave-52/stages/P-1-decompose.md (floor trip, override-ship; l2_flag:
    "sub-floor reuse-heavy-slice override — obs-B 3rd instance (waves 50/51/52);
    floor-carve-out candidate now strongly recurring, promote at L-2")
  - process/waves/_archive/wave-51/blocks/L/observations.md (obs-B — 2nd instance;
    HOLD-SECONDARY on slot competition with obs-A; carry flagged to wave-52 for rule 5)
  - process/waves/_archive/wave-50/blocks/L/observations.md (obs-B — 1st instance;
    l2_flag: "recurring sub-floor feature-completion override — floor rubric carve-out candidate")

  Severity: strong (3rd consecutive instance; per-wave cognition and documentation overhead;
  no valid alternative resolution; floor rubric mechanically mis-classifies high-value waves).
  Candidate principles file: command-center/principles/PRODUCT-PRINCIPLES.md (rule 5 — next
  open slot; rule 4 taken by wave-51 obs-A cross-surface reachability promotion).
  Candidate rule (pre-trimmed, char-counted):
  ```
  5. When mvp-thinner returns floor_constraint_active with zero valid split candidates, waive the floor by rule; no BOARD convene is required.
     Why: The floor targets wasteful tiny greenfield waves; a feature with no expansion path is not that class.
  ```
  Rule line: "5. When mvp-thinner returns floor_constraint_active with zero valid split candidates, waive the floor by rule; no BOARD convene is required." = 140 chars. OVER.
  Trim: "5. When mvp-thinner returns floor_constraint_active with zero split candidates, waive the floor; no BOARD is required." = 117 chars. PASS (<=120).
  Why line: "   Why: The floor targets wasteful tiny greenfield waves; a feature with no expansion path is not that class." = 109 chars WITH indent. OVER.
  Trim: "   Why: The floor targets wasteful greenfield micro-waves; a feature with no valid split is exempt." = 99 chars. PASS (<=100).
  No forbidden tokens (checked: no `we`, `our`, `the team`, `wave-<N>`, em-dash; parenthetical "no BOARD is required" is 4 words). PASS.
  Near-dup check against PRODUCT rules 1-4: rule 1 (seed claims), rule 2 (named entity),
  rule 3 (credential-independent ACs), rule 4 (cross-surface state reachability). None address
  the floor-waiver class. Not a near-dup.
  Recurrence: THIRD INSTANCE (waves 50, 51, 52 — all consecutive). PROMOTION-ELIGIBLE.
  Promotion flag: YES — 3-wave bar met (exceeds the 2-wave minimum); generalizable
    (any wave where reuse-heavy scope or a V-2-debt fix trims estimated LOC below the floor);
    falsifiable (checkable: does mvp-thinner return floor_constraint_active with zero split
    candidates? if yes, the rule prescribes the outcome mechanically); cited (P-1-decompose
    wave-52 l2_flag, wave-51 obs-B HOLD-SECONDARY carry, wave-50 obs-B first instance).
  NOMINATION for karen vetting at L-2 (PRODUCT-PRINCIPLES rule 5). Second nomination this
  wave (first is obs-1 targeting T-5.md rule 3 — different file, no slot conflict).

---

- **[obs-5 — status check on prior held observations]**

  | origin | obs | class | wave-52 status |
  |--------|-----|-------|----------------|
  | wave-49 obs-B | Socket.IO namespace mismatch; mocked-both-sides unit suite invisible to namespace string drift; T-4.md rule 1 | PARTIALLY ABSORBED by obs-1 above (2nd instance of the broader mocked-both-sides class). The wave-52 instance is a different symptom (initial handshake, not namespace string); the namespace-mismatch sub-class itself is NOT confirmed as a second failure (this wave applied the lesson correctly per obs-2). Wave-49 obs-B HOLD maintained for T-4.md — a second namespace-mismatch failure instance is still needed for T-4 rule 1 specifically. |
  | wave-49 obs-C | Responsive breakpoint not validated against D-3 adopted design at B-block | NOT CONFIRMED. Wave-52's D-block produced a focus-room-panel design that was adopted; T-5 S5 / T-6 validated responsive states (compact <1024px bar) and passed without finding a breakpoint regression. Positive application. Remains 3-wave HOLD. |
  | wave-50 obs-B | Parallel T-5 testers block on shared MCP Chrome profile | NOT CONFIRMED. Wave-52 T-5 used a single tester (1 ui-comprehensive-tester, playwright node package). Remains 2-wave HOLD. |
  | wave-50 obs-C | P-4/plan review enumerate compute-on-read walk paths for new per-row parameter | NOT CONFIRMED. Wave-52's room-timer reuses wave-49/50 CAS and phase formulas; no new per-row parameter walk introduced. Remains 2-wave HOLD. |
  | wave-44 obs-1 | Responsive/layout fix introduces overlay without WCAG dialog contract | NOT CONFIRMED. No layout fix introducing an overlay. Remains 8-wave HOLD. |
  | wave-45 obs-1 | Browser resolution in committed playwright config | NOT CONFIRMED. T-5 launched cleanly via node package. Remains 7-wave HOLD. |
  | wave-45 obs-2 | `playwright test --list` false-green for browser-resolution change | NOT CONFIRMED. No Playwright config change. Remains 7-wave HOLD. |
  | wave-47 obs-C | Display-identifier vs opaque-id mismatch | NOT CONFIRMED. No component rendering user identities via opaque-id. Remains 5-wave HOLD. |
  | wave-41 obs-1 | V-3 redeploy false-green | NOT CONFIRMED. V-3 Phase 2 not triggered (fast-fix queue empty). Remains 11-wave HOLD. |
  | wave-41 obs-2 | Symbol-grep false-positive | NOT CONFIRMED. V-1 karen verified via file:line grep and live namespace probe, not symbol-name grep. Remains 11-wave HOLD. |
  | wave-41 obs-3 | Parallel-path enforcement gap | NOT CONFIRMED. No new parallel sibling method introduced. Remains 11-wave HOLD. |
  | wave-40 obs-1 | T-8 fix mechanism contradicts architectural decision | NOT CONFIRMED. No T-8-sourced architectural conflict. Remains 12-wave HOLD. |
  | wave-40 obs-4 | Global 22P02 filter / text-keyed route params | NOT CONFIRMED. No text-keyed route params introduced. Remains 12-wave HOLD. |

  Severity: informational (status checks only).
  Candidate principles file: none.
  Promotion flag: NO.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Mocked-both-sides socket tests miss initial server-push handshake; T-5 caught live-blocking skeleton-stuck bug the full unit suite passed | strong | 2nd instance (wave-49 obs-B same structural gap, different symptom) | T-5.md rule 3 | PROMOTION CANDIDATE — 2-wave bar met; generalizable; falsifiable; cited; nominate for karen |
| obs-2 | Wave-49 namespace-mismatch lesson correctly applied; regression-guard test in place; wave-49 obs-B HOLD unchanged | informational | confirmation-by-application; wave-49 obs-B namespace HOLD maintained | none | HOLD maintained (wave-49 obs-B needs second failure instance for T-4.md) |
| obs-3 | Gate agent (V-3 head-verifier) appended directly to VERIFY-PRINCIPLES bypassing L-2; proposed lesson sound; append reverted | informational | 1st instance (discipline); 1st instance (VERIFY lesson itself) | VERIFY-PRINCIPLES rule 5 | HOLD — promote VERIFY lesson on 2nd wave where unprobed zero-finding gate passes a defect |
| obs-4 | Sub-floor reuse-heavy multi-spec waves resolved by override-ship three consecutive waves; floor rubric carve-out | strong | 3rd instance (waves 50, 51, 52) | PRODUCT-PRINCIPLES rule 5 | PROMOTION CANDIDATE — 3-wave bar met; generalizable; falsifiable; cited; nominate for karen |
| obs-5 | Status check on prior held observations | informational | status checks | null | STATUS CHECK ONLY |

**Observations emitted: 5 (obs-1 through obs-5)**
**Severities: 2 strong (obs-1, obs-4), 1 informational-first-instance (obs-3), 1 informational-confirmation (obs-2), 1 status-check (obs-5)**
**Promotion-eligible: obs-1 (T-5.md rule 3, 2-wave bar met) AND obs-4 (PRODUCT-PRINCIPLES rule 5, 3-wave bar met)**
**Nominations for karen vetting: TWO this wave — obs-1 (T-5.md rule 3) and obs-4 (PRODUCT-PRINCIPLES rule 5). No slot conflict: different files.**
