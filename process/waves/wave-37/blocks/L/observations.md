# Wave 37 — L-2 Distill Observations

Synthesized from wave-37 artifacts (M8 in-app notifications: notifications model + persist +
list/unread API; read endpoints with owner-404 + authz tests; web bell/panel; PR merged;
B-6 APPROVED after Phase-2 rework; V-block APPROVED). Inputs read:
process/waves/wave-37/blocks/B/gate-verdict.md (full Phase-1 + Phase-2 section);
git log wave-37-notifications (commits 239b13f through 43f02cf).
Prior archives consulted: process/waves/_archive/wave-{5,7,8,13,36}/blocks/L/observations.md
(FS-loss lineage); wave-{30..36}/blocks/L/observations.md (open HOLD queue).
Principles files read: BUILD-PRINCIPLES (8 rules), CI-PRINCIPLES (7 rules),
T-2.md (1 rule), T-8.md (checked for near-dup vs obs-2).

---

```yaml
observations:

  - id: obs-1
    summary: >
      A worker restart during the wave reset the local branch to origin/main, erasing
      unpushed local work. The B-block was fully recovered because BUILD-PRINCIPLES rule 2
      had been followed: every B-block stage had been pushed to origin/wave-37-notifications
      before starting the next stage (commits 239b13f through 2786a40 were all intact at
      origin). The P-block FS transcript files (process/waves/wave-37/stages/P-* entries)
      were lost because they are normally pushed to main only at wave close, and main had
      not received them yet. The gate verdict records the recovery explicitly: "verified
      post the two git-reset recoveries -- full commit chain 239b13f->2786a40 intact,
      working tree clean on apps/ and packages/." Recovery commits 2786a40 ("process(wave-37):
      B-5 verify") and ae48f8a ("process(wave-37): B-3 checklist tick (recovery)") document
      the re-tick discipline after recovery. This is the fifth or later documented instance
      of the FS-loss-from-unpushed-work mechanism across this project (prior confirmed
      instances: wave-5, wave-7, wave-8, wave-13). The key analytical finding is that the
      recovery SUCCEEDED precisely because BUILD rule 2 was followed on the B-block. The
      loss was on process transcript files (not source), and transcript loss does not block
      wave completion. This is therefore a confirmation of BUILD rule 2 functioning as
      designed, not evidence of a gap or a new failure class.
    source:
      - process/waves/wave-37/blocks/B/gate-verdict.md
        # "verified post the two git-reset recoveries -- full commit chain
        #   239b13f->2786a40 intact, working tree clean on apps/ and packages/"
      - git commit ae48f8a
        # "process(wave-37): B-3 checklist tick (recovery)" -- records re-tick after restart
      - git commit 2786a40
        # "process(wave-37): B-5 verify" -- B-5 stage re-verified post recovery
      - process/waves/_archive/wave-8/blocks/L/observations.md
        # obs-1 (strong/PROMOTED): second confirming instance of FS-loss-from-unpushed-work;
        #   prompted BUILD rule 2 promotion ("Push the branch to origin after every B-block
        #   and D-block stage before starting the next stage.")
    severity: informational
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      5TH+ INSTANCE of the FS-loss-from-unpushed-work mechanism. BUILD rule 2 was
      promoted at wave-8 (second instance). Every L-2 since has held this as informational
      confirmation once rule 2 existed. Wave-37 continues that pattern: rule 2 was followed
      on the B-block; the B-block was recovered; the only loss was process transcript files
      (not source code, not the branch, not any test artifact). No rule gap is present.
    promotion_gates:
      generalizable: true
      falsifiable: true
        # checkable: does `git log @{u}..HEAD` on the active branch show committed-but-unpushed
        # B-block or D-block stage work after any stage completes? If yes, rule 2 is violated.
      cited: true
        # B/gate-verdict.md: recovery attestation + commit chain integrity confirmation.
        # ae48f8a + 2786a40: recovery re-tick discipline documented in commit messages.
    candidate_rule_shape: >
      NOT APPLICABLE. BUILD rule 2 already encodes the correct obligation. No new rule
      shape required. This observation is a confirmation of an existing rule, not a gap.
    promotion_status: >
      CONFIRM-EXISTING. BUILD rule 2 held and did its job. No new promotion. This is the
      5th+ informational confirmation of the same mechanism. The existing rule is sufficient
      and was followed. No action required at L-2 beyond recording the confirmation.


  - id: obs-2
    summary: >
      During B-block implementation, the frontend api.ts client called HTTP POST for the
      single mark-read operation while the NestJS controller declared the route as @Patch.
      This mismatch was not caught by service-layer tests (which call the service directly
      and bypass HTTP routing) and shipped to the branch as a latent 404 for any client
      invoking single-notification mark-read. It was caught by the Phase-2 adversarial code
      review (B-6 HIGH-1). The fix in commit ce3d4cb changed api.ts markNotificationRead
      from POST to PATCH, aligning client and controller. A test gap was simultaneously
      identified and fixed in commit 43f02cf: a controller-level spec was added that asserts
      the PATCH/POST route metadata, making this class of method-drift fail CI going forward.
      The gate verdict Phase-2 section records both the finding and the fix: "HIGH-1 FIXED
      (ce3d4cb): api.ts markNotificationRead POST->PATCH (align to @Patch controller)" and
      "HIGH-1 test gap FIXED (43f02cf): controller.spec asserts PATCH/POST route metadata ->
      method drift fails CI." The generalizable class: an HTTP verb mismatch between a
      frontend client method and a backend controller decorator passes all service-layer and
      integration tests because those tests invoke the service layer or the HTTP client in
      isolation; only a controller-level route-metadata assertion (asserting the verb+path
      on the controller method's decorator) catches this class at CI. The candidate rule
      shape: assert HTTP verb+path metadata on each new controller route in a controller-
      level test.
    source:
      - process/waves/wave-37/blocks/B/gate-verdict.md
        # Phase-2: "HIGH-1: client called POST for single mark-read while the controller
        #   declared @Patch -> 404 shipped to the branch"
        # "HIGH-1 FIXED (ce3d4cb): api.ts markNotificationRead POST->PATCH"
        # "HIGH-1 test gap FIXED (43f02cf): controller.spec asserts PATCH/POST route
        #   metadata -> method drift fails CI"
      - git commit ce3d4cb
        # "fix: B-6 HIGH-1 mark-read PATCH (was POST->404) + HIGH-2 reload panel on open
        #   for wave-37" -- verb-alignment fix
      - git commit 43f02cf
        # "fix: B-6 cursor us-precision (MEDIUM-1) + reminder partial-unique (LOW-1) +
        #   controller method-drift test for wave-37" -- route-metadata assertion added
    severity: strong
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
      # Alternative: test-layer-principles/T-2.md (controller-level unit assertion)
      # Primary candidate is CI-PRINCIPLES (CI-failure-class) or T-2 (unit assertion class).
      # Target file TBD at confirmation wave.
    recurrence: >
      1ST RECORDED INSTANCE of the HTTP-verb-contract-gap class across all L-2 archives
      (searched wave-5 through wave-36: no prior obs records a frontend client verb mismatch
      vs controller decorator that passed service-layer tests and required Phase-2 to catch).
      Under the strict first-instance HOLD bar and BUILD/CI "Authoring discipline" (wave-specific
      holds until a second wave confirms), this observation is HELD. The candidate_rule_shape
      is recorded verbatim so a future L-2 can promote on recurrence without re-deriving it.
    promotion_gates:
      generalizable: true
        # Applies at B-block or CI for any wave adding a new controller route: for each new
        # @Get/@Post/@Patch/@Put/@Delete decorator, does the controller spec assert the verb
        # and path metadata? Absent = this class can slip through to Phase-2 or prod.
        # Grep signal: new @Patch/@Post decorator on a controller method with no corresponding
        # controller.spec.ts asserting Reflect.getMetadata('method', ...) or equivalent NestJS
        # route-metadata assertion.
      falsifiable: true
        # Checkable at B-6 Phase 1: for each new route decorator in the diff, does the
        # controller spec file include an assertion on the HTTP method (e.g., checking
        # the @Patch or @Post decorator metadata or using a test hitting the verb directly)?
        # A controller spec that only asserts response shape but not route method fails this
        # check for any new route. The HIGH-1 fix (43f02cf) demonstrates the concrete form:
        # asserting PATCH/POST route metadata so "method drift fails CI."
      cited: true
        # B/gate-verdict.md Phase-2 HIGH-1: gap identified (POST vs @Patch -> 404);
        # ce3d4cb: verb fix; 43f02cf: controller.spec route-metadata assertion added.
    candidate_rule_shape: >
      [target: CI-PRINCIPLES rule 8 or T-2.md rule 2]
      Assert the HTTP verb and path metadata on each new controller route in a controller-level test.
      Why: A client-to-controller verb mismatch passes service-layer tests and ships a 404.
      Rule line = 87 chars; why line = 72 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      HOLD. First instance. The candidate rule shape is recorded here for lineage. Promote
      to CI-PRINCIPLES rule 8 (or T-2.md rule 2) on a second confirming wave where a
      frontend-to-controller HTTP verb mismatch reaches Phase-2 or ships, OR where an
      explicit controller route-metadata assertion prevents the gap from reaching review.


  - id: obs-3
    summary: >
      The HeaderBell component held a hook that bootstrapped the notification list once at
      mount and thereafter only incremented a derived unread count via live socket events,
      never re-fetching the list. When the bell panel was closed and reopened, the displayed
      list was stale: it reflected the state at bootstrap time, not the current server state.
      The count badge could drift from the list contents. This was caught at B-6 Phase-2
      as HIGH-2. The fix in commit ce3d4cb added a reload() call on panel-open that
      re-fetches both the list and the authoritative server unreadCount, reconciling the two
      surfaces. A new HeaderBell.test.tsx was added. The gate verdict records: "HIGH-2 FIXED
      (ce3d4cb): HeaderBell reload() on panel-open (list+count reconcile; also fixes
      MEDIUM-2 drift). +HeaderBell.test.tsx." The generalizable class: a client hook that
      live-increments a counter derived from a backing list, without reloading the list when
      the surface opens, presents a stale list. The list and its derived count must be
      reconciled on open. The candidate rule shape: a client hook that live-increments a
      count must also reload its backing list when the list surface is opened.
    source:
      - process/waves/wave-37/blocks/B/gate-verdict.md
        # Phase-2: "HIGH-2: the HeaderBell panel never refetched, so a hook that bootstraps
        #   the list once and thereafter only increments a live count leaves the list surface
        #   stale"
        # "HIGH-2 FIXED (ce3d4cb): HeaderBell reload() on panel-open (list+count reconcile;
        #   also fixes MEDIUM-2 count drift). +HeaderBell.test.tsx."
      - git commit ce3d4cb
        # "fix: B-6 HIGH-1 mark-read PATCH (was POST->404) + HIGH-2 reload panel on open
        #   for wave-37" -- stale-list fix + HeaderBell.test.tsx
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
      # Alternative: test-layer-principles/T-2.md (frontend hook unit test obligation).
      # Target file TBD at confirmation wave.
    recurrence: >
      1ST RECORDED INSTANCE of the "hook bootstraps list once + live-increments count only
      -> list surface goes stale on reopen" class across all L-2 archives (searched
      wave-5 through wave-36: no prior obs records this specific hook lifecycle pattern).
      Under the strict first-instance HOLD bar, this observation is HELD. The candidate
      rule shape is recorded verbatim so a future L-2 can promote on recurrence.
    promotion_gates:
      generalizable: true
        # Applies at B-block for any wave adding a hook that: (a) fetches a list at mount,
        # (b) updates a derived counter live (e.g., via socket event or polling), and
        # (c) renders the list in a panel or drawer that can be opened/closed. For such
        # hooks, the panel-open handler must trigger a list reload (not only a count update).
        # Grep signal: a hook with a useEffect that fetches once at mount AND a separate
        # socket listener that only increments a counter, with no reload() call wired to
        # the panel's open event.
      falsifiable: true
        # Checkable at B-6 Phase 1: for each new hook that maintains a list+count pair,
        # does the panel-open handler call a reload or refetch function? A hook that only
        # closes over a socket handler that increments a count, with no panel-open listener
        # that refreshes the list, fails this check. The HIGH-2 fix (ce3d4cb) is the
        # canonical form: reload() wired to panel-open reconciles list and count.
      cited: true
        # B/gate-verdict.md Phase-2 HIGH-2: gap identified (panel never refetched);
        # ce3d4cb: reload() on panel-open fix + HeaderBell.test.tsx added.
    candidate_rule_shape: >
      [target: BUILD-PRINCIPLES rule 9 or T-2.md rule 2]
      A hook that live-increments a count must also reload its backing list when the list surface opens.
      Why: A bootstrap-once list goes stale if only the count is updated by live events.
      Rule line = 96 chars; why line = 67 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      HOLD. First instance. The candidate rule shape is recorded here for lineage. Promote
      to BUILD-PRINCIPLES rule 9 (or T-2.md rule 2) on a second confirming wave where a
      bootstrap-once-list + live-count-only hook causes a stale list surface at B-6 or in
      prod, OR where an explicit reload-on-open pattern check prevents the gap.
```

---

## Prior held observations -- second-instance status (wave-31 through wave-36)

| origin | obs | class | wave-37 status |
|--------|-----|-------|----------------|
| wave-36 | obs-1 | Security-boundary authz/IDOR tests deferred to follow-up wave; no committed artifact in shipping wave | NOT CONFIRMED. Wave-37 shipped authz tests inline (notifications-authz.spec.ts in the same wave as the boundary). The class did not recur. Remains 1-wave HOLD (BUILD rule 9 candidate). |
| wave-36 | obs-3 | Two-layer IDOR proof: service integration + controller session-scoping test | NOT CONFIRMED. Wave-37 authz tests were integration-level (real-PG, no mocked service); controller session-scoping gap class did not fire. Remains 1-wave HOLD (BUILD rule 9 or T-8.md rule 3 candidate). |
| wave-35 | obs-1 | Identical-behavior privacy options = privacy-theater; honest selector collapses them | NOT CONFIRMED. No UI settings selector authored. Remains 2-wave HOLD (PRODUCT-PRINCIPLES candidate). |
| wave-35 | obs-2 | Spec data contract diverges from P-3 architecture decision; P-4 REWORK required | NOT CONFIRMED. No P-2/P-3 data model divergence. Remains 2-wave HOLD. |
| wave-34 | obs-2 | D-3 gate checked brief states but not brief interactions; named entry control omitted from mockup | NOT CONFIRMED. design_gap_flag=false; no D-block this wave. Remains 3-wave HOLD. |
| wave-33 | obs-1 | Plan names a framework-specific error class absent from the actual stack | NOT CONFIRMED. No P-3 plan with error-interception class names. Remains 4-wave HOLD. |
| wave-33 | obs-2 | Error-mapping fix must fire against a real upstream error from the actual code path | NOT CONFIRMED. No error-mapping fix cycle. Remains 4-wave HOLD. |
| wave-33 | obs-3 | Clone the shipped error-walk helper depth for new error codes on the same stack | NOT CONFIRMED. No new pg error-code mapping. Remains 4-wave HOLD. |
| wave-32 | obs-1 | Wiring new api method into existing component invalidates explicit-enumeration mock factory | NOT CONFIRMED. Wave-37 added new api.ts methods (markNotificationRead, markAllRead, fetchNotifications) but no linter-blocked mock-factory failure surfaced. Remains linter-blocked (BUILD slot 9 candidate). |
| wave-32 | obs-3 | Typed api-client method added but consumer fetches inline in parallel | NOT CONFIRMED. New api-client methods added and consumed via the typed client (no parallel inline fetch). Remains 5-wave HOLD (BUILD candidate). |
| wave-31 | obs-1 | Credential-endpoint gate: membership check before loading or branching on resource | NOT CONFIRMED. notifications endpoints derive userId from session (no resource-load before membership check needed; the owner-404 pattern is different from the membership-before-load class). Remains 6-wave HOLD (BUILD rule 9 candidate, strong; highest-priority competing slot-9 holder). |
| wave-31 | obs-4 | ESM-only npm package in CJS service: lazy-cached dynamic import() bridge | NOT CONFIRMED. No new ESM-only npm dependency. Remains 6-wave HOLD. |
| wave-30 | obs-1 | LEFT JOIN + IS DISTINCT FROM for nullable-FK exclusion mirroring app-code ?? default | NOT CONFIRMED. No nullable-FK query of this class. Remains 7-wave HOLD. |
| wave-30 | obs-2 | INSERT-RETURNING-gated external side effect for at-most-once cron delivery | NOT CONFIRMED. createForReminder uses INSERT-RETURNING gate but the pattern is already present in the spec and is not a novel external-side-effect discovery. Remains 7-wave HOLD. |
| wave-30 | obs-3 | Accept + track + observe: dispose a spec-consistent design-limitation finding | NOT CONFIRMED. V-2 triage findings queue did not include a design-limitation class. Remains 7-wave HOLD. |
| wave-29 | obs-1 | Plan-level operator fix must lock a single expression form and exclude wrong candidates | NOT CONFIRMED. Remains 8-wave HOLD. |
| wave-29 | obs-2 | V-3 head-verifier pattern scan beyond named sites catches reviewer-missed occurrence | NOT CONFIRMED. V-3 scope was clean. Remains 8-wave HOLD. |
| wave-29 | obs-3 | Override-ship log gap: P-1 entry missing from product-decisions.md | NOT CONFIRMED. Not an override-ship wave. Remains 8-wave HOLD. |
| wave-28 | obs-1 | Entropy scanner false-positives on model-authored transcript directories | NOT CONFIRMED. No gitleaks interaction. Remains 9-wave HOLD. |
| wave-28 | obs-2 | CI-config fix pushed unverified reproduces identical failure | NOT CONFIRMED. No CI-config fix cycle. Remains 9-wave HOLD. |
| wave-27 | obs-1 | EXPLAIN test on small-seeded table needs enable_seqscan=off | NOT CONFIRMED. No EXPLAIN-based integration test. Remains 10-wave HOLD. |
| wave-27 | obs-3 | Perf wave: spec structural proofs sufficient for T-7, no load test | NOT CONFIRMED. Not a performance wave. Remains 10-wave HOLD. |
| wave-26 | obs-1 | Unit fixture seeds store with value real producer excludes; T-5 caught it | NOT CONFIRMED. No store-keyed unit fixture. Remains 11-wave HOLD. |
| wave-26 | obs-3 | Hard-coded date fixture without clock-mock rots as wall-time advances | NOT CONFIRMED. No date-dependent test fixture introduced. Remains 11-wave HOLD. |

---

## Signals evaluated and dropped

**Signal: MEDIUM-1 cursor precision (µs vs ms) + LOW-1 partial-unique reminder constraint:**
Both were caught and fixed in 43f02cf. The cursor µs-precision fix is a data-type fidelity
issue (pg timestamptz carries µs; keyset comparison must cast to ::timestamptz, not truncate).
This is a correct-by-construction data-type discipline, not a new principle class: the project
already carries integration tests with real-PG that would catch incorrect keyset skips at T-4.
No generalizable gap beyond what the existing integration tier covers. DROPPED as wave-specific
correction, no principle candidate.

**Signal: LOW-1 partial-unique reminder dedup (user_id, assignment_id) WHERE type='assignment_reminder':**
The createForReminder ON CONFLICT path was improved with a proper partial-unique index
(migration 0016) backing the dedup. This is correct spec-completeness work caught at Phase-2.
The notification dedup class is already covered by the spec's ON CONFLICT DO NOTHING
discipline (recorded in the gate verdict). The partial-unique refinement is narrower than a
principle and is specific to the reminder-type dedup shape. DROPPED; no new principle.

**Signal: Phase-2 rework cycle (2 HIGH + 2 MEDIUM + 1 LOW) as a process signal:**
The five-finding Phase-2 pass is notable in volume. However, three of the five findings (HIGH-1,
HIGH-2, MEDIUM-2) share a root cause: the frontend layer was not reviewed for HTTP contract
fidelity and list-lifecycle correctness before Phase-1 gate. The root cause is that Phase-1
code-read correctly approves backend correctness but does not exercise the HTTP client
contract. This is already the role of Phase-2 adversarial review per BUILD rule 4. The
finding-volume is within the expected Phase-2 discovery range; it does not indicate a
process failure. obs-2 and obs-3 capture the two distinct generalizable classes; the
MEDIUM-1 and LOW-1 are wave-specific corrections. DROPPED as absorbed into obs-2 + obs-3.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | BUILD rule 2 confirmed: B-block recovered from worker restart because branch was pushed per-stage | informational | 5th+ instance; rule already promoted | BUILD-PRINCIPLES | CONFIRM-EXISTING -- rule 2 held; no new promotion |
| obs-2 | HTTP verb mismatch (client POST vs controller @Patch) passes service-layer tests; controller route-metadata assertion catches it at CI | strong | 1st instance | CI-PRINCIPLES (or T-2.md) | HOLD -- first instance; promote on 2nd confirming wave |
| obs-3 | Bootstrap-once list + live-count-only hook leaves list surface stale on reopen; reload on panel-open reconciles | warning | 1st instance | BUILD-PRINCIPLES (or T-2.md) | HOLD -- first instance; promote on 2nd confirming wave |

**Observations emitted: 3 (obs-1, obs-2, obs-3)**
**Severities: 1 informational (obs-1), 1 strong (obs-2), 1 warning (obs-3)**
**Candidate files: BUILD-PRINCIPLES (obs-1 confirmation + obs-3 hold), CI-PRINCIPLES (obs-2 hold)**
**Promotion-eligible this wave: NONE**
**Overall distill verdict: PROMOTE ZERO this wave (obs-1 is rule-2 confirmation; obs-2 and obs-3 are first-instance HOLDs)**

---

## Promotion candidate flags for karen

**No observations are promotable this wave. One confirmation of an existing rule; two first-instance HOLDs.**

**obs-1** is an informational confirmation of BUILD-PRINCIPLES rule 2. The rule functioned
correctly. The B-block was recovered without loss because the branch had been pushed after
each stage. No action required.

**obs-2** (CI-PRINCIPLES rule 8 or T-2.md rule 2 candidate, strong severity) is the highest-
priority new HOLD. The class is clean: an HTTP verb mismatch (client POST vs controller @Patch)
is structurally invisible to service-layer tests. The candidate rule is falsifiable (controller
spec must assert route metadata for each new verb). The fix pattern is concrete (43f02cf
controller.spec route-metadata assertion). Watch for: any wave adding new controller routes
without controller-level route-metadata assertions in the test diff.

**obs-3** (BUILD-PRINCIPLES rule 9 or T-2.md rule 2 candidate, warning severity) is the second
new HOLD. The class is falsifiable (hook with mount-fetch + live-count-increment must include
a reload on panel-open). The fix pattern is concrete (ce3d4cb reload() on panel-open).
Watch for: any wave adding a hook that fetches a list at mount and increments a derived counter
via socket or polling, without wiring a reload to the panel-open event.

**Competing BUILD slot-9 candidates (all 1st-instance HOLDs or held):**
  - wave-31 obs-1 (strong): credential-endpoint membership-before-load -- highest priority
    by severity and age; if it confirms before obs-3, it takes slot 9.
  - wave-36 obs-1 (warning): security-boundary authz tests deferred to follow-up wave.
  - wave-36 obs-3 (warning): two-layer IDOR proof for session-only-userId endpoints.
  - wave-32 obs-1 (warning, linter-blocked): enumerated-mock factory staleness.
  - wave-32 obs-3 (warning): typed api-client method added but consumer fetches inline.
  - wave-33 obs-3 (informational): clone shipped error-walk helper depth.
  Wave-37 obs-3 (warning) joins this queue. First-to-confirm takes the slot.

**obs-2 note on target file:** CI-PRINCIPLES slot 8 is open; T-2.md slot 2 is also open.
The deciding factor at confirmation: if the gap is caught by a CI failure (method drift
surfacing in a test run), CI-PRINCIPLES is the natural home. If the gap is caught at B-6
Phase-1 code-read (reviewer spots missing controller spec), T-2.md is the natural home.
Both slots remain open; no pre-commitment.
