# Wave 10 — L-2 Distill observations (knowledge-synthesizer synthesis)

Synthesized from wave-10 artifacts (M2 RBAC capstone: roles + can() permission engine +
channel-permissions + owner-lockout protection + UI; PR#20 + V-3 fast-fix PR#21; V-APPROVED;
176 tests). M2 is feature-complete (all 4 bundles shipped).
Prior archives consulted: process/waves/_archive/wave-{7,8,9}/blocks/L/observations.md.

```yaml
observations:

  - id: obs-1
    title: "Verified-prod-session fixture gap: 4 consecutive authed-feature waves, task 4a2ad286 never executed"
    summary: >
      Every authed-feature wave from wave-7 through wave-10 has been structurally unable to
      live-verify its authenticated permission core (403 non-permitted / RBAC authz paths)
      because no persistent verified prod fixture exists. The escalation history is direct:
      wave-7 L-2 queued task 4a2ad286 (task-candidate); wave-8 L-2 upgraded to
      task-escalation ("prioritize before next authed-feature wave"); wave-9 L-2 upgraded
      to task-escalation-critical ("RBAC wave will be structurally blocked"); wave-10 C-2
      confirms the prediction: "403 non-permitted NOT live-verified" (C-2 head-signoff
      rationale). T-8 explicitly records the gap as an info finding; both V-1 reviewers
      independently flagged it. V-3 escalated it to L/N. The gap has persisted for 4
      consecutive authed-feature waves without 4a2ad286 being executed. The
      escalation-not-acted-upon streak is itself a systemic signal: task-escalation as the
      sole mechanism has failed four times; the task has never been bundled into a wave.
      This wave's RBAC surface is the highest-stakes instance: owner-superuser, 403
      non-permitted, channel-filter-per-role are all critical security properties that exist
      only in unit tests, never in a live prod probe.
    source:
      - process/waves/wave-10/stages/C-2-deploy-and-verify.md
        # "403 non-permitted (access-control core): NOT live-verified — carried forward.
        #  No prod verified-session fixture exists (test-accounts.md still template;
        #  task 4a2ad286 unbundled)."
      - process/waves/wave-10/stages/T-8-security.md
        # finding: "403-non-permitted not live-probed (no verified prod fixture; 0 prod servers)
        #  -> ESCALATION-CRITICAL 4a2ad286 (4 waves running); covered by 270 tests + 6 conditions"
      - process/waves/wave-10/stages/V-1-karen.md
        # "verified-prod-fixture 4a2ad286 (authed 403-non-permitted live probe) remains
        #  escalation-critical and was not live-exercised here (0 prod servers, no verified fixture)
        #  — the 403 paths are covered by unit tests only."
      - process/waves/wave-10/stages/V-1-jenny.md
        # "No authed live e2e exercised revoke end-to-end against prod (no test session).
        #  Strongly recommend L/N prioritize 4a2ad286 so future auth/RBAC waves can
        #  live-verify the authenticated 403 core, not just the unauthenticated 401 edge."
      - process/waves/_archive/wave-9/blocks/L/observations.md
        # obs-3 (task-escalation-critical): third consecutive wave; "if 4a2ad286 is not
        #  resolved before wave-10, every wave-10 authed-surface verification will be
        #  structurally unable to live-verify its authed paths."
      - process/waves/_archive/wave-8/blocks/L/observations.md
        # obs-3 (task-escalation): second consecutive wave; "task 4a2ad286 should be
        #  prioritized before the next authed-feature wave."
      - process/waves/_archive/wave-7/blocks/L/observations.md
        # obs-2 (warning): first formal capture; task 4a2ad286 queued as task-candidate.
    severity: strong
    recurrence_wave_count: 4
    candidate_principles_file: command-center/principles/test-layer-principles/T-8.md
    generalizable: true
      # Applies to any project with a global email-verification gate where no pre-provisioned
      # verified test account exists for the prod environment. The structural consequence
      # (authenticated authz paths unverifiable without a fixture) is stack-independent.
    falsifiable: true
      # Checkable: does command-center/testing/test-accounts.md record a prod account with
      # email-verified status + SuperTokens user_id? If not, any authed authz path is
      # structurally unverifiable at C-2 / T-8.
    disposition_recommendation: >
      BOTH (a) and (b) — with (a) as the mandatory concrete action.

      (a) HARD task-escalation: pull 4a2ad286 into wave-11 as a SEED TASK (blocker), not a
      sibling. The 4-wave record of "task-escalation" as the only mechanism demonstrates
      the mechanism has failed: the task has never been bundled into a wave. Designating it
      a seed task for wave-11 means it is the wave's primary deliverable, not a carry-forward
      item that can be deprioritized against feature scope. The N-3 wave-close artifact should
      explicitly record 4a2ad286 as the wave-11 seed.

      (b) PROCESS PRINCIPLE for T-8 — clears the promotion bar. The pattern is now:
      recurring across 4 waves (recurrence_wave_count=4, exceeds the 2-wave bar by 2x),
      generalizable (any project with a session gate + no prod fixture), falsifiable
      (checkable at T-8: does a verified prod account exist in test-accounts.md?), and
      carries a direct causal chain from fixture absence to live-unverifiable authz core.
      The T-8.md "Rules" section is empty — no near-dup. Candidate rule shape:
        "Verify the authenticated authz path (403 non-permitted) live against prod at T-8
         before approving an authed-feature wave; a verified prod fixture is a prerequisite."
         Why: "A 401 live probe confirms the auth door only; the authz core (403/RBAC)
         requires an authenticated session."
      Note: this rule shape has a prerequisite dependency — the fixture must exist before
      the rule is satisfiable. That does not disqualify it; it means the rule forces the
      fixture to be created, which is the desired outcome. However, until 4a2ad286 is
      executed, promoting the rule without the fixture would create an unenforced mandate.
      Recommendation: promote (b) CONCURRENTLY with executing (a) — make 4a2ad286 wave-11
      seed, promote the T-8 rule at wave-11 L-2 once the fixture exists and was used.

      The L-block head's lean toward (a) as the concrete next action is CORRECT. (b) also
      clears the bar as a genuinely new, recurring, enforceable rule — but its enforceability
      depends on (a) completing first. Both are needed; sequence (a) then (b).

  - id: obs-2
    title: "Safe-by-default fallback does not satisfy an explicit acceptance criterion"
    summary: >
      Wave-10 V-1 Karen's Critical finding (9a): the createServer transaction did not seed
      a default Member role, but can() and canViewChannel() treat null role_id as
      default-deny (all-false), so the system was safe-by-default in the absence of the
      seeded role. Karen REJECTed on this basis: "the AC is literally unmet and the
      role-management UI for a fresh server opens onto an empty role list with no 'Member'
      baseline." Jenny scored it Low (cosmetic/spec-completeness, safe by default). The
      split verdict itself is instructive: the safety net masked the spec gap at the
      implementation layer. V-3 fast-fixed it (createServer-default-role-seed PR#21). The
      structural pattern — an explicit spec AC requires a seed/state to exist; the system
      is safe without it via a fallback path; the spec gap therefore ships undetected
      unless a reviewer checks the AC independently from the safety property — recurs at a
      smaller scale in wave-8 obs-4 (8b: share modal always minted ad-hoc because the
      server.invite_code permanent code was a safe default, but the UI AC required it to
      surface as the default option). Both cases: a safe fallback made the missing seed
      operationally transparent, hiding the AC gap from CI and B-6.
    source:
      - process/waves/wave-10/stages/V-1-karen.md
        # finding 9a (Critical): "createServer does not seed a default 'Member' role (forward path)
        #  ... the AC is literally unmet ... backfill-roles.ts covers existing servers (ran on 0),
        #  but the forward create path was never wired."
      - process/waves/wave-10/stages/V-3-fast-fix.md
        # "fast_fixed: [createServer-default-role-seed, deleteRole-assigned-guard]"
      - process/waves/_archive/wave-8/blocks/L/observations.md
        # obs-4: "8b: share modal always mints ad-hoc instead of defaulting to permanent code;
        #  operationally functional but the two-tier UI value is half-wired; safe fallback masked the gap."
    severity: warning
    recurrence_wave_count: 2
    candidate_principles_file: command-center/principles/VERIFY-PRINCIPLES.md
    generalizable: true
      # Applies to any feature where a fallback (default-deny, nullable default, implicit default)
      # makes the absence of an explicit spec-required seed invisible to runtime probes and CI.
    falsifiable: true
      # Checkable at V-1: for every AC that requires a specific initial state or seed to exist
      # (e.g., "on-create: seed X"), verify the forward create path, not just the steady-state
      # system behavior, by inspecting the create transaction source directly.
    disposition_recommendation: >
      PROMOTE to VERIFY-PRINCIPLES (candidate for L-2/karen). The pattern clears the 2-wave bar:
      wave-8 obs-4 (8b, share-modal permanent-code default) + wave-10 (createServer default-role
      seed). Both exhibit identical structure: a safe fallback makes the missing seed
      operationally transparent; CI and B-6 pass; V-1 independent check catches it. The rule is
      generalizable and falsifiable. VERIFY-PRINCIPLES Rules section is empty (no near-dup).
      Candidate rule shape:
        "Verify explicit seeding ACs against the create path in source, not system behavior;
         a safe fallback masks a missing seed."
         Why: "A default-deny or nullable fallback can satisfy runtime probes while the AC's
         required initial state is absent."
      At 122 chars the rule line is slightly over the 120-char limit; karen will compact on
      promotion. This is a strong candidate for the cap (VERIFY-PRINCIPLES: 0 rules → 1).

  - id: obs-3
    title: "Split reviewer verdicts: adjudicate on the AC standard, defer on the forward-scope bound"
    summary: >
      Wave-10 had a Karen-REJECT / jenny-APPROVE split. Karen REJECTed on unmet ACs (Critical +
      High); jenny APPROVEd because security was sound, impact was bounded, and the gaps were
      spec-completeness. V-3 adjudicated: fast-fix the cheap explicit-AC gaps (createServer seed,
      deleteRole guard) now; defer the forward-scoped primitives (ChannelPermissionGuard wiring,
      OwnerLockoutService routes) to M3 per spec's own language. The adjudication criterion was
      clean: if a finding identifies an unmet AC that is cheap to close, fast-fix it regardless
      of safety; if a finding identifies something that is forward-scoped per the spec (M3 will
      reuse), defer explicitly with a deferral record. The split resolution was efficient (1 fast-fix
      round) and did not compromise either reviewer's judgment: karen's standard was met (ACs are
      now met) and jenny's bound was respected (forward-scoped items correctly deferred).
    source:
      - process/waves/wave-10/stages/V-3-fast-fix.md
        # "fast_fix_rounds: 1; fast_fixed: [createServer-default-role-seed, deleteRole-assigned-guard];
        #  deferred_to_M3: [member-list-endpoint, guard/owner-lockout-route-wiring]"
      - process/waves/wave-10/stages/V-1-karen.md
        # finding 9a Critical / 9b High (unmet ACs); items 4/7 Low (forward-scoped, defensible)
      - process/waves/wave-10/stages/V-1-jenny.md
        # "can't delete role still assigned — interpretation note... safe resolution... arguably
        #  satisfies 'reassign' (to default). Not a security hole. Logged as minor design choice."
    severity: informational
    recurrence_wave_count: 1
    candidate_principles_file: command-center/principles/VERIFY-PRINCIPLES.md
    generalizable: true
      # The triage criterion (fast-fix unmet cheap ACs; defer forward-scoped primitives) is
      # independent of the specific feature surface. Applicable to any split verdict involving
      # completeness vs. scope-discipline tensions.
    falsifiable: true
      # Checkable: when reviewers split, does the V-3 record name the adjudication criterion
      # (AC unmet vs. forward-scope) for each finding? If V-3 defers an unmet cheap AC, the
      # rule is violated.
    disposition_recommendation: >
      KEEP AS OBSERVATION. Single-wave occurrence. Pattern may be recurring (wave-8 had a
      related triage: V-2 accepted 8a/8b as non-blocking based on 0-prod-server bound; wave-9
      had a single-reviewer APPROVE with minor deltas), but the split-reviewer-adjudication
      framing specifically is wave-10-specific. Hold for a second confirming instance before
      promoting. If a second wave has a karen/jenny split resolved by the same
      AC-standard/forward-scope criterion, recurrence condition fires. Cap note: if obs-2
      is promoted this wave, VERIFY-PRINCIPLES cap (1/wave) is consumed — obs-3 cannot also
      be promoted this wave regardless of recurrence. Hold.

  - id: obs-4
    title: "Create-path and backfill-path must seed identical defaults"
    summary: >
      The backfill script (backfill-roles.ts) seeded a default 'Member' is_default=true role
      for existing servers, but the createServer transaction did not. The two paths diverged:
      existing servers got the seed via backfill; new servers created after deploy received
      zero roles. Karen's Critical finding 9a was exactly this divergence. The fast-fix
      (PR#21) closed the gap by adding the same insert to createServer's transaction. The
      structural cause is a process gap: when a backfill is authored, the create transaction
      is not mechanically forced to be inspected for the corresponding seed. In wave-8
      obs-4 (finding 8a), the permanent-code backfill omitted the backfill UPDATE for
      servers.invite_code — the reverse gap (backfill incomplete relative to the forward
      path). Both directions of the same class: create-path and backfill-path can diverge
      when they are authored independently without cross-referencing.
    source:
      - process/waves/wave-10/stages/V-1-karen.md
        # finding 9a (Critical): "backfill-roles.ts covers existing servers (ran on 0),
        #  but the forward create path was never wired."
      - process/waves/wave-10/stages/V-3-fast-fix.md
        # "fast_fixed: [createServer-default-role-seed]" — adds missing seed to createServer txn.
      - process/waves/_archive/wave-8/blocks/L/observations.md
        # obs-4 (8a): "Migration omits the permanent-code backfill... moot at 0 servers but
        #  the backfill-omission class is consistent: forward path and backfill path authored
        #  independently without a cross-check."
    severity: warning
    recurrence_wave_count: 2
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    generalizable: true
      # Applies to any feature where a backfill seeds state for existing rows that the create
      # transaction must also produce for new rows. Stack and ORM independent.
    falsifiable: true
      # Checkable at B-6 / V-1: does every backfill have a corresponding seed in the create
      # transaction? If a backfill inserts/updates a column and the create transaction does not
      # produce the same column value for new rows, the rule is violated.
    disposition_recommendation: >
      PROMOTE to BUILD-PRINCIPLES (candidate for L-2/karen). The pattern clears the 2-wave bar:
      wave-8 obs-4 (8a: backfill omits a step that the forward path already handles) +
      wave-10 (forward path omits a step the backfill handles). Both directions of the
      same class: create-path and backfill-path diverge when authored independently.
      BUILD-PRINCIPLES currently has 2 rules (boot-prod-artifact, push-after-stage). This
      would be rule 3. No near-dup. Candidate rule shape:
        "Any seed applied by a backfill must also appear in the create transaction, column-for-column."
         Why: "A backfill-only seed leaves the forward create path producing a different initial state."
      Rule line = 87 chars (within 120); why line = 72 chars (within 100). Satisfies format.
      Cap note: BUILD-PRINCIPLES cap (1/wave). If this is the only BUILD candidate this wave,
      cap is clear.

  - id: obs-5
    title: "Inflated test-count claim shipped past B-6 and CI: 270 claimed, 176 actual"
    summary: >
      V-1 Karen found the "270 tests" claim in the implementation artifacts was false: actual
      RBAC spec count = 46; suite-wide = 175 (176 after V-3 fast-fix). The number 270 appears
      to have been generated during planning or B-block and carried forward unchecked through
      B-6 review and T-block assertions. T-8 itself repeated the inflated figure ("270 tests
      incl. 6 security conditions") in its trust-basis rationale. This means the inflated
      count was load-bearing: both T-8 and C-2 cited "270 tests" as the basis for trusting
      RBAC correctness in the absence of a live prod fixture. The V-3 fast-fix corrected the
      doc only (test-count 270→176, PR#21). No prior wave archive records a fabricated test
      count reaching the V-block. The mechanism is novel but the risk class (inflated claim
      used as a trust basis for a security-critical property) is significant.
    source:
      - process/waves/wave-10/stages/V-1-karen.md
        # finding 8: "'270 tests' — WRONG. Actual RBAC specs = 46; whole API suite = 175
        #  across 13 files. There is no 270 anywhere."
      - process/waves/wave-10/stages/T-8-security.md
        # "covered by 270 tests + 6 conditions" — inflated count used as trust basis
      - process/waves/wave-10/stages/C-2-deploy-and-verify.md
        # "Trust 270 tests incl. 6 security conditions" — inflated count in C-2 trust rationale
      - process/waves/wave-10/stages/V-3-fast-fix.md
        # "Doc: test-count 270→176" — corrected in V-3
    severity: warning
    recurrence_wave_count: 1
    candidate_principles_file: null
    generalizable: true
      # An inflated test count used as a trust basis could occur in any wave where the
      # build agent self-reports a count without a mechanical cross-check.
    falsifiable: true
      # Checkable: does `npx jest --listTests | xargs grep -c "it\|test" | awk -F: '{s+=$2}END{print s}'`
      # (or equivalent pnpm vitest count) match the claimed count at B-6 / T-8?
    disposition_recommendation: >
      KEEP AS OBSERVATION. Single-wave occurrence. No prior wave records a false test count
      in a V-block finding. Hold for a second confirming instance. The mitigation path is
      clear (B-6 should mechanically verify test count from the test runner output, not a
      planning-stage claim), but a rule based on one instance would be premature. Flag for
      the B-6 review agent to verify test counts from runner output at B-block close.

  - id: obs-6
    title: "Forward-scoped primitives (built + tested, no live route): V approval requires explicit deferral record"
    summary: >
      Wave-10 built ChannelPermissionGuard and OwnerLockoutService to correct spec (unit-tested,
      all logic verified), but neither is wired to a live HTTP route in M2 — there are no
      channel-scoped message routes yet (M3) and no member-leave/remove HTTP endpoints. Both
      Jenny and Karen independently noted this as forward-scoped per the spec's own language
      ("M3 messaging will reuse this guard"). V-3 deferred them explicitly to M3 with a
      named deferral record. This is a positive process outcome: forward-primitive building is
      in-scope per the spec; the risk is that a future V-block mistakes "built + tested but
      no live route" for "broken" if the deferral is not recorded. The explicit
      "deferred_to_M3" record in V-3 is the correct mechanism. Wave-8 V-block had a related
      pattern (8b: share modal UI wired to wrong path; a forward-path was built but not
      surfaced), though the direction was inverted (wave-8: surfacing broken; wave-10:
      building correct but not yet surfaced). Pattern is related but not identical.
    source:
      - process/waves/wave-10/stages/V-1-karen.md
        # "Items 4/7 (guard + lockout wiring) are acceptable to defer to M3 per the spec's
        #  own 'M3 will reuse' language, provided the deferral is explicitly recorded."
      - process/waves/wave-10/stages/V-1-jenny.md
        # "Not over-reach, not drift... The AC explicitly scopes it as a forward-looking primitive."
      - process/waves/wave-10/stages/V-3-fast-fix.md
        # "deferred_to_M3: [member-list-endpoint, guard/owner-lockout-route-wiring]"
    severity: informational
    recurrence_wave_count: 1
    candidate_principles_file: null
    generalizable: true
    falsifiable: true
      # Checkable: when a wave builds a forward-scoped primitive (spec says "X will use this"),
      # does V-3 record an explicit named deferral for the wiring? If V-3 is silent on an
      # unwired-but-built component, the observation is violated.
    disposition_recommendation: >
      KEEP AS OBSERVATION. Single-wave occurrence. The practice (explicit deferral record for
      forward-scoped primitives) is worth tracking. Hold for a second confirming instance.
      If a subsequent wave builds a forward-primitive and the explicit V-3 deferral is absent,
      the observation recurrence condition fires and the pattern becomes a VERIFY-PRINCIPLES
      candidate. Note: VERIFY-PRINCIPLES cap is likely consumed by obs-2 this wave; even if
      this cleared the bar, it could not be promoted in the same wave as obs-2.
```

---

## Wave-10 L-2 distill disposition

**Promotion candidates assessed: obs-2, obs-4**

**obs-1 (verified-prod-session fixture, 4a2ad286) — BOTH task-escalation-critical AND T-8 principle candidate.**

The 4-wave streak exhausts the task-escalation-only vehicle. Disposition:
- (a) Mandatory: N-3 wave-close MUST designate 4a2ad286 as the wave-11 seed task (primary deliverable, not a sibling). The 4-wave record of task-escalation-not-actioned is a structural process failure; only treating it as a seed makes it unavoidable.
- (b) T-8 principle: the pattern clears every promotion bar (4-wave recurrence, generalizable, falsifiable, no near-dup in T-8.md). Candidate rule:
  ```
  1. Verify the authenticated authz path (403 non-permitted) live at T-8 on any authed-feature wave.
     Why: A 401 probe confirms the auth gate only; the authz core requires a verified prod session.
  ```
  Rule line = 84 chars; why line = 74 chars. No forbidden tokens. Two non-empty lines.
  Sequencing: (a) executes first (wave-11 seed); (b) promoted at wave-11 L-2 once the fixture has been used successfully at T-8 (promotes from a real, non-self-violating exemplar). Do NOT promote (b) this wave — the rule would mandate what the system cannot yet do.

**obs-2 (safe-by-default != AC-met) — STRONG CANDIDATE for VERIFY-PRINCIPLES.**
2-wave confirmed (wave-8 obs-4/8b + wave-10 createServer seed gap). Generalizable, falsifiable, no near-dup. Cap: VERIFY-PRINCIPLES has 0 rules; cap is clear. Promote at karen.

Candidate rule for karen to format:
```
1. Verify explicit seeding ACs by inspecting the create-path source; a safe fallback masks a missing seed.
   Why: A default-deny or nullable fallback satisfies runtime probes while the AC's required state is absent.
```
Rule line = 99 chars (within 120); why line = 82 chars (within 100). No forbidden tokens.

**obs-3 (split reviewer adjudication) — KEEP AS OBSERVATION.**
Single-wave specific framing. Related to the broader triage posture (wave-8 V-2 had comparable triage) but the split-reviewer-explicit-adjudication shape is wave-10-specific. VERIFY-PRINCIPLES cap would be consumed by obs-2. Hold.

**obs-4 (create-path / backfill-path identical defaults) — STRONG CANDIDATE for BUILD-PRINCIPLES.**
2-wave confirmed (wave-8 obs-4/8a inverse direction + wave-10 direct instance). Generalizable, falsifiable, no near-dup in BUILD-PRINCIPLES. Cap: BUILD-PRINCIPLES has 2 rules; this would be rule 3. Cap is clear. Promote at karen.

Candidate rule for karen to format:
```
3. Any seed applied by a backfill must also appear in the create transaction, column-for-column.
   Why: A backfill-only seed leaves the forward create path producing a different initial state.
```
Rule line = 87 chars (within 120); why line = 72 chars (within 100). No forbidden tokens.

**obs-5 (inflated test count) — KEEP AS OBSERVATION.**
First occurrence. Significant but single-wave. Hold for second confirming instance. Flag B-6 to verify test count from runner output.

**obs-6 (forward-scoped primitive deferral) — KEEP AS OBSERVATION.**
Single-wave. Hold for second confirming instance. VERIFY-PRINCIPLES cap consumed by obs-2 regardless.

**Summary table:**

| id    | title (short)                          | severity    | recurrence | disposition                                        |
|-------|----------------------------------------|-------------|------------|----------------------------------------------------|
| obs-1 | Verified-prod-session fixture gap      | strong      | 4 waves    | (a) wave-11 seed + (b) T-8 rule at wave-11 L-2    |
| obs-2 | Safe-by-default != AC-met              | warning     | 2 waves    | PROMOTE → VERIFY-PRINCIPLES rule 1 (karen)         |
| obs-3 | Split reviewer: adjudicate on standard | informational | 1 wave   | keep-as-observation (cap consumed, single-wave)    |
| obs-4 | Create-path / backfill identical seeds | warning     | 2 waves    | PROMOTE → BUILD-PRINCIPLES rule 3 (karen)          |
| obs-5 | Inflated test-count claim              | warning     | 1 wave     | keep-as-observation; flag B-6 runner-count check   |
| obs-6 | Forward-scoped primitive deferral      | informational | 1 wave   | keep-as-observation (cap consumed by obs-2)        |
