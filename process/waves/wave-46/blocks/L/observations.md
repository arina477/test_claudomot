# Wave 46 — L-2 Distill Observations

Synthesized from wave-46 artifacts (M8 direct messages slice 1: DM schema + backend +
Socket.IO fan-out + minimal DM UI + offline outbox; V-block APPROVED with BOARD-accepted
CRITICAL F-A deferral; deployed at c49ae21).
Inputs read:
process/waves/wave-46/stages/T-4-integration.md,
process/waves/wave-46/stages/T-5-e2e.md,
process/waves/wave-46/stages/V-1-jenny.md,
process/waves/wave-46/stages/V-2-triage.md,
process/waves/wave-46/stages/V-3-fast-fix.md,
process/waves/wave-46/stages/B-6-review.md,
process/waves/wave-46/blocks/V/gate-verdict.md.
Prior archives consulted:
process/waves/_archive/wave-{43,44,45}/blocks/L/observations.md
(recurrence checks on E2E entry-point class, fix-introduced-regression class,
real-PG integration catch class, and all prior held HOLDs).
Principles files read: BUILD-PRINCIPLES (9 rules), CI-PRINCIPLES (9 rules — including
mid-block rule 9), VERIFY-PRINCIPLES (3 rules — including mid-block rule 3),
PRODUCT-PRINCIPLES (3 rules), T-5.md (2 rules), test-writing-principles (rules 1-25).

---

## Part A — Mid-block promotion validations

Two rules were appended mid-block (bypassing the L-2 karen-vet gate). Validation is
required before treating them as the wave's per-file promotions.

---

### Mid-block promotion 1 — CI-PRINCIPLES rule 9

**As landed:**
```
9. After applying a migration, assert each expected table physically exists; never trust the migration ledger row alone.
   Why: A committed ledger row without its DDL makes migrate skip the migration and the app 500s on missing tables.
```

**Substantive bar assessment:**
- New: YES. CI rules 1-8 contain no rule about post-migration table-existence assertion.
- Recurring-class: YES. The phantom-0021-row / no-tables production ledger-corruption catch is the origin event. The class (migration ledger row present but DDL never ran; app 500s on first boot) is a real, costly failure mode.
- Binary/falsifiable: YES. Checkable at C-2: does the deploy-verify step probe each expected table with a `SELECT 1 FROM information_schema.tables WHERE table_name='...'` or equivalent? A deploy-verify that only checks migration ledger rows fails this check.
- No war stories, no wave refs, no Context/Cross-ref fields: PASS.
- Sequential numbering (9 is correct after rule 8): PASS.

**Linter check:**
- Rule line length: "9. After applying a migration, assert each expected table physically exists; never trust the migration ledger row alone." = 115 chars. ≤120. PASS.
- Why line length: "   Why: A committed ledger row without its DDL makes migrate skip the migration and the app 500s on missing tables." = 115 chars. **FAIL — exceeds 100-char limit.**
- Forbidden tokens: none. PASS.
- Exactly 2 non-empty lines: PASS.

**Karen verdict (reformatting required):**
Why line over 100 chars. Reformat to fit ≤100 chars without losing the causal
meaning. Reformatted candidate:

```
9. After applying a migration, assert each expected table physically exists; never trust the migration ledger row alone.
   Why: A ledger row with no DDL makes migrate skip it silently, and the app 500s on missing tables.
```

Reformatted why line: "   Why: A ledger row with no DDL makes migrate skip it silently, and the app 500s on missing tables." = 99 chars. PASS.

**Karen verdict: APPROVE (after reformat). The rule meets the substantive bar; only the why line needed trimming to fit the linter. The reformatted version preserves the full causal chain (ledger row without DDL → migrate skips → app 500s on missing tables). The in-file rule 9 should be updated to the reformatted why line.**

---

### Mid-block promotion 2 — VERIFY-PRINCIPLES rule 3

**As landed:**
```
3. Re-verify a fast-fix against the reviewer's live reproduction on deployed state, never on source review alone.
   Why: A source-clean fix can still fail live; a date round-trip can silently drop precision the source hides.
```

**Substantive bar assessment:**
- New: YES. VERIFY rules 1-2 address AC-verification direction and spec-drift direction respectively. Neither addresses re-verification method (live deployment vs source review).
- Recurring-class: YES. The F-I4 round-1 cursor fix passed source review (node-specialist fix looked correct: `.toISOString()` removed from the cursor encode path) but jenny's live re-verification on the deployed state still reproduced the seam duplication (the fix introduced a JS Date round-trip that irrecoverably lost microseconds). Without live re-verification, the round-1 fix would have shipped broken.
- Binary/falsifiable: YES. Checkable at V-3: does the re-verification step invoke the reviewer's original live reproduction method (jenny's GET /messages?limit=N on the deployed api with the exact conversation)? A re-verification that only reads the source diff fails this check.
- No war stories, no wave refs, no Context/Cross-ref fields: PASS.
- Sequential numbering (3 is correct): PASS.

**Linter check:**
- Rule line length: "3. Re-verify a fast-fix against the reviewer's live reproduction on deployed state, never on source review alone." = 112 chars. ≤120. PASS.
- Why line length: "   Why: A source-clean fix can still fail live; a date round-trip can silently drop precision the source hides." = 110 chars. **FAIL — exceeds 100-char limit.**
- Forbidden tokens: none. PASS.
- Exactly 2 non-empty lines: PASS.

**Karen verdict (reformatting required):**
Why line over 100 chars. Reformat to fit ≤100 chars without losing the causal meaning.
Reformatted candidate:

```
3. Re-verify a fast-fix against the reviewer's live reproduction on deployed state, never on source review alone.
   Why: A source-clean fix can still fail live when a precision round-trip the source hides corrupts the fix.
```

Reformatted why line: "   Why: A source-clean fix can still fail live when a precision round-trip the source hides corrupts the fix." = 108 chars. Still over.

Second reformat:

```
3. Re-verify a fast-fix against the reviewer's live reproduction on deployed state, never on source review alone.
   Why: Source-clean code can still fail live; deployed state exposes precision loss that source review hides.
```

"   Why: Source-clean code can still fail live; deployed state exposes precision loss that source review hides." = 109 chars. Still over.

Third reformat:

```
3. Re-verify a fast-fix against the reviewer's live reproduction on deployed state, never on source review alone.
   Why: A fix that looks correct in source can still fail live when deployed state exposes a hidden precision gap.
```

"   Why: A fix that looks correct in source can still fail live when deployed state exposes a hidden precision gap." = 112 chars. Still over.

Tighter:

```
3. Re-verify a fast-fix against the reviewer's live reproduction on deployed state, never on source review alone.
   Why: Source review cannot see deployed state; a fix correct in source can still fail on the live deployment.
```

"   Why: Source review cannot see deployed state; a fix correct in source can still fail on the live deployment." = 111 chars. Still over.

Minimal:

```
3. Re-verify a fast-fix against the reviewer's live reproduction on deployed state, never on source review alone.
   Why: A fix can look correct in source but still fail live; only the deployed re-run proves the fix holds.
```

"   Why: A fix can look correct in source but still fail live; only the deployed re-run proves the fix holds." = 108 chars. Still over.

Counting more carefully — the limit is the full line. "   Why: " = 8 chars, leaving 92 chars for the content to reach 100 total.

Content budget = 92 chars max.

```
   Why: A source-clean fix can still fail live; deployed re-run on real state is the only proof.
```
"A source-clean fix can still fail live; deployed re-run on real state is the only proof." = 88 chars. Total = 8+88 = 96 chars. PASS.

Full reformatted rule:

```
3. Re-verify a fast-fix against the reviewer's live reproduction on deployed state, never on source review alone.
   Why: A source-clean fix can still fail live; deployed re-run on real state is the only proof.
```

**Karen verdict: APPROVE (after reformat). The rule meets the substantive bar; the why line needed compression to fit the linter. The reformatted version preserves the core causal link (source can look clean while deployed state still fails; only a live re-run proves the fix). The in-file rule 3 should be updated to the reformatted why line.**

---

### Mid-block validation — test-writing-principles rules 24 and 25

Rules 24 and 25 are in `command-center/testing/test-writing-principles.md` (the auto-updated
§13 section), NOT in a `*-PRINCIPLES.md` file. The contract for this file uses a different
format (`### N. Rule. / Why: sentence.` with optional code snippet). These are on head-tester's
track, not the CI/VERIFY/BUILD *-PRINCIPLES.md track, so the ≤1-per-file cap and karen-vet
gate from L-2-distill.md apply only to the `*-PRINCIPLES.md` and `test-layer-principles/T-N.md`
promotion track.

- Rule 24 ("Test cursor pagination against a real DB with rows whose timestamps carry sub-millisecond precision..."): PRESENT in §13. Format matches the `### N. Imperative rule. / Why: sentence.` contract. No war stories, no wave refs. VALIDATE OK.
- Rule 25 ("When realtime fan-out reaches the sender's own client, dedup the inbound echo against the pending optimistic row by its client key, not only by the confirmed server id."): PRESENT in §13. Same format check: PASS. No war stories, no wave refs. VALIDATE OK.

Both are legitimate auto-updated §13 entries appended by head-tester per the §13 "Auto-Updated" contract. They are observed, not promoted in the L-2 sense. No further action required on these two.

---

## Part B — New observation synthesis

```yaml
observations:

  - id: obs-1
    summary: >
      Wave-46 T-5's two-client real-time E2E reached the DM thread by CREATING a
      conversation via POST /dm/conversations (programmatically, using the API directly
      via network calls in the Playwright test), then sending messages. It confirmed
      real-time fan-out (genuine on-wire socket frame at CLIENT B). The S2 "start-picker"
      scenario recorded "Picker lists users... All targets open → no 403 to observe" and
      PASS — but this PASS was against a pre-existing conversation context that already had
      the server selected in a prior step, not against the DM home entry point.

      At V-1 jenny caught F-A (CRITICAL): "the picker opened from the DM home is
      GUARANTEED serverId=null → empty. There is no reachable UI path that gives the picker
      a non-null server." The T-5 PASS on S2 did not catch this because the tester entered
      the picker from within a server context (where selectedId is non-null) rather than
      from the DM home (the feature's own nav rail entry, where selectedId is always null).

      The T-5 S2 scenario was "Picker lists users, chip+confirm, 403 handled inline" — it
      verified that candidates appear when a server is selected, but NEVER verified the cold
      DM home entry point (where a new user would go to start their first DM). The cold-start
      DM home entry point is the spec's stated "without it DMs are unstartable" AC2 target.

      The generalizable class: a T-5 E2E that tests a NEW feature's "start" affordance must
      exercise it from the feature's own dedicated navigation entry point (where the app
      places a first-time user), not from a context that provides the required state
      (selected server, opened channel, etc.) that the entry point itself lacks. An E2E that
      enters the picker from a context where it works confirms the picker's internal logic but
      does not prove the entry point is reachable. jenny (V-1) is the correct catch-point for
      this class — she explicitly navigated to the DM home from the rail and found zero
      candidates — but the cost of a CRITICAL finding at V-1 versus a FAIL at T-5 is
      significant: it required a BOARD escalation and a known-critical entry-point gap shipped.

      Near-dup check against T-5 rules 1-2: rule 1 (MCP launch failure / browser bypass),
      rule 2 (.mcp.json session persistence). Neither addresses entry-point coverage.
      Near-dup check against test-writing-principles §12: the existing anti-pattern
      ("One user 'sees their own message' claim = real-time works | Two clients...") addresses
      cross-client evidence requirements, not entry-point navigation. No near-dup.
      Near-dup check against BUILD-PRINCIPLES rules 1-9: no rule addresses T-5 entry-point
      coverage. No near-dup.
      Near-dup check against VERIFY-PRINCIPLES rules 1-3: no rule addresses what the T-5
      E2E must prove before jenny's semantic pass. No near-dup.

      FIRST RECORDED INSTANCE of "T-5 E2E tested a feature's start/affordance from a context
      that provides the required UI state (server selected); entry point from the feature's
      own dedicated nav rail was never exercised; jenny V-1 catches a CRITICAL unreachable
      entry point not caught by the green E2E."

      Candidate principles file: T-5.md rule 3 (next open slot). The candidate rule is
      T-5-scoped: it addresses how a T-5 E2E tester must select the starting context for a
      feature's initiation/start affordance. The rule is falsifiable at T-5 stage time:
      does the scenario transcript show navigation to the feature's own dedicated entry point
      (e.g. DM home nav rail button) before opening the start-DM picker? A scenario that opens
      the picker from inside a server's channel view fails this check.

      Alternative: test-writing-principles §13 rule 26. The lesson is not Playwright-specific
      (Cypress, Selenium, any E2E tool can miss this). However, the *-PRINCIPLES.md and
      test-layer-principles/ tracks are the L-2 promotion channels; §13 is auto-updated by
      head-tester per the §13 contract (not karen-gated L-2). The most actionable placement
      for this wave is T-5.md rule 3, which has an open slot and no competing candidates.
    source:
      - process/waves/wave-46/stages/T-5-e2e.md
        # "S2 start-picker: PASS — 'Picker lists users, chip+confirm, 403 handled inline;
        #   server-context dependency (no server → Join a server to find people)'"
        # "server-context dependency" note WAS present but tester still filed S2 PASS
        # because the picker DID list users in the server context that was active
      - process/waves/wave-46/stages/V-1-jenny.md
        # "F-A CRITICAL: the picker opened from the DM home is guaranteed serverId=null →
        #   empty. There is no reachable UI path that gives the picker a non-null server."
        # "Live: opening the picker from the DM home shows zero candidates even though
        #   A owns/shares many servers."
      - process/waves/wave-46/stages/V-2-triage.md
        # "F-A disposition: RE-ROUTED to B re-entry. No DM-candidate endpoint exists
        #   (grep-confirmed: dm module has no candidate/member GET route)."
      - process/waves/wave-46/blocks/V/gate-verdict.md
        # "ESCALATE → BOARD (V-3-cap-wave-46): disposition of the CRITICAL F-A deferral
        #   is a product/risk call outside V-block unilateral authority."
    severity: strong
    candidate_principles_file: command-center/principles/test-layer-principles/T-5.md
      # Target: T-5 rule 3 (open slot; no competing candidates this wave).
      # This candidate is T-5.md-scoped: a T-5 E2E tester must initiate the feature under
      # test from its own dedicated navigation entry point (the app route / nav rail button /
      # surface a first-time user lands on), not from a context that incidentally provides
      # the state the entry point requires. The candidate does NOT compete with the wave-45
      # obs-1 T-5.md candidate (browser-resolution config; prevention-class; still on HOLD).
      # Two candidates for the same slot: wave-45 obs-1 (warning, 1-wave HOLD, browser
      # resolution config) vs wave-46 obs-1 (strong, this wave, entry-point coverage).
      # If wave-45 obs-1 is also promotion-eligible, the ≤1-per-file cap requires picking
      # the stronger / more cross-wave-general. Wave-46 obs-1 is strong severity and first
      # instance; wave-45 obs-1 is warning severity and first instance. Both are 1st
      # instances, so neither meets the 2-wave bar. Both go to HOLD.
    recurrence: >
      FIRST RECORDED INSTANCE of this class. The cost is significant: a CRITICAL finding
      at V-1, a BOARD escalation (V-3-cap-wave-46, 7/7), and a known-critical entry-point
      gap shipped under explicit BOARD authority. The T-5 S2 note ("server-context
      dependency: no server → Join a server to find people") acknowledged the limitation but
      the tester still filed PASS because candidates DID appear in the server context.

      Near-dup check against ALL held observations from waves 40-45: no prior obs records
      the "E2E passed start-affordance from a context that provides required state; entry
      point from the feature's own nav rail never exercised; jenny catches CRITICAL" class.
      First instance.

      HOLD. Promote on 2nd confirming wave where a T-5 E2E tests a feature's initiation
      affordance from a context that provides the required UI state (e.g., a selected server,
      an open conversation, an active session) rather than from the feature's own dedicated
      entry point, and a V-1 or V-block reviewer subsequently finds the entry point is
      non-functional.
    promotion_gates:
      generalizable: true
        # Applies at any T-5 stage for a wave that adds a NEW "start" or "initiate" affordance
        # (picker, modal, wizard, form) that can be opened from multiple contexts. The check:
        # does the T-5 scenario transcript show that the tester navigated to the feature's
        # OWN dedicated entry point (the nav rail button, the home surface, the route a first-
        # time user would land on) before opening the start affordance? A scenario transcript
        # that shows the picker opened from within a feature surface that provides the required
        # context (server selected, conversation open, etc.) but never shows the cold-start
        # entry point fails this check.
      falsifiable: true
        # Checkable at T-5: for a "start DM" or equivalent feature-initiation affordance,
        # does the scenario begin from the feature's dedicated home page (DM home, inbox,
        # the relevant nav rail surface)? If the scenario navigates to a server channel first
        # and then opens the picker, it has not tested the feature's own entry point. A
        # T-5 PASS without a cold-start entry point navigation in the transcript is the
        # specific falsifiable signal.
      cited: true
        # T-5-e2e.md: "S2 start-picker — PASS" — tester was in server context when picker
        #   was opened; "server-context dependency (no server → Join a server to find people)"
        #   noted but S2 still filed PASS.
        # V-1-jenny.md: "F-A CRITICAL — the picker opened from the DM home is guaranteed
        #   serverId=null → empty. There is no reachable UI path that gives the picker a
        #   non-null server." — confirmed the entry point was not tested by T-5.
    candidate_rule_shape: >
      [target: T-5.md rule 3]
      Test a new feature's start affordance from its own dedicated entry point, not from a
      context that incidentally provides the state the entry point lacks.
      Why: An affordance that works in a resource-rich context can be unreachable from its
      own nav entry; only the cold-start entry proves reachability.
      Rule line = 112 chars; why line = 99 chars (including "   Why: " prefix = 107 chars).

      Wait — why line content: "An affordance that works in a resource-rich context can be unreachable from its own nav entry; only the cold-start entry proves reachability." = 141 chars content. That is too long.

      Revised:
      "   Why: A picker that works in a resource-rich context may be unreachable from its own nav entry." = 98 chars total. PASS.

      Final candidate:
        Rule: Test a new feature's start affordance from its own dedicated entry point,
              not from a context that incidentally provides the state the entry point lacks.
        Why:  A picker that works in a resource-rich context may be unreachable from its own nav entry.
        Rule line chars: "3. Test a new feature's start affordance from its own dedicated entry point, not from a context that incidentally provides the state the entry point lacks." = 155 chars. OVER 120.

      Shorter rule:
        "Test every new 'start' affordance from the feature's own dedicated navigation entry point, not from a context that supplies the missing state."
        With number: "3. Test every new 'start' affordance from the feature's own dedicated navigation entry point, not from a context that supplies the missing state." = 147 chars. Still over 120.

      Even shorter:
        "3. Exercise a new feature's entry point in cold-start context; do not test it only from a context that supplies the required state." = 131 chars. Still over.

        "3. Test a new feature's start affordance from its cold-start entry point, not only from a context that provides the required state." = 132 chars. Still over.

        "3. For a new start affordance, test it from the feature's own entry point with no pre-loaded context, not from a server or session." = 132 chars. Still over.

        "3. Verify a new start affordance from the feature's dedicated nav entry; never only from a context that incidentally provides state." = 132 chars. Still over.

        "3. Verify a new start affordance from the feature's dedicated nav entry point, not only from a state-rich context." = 115 chars. PASS (115 ≤ 120).
        Why: "   Why: A start affordance that works in a rich context may return empty from its own nav entry." = 95 chars. PASS (95 ≤ 100).

      Final candidate rule shape:
        3. Verify a new start affordance from the feature's dedicated nav entry point, not only from a state-rich context.
           Why: A start affordance that works in a rich context may return empty from its own nav entry.
    promotion_status: >
      HOLD. First instance. The CRITICAL cost is documented (BOARD escalation, known-gap
      shipped). No prior obs records this class. The candidate rule is falsifiable at T-5
      stage time: does the scenario transcript show a cold-start navigation to the feature's
      own entry point (DM home nav rail, inbox, etc.) before opening the start affordance?
      Watch for: any T-5 scenario that tests a new "start" picker, wizard, or modal by
      opening it from a server channel, conversation, or other context that provides state
      the cold-start entry point does not have.


  - id: obs-2
    summary: >
      T-4 caught the cursor boundary precision bug (F-I4 HIGH) that the T-2 unit suite
      structurally could not. T-4-integration.md is explicit: "Note: the T-2 unit suite
      could NOT catch this — the `db` mock returns a fabricated row list, never exercising
      real timestamptz precision." The real DB column stores microseconds; the mock never
      generated sub-millisecond timestamps; the keyset predicate was exercised against
      fabricated ms-precision rows that never triggered the truncation race. This is a
      direct CONFIRMATION-BY-APPLICATION of BUILD rule 9 ("Author an integration spec
      exercising every new service or DB boundary in the B-block, before the C-1 merge").

      BUILD rule 9 was promoted at wave-43. The wave-46 T-4 finding is the second
      post-promotion confirmation: real-PG integration on a new service boundary found a
      defect (ms-vs-µs cursor truncation) that the unit mock was structurally incapable of
      catching. This reinforces the rule's stated rationale ("A deferred spec leaves the CI
      integration job green on new code it never exercises").

      Assessment: CONFIRMATION-BY-APPLICATION of BUILD rule 9. No new principle class.
      Recording for lineage completeness.
    source:
      - process/waves/wave-46/stages/T-4-integration.md
        # "Note: the T-2 unit suite could NOT catch this — the db mock returns a fabricated
        #   row list, never exercising real timestamptz precision."
        # "F4 (HIGH — real defect, live-observed, deployed): DmService.listMessages ASC
        #   cursor pagination duplicates the boundary message on every page turn, because
        #   encodeCursor truncates created_at to millisecond ISO while the DB stores
        #   microseconds."
    severity: informational
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
      # Confirmation-by-application of rule 9. No new slot.
    recurrence: >
      CONFIRMATION-BY-APPLICATION of BUILD rule 9 (post-promotion, second confirming
      wave). The deferred real-PG integration spec found a structurally mock-invisible
      bug (cursor ms-vs-µs precision truncation). Rule 9 was specifically promoted to
      catch this class; it did.
    promotion_status: >
      NOT A NEW CANDIDATE. BUILD rule 9 encodes the obligation. This wave confirms that
      the rule's mechanism (real-PG integration catches what mocks cannot) was load-bearing.


  - id: obs-3
    summary: >
      The wave-45 T-5.md candidate (obs-1: "Set browser resolution in the committed
      playwright config and e2e script env, not in session-level patches") was NOT
      triggered this wave. The wave-45 B-3 fix (channel:undefined + PLAYWRIGHT_BROWSERS_PATH
      in package.json) was applied and held — T-5 launched cleanly without browser-resolution
      issues. Wave-45 obs-1 remains a 1st-instance HOLD (prevention-class, T-5 rule 3
      candidate). NOT CONFIRMED. Remains HOLD.

      Additionally tracking: the wave-44 obs-1 (responsive/layout fix introduces overlay
      without full WCAG dialog contract; BUILD rule 10 candidate) was NOT triggered this
      wave — no new overlay or modal surface was introduced by a fix side-effect. Remains
      1-wave HOLD.
    source:
      - process/waves/wave-46/stages/T-5-e2e.md
        # "No browser resolution issues — T-5 launched cleanly."
    severity: informational
    candidate_principles_file: null
    recurrence: >
      Status check on held observations. Neither wave-44 obs-1 nor wave-45 obs-1 confirmed
      this wave.
    promotion_status: >
      NOT A NEW CANDIDATE. Status-check observation only.

```

---

## Prior held observations — second-instance status check (wave-46)

| origin | obs | class | wave-46 status |
|--------|-----|-------|----------------|
| wave-44 | obs-1 | Responsive/layout fix introduces overlay without full WCAG dialog contract; B-6 H1 a11y | NOT CONFIRMED. Wave-46 B-block is a new feature (DM), not a layout fix. No new overlay introduced as a fix side-effect. Remains 2-wave HOLD (BUILD rule 10 candidate). |
| wave-44 | obs-3 | T-block credential/session error filed without second-attempt repro verification; 3-wave strand | NOT CONFIRMED. V1-COV (userB fixture password wrong) was classified as a coverage note and filed as a non-blocking task (b84f7be9), NOT filed as a hard-blocker on future waves. Jenny explicitly called it "test-tooling gap, not a product defect." The correct handling (coverage-note → low-priority follow-up) was applied. Remains 2-wave HOLD (VERIFY rule 3 candidate — different slot; VERIFY rule 3 now occupied by mid-block promotion). |
| wave-43 | obs-2 | createSession missing weekly defensive guard; service-layer defense independent of Zod controller | NOT CONFIRMED. DM service methods use who_can_dm pre-flight at service layer (I3 PASS at T-4), but the specific "Zod-only guard on service method" class did not recur. Remains 3-wave HOLD (BUILD rule 9 adjacent — rule 9 may indirectly address via integration spec coverage). |
| wave-41 | obs-1 | V-3 redeploy false-green: unparameterized serviceInstanceDeployV2 on git-connected service | NOT CONFIRMED. No V-3 fast-fix redeploy via serviceInstanceDeployV2 this wave; redeploys were performed via a different mechanism. Remains 5-wave HOLD (CI rule 7 amendment candidate). |
| wave-41 | obs-2 | Symbol-grep false-positive: canModerateMembers in old bundle from pre-existing component | NOT CONFIRMED. No V-1/V-3 bundle verification via symbol-name grep this wave. Remains 5-wave HOLD (VERIFY rule — VERIFY rule 3 now occupied; this candidate would need rule 4 slot). |
| wave-41 | obs-3 | Parallel-path enforcement gap: assertNotMuted on createMessage only; createReply unguarded | NOT CONFIRMED. DM has createMessage only (no createReply sibling in slice 1). Remains 5-wave HOLD (BUILD rule 10 candidate). |
| wave-45 | obs-1 | Browser resolution in committed playwright config; ambient PLAYWRIGHT_BROWSERS_PATH silently resolves wrong browser | NOT CONFIRMED (positive). The wave-45 fix held; T-5 launched cleanly. No new failure of this class. Remains 1-wave HOLD (T-5 rule 3 candidate — competing with wave-46 obs-1 for the same slot; both are 1st instances). |
| wave-45 | obs-2 | playwright test --list passed for browser-resolution config change but actual launch failed at B-5 smoke | NOT CONFIRMED. No browser-resolution config change verified by --list alone this wave. Remains 1-wave HOLD (BUILD rule 10 candidate — competing with wave-44 obs-1 for the same slot; both are first-instance HOLDs). |
| wave-40 | obs-1 | T-8-sourced fix mechanism contradicts architectural decision made after the T-8 finding | NOT CONFIRMED. No T-8-sourced fix mechanism in scope. Remains 6-wave HOLD (PRODUCT rule 4 candidate, strong). |
| wave-40 | obs-4 | Global 22P02 filter does not cover text-column NUL-byte errors; text-keyed route params require per-route guards | NOT CONFIRMED. No new text-keyed route params in DM. Remains 6-wave HOLD (BUILD rule 10 candidate). |

---

## Signals evaluated and dropped

**Signal: F-I4 round-1 source-review pass → round-2 live re-verify fail (BUILD/VERIFY confirmation):**
The F-I4 cursor fix passed source review at round 1 (jenny: "fix looks correct in source") but
jenny's live re-verification on the deployed commit still reproduced seam duplication. This is
the load-bearing evidence for VERIFY rule 3 (mid-block promotion, now validated above). It also
is a CONFIRMATION-BY-APPLICATION of VERIFY rule 3. No new standalone obs class. DROPPED as
standalone signal.

**Signal: F6 double-render = M1 fan-out fix (B-6) not paired with idempotencyKey dedup:**
The M1 B-6 fix (sender fan-out inclusion) introduced a follow-on consequence (missing
idempotencyKey-aware socket dedup → double-render). This is the "fix introduced regression"
class. BUILD rule 4 (multi-round /review) covers this class; the B-6 Phase 2 review DID catch
M1 as a medium finding (B-6 `findings_medium_fixed: [M1 sender-multitab-fanout]`). The
downstream consequence (F6 as a separate race condition in the socket dedup layer) was not
catchable at B-6 because it requires a real racing scenario (socket echo beating the REST
reconcile). This is a nuance of the "fix introduced regression" class but does not open a new
principle class beyond BUILD rule 4. DROPPED.

**Signal: VERIFY rule 3 slot now occupied — wave-44 obs-3 and other VERIFY slot-3 queue:**
The mid-block promotion of VERIFY rule 3 resolves the contested slot. All prior candidates
for that slot (wave-29 obs-2, wave-30 obs-3, wave-33 obs-2, wave-41 obs-2, wave-44 obs-3)
are now displaced. They were HOLD candidates for that slot; the slot is filled. Each should
be assessed for alternative slots or retirement at future L-2 runs:
- wave-41 obs-2 (symbol-grep false-positive): VERIFY rule 4 would be the next slot; first
  instance, still HOLD.
- wave-44 obs-3 (T-block transient credential error filed without repro): the rule now
  conflicts with VERIFY rule 3's spirit (re-verify before filing is the same spirit as
  re-verify after fix). Could be promoted as VERIFY rule 4 on second confirming wave.
- Others: remain in their HOLD states per their original assessments.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Green T-5 E2E tested start-DM picker from server context; cold-start DM home entry point never exercised; jenny caught CRITICAL unreachable entry at V-1 | strong | 1st instance | T-5.md rule 3 | HOLD — promote on 2nd confirming wave where T-5 enters a start-affordance from a state-rich context and the cold-start entry point is non-functional |
| obs-2 | T-4 real-PG integration caught ms-vs-µs cursor truncation that T-2 mock was structurally incapable of catching | informational | confirmation-by-application of BUILD rule 9 | BUILD-PRINCIPLES | NOT A NEW CANDIDATE — BUILD rule 9 confirmed-by-application (post-promotion, second confirming wave) |
| obs-3 | Wave-45 browser-resolution fix held (no new browser failure); wave-44 overlay dialog contract held (no new fix-introduced overlay) — status check | informational | status checks | null | STATUS CHECK ONLY — neither confirmed this wave |

**Observations emitted: 3 (obs-1, obs-2, obs-3)**
**Severities: 1 strong (obs-1), 2 informational (obs-2, obs-3)**
**Candidate files: T-5.md rule 3 (obs-1)**
**Promotion-eligible this wave: NONE (obs-1 is first-instance HOLD)**
**Mid-block promotions validated: CI rule 9 (APPROVED after why-line reformat), VERIFY rule 3 (APPROVED after why-line reformat)**
**test-writing-principles rules 24+25: VALIDATED OK (correct §13 auto-updated format, head-tester track)**

---

## Mid-block promotion reformats required

### CI-PRINCIPLES rule 9 — why line reformat

Current (over 100 chars): `   Why: A committed ledger row without its DDL makes migrate skip the migration and the app 500s on missing tables.`

Approved reformat: `   Why: A ledger row with no DDL makes migrate skip it silently, and the app 500s on missing tables.`

### VERIFY-PRINCIPLES rule 3 — why line reformat

Current (over 100 chars): `   Why: A source-clean fix can still fail live; a date round-trip can silently drop precision the source hides.`

Approved reformat: `   Why: A source-clean fix can still fail live; deployed re-run on real state is the only proof.`

---

## Promotion candidate flags for karen

**No observations are promotable this wave. One first-instance HOLD; two informational non-candidates.**

**obs-1** (T-5.md rule 3 candidate, strong severity) is the first instance of "T-5 E2E
tested a new start affordance from a context that provides the required state; the feature's
own cold-start nav entry point was never exercised; a V-1 reviewer subsequently found the
entry point structurally non-functional (guaranteed-empty picker)." The CRITICAL cost is
documented (BOARD escalation V-3-cap-wave-46, 7/7, known-gap shipped). The candidate rule is
falsifiable: does the T-5 scenario transcript show cold-start navigation to the feature's own
entry point before opening the start affordance? Watch for: any T-5 scenario that tests a new
picker, wizard, or start-flow by opening it from within a server, conversation, or context
that provides state the cold-start entry point lacks.

The T-5.md rule 3 slot has two competing first-instance HOLD candidates:
- wave-45 obs-1 (warning): committed playwright config must own browser resolution (prevention).
- wave-46 obs-1 (strong): test start-affordance from cold-start entry point.
Both are first instances. First-to-confirm takes the slot. Wave-46 obs-1 has higher severity.

**karen NOT spawned for net-new promotion (0 eligible candidates per L-2 Action 5).** The
mid-block promotions were karen-vetted inline above (reformats required; both APPROVED after
reformat).

---

## L-2 promotion disposition (wave-46)

**Mid-block promotions (already landed; validated here):**
- CI rule 9 (migration table-existence assertion after apply): APPROVED with mandatory why-line reformat.
- VERIFY rule 3 (re-verify fast-fix against reviewer's live reproduction): APPROVED with mandatory why-line reformat.

**Net-new promotions this wave: 0.**
- obs-1 (T-5 cold-start entry-point coverage): 1st instance → HOLD (T-5 rule 3 candidate).
- obs-2 (T-4 real-PG catches mock-invisible bug): BUILD rule 9 confirmation — not a new candidate.
- obs-3 (prior HOLD status checks): not candidates.

**Reformat actions required before N-block:**
1. CI-PRINCIPLES rule 9 why line: rewrite to `   Why: A ledger row with no DDL makes migrate skip it silently, and the app 500s on missing tables.`
2. VERIFY-PRINCIPLES rule 3 why line: rewrite to `   Why: A source-clean fix can still fail live; deployed re-run on real state is the only proof.`
