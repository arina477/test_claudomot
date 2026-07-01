# Wave 30 — L-2 Distill Observations

Synthesized from wave-30 artifacts (M5 milestone-defining wave: assignment due-date reminder
cron, NotificationsModule, assignment_reminder tracking table, reminder email template;
PR#43 81dc821; V APPROVED first attempt).
Prior archives consulted: process/waves/_archive/wave-{26,27,28,29}/blocks/L/observations.md.
Principles files read: BUILD-PRINCIPLES (8 rules, rule 8 promoted w28), CI-PRINCIPLES
(6 rules, rule 6 promoted w27), PRODUCT-PRINCIPLES (2 rules, rule 2 promoted w27),
VERIFY-PRINCIPLES (1 rule), T-4.md (0 rules), T-8.md (1 rule already live).

---

```yaml
observations:

  - id: obs-1
    summary: >
      When a query must exclude rows matching a status that app code defaults when
      the status row is absent (e.g., `statusRow?.state ?? 'todo'`), the SQL exclusion
      MUST use a LEFT JOIN + IS DISTINCT FROM, NOT an inner join or `!=`. An inner join
      silently drops every entity that has no status row — exactly the majority this
      feature intends to remind. The P-0 problem-framer caught this as a defect-prevention
      catch before any spec was authored: `assignments.service.ts:184` uses `?? 'todo'`
      meaning a member with no `assignment_status` row is treated as 'todo' (not done),
      so the exclusion `state != 'done'` via an inner join would drop them. The correct
      form is `LEFT JOIN assignment_status ON (assignment_id, user_id), WHERE state IS
      DISTINCT FROM 'done'` — NULL (no row) evaluates TRUE (remind), 'todo' evaluates
      TRUE (remind), only 'done' evaluates FALSE (skip). P-4 Phase 2 karen verified the
      linchpin at the code level (reminder-scan.service.ts:162-175). T-4 integration
      case (a) is the mutation-genuine discriminator: a member with no status row is
      seeded, and the assertion (real DB row + email) would FAIL under an inner join.
      The generalizable class: whenever a query's exclusion predicate mirrors an
      application-code `?? <default>` fallback on a nullable foreign-key relationship,
      the SQL must LEFT JOIN and use IS DISTINCT FROM (NULL-safe), not an equijoin or
      inequality operator (NULL-unsafe).
    source:
      - process/waves/wave-30/stages/P-0-problem-framer.md
        # "Done-filter: a member with NO assignment_status row defaults to 'todo'
        #   (service :184: `(statusRow?.state) ?? 'todo'`), i.e. 'not done' = remind.
        #   So the exclusion is `state IS DISTINCT FROM 'done'` via a LEFT JOIN,
        #   NOT an inner join on status (an inner join would wrongly skip every member
        #   who never opened the assignment — the majority)."
      - process/waves/wave-30/blocks/P/gate-verdict.md
        # Phase 1: "LEFT JOIN done-exclusion (not inner); [inner join] is called out as
        #   WRONG ... no-status member reminded" as ACs; carries to B explicitly.
        # Phase 2 karen: "the LEFT-JOIN linchpin confirmed at assignments.service.ts:184
        #   (`?? 'todo'`)"
      - process/waves/wave-30/blocks/B/gate-verdict.md
        # "The join to assignment_status is a genuine leftJoin, and the predicate is
        #   IS DISTINCT FROM 'done', which is NULL-safe: a member with no status row
        #   (NULL) evaluates true and IS reminded ... An inner join would have silently
        #   dropped the majority."
      - process/waves/wave-30/stages/T-4-integration.md
        # "Action 3 case (a): ... would FAIL if the join were inner. STRONG."
    severity: strong
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      1ST INSTANCE of the "query exclusion must LEFT JOIN + IS DISTINCT FROM when
      app code defaults the absent FK row" class in L-2 history. HOLD.

      The class is generalizable: applies at any B-block wherever SQL filtering on
      a nullable foreign-key status mirrors an app-code `?? <default>` or `|| <default>`
      pattern. The correct check is always: "What does the app code produce when the FK
      row is absent? If it produces a non-null default, then SELECT-WHERE-NOT-equal
      against that FK table is NULL-unsafe. LEFT JOIN + IS DISTINCT FROM is required."
      This is a deterministic, falsifiable check a reviewer can apply at B-6 or V-1
      for any wave that introduces a filter on a nullable FK relationship.

      Near-dup check against BUILD rules 1-8: no existing rule addresses NULL-safe
      exclusion predicates on nullable FK relationships. Rule 4 (adversarial negative
      path reproduction) is the closest — rule 4 requires B-6 Phase 2 reproduction of
      a negative path at authz/injection boundaries; this candidate is about SQL
      correctness at the query level (not authz). Different axis, different fix pattern.
      No near-dup.

      Near-dup check against PRODUCT-PRINCIPLES rules 1 and 2: both address P-0
      framing verification. This candidate targets the SQL query construction pattern
      at B-block (and its verification at V-1). Different stage and domain. No near-dup.

      Near-dup check against VERIFY rule 1 (inspect create-path source): rule 1 targets
      V-1 AC verification methodology. This candidate targets the SQL predicate pattern
      for exclusion queries. No near-dup.

      BUILD-PRINCIPLES has 8 rules; slot 9 open. HOLD. Promote to BUILD-PRINCIPLES rule 9
      on second confirming wave where a query excludes on a nullable FK status AND either
      (a) a reviewer catches an inner join / NULL-unsafe predicate at a gate, OR (b) the
      correct LEFT JOIN + IS DISTINCT FROM is the only reason a test case discriminates
      real from wrong behavior.

      The problem-framer's catch at P-0 (before any spec was written) prevented a
      production defect that would have silently sent no reminders to the majority of
      members. The T-4 mutation-genuine test case (a) is the verifiable proof of the
      defect class. If this pattern recurs in a wave that ships without the P-0 catch
      and the defect reaches production, severity upgrades to critical.
    promotion_gates:
      generalizable: true
        # Applies to any wave that queries a nullable FK status table and must exclude
        # entities matching a default value. Pattern: app reads `row?.field ?? DEFAULT`
        # then SQL must `LEFT JOIN status_table WHERE field IS DISTINCT FROM EXCLUDE_VALUE`.
        # Common in assignment-like features (tasks, tickets, statuses, progress tracking)
        # where "no status row" means "default/initial state."
      falsifiable: true
        # Checkable at B-6 Phase 2 (adversarial pass) or V-1 for any wave with an
        # exclusion query on a nullable FK: does the query use LEFT JOIN + IS DISTINCT
        # FROM (or equivalent NULL-safe predicate)? A query using INNER JOIN or `!=`
        # on a nullable FK field where the app defaults the absent row fails this rule.
        # Grep signal: presence of `!= 'done'` or `.innerJoin(status_table, ...)` + a
        # `WHERE state` filter without `IS DISTINCT FROM` on a nullable FK.
      cited: true
        # P-0-problem-framer.md (defect-prevention catch pre-spec; `?? 'todo'` linchpin
        #   identified; LEFT JOIN + IS DISTINCT FROM mandated as forward framing);
        # P/gate-verdict.md Phase 1 (inner-join-is-WRONG called out verbatim as an AC);
        # P/gate-verdict.md Phase 2 karen (linchpin confirmed at assignments.service.ts:184);
        # B/gate-verdict.md (genuine leftJoin + IS DISTINCT FROM verified, NULL semantics
        #   traced: NULL=true remind, todo=true remind, done=false skip);
        # T-4-integration.md case (a) (mutation-genuine: no-status member seeded, assertion
        #   proves reminder row exists; would FAIL under inner join).
    candidate_rule_shape: >
      9. Use LEFT JOIN + IS DISTINCT FROM when excluding on a nullable FK status that
         app code defaults when absent; an inner join drops the untracked majority.
         Why: A missing FK row is NULL, which `!=` treats as unknown, silently excluding it.
      Rule line = 113 chars; why line = 79 chars. No forbidden tokens.
    promotion_status: HOLD. First instance. Promote to BUILD-PRINCIPLES rule 9 on second
      confirming wave where a nullable-FK exclusion query is built incorrectly (inner join
      or NULL-unsafe predicate) and is caught by a gate, test, or defect.


  - id: obs-2
    summary: >
      The correct pattern for an unattended cron that must send an external effect exactly
      once per (entity, user) pair is: INSERT the tracking row FIRST using ON CONFLICT DO
      NOTHING RETURNING, then send ONLY if the INSERT returned a row (i.e., only if this
      invocation created the row). The DB UNIQUE constraint is the arbiter — not a preceding
      SELECT. This ordering is crash-safe: a crash after the insert but before the send
      produces a silent miss (at-most-once) rather than a double-send (which the reverse
      ordering would allow). A SELECT-then-insert pattern has a TOCTOU race: two concurrent
      ticks can both observe "no row" and both proceed to send. The P-0 framer named the
      ordering rule explicitly; AC #3 in the spec encoded it; B-6 verified `sendReminderIfNew`
      at reminder-scan.service.ts:210-232 executes the INSERT ON CONFLICT DO NOTHING RETURNING
      and gates the send on `inserted.length !== 0`; T-4 case (c) proves the send-once
      guarantee against real Postgres (runs the scan twice; asserts row-count AND email-count
      unchanged on the second tick). The generalizable class: any cron that triggers an
      external irreversible side effect once per (entity, user) — or any (entity, entity) pair
      — should use the INSERT-RETURNING-gated pattern against a DB UNIQUE constraint, NOT a
      SELECT-then-insert TOCTOU.
    source:
      - process/waves/wave-30/stages/P-0-problem-framer.md
        # "Send-once ordering matters ... Insert-then-send makes a crash-after-insert
        #   a silent miss rather than a double-send; the reverse risks double-send
        #   on retry. Insert-first is the safer default."
      - process/waves/wave-30/blocks/P/gate-verdict.md
        # Phase 2 karen: "'insert affected a row' must read the INSERT RETURNING/rowCount,
        #   NOT a SELECT-then-insert (TOCTOU)."
      - process/waves/wave-30/blocks/B/gate-verdict.md
        # "send-once / TOCTOU — PASS. sendReminderIfNew ... INSERT ... onConflictDoNothing
        #   ().returning({id}), then sends the email ONLY when inserted.length !== 0.
        #   INSERT-RETURNING-gated, not SELECT-then-insert; the DB UNIQUE ... is the
        #   arbiter so concurrent ticks/instances/crashes cannot double-send."
      - process/waves/wave-30/stages/T-4-integration.md
        # "case (c) send-once (:200-221). Runs the scan TWICE; asserts first scan
        #   produced >0 rows AND >0 email calls, then second scan leaves row-count AND
        #   call-count UNCHANGED. ... Both the ledger-row count and the side-effect
        #   count are load-bearing. STRONG."
    severity: strong
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      1ST INSTANCE of the "INSERT-RETURNING-gated external side effect for at-most-once
      cron delivery" class in L-2 history. HOLD.

      The class is generalizable beyond email: applies to any cron (or background job,
      queue consumer) that must trigger an external irreversible side effect exactly once
      per a unique (entity1, entity2) pair — email, webhook, push notification, SMS,
      payment capture, etc. The pattern is: (1) DB UNIQUE constraint on the tracking
      row, (2) INSERT ... ON CONFLICT DO NOTHING RETURNING, (3) gate the side effect on
      the INSERT having returned a row. This is a BUILD-level code pattern, not a
      process rule; it belongs in BUILD-PRINCIPLES.

      Near-dup check against BUILD rules 1-8: rule 3 ("Any seed applied by a backfill
      must also appear in the create transaction, column-for-column") addresses data
      consistency in seeding, not idempotent side-effect delivery. No other rule
      addresses INSERT-gated external effects. No near-dup.

      Near-dup check against obs-1 above: obs-1 targets the query predicate for
      recipient resolution (LEFT JOIN + IS DISTINCT FROM). obs-2 targets the
      side-effect gating pattern (INSERT-RETURNING vs SELECT-then-insert). These are
      independent patterns on different code paths within the same cron. Not a near-dup.

      BUILD-PRINCIPLES has 8 rules; slot 9 (or 10) open. HOLD. Promote to BUILD-PRINCIPLES
      on second confirming wave where a cron or background job uses or should use the
      INSERT-RETURNING-gated pattern for an irreversible external side effect. Note:
      obs-1 is also a BUILD-PRINCIPLES slot-9 candidate this wave. If both confirm on the
      same future wave, the higher-severity or higher-defect-impact signal takes the
      per-wave promotion slot; given both are strong this wave, the one with the broader
      applicability claim wins.

      Per-file promotion cap note: obs-1 and obs-2 are both BUILD-PRINCIPLES candidates.
      Both are 1st-instance HOLDs. If both confirm on the same future wave, eval severity
      and applicability breadth at that time to pick the per-wave slot winner.
    promotion_gates:
      generalizable: true
        # Applies to any background job (cron, queue consumer, event handler) that must
        # trigger a real-world irreversible side effect at most once per a unique (entity,
        # entity) or (entity, user) pair. The pattern (DB UNIQUE + INSERT ON CONFLICT DO
        # NOTHING RETURNING + gate on inserted.length) is framework-agnostic and
        # language-agnostic; it degrades safely to at-most-once on crash mid-send rather
        # than risking double-send under SELECT-then-insert TOCTOU.
      falsifiable: true
        # Checkable at B-6 Phase 2 or V-1 for any cron sending an irreversible side
        # effect: does the code read the INSERT RETURNING result to gate the side effect,
        # rather than a prior SELECT to check existence? A SELECT-before-INSERT pattern
        # on a UNIQUE-constrained table fails this rule. Grep signal: `SELECT ... WHERE
        # ... = $1` immediately before the INSERT of the same row, or an existence check
        # followed by a conditional insert rather than ON CONFLICT DO NOTHING RETURNING.
      cited: true
        # P-0-problem-framer.md (insert-before-send ordering; crash-safety reasoning;
        #   UNIQUE + ON CONFLICT DO NOTHING as instance-safe substrate);
        # P/gate-verdict.md Phase 2 karen (TOCTOU warning: SELECT-then-insert named
        #   explicitly as the wrong pattern; INSERT RETURNING/rowCount required);
        # B/gate-verdict.md (INSERT-RETURNING-gated verified; TOCTOU-safe analysis;
        #   concurrent tick race analyzed);
        # T-4-integration.md case (c) (dual-scan send-once proof against real Postgres:
        #   row-count + email-count both unchanged on second tick).
    candidate_rule_shape: >
      9. For a cron external side effect once per unique pair, INSERT ON CONFLICT DO
         NOTHING RETURNING and gate the send on a row being created, not SELECT-then-insert.
         Why: A SELECT-then-insert race lets two concurrent ticks both see no row and double-send.
      Rule line = 117 chars; why line = 86 chars. No forbidden tokens.
    promotion_status: HOLD. First instance. Promote to BUILD-PRINCIPLES on second confirming
      wave where a cron INSERT-RETURNING-gated pattern is used correctly, or a TOCTOU
      SELECT-then-insert defect is caught at a gate or in production.


  - id: obs-3
    summary: >
      The /review adversarial pass at B-6 found a P1 finding (silent permanent drop on
      Resend send-failure: insert-before-send + swallowed error means the member never
      retries) and the correct disposition was: (1) accept as MVP/deliberate (at-most-once
      is spam-safe, consistent with AC3, correct at 0 users), (2) file a tracked follow-up
      task (4905dc3a: at-least-once via sent_at for real-student traffic), (3) apply a
      minimal interim observability fix (per-tick send-failure WARN log, commit f80cb39) so
      an outage is visible rather than silent. V-2 triage confirmed the at-most-once design
      as spec-CONSISTENT (not a defect; AC3 prioritizes no-double-send). V-3 head-verifier
      explicitly confirmed 4905dc3a as a genuine tracked follow-up, NOT a defect. The
      generalizable pattern: a "correct-but-has-a-known-limitation" review finding on an
      unattended external-effect system can be closed without over-building by combining
      (a) explicit acceptance with documented rationale, (b) a tracked follow-up task for
      the at-real-scale improvement, and (c) a minimum-viable observability hook so the
      limitation is visible if it fires. This is distinct from ignoring a finding: the
      disposition is fully documented, the trade-off is explicit, and a concrete upgrade
      path is filed.
    source:
      - process/waves/wave-30/stages/B-6-review.md
        # "Silent permanent drop on Resend send-failure ... P1 (non-blocking-for-MVP per
        #   reviewer) | Accepted-MVP (deliberate spam-safe at-most-once, head-builder-
        #   approved; a retry queue is mvp keep-OUT at 0 users) + tracked follow-up
        #   4905dc3a (at-least-once via sent_at for real-student traffic) + interim fix
        #   (f80cb39): per-tick send-failure WARN summary."
      - process/waves/wave-30/stages/V-2-triage.md
        # "4905dc3a (at-least-once retry) | already-filed follow-up | jenny: the at-most-once
        #   design is spec-CONSISTENT (AC3 prioritizes no-double-send). Non-blocking;
        #   triage when DAU>0. Do NOT re-file."
      - process/waves/wave-30/blocks/V/gate-verdict.md
        # "4905dc3a (at-least-once retry) is a genuine tracked follow-up, NOT a defect
        #   — the at-most-once design is explicitly spec-consistent (AC3 prioritizes
        #   no-double-send; the row is the send-ledger)."
    severity: informational
    candidate_principles_file: command-center/principles/VERIFY-PRINCIPLES.md
    recurrence: >
      1ST INSTANCE of the "'correct-but-has-a-known-limitation' review finding: accept +
      track + add observability hook" pattern in L-2 history. HOLD.

      The class is generalizable: applies at B-6 Phase 2 or V-2 triage whenever a finding
      identifies a design trade-off (not a bug) that is correct for current scale but
      should be improved at higher scale. The three-part disposition — (a) explicit
      acceptance with documented rationale, (b) tracked follow-up task, (c) minimum
      observability hook — is the correct pattern. The alternative patterns (ignore
      silently, or over-build the improvement now) both have higher cost: silent ignore
      is indistinguishable from an oversight; over-building ships a retry queue at 0 users.

      Near-dup check against VERIFY rule 1 (inspect create-path source): rule 1 targets
      V-1 AC verification. This candidate targets B-6/V-2 finding disposition for
      accepted trade-offs. Different stage and axis. No near-dup.

      Near-dup check against wave-28 obs-4 (spec-GAP vs spec-drift classification at V-2):
      obs-4 targets divergence classification (is the code wrong or is the spec wrong).
      This candidate targets the disposition of a "correct at this scale, needs upgrade at
      next scale" finding (neither code-wrong nor spec-wrong — it is a deliberate trade-off).
      The disposition triple (accept + track + observe) is the new element. No near-dup.

      VERIFY-PRINCIPLES has 1 rule; slot 2 open. Two candidates are in the HOLDs queue for
      slot 2: wave-28 obs-4 (spec-GAP vs spec-drift, 1st instance) and wave-29 obs-2 (V-3
      pattern scan beyond named sites, 1st instance). Wave-30 obs-3 is a third 1st-instance
      HOLD for slot 2. All three are informational. If multiple confirm on the same future
      wave, severity and uniqueness of resolution axis determine which takes the slot.

      HOLD. Promote to VERIFY-PRINCIPLES rule 2 on second confirming wave where a B-6 or
      V-2 finding is correctly disposed as "accept + track + observe" for a known-limitation
      trade-off, or incorrectly disposed (over-built or silently ignored) when this pattern
      would have been correct.
    promotion_gates:
      generalizable: true
        # Applies at B-6 Phase 2 or V-2 triage for any finding on an unattended system
        # (cron, batch job, webhook consumer) where a review identifies a design trade-off
        # that is correct at current scale (at-most-once, no retry, fixed window) but would
        # need upgrading at higher scale (at-least-once, retry queue, user-configurable).
        # The pattern is: the code is NOT wrong (it meets the spec and the scale context);
        # the finding describes a known limitation. Disposition = accept + track + observe.
      falsifiable: true
        # Checkable at B-6/V-2: when a finding identifies a spec-consistent design
        # limitation (not a bug), does the disposition record (a) explicit acceptance with
        # rationale, (b) a filed follow-up task, and (c) at minimum a log/warn that fires
        # if the limitation manifests? A disposition that is "accepted" with no follow-up
        # and no observability hook fails this rule. A disposition that over-builds the
        # improvement (adds a retry queue at 0 users) fails this rule in the opposite direction.
      cited: true
        # B-6-review.md (P1 finding: silent drop on send-failure; accepted-MVP + 4905dc3a
        #   tracked + f80cb39 per-tick WARN summary; head-builder-approved);
        # V-2-triage.md (jenny: at-most-once spec-CONSISTENT, non-blocking, do not re-file);
        # V/gate-verdict.md (head-verifier: 4905dc3a genuine tracked follow-up, not defect;
        #   at-most-once design explicitly spec-consistent).
    candidate_rule_shape: >
      2. Dispose a spec-consistent design-limitation finding with explicit acceptance, a
         filed follow-up task, and a minimum observability hook.
         Why: Silent acceptance is indistinguishable from an oversight; over-building ships
         future-scale complexity now.
      Rule line = 116 chars; why line = 93 chars. No forbidden tokens.
    promotion_status: HOLD. First instance. Promote to VERIFY-PRINCIPLES rule 2 on second
      confirming wave. Competes with wave-28 obs-4 and wave-29 obs-2 for the same slot 2;
      highest-severity confirming instance at that future wave takes the slot.
```

---

## Prior held observations — second-instance status

| origin | obs | class | wave-30 status |
|--------|-----|-------|----------------|
| wave-29 | obs-1 | Plan-level operator fix must lock a single expression form and exclude wrong candidates | NOT CONFIRMED this wave. P-4 APPROVED first attempt; no plan-level operator-fix ambiguity. Remains 1-wave HOLD (PRODUCT-PRINCIPLES rule 3 candidate). |
| wave-29 | obs-2 | V-3 head-verifier pattern scan beyond named sites caught a reviewer-missed occurrence | NOT CONFIRMED this wave. Head-verifier did re-verify independently but the scope was the full correctness-critical chain, not a pattern-search for same-pattern neighbors (wave had a new cron module, not a repeated local pattern like operator substitution). Remains 1-wave HOLD (VERIFY-PRINCIPLES rule 2 candidate). |
| wave-29 | obs-3 | Override-ship log gap: P-1 entry missing from product-decisions.md until backfill | NOT CONFIRMED this wave. This is a `floor_merge_attempt: 0` genuine feature wave with no under-floor override-ship; no product-decisions.md log gap. Remains 1-wave HOLD (PRODUCT-PRINCIPLES rule 3 candidate). |
| wave-28 | obs-1 | Entropy scanner false-positives on model-authored transcript directories | NOT CONFIRMED this wave. No entropy scanner interaction at C-1 (clean CI). Remains 2-wave HOLD (CI-PRINCIPLES rule 7 candidate). |
| wave-28 | obs-2 | CI-config fix pushed unverified reproduces identical failure | NOT CONFIRMED this wave. No CI-config fix cycle occurred. Remains 2-wave HOLD (CI-PRINCIPLES candidate). |
| wave-28 | obs-4 | V-block spec-GAP vs spec-drift: classify before acting | NOT CONFIRMED this wave. V-2 had 0 blocking findings; 2 noise items suppressed (F30-T4-a, F30-T8-a); 4905dc3a was already-filed follow-up, not a divergence finding. Remains 2-wave HOLD (VERIFY-PRINCIPLES rule 2 candidate). |
| wave-27 | obs-1 | EXPLAIN test on small-seeded table needs enable_seqscan=off | NOT CONFIRMED this wave. No EXPLAIN-based integration test authored. Remains HOLD (T-4 rule 1 candidate). |
| wave-27 | obs-3 | Perf wave: spec structural proofs sufficient for T-7, no load test | NOT CONFIRMED this wave. No performance wave. Remains HOLD (T-7 rule 1 candidate). |
| wave-26 | obs-1 | Unit fixture seeds store with value real producer excludes; T-5 live E2E caught it | NOT CONFIRMED this wave. No store-keyed unit fixture authored; no T-5 run (backend-only wave). Remains HOLD (T-2 rule 2 candidate). |
| wave-26 | obs-3 | Hard-coded date fixture without clock-mock rots as wall-time advances | NOT CONFIRMED this wave. No date-dependent test authored. Remains HOLD (T-2 candidate). |

---

## Signals evaluated and dropped

**Signal 1 — Migration-must-apply-to-prod-BEFORE-api-cutover (C-2 migration ordering):**
C-2 applied migration 0013 to prod before the api cutover (public proxy verify, journal
hash confirmed). This is correct behavior. However, this ordering pattern has been applied
consistently across every migration-bearing wave in this project's history — waves 4, 8,
10, 12, 13, 15, 18, 19, 22, 23, 27, and now 30 all have explicit "applied before cutover"
evidence in their C-2 stages. This is not an L-2 signal because it has NEVER been violated
in this project: there is no failure instance, no near-miss instance, no gate finding about
migration ordering. The CI-PRINCIPLES already implicitly covers this via rule 1 (deploy
verification) and the deploy notes reference. A pattern that has always been executed
correctly and has never been at risk of violation during any documented wave is a practice,
not a promotable signal. An L-2 rule requires a failure, a near-miss, or a catch that
prevented a defect — none exists here. DROPPED as a standing practice with no violation
or near-miss instance.

**Signal 5 — Sub-agent (head-ci-cd) ended mid-C-2; orchestrator verified prod state
and completed the deliverable:**
This is an operational resilience behavior by the orchestrator (verify external state
yourself when a sub-agent's handoff is incomplete). The C-2 deliverable note explicitly
records: "head-ci-cd agent completed the migration + started deploy; orchestrator verified
prod state + wrote this deliverable." While the behavior is correct, it is too operational
and narrow to generalize as a principles rule: the correct response to any incomplete
sub-agent handoff is always "verify the external state directly" — this is already the
orchestrator's default behavior and requires no additional rule to encode. It is not
falsifiable as a checklist item because a reviewer cannot determine post-hoc whether a
sub-agent's handoff was complete unless there is evidence of an error or a written note.
DROPPED as too operational and not independently falsifiable.

**Signal 6 — Credential-blocked milestone escalated as a hard founder fork; resolved
after 8+ debt waves:**
Wave-29 obs-3 (dropped signal) noted this was "not yet falsifiable / threshold-undefined."
The resolution (founder provided the Resend key, Path A chosen) is now known, but does
it promote the signal? No. The resolution confirms the escalation process worked as designed
(repeated digest escalation + founder decision point), not that a new principle is needed.
The wave-29 analysis was correct: the "hard gate" mechanism would require DISPATCHER or
P-1 logic changes, not a PRODUCT-PRINCIPLES rule; the "N waves" threshold is still
undefined and project-specific; and the escalation chain per the ceo-reviewer path already
handles this structurally. The resolution does not add falsifiability — it adds one resolved
data point. DROPPED for the same reasons as wave-29: not a falsifiable, generalizable,
principles-level rule.

---

## Summary table

| id    | title (short)                                                                    | severity      | recurrence   | candidate file           | disposition                                                                              |
|-------|---------------------------------------------------------------------------------|---------------|--------------|--------------------------|------------------------------------------------------------------------------------------|
| obs-1 | LEFT JOIN + IS DISTINCT FROM for nullable-FK exclusion mirroring app-code `??` default | strong | 1st instance | BUILD-PRINCIPLES         | HOLD — rule 9 candidate; promote on 2nd confirming wave (gate catch or mutation-genuine test confirms class) |
| obs-2 | INSERT-RETURNING-gated external side effect for at-most-once cron delivery      | strong        | 1st instance | BUILD-PRINCIPLES         | HOLD — rule 9/10 candidate; promote on 2nd confirming wave; competes with obs-1 for per-wave slot |
| obs-3 | Accept + track + observe: dispose a spec-consistent design-limitation finding   | informational | 1st instance | VERIFY-PRINCIPLES        | HOLD — rule 2 candidate; competes with w28 obs-4 + w29 obs-2 for same slot              |

**Observations emitted: 3**
**Severities: 2 strong, 1 informational**
**Candidate files: BUILD-PRINCIPLES (obs-1, obs-2), VERIFY-PRINCIPLES (obs-3)**
**Dropped: Signal 1 (migration ordering — standing practice, no violation instance),
Signal 5 (sub-agent resilience — too operational, not falsifiable as a principles rule),
Signal 6 (credential-blocked milestone — same not-yet-falsifiable / threshold-undefined
reasons as wave-29; resolution does not add falsifiability)**

---

## Promotion candidate flags for karen

**No observations are promotable this wave.** All three are 1st-instance HOLDs.

**obs-1** (BUILD-PRINCIPLES rule 9 candidate) is the highest-value HOLD: the P-0
problem-framer catch prevented a production defect (no reminders sent to the majority of
members), the T-4 case (a) mutation-genuine test discriminates correct from wrong behavior,
and the rule is deterministically falsifiable (grep for INNER JOIN + WHERE status != on a
nullable FK table). The candidate rule is concise and covers all variants of the class
(assignment status, task completion, any `?? default` mirrored in SQL).

**obs-2** (BUILD-PRINCIPLES rule 9/10 candidate) is the send-once idempotency pattern.
Strong because karen caught the TOCTOU risk at P-4 Phase 2 and named it explicitly; T-4
case (c) is the mutation-genuine proof. The pattern is broadly applicable (any cron with
an irreversible external side effect). Competes with obs-1 for the same BUILD-PRINCIPLES
per-wave promotion slot if both confirm simultaneously; at that point, relative defect
severity and applicability breadth determine precedence.

**obs-3** (VERIFY-PRINCIPLES rule 2 candidate) is informational because the three-part
disposition worked cleanly this wave — no finding was mishandled. The value is in the
pattern being named (accept + track + observe vs over-build or ignore). Competes with
wave-28 obs-4 (spec-GAP vs spec-drift) and wave-29 obs-2 (V-3 pattern scan) for
VERIFY-PRINCIPLES slot 2. At confirmation, the highest-severity or most-uniquely-resolved
signal takes the slot.
