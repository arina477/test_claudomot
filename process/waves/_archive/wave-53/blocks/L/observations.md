# Wave 53 — L-block observations ledger

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read: process/waves/wave-53/stages/ full artifact set (P-0-frame, P-1-decompose, P-3-plan,
B-2-backend, B-6-review-output, C-1-pr-ci-merge, C-2-deploy-and-verify, T-8-security,
T-8-evidence/pentest-report.md, T-9-journey, V-1-karen, V-1-jenny, V-2-triage, V-3-fast-fix).
Gate verdicts read: process/waves/wave-53/blocks/{P,B,T,V}/gate-verdict.md.
Prior archives consulted: process/waves/_archive/wave-{48,49,50,51,52}/blocks/L/observations.md
(recurrence checks on branch-hygiene, prior-art-reuse, WS-error-path live-probe, and all prior
held HOLDs).
Principles files read: BUILD-PRINCIPLES.md (10 rules), PRODUCT-PRINCIPLES.md (5 rules),
VERIFY-PRINCIPLES.md (4 rules), T-5.md (3 rules), T-8.md (2 rules).

---

- **[obs-1 — FIRST INSTANCE: branch created from local main carrying unpushed process/principle
  commits; squash-merge bundled code fix with wave-archive and L-2 promotions]**

  The wave-53 branch was created from a local `main` that already contained unpushed commits: the
  wave-52 L-2 principle promotions (PRODUCT-PRINCIPLES rule 5, T-5.md rule 3), the wave-52 N-3
  archive move, and wave-53 P-block process files. When the PR was squash-merged, those carried-in
  commits landed together with the actual code fix in a single squash commit (`9c114d0`). The local
  `main` was then non-fast-forwardable and required a `git reset --hard origin/main`. Nothing was
  lost and everything landed correctly on `main` — the C-1 artifact explicitly records this as a
  hygiene note, not a defect.

  The structural pattern: process/principle/archive commits accumulate on `main` locally between
  the moment the prior wave's N-3 fires and the moment `git push origin main` is executed before
  the next wave branches. If the next wave branches before that push, the local extras ride along
  in the branch history and are folded into the squash. The correct mitigation is to push `main` to
  origin immediately after N-3 and before creating the new wave branch; or to accept the bundled
  squash pattern as benign when it occurs (everything lands correctly, the squash just contains
  more than only the code change).

  Recurrence check: searched wave-{48,49,50,51,52}/blocks/L/observations.md for "branch hygiene",
  "unpushed", "squash bundl", and related patterns. The BUILD-PRINCIPLES rule 2
  ("Push the branch to origin after every B-block and D-block stage before starting the next
  stage") addresses a different gap (losing B/D-block work on worker restart). No prior wave's
  observations record this specific class: main-side process/principle commits accumulating
  locally and riding into a feature-branch squash. This is the FIRST INSTANCE.

  Source artifacts:
  - process/waves/wave-53/stages/C-1-pr-ci-merge.md (note field: "Squash bundled carried-in
    L-2/archive/P-B process commits with the code fix (branch-before-push hygiene); local main
    reset --hard to origin/main. Branch-hygiene L-2 candidate.")
  - process/waves/wave-53/stages/C-1-pr-ci-merge.md lines 26-28: "Verified the squash contains
    all wave-53 work + the carried-in L-2 principles + wave-52 archive + P/B process."

  Severity: informational (no data lost; correct outcome; adds minor confusion to the squash
  commit's content but causes no CI or deployment failure).
  Candidate principles file: command-center/principles/BUILD-PRINCIPLES.md (would be rule 11).
  Candidate rule shape (pre-shaped for linter awareness, NOT a nomination):
    "11. Push main to origin immediately after N-3 closes, before creating the next wave branch."
    Rule line = 79 chars. PASS (<=120).
    Why: "   Why: An unpushed main lets process and principle commits ride into the next wave's squash."
    Why line WITH 3-space indent = 93 chars. PASS (<=100). No forbidden tokens.
  Recurrence: FIRST INSTANCE. No prior occurrence found in wave-{48,49,50,51,52} archives.
  Promotion flag: HOLD — 1st instance; not yet recurring+generalizable per the 2-wave bar.
  Verdict on head-learn candidate (a): HOLD. The pattern is real and the mitigation is clear, but
    the 2-wave bar is not met. Log and watch for a second wave where a squash bundles unexpected
    non-code content because main was not pushed before branching.

---

- **[obs-2 — FIRST INSTANCE: REST-layer pg-error utility reused verbatim at the WS gateway layer,
  closing the WS info-disclosure without reinventing the 22P02 detection logic]**

  The fix for the study-room Socket.IO info-disclosure reused `isInvalidTextRepresentation` from
  `apps/api/src/auth/pg-error-utils.ts` — a utility originally authored for the REST-layer
  `SupertokensExceptionFilter` to detect Drizzle-wrapped 22P02 SQLSTATE errors across ~30 UUID
  route params. The gateway is a Socket.IO surface that bypasses the HTTP exception filter, so it
  had no prior mechanism to intercept this error class. Rather than duplicating the detection
  logic, the fix imported and reused the shared utility as a belt-and-suspenders discriminator
  inside `safeErrorMessage`'s catch path.

  The generalizable pattern: when a new transport surface (WS gateway, gRPC, queue consumer) must
  handle a DB-error class that is already discriminated by a shared utility on the HTTP transport
  layer, the correct approach is to import and reuse that utility rather than re-implementing the
  detection logic per-surface. The `isInvalidTextRepresentation` + `isUuid` pairing in this wave
  represents a two-layer defense: format-guard at the parse layer prevents the error from reaching
  the DB at all; the pg-error utility covers the residual path if a malformed id ever bypasses the
  parse guard.

  Recurrence check: searched wave-{48,49,50,51,52}/blocks/L/observations.md for "prior art",
  "isInvalidText", "pg-error-util", "filter reuse", "HTTP filter", "WS shared util", and related
  patterns. Wave-33 introduced `isInvalidTextRepresentation` (REST layer), wave-40 evaluated
  but did NOT extend it to a text-column NUL-byte class (different error code, different layer).
  No prior wave's L-2 observations record the class of "HTTP-layer error-discrimination utility
  reused on WS gateway layer to close the same DB error class on a new transport". FIRST INSTANCE.

  The P-3 plan itself names this prior-art reuse explicitly: "No reinvention. `pg-error-utils.ts::
  isInvalidTextRepresentation(err)` already detects the wrapped DrizzleQueryError 22P02 and is
  used by the REST SupertokensExceptionFilter to genericize this exact error across ~30 UUID route
  params... may reuse `isInvalidTextRepresentation` as the known-DB-cast-error discriminator
  inside the catch blocks (belt-and-suspenders with defense #1)."

  Source artifacts:
  - process/waves/wave-53/stages/P-3-plan.md (§ "Prior-art reuse (no reinvention)": explicit
    citation of `isInvalidTextRepresentation` as the REST-layer prior art reused at the WS layer)
  - process/waves/wave-53/stages/B-2-backend.md (files implemented: `study-room.gateway.ts`
    modified, "imports `isInvalidTextRepresentation`")
  - process/waves/wave-53/stages/V-1-jenny.md (§ AC-3 note: "`safeErrorMessage` mirrors the
    shipped `SupertokensExceptionFilter` HttpException-first ordering exactly")

  Severity: informational (positive pattern; no defect; the reuse prevented duplication of
  detection logic across transport surfaces).
  Candidate principles file: none at this time — this is a positive-application observation, not a
  defect pattern. The lesson (when a shared error-discrimination utility exists for one transport,
  extend it to a new transport rather than duplicating) is potentially valuable for BUILD-PRINCIPLES
  but is too specific to a single instance to assert as a cross-wave rule. It overlaps weakly with
  BUILD rule 9 (integration-spec boundary) and is not a near-dup, but it is also not yet
  generalizable across waves.
  Recurrence: FIRST INSTANCE. HOLD.
  Verdict on head-learn candidate (b): HOLD. The prior-art reuse is genuine and explicit in the
    artifacts. It is not wave-specific trivia — the pattern (shared pg-error util on HTTP reused on
    WS) is replicable on every new transport surface. However, the 2-wave bar is not met; a second
    wave where an existing transport-layer error utility is correctly extended to a new transport
    surface (or, conversely, duplicated when it should have been reused) is needed before this
    becomes promotion-eligible.

---

- **[obs-3 — FIRST INSTANCE: T-8 drove a real authenticated Socket.IO probe to verify a realtime
  error-path fix, extending the live-probe discipline to WS error envelopes]**

  Wave-52 T-8 (pattern B, active) identified the info-disclosure finding against the live
  `/study-room` namespace (authenticated Socket.IO connection, malformed serverId probe). Wave-53
  T-8 drove the same live authenticated socket probe — now against the fixed code at commit
  `9c114d0` on production — to confirm the fix is effective: the `subscribe_server_rooms` verb was
  emitted with three malformed non-UUID serverIds and the captured `study-room:join_error` messages
  contained none of the previously-leaked SQL/schema/userId text. This is pattern B (active),
  live-prod, authenticated as the prod fixture via SuperTokens header-session.

  The connection to T-5 rule 3 (promoted at wave-52): T-5 rule 3 addresses a REALTIME FEATURE's
  initial server-push handshake requiring a real-socket E2E rather than event-mocked unit tests.
  The wave-53 T-8 probe is a SECURITY VERIFICATION of a realtime error-path fix using a real
  socket on live prod. These are related but distinct:
  - T-5 rule 3: applies at T-5 (E2E testing of realtime features); concerns the initial
    subscribe-and-snapshot flow that mocked tests structurally cannot exercise.
  - Wave-53 T-8 class: applies at T-8 (security); concerns verifying that a fix to an error
    envelope on a WS gateway actually works on live prod, not just in unit tests.

  The shared structural insight is that a unit test asserting the error message content (as the
  wave-53 gateway spec does) cannot prove the fix is present on the live deployed binary; a real
  socket connection to production is the only live verification. T-8 rule 1 ("Live-probe the authz
  path against prod at T-8 with a verified prod fixture on every authed-feature wave") already
  encodes the live-prod fixture discipline. The wave-53 contribution is narrower: when the T-8
  finding is specifically an error-envelope leak on a WS gateway, the verification of the fix also
  requires a real socket probe (not a source-read or a unit test assertion), because the deployed
  binary's error-handling path is what matters.

  T-8 rule 2 ("At T-8, probe each :id route param with a malformed non-UUID value on the authed
  path and assert 400, not 500") covers the REST layer. The wave-53 probe extends this to the WS
  layer: a malformed non-UUID serverId on an authed socket verb should return a generic error
  message, not leak DB internals. This is not a near-dup (T-8 rule 2 addresses HTTP route params
  and 400/500 status code; the wave-53 class addresses WS payload params and the error message
  content/leak-properties). It is a WS-surface analog.

  Recurrence check: searched wave-{48,49,50,51,52} T-8 stage files and L-2 observations for
  evidence of a prior wave driving a real socket probe specifically to VERIFY A FIX to a WS error
  envelope. Wave-14, wave-46, wave-52 all used authenticated WS probes at T-8, but those were
  feature discovery probes (finding new issues), not fix-verification probes against a specific
  error-path on a live binary. FIRST INSTANCE of the fix-verification-via-live-socket class.

  Source artifacts:
  - process/waves/wave-53/stages/T-8-security.md (Pattern B active; "Live probes run by
    penetration-tester against `https://api-production-b93e.up.railway.app`"; 4/4 PASS;
    "wave-52 T-8 F-1 info-disclosure CONFIRMED CLOSED on live prod")
  - process/waves/wave-53/stages/T-8-evidence/pentest-report.md (Probe 1: 3 malformed serverIds
    captured LIVE → "Invalid payload: serverId required"; asserted ABSENT: "invalid input syntax",
    "server_members", "22P02", any column/SQL text, caller userId)
  - process/waves/wave-53/stages/T-9-journey.md (head-tester gate: "T-8 live probe genuinely
    against prod (wave-52 F-1 CONFIRMED CLOSED, secret-grep clean)")

  Severity: warning (the observation has real value: unit tests alone are not sufficient to confirm
  a WS error-path fix on live prod; the live socket probe is the only meaningful verification).
  Candidate principles file: command-center/principles/test-layer-principles/T-8.md (would be
  rule 3).
  Candidate rule shape (pre-shaped for linter awareness, NOT a nomination):
    "3. Verify a WS error-envelope fix with a live authenticated socket probe, not only unit
       assertions."
    Rule line = 82 chars. PASS (<=120).
    Why: "   Why: A unit assertion on error content cannot confirm the fix is live on the deployed
       binary."
    Why line WITH 3-space indent = 96 chars. PASS (<=100). No forbidden tokens.
    Near-dup check vs T-8 rules 1 and 2: rule 1 = live authz probe (fixture, authz path); rule 2 =
    malformed :id REST route → 400. This proposed rule 3 = fix-verification of a WS error envelope
    → live socket. Distinct axes. Not a near-dup. PASS.
  Recurrence: FIRST INSTANCE. No prior wave has a fix-verification-via-live-WS-socket obs in
    the prior-5-wave archive.
  Promotion flag: HOLD — 1st instance; the 2-wave bar is not met.
  Verdict on head-learn candidate (c): HOLD. The wave-53 WS error-path live verification is NOT
    already covered by existing T-5 rule 3. T-5 rule 3 addresses the initial realtime handshake
    flow in E2E testing; T-8 rule 3 would address security fix-verification on a WS error envelope
    using a live prod socket. These are different layers, different agents (T-5 = ui-comprehensive-
    tester; T-8 = penetration-tester), and different purposes. However, the 2-wave bar is not met;
    a second wave where T-8 verifies a WS error-path fix (or, conversely, where a WS error-path
    fix is accepted on unit evidence alone and a live probe would have caught a deployment gap)
    is needed before this is promotion-eligible.

---

- **[obs-4 — status check on prior held observations]**

  | origin | obs | class | wave-53 status |
  |--------|-----|-------|----------------|
  | wave-52 obs-3 (a) | VERIFY lesson: independently re-probe load-bearing claims at gate before accepting zero-finding verdict | NOT CONFIRMED. V-block: no gate received a zero-finding pass on a load-bearing claim without independent re-probing — karen independently re-grepped all claims, jenny verified AC by AC from deployed code. Consistent with the behavior the proposed rule formalizes; positive application. Remains 1st-instance HOLD. |
  | wave-52 obs-3 (b) | Gate agent direct-writes to principles files (discipline gap) | NOT CONFIRMED. No gate agent wrote to principles files this wave. Remains 1st-instance HOLD. |
  | wave-49 obs-B | Socket.IO namespace mismatch invisible to mocked-both-sides tests; T-4.md rule 1 | NOT CONFIRMED. Wave-53 is backend-only error-handling; no new Socket.IO gateway namespace. Remains 4-wave HOLD. |
  | wave-49 obs-C | Responsive breakpoint not validated against D-3 adopted design at B-block | NOT CONFIRMED. D-block skipped (backend-only). Remains 4-wave HOLD. |
  | wave-50 obs-B | Parallel T-5 testers block on shared MCP Chrome profile | NOT CONFIRMED. T-5 skipped (backend-only, no UI changes). Remains 3-wave HOLD. |
  | wave-50 obs-C | P-4/plan review enumerate compute-on-read walk paths for new per-row parameter | NOT CONFIRMED. Wave-53 has no compute-on-read walk. Remains 3-wave HOLD. |
  | wave-44 obs-1 | Responsive/layout fix introduces overlay without WCAG dialog contract | NOT CONFIRMED. No layout fix or overlay. Remains 9-wave HOLD. |
  | wave-45 obs-1 | Browser resolution in committed playwright config | NOT CONFIRMED. T-5 skipped. Remains 8-wave HOLD. |
  | wave-45 obs-2 | `playwright test --list` false-green for browser-resolution change | NOT CONFIRMED. No Playwright config change. Remains 8-wave HOLD. |
  | wave-47 obs-C | Display-identifier vs opaque-id mismatch | NOT CONFIRMED. No component rendering user identities. Remains 6-wave HOLD. |
  | wave-41 obs-1 | V-3 redeploy false-green | NOT CONFIRMED. V-3 Phase 2 not triggered (fast-fix queue empty). Remains 12-wave HOLD. |
  | wave-41 obs-2 | Symbol-grep false-positive | NOT CONFIRMED. V-1 karen used file:line git-show inspection, not symbol-name grep. Remains 12-wave HOLD. |
  | wave-41 obs-3 | Parallel-path enforcement gap | NOT CONFIRMED. No new parallel sibling method. Remains 12-wave HOLD. |
  | wave-40 obs-1 | T-8 fix mechanism contradicts architectural decision | NOT CONFIRMED. No architectural conflict in this T-8-sourced fix. Remains 13-wave HOLD. |
  | wave-40 obs-4 | Global 22P02 filter / text-keyed route params | PARTIALLY ADJACENT. The wave-53 fix reuses `isInvalidTextRepresentation` (pg-error-utils 22P02 detector) on the WS gateway layer. This is not the same class (wave-40 obs-4 = text-column NUL-byte params, NOT uuid-cast params; a different SQLSTATE). Not a confirming instance. Remains 13-wave HOLD. |

  Severity: informational (status checks only).
  Candidate principles file: none.
  Promotion flag: NO.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Branch created from unpushed local main; squash bundled process/principle commits with code fix | informational | 1st instance (no prior wave has this class in the archive) | BUILD-PRINCIPLES (rule 11 candidate shape) | HOLD — 1st instance; watch for 2nd wave |
| obs-2 | REST-layer pg-error utility reused verbatim at WS gateway layer; no duplicate detection logic | informational | 1st instance (wave-33 introduced the util for REST; this wave is first cross-transport reuse) | none at this time (positive pattern, no defect) | HOLD — 1st instance; no defect to anchor recurrence check |
| obs-3 | T-8 drove real authenticated live socket probe to verify WS error-path fix; distinct from T-5 rule 3 | warning | 1st instance (prior T-8 WS probes were discovery, not fix-verification) | T-8.md (rule 3 candidate shape) | HOLD — 1st instance; promotion-eligible on 2nd confirming wave |
| obs-4 | Status check on prior held observations | informational | status checks | null | STATUS CHECK ONLY |

**Observations emitted: 4 (obs-1 through obs-4)**
**Severities: 1 warning (obs-3), 2 informational (obs-1, obs-2), 1 informational/status-check (obs-4)**
**Promotion-eligible: NONE this wave (all 3 substantive observations are first-instance; no 2-wave bar met)**
**Nominations for karen vetting: ZERO this wave**

Candidate verdicts per head-learn brief:
- (a) BRANCH HYGIENE: HOLD — first instance; no prior occurrence found in wave-{48,49,50,51,52}
  archives; BUILD rule 2 addresses the adjacent unpushed-commit-loss class but not the main-side-
  accumulation-before-branching class. Watch for second wave.
- (b) PRIOR-ART REUSE: HOLD — first instance; genuine and explicitly documented in P-3 and B-2
  artifacts; pattern is replicable on any new transport surface but the 2-wave bar is not met.
- (c) LIVE REALTIME ERROR-PATH VERIFICATION: HOLD — first instance; NOT already covered by T-5
  rule 3 (different layer, agent, purpose); the wave-53 WS error-path live probe is distinct from
  T-5's initial-handshake E2E rule; promotion-eligible on a second confirming wave.
