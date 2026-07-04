# Wave 43 — L-2 Distill Observations

Synthesized from wave-43 artifacts (M8 class scheduling: create/edit/delete recurring sessions,
organizer authz, recurrence expansion; PR squash-merged to main; V-block APPROVED).
Inputs read:
process/waves/wave-43/stages/B-5-verify.md,
process/waves/wave-43/stages/B-6-review.md,
process/waves/wave-43/stages/T-4-integration.md,
process/waves/wave-43/stages/T-5-e2e.md,
process/waves/wave-43/stages/T-6-layout.md.
Prior archives consulted:
process/waves/_archive/wave-{41,42}/blocks/L/observations.md
(recurrence checks on biome-at-B-5, Playwright bypass, integration-spec deferral, id-contract
drift, default-flag data-loss, parallel-path enforcement gap, symbol-grep false-positive).
Principles files read: BUILD-PRINCIPLES (8 rules), CI-PRINCIPLES (8 rules),
VERIFY-PRINCIPLES (2 rules), PRODUCT-PRINCIPLES (3 rules), T-4.md (0 rules), T-5.md (2 rules).

---

```yaml
observations:

  - id: obs-1
    summary: >
      For the third consecutive wave (41: moderation, 42: submissions, 43: scheduling),
      integration specs for the new feature's service boundaries were NOT authored during
      the B-block; T-4 authored them under Pattern B. Wave-43 T-4-integration.md: "CI runs
      real-PG integration; scheduling specs authored at T-4 (not in B-block) → Pattern B
      active." The 22-case scheduled-sessions spec (commit a5ef4d1) was a T-4 deliverable;
      the CI integration job was green throughout the B-block and C-1 stages without any
      real-PG exercise of the five new scheduling service methods.

      This is a direct second confirming instance of wave-42 obs-1 (first recorded instance;
      HOLD). Both waves produced the same artifact shape: B-block introduces new service
      methods + route handlers; the CI integration job exits green for the entire B-block and
      C-1 cycle; T-4 authors the spec under Pattern B; first CI run catches a real gap
      (wave-42: none beyond the authored cases; wave-43: createSession missing the weekly
      defensive guard — caught only because the integration test calls the service directly,
      bypassing the Zod controller path). The two confirming waves are consecutive (42, 43),
      involve different features, and were authored by different specialists — confirming the
      class is not feature-specific.

      Wave-42 obs-1 candidate rule shape (verified still valid):
        "Author integration specs covering new service boundaries in the B-block; do not defer
        them to T-4.
        Why: A deferred spec makes the CI integration job green on new code for the entire
        B-block and C-1 cycle without real-PG exercise."
      No near-dup in BUILD rules 1-8 (rule 4 mandates Phase-2 adversarial probing, not spec
      authoring responsibility). T-4.md has 0 rules — no near-dup risk.

      The promotion target is BUILD-PRINCIPLES rule 9 OR T-4.md rule 1 (both slots open).
      T-4.md is the more precise fit: the obligation is T-4-scoped (does Pattern B activate?
      was there a spec in the B-block diff?), not a general build discipline. An alternative
      is BUILD rule 9 if the intent is to enforce the obligation at B-5/B-6 rather than
      frame it as T-4 recovery. Head-builder and head-tester should arbitrate the slot.

      Competing BUILD slot-9 candidates per wave-42: wave-31 obs-1 (strong, 12-wave HOLD),
      wave-39 obs-1 (strong, 4-wave HOLD) take priority. An alternative path is T-4 rule 1,
      which has no competition.
    source:
      - process/waves/wave-43/stages/T-4-integration.md
        # "CI runs real-PG integration; scheduling specs authored at T-4 (not in B-block)
        #   → Pattern B active."
        # "Authored: apps/api/test/integration/scheduled-sessions.integration.spec.ts
        #   (22 cases, matches the assignment-submissions.integration harness)"
        # "test-automator (commit a5ef4d1)"
      - process/waves/_archive/wave-42/blocks/L/observations.md
        # obs-1: first recorded instance, HOLD, BUILD rule 9 or T-4 rule 1 candidate.
        # obs-1 promotion_status: "Watch for: any T-4 stage transcript that records Pattern B
        #   active alongside a new feature's service boundaries that first appear this wave."
    severity: warning
    candidate_principles_file: command-center/principles/test-layer-principles/T-4.md
      # Primary: T-4 rule 1 slot (open; no competing candidates). BUILD rule 9 is an
      # alternative slot with heavier competition but a more upstream enforcement point.
    recurrence: >
      SECOND CONFIRMING INSTANCE of wave-42 obs-1 ("B-block ships new service boundaries
      without integration specs; CI integration job is green on new code for the entire
      B-block and C-1 cycle; T-4 authors the spec under Pattern B").

      Confirming waves: 42 (assignment submissions, first instance) and 43 (scheduling,
      this instance). Wave-41 (moderation) also deferred integration specs to T-4 — it was
      not the origin obs but is the third documented occurrence in the 3-wave run.

      The 2+ wave bar is now met for wave-42 obs-1. PROMOTION-ELIGIBLE.
    promotion_gates:
      generalizable: true
        # Applies at every B-block for a wave introducing new service methods and route
        # handlers covered by the project's real-PG integration tier. Check: does the B-5
        # diff include a new *.integration.spec.ts alongside the new service file(s)?
        # A B-5 "integration: pass" without a new spec in the diff is a false coverage
        # signal — the green comes from prior coverage.
      falsifiable: true
        # Checkable at B-5 or T-4: if T-4-integration.md records "Pattern B active" or
        # "specs authored at T-4 (not in B-block)", the B-block omitted the spec. Three
        # consecutive Pattern-B activations (waves 41/42/43) confirm the check is reliably
        # falsifiable against this exact transcript signal.
      cited: true
        # wave-43 T-4-integration.md: "scheduling specs authored at T-4 (not in B-block)
        #   → Pattern B active"; "22 cases".
        # wave-42 T-4-integration.md (wave-42 obs-1): identical Pattern B activation.
    candidate_rule_shape: >
      [target: T-4.md rule 1 or BUILD-PRINCIPLES rule 9]
      Author integration specs covering new service boundaries in the B-block; do not defer
      them to T-4.
      Why: A deferred spec makes the CI integration job green on new code for the entire
      B-block and C-1 cycle without real-PG exercise.
      Rule line = 92 chars; why line = 97 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      PROMOTION-ELIGIBLE. Second confirming wave (wave-42 first instance, wave-43 second).
      The pattern is consistent: Pattern-B activation in T-4-integration.md is the
      falsifiable signal; three consecutive occurrences confirm it is structural, not
      incidental. Awaiting karen vet + head-tester or head-builder slot decision (T-4 rule 1
      vs BUILD rule 9).


  - id: obs-2
    summary: >
      Wave-43 T-4 caught a real defense-in-depth gap that was invisible through B-block and
      C-1: createSession had a defensive endsAt>startsAt guard (mirroring updateSession) but
      NO defensive weekly-recurrenceUntil>=startsAt guard, even though updateSession had both
      from B-6 H1. The HTTP controller path was safe because the Zod refine on the controller
      input schema rejects the invalid recurrenceUntil at 400 before the service is called.
      But the T-4 integration test calls createSession directly (bypassing the controller and
      its Zod parse), which exposed the missing guard. Fix: e7f1f7a (node-specialist added the
      mirror guard in createSession). This is the correct outcome — a real gap surfaced by the
      integration test that would otherwise be reachable only by a caller who bypasses the
      HTTP layer (e.g., a future internal batch scheduler, or another service method calling
      createSession programmatically).

      The generalizable class: a service method may lack a defensive guard that the HTTP
      controller's Zod layer provides, making the service safe only when reached via the HTTP
      path. When the service is callable directly (as integration tests always do), the missing
      guard is an exploitable gap for any caller that does not go through the controller.
      Each service method should be defensible in isolation — its own validation must not rely
      on the caller having applied an upstream Zod layer.

      Near-dup check against BUILD rules 1-8: no existing rule addresses service-layer
      defensive guards independent of the Zod/controller layer. Rule 4 (Phase-2 adversarial
      probing) addresses a different axis (prove a guard works; not ensure a service is
      independently defensible). No near-dup.

      Near-dup check against wave-41 obs-3 (parallel-path enforcement gap): obs-3 is about a
      gate applied to one write method but missing from a sibling method. This class is about
      a guard present at the HTTP controller layer but missing from the service layer itself.
      Different axis (layer gap, not sibling-method gap). Not a near-dup.

      Near-dup check against wave-42 obs-1 (obs-1 this wave, integration specs deferred):
      obs-1 addresses WHEN the spec is authored; obs-2 addresses WHAT the spec found — a
      service-layer gap invisible to the controller test path. Complementary, not a near-dup.
    source:
      - process/waves/wave-43/stages/T-4-integration.md
        # "Root cause (a REAL defense-in-depth gap the spec caught): the test calls
        #   createSession directly (bypassing the controller Zod parse); createSession had a
        #   defensive endsAt>startsAt guard but NO defensive weekly-recurrenceUntil>=startsAt
        #   guard (updateSession already had both from B-6 H1). Production HTTP path was
        #   already correct (Zod refine rejects it at the controller 400) — this is
        #   service-level defense-in-depth only."
        # "Fix (e7f1f7a, node-specialist): added the mirror weekly-recurrenceUntil guard
        #   in createSession."
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
      # Target: rule 9 slot (contested; see wave-42 for full priority queue).
      # This obs is a first instance — HOLD.
    recurrence: >
      FIRST RECORDED INSTANCE of "service method missing a defensive guard that the HTTP
      controller's Zod layer provides; service callable directly (integration tests) exposes
      the gap; fix: mirror the guard in the service method independent of the HTTP path."

      Near-dup lineage checked through wave-42: no prior obs records the Zod-only-guard
      (service not independently defensible) class as a standalone. Wave-41 obs-3 (parallel-
      path enforcement gap: sibling method missing a gate) is a related but distinct class.
      No prior obs.

      Competing BUILD slot-9 candidates (all HOLDs; priority order per wave-42 obs-1 queue):
        - wave-31 obs-1 (strong, 12-wave HOLD): credential-endpoint membership-before-load.
        - wave-39 obs-1 (strong, 4-wave HOLD): async exit action with no error path.
        - wave-36 obs-1 (warning, 7-wave HOLD): authz tests deferred to follow-up wave.
        - wave-36 obs-3 (warning, 7-wave HOLD): two-layer IDOR proof for session-only-userId.
        - wave-37 obs-3 (warning, 6-wave HOLD): bootstrap-once list + live-count-only hook.
        - wave-38 obs-3 (warning, 5-wave HOLD): process.env = undefined stringification trap.
        - wave-40 obs-4 (warning, 3-wave HOLD): text-column route params bypass global 22P02.
        - wave-41 obs-3 (warning, 2-wave HOLD): parallel-path enforcement gap.
        - wave-42 obs-3 (warning, 1-wave HOLD): PK missing from shared DTO before route wiring.
        - wave-42 obs-4 (warning, 1-wave HOLD): default-false include flag backs writable form.
        - wave-43 obs-2 (warning, this wave, new): Zod-only guard on service-layer method.
    promotion_gates:
      generalizable: true
        # Applies at B-2 (backend authoring) for any service method where the corresponding
        # HTTP controller applies a Zod refine or check on the input before calling the
        # service. Check: does the service method also apply the same defensive guard
        # independently? A service method whose only protection against an invalid input is
        # an upstream Zod refine in the controller fails this check.
      falsifiable: true
        # Checkable at B-5 or T-4: an integration test that calls the service method
        # directly (not via the HTTP handler) with an input the Zod schema would reject —
        # if the test passes without a 400/error from the service method itself, the guard
        # is absent. A first CI failure in the integration run on a validation case that
        # calls the service directly is the confirmatory signal.
      cited: true
        # T-4-integration.md: "createSession had a defensive endsAt>startsAt guard but NO
        #   defensive weekly-recurrenceUntil>=startsAt guard; Production HTTP path was
        #   already correct (Zod refine rejects it at the controller 400) — service-level
        #   defense-in-depth only."
    candidate_rule_shape: >
      [target: BUILD-PRINCIPLES rule 9]
      Make each service method defensible in isolation; do not rely on an upstream Zod layer
      to enforce a business invariant the service must own.
      Why: A caller bypassing the controller (integration test, batch job) bypasses the Zod
      guard and reaches invalid service state.
      Rule line = 116 chars; why line = 95 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      HOLD. First instance. The gap is mechanically clean (service callable directly;
      missing guard invisible to HTTP path; T-4 first-CI-run caught it; one fix commit).
      Watch for: any service method where the Zod controller refine applies a business
      constraint (not-null, range, ordering, enum) and the service method body does not
      independently enforce the same constraint.


  - id: obs-3
    summary: >
      At T-6, selecting a session at the 1024px breakpoint opens a 359px detail drawer that
      appears alongside the members panel. Per DESIGN-SYSTEM §9, the members panel should
      collapse to a toggle at <=1024px. Because it does not collapse, the rail + sidebar +
      agenda + detail drawer + members panel all compete for 1024px — crushing the agenda
      card to 28px (unreadable; Weekly chip clipped). T6-F1 classified MAJOR responsive,
      non-blocking (primary breakpoints 1280/1440 clean). Root: the D-block design did not
      specify the members-panel collapse interaction when the detail drawer opens at 1024px;
      the implementation followed the design faithfully, which is why it passed D-3 review.

      The generalizable class: a new panel or drawer that expands at a constrained breakpoint
      must account for all co-visible panels that share the same horizontal layout budget at
      that breakpoint. If DESIGN-SYSTEM §9 specifies a collapse rule for one panel (members)
      at a breakpoint, any new panel introduced at the same breakpoint must be designed with
      that collapse rule in mind — or the collapse rule must be explicitly extended to cover
      the interaction between the new and existing panels. T-6 is the correct catch-point for
      this class; the gap originates in the D-block design (not the B-block implementation).

      Near-dup check against existing VERIFY-PRINCIPLES (2 rules), CI-PRINCIPLES (8 rules),
      BUILD-PRINCIPLES (8 rules): none address layout-budget collision at a shared breakpoint
      when a new panel is introduced. No near-dup.

      No prior obs records this class (checked waves 36-42). FIRST INSTANCE.
    source:
      - process/waves/wave-43/stages/T-6-layout.md
        # "T6-F1 (MAJOR responsive, → V-2): at the 1024 MIN breakpoint, selecting a session
        #   opens the 359px detail drawer ALONGSIDE the members panel (which per DESIGN-SYSTEM
        #   §9 should collapse to a toggle <=1024) — rail+sidebar+agenda+detail+members
        #   compete for 1024px, crushing the agenda card to 28px (unreadable; Weekly chip
        #   clipped). Only at 1024+detail-open+members-visible; 1280/1440 clean."
        # "B-3/D-block responsive gap — the members panel should collapse when the detail
        #   drawer opens at <=1024."
    severity: informational
      # Non-blocking (1024 is a secondary breakpoint; 1280/1440 primary clean). First instance.
      # Would warrant warning severity on recurrence.
    candidate_principles_file: command-center/principles/VERIFY-PRINCIPLES.md
      # No existing VERIFY rule covers layout-budget collision from co-visible panels.
      # Alternatively: DESIGN-PRINCIPLES if that file exists and covers D-block obligations.
      # VERIFY-PRINCIPLES slot 3 is the nearest open slot and is contested (see wave-41 obs-2
      # lineage for competing candidates). First instance — HOLD.
    recurrence: >
      FIRST RECORDED INSTANCE of "new drawer at a constrained breakpoint co-visible with an
      existing panel that DESIGN-SYSTEM specifies should collapse; layout-budget collision
      crushes existing panel content; T-6 MAJOR finding; D-block design gap origin."

      No prior obs records this class (checked waves 36-42).
    promotion_gates:
      generalizable: true
        # Applies at D-1/D-2 for any wave adding a new expandable panel or drawer to a surface
        # that already has constrained-breakpoint co-visible panels. Check: does DESIGN-SYSTEM
        # specify a collapse rule for any co-visible panel at the target breakpoint? If yes,
        # the D-block design must specify the interaction between the new panel and the
        # collapsible panel explicitly — not assume the collapse rule is automatic.
      falsifiable: true
        # Checkable at T-6: for any wave adding a new panel/drawer, capture the constrained
        # breakpoint (1024px or narrower) with the new panel open + all co-visible panels
        # visible. If agenda or content area is crushed below a readable height (e.g., <80px
        # for a card), or if a co-visible panel that DESIGN-SYSTEM marks as collapsible at
        # that breakpoint is still fully expanded, the check fails.
      cited: true
        # T-6-layout.md T6-F1: "rail+sidebar+agenda+detail+members compete for 1024px,
        #   crushing the agenda card to 28px"; "members panel should collapse when the detail
        #   drawer opens at <=1024."
    candidate_rule_shape: >
      [target: VERIFY-PRINCIPLES rule 3 — contested slot]
      At T-6, capture every new drawer open at the narrowest target breakpoint with all
      co-visible panels expanded; a DESIGN-SYSTEM-collapsible panel still expanded fails.
      Why: A drawer introduced without accounting for DESIGN-SYSTEM collapse rules crushes
      co-visible content at constrained widths.
      Rule line = 118 chars; why line = 95 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      HOLD. First instance. The finding was MAJOR at T-6 (non-blocking only because primary
      breakpoints clean). The gap origin is D-block design, not implementation — making it
      a design-review obligation, not solely a build one. Watch for: any wave adding a new
      expandable panel or drawer to a surface that has DESIGN-SYSTEM-collapsible co-visible
      panels at a constrained breakpoint.


  - id: obs-4
    summary: >
      B-5 recorded for the second consecutive wave (wave-42 and wave-43) that the per-file
      biome check misses cross-file format and import-ordering violations that only the full
      `biome ci` run catches. Wave-43 B-5: "per-file biome check misses cross-file
      format+import-ordering; only full `biome ci` catches it." Wave-42 obs-2 was the second
      failure instance of wave-38 obs-1 and was ruled PROMOTION-ELIGIBLE by L-2 but REJECTED
      by karen as a near-dup of BUILD rules 7 and 8 — with the disposition that the correct
      resolution is an in-place scope edit of BUILD rule 7 (from "reporting a build task done"
      to "pushing any authored file") at head-builder's discretion, not a net-new rule.

      Wave-43 B-5 is the third failure instance of this class (wave-38: B-5 omits repo-root
      command; wave-42: test-automator uses tsc-only; wave-43: per-file check instead of full
      `biome ci`). Karen's wave-42 ruling stands: a new obs here is a near-dup of the
      recommended rule 7 scope edit that has not yet been made. This observation is recorded
      to document the continued recurrence as cross-wave pressure on the head-builder to make
      the in-place rule 7 edit. It does not open a new principle track.

      Action: head-builder should amend BUILD rule 7 in-place to widen scope from "before
      reporting a build task done" to "before pushing any authored file, regardless of stage."
    source:
      - process/waves/wave-43/stages/B-5-verify.md
        # "Lint (biome ci): initially 5 FORMAT errors (import ordering + formatting) in the
        #   new API/shared scheduling files (per-file check missed them — only covered web/*)."
        # "L-2 note: recurrence of the 'run full biome ci (not per-file) before push' lesson
        #   (wave-42 obs-2 / T-4). Per-file biome check misses cross-file format+import-ordering.
        #   → L-2 candidate (reinforces the case for a BUILD rule-7 scope edit)."
      - process/waves/_archive/wave-42/blocks/L/observations.md
        # obs-2: promotion-eligible second failure instance; karen REJECTED as near-dup of
        # BUILD rules 7+8; disposition: in-place rule 7 scope edit at head-builder's discretion.
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
      # NOT a new obs candidate. Reinforces the existing head-builder disposition:
      # amend BUILD rule 7 scope in-place (append-only contract governs; in-place edit
      # requires head-builder approval, not karen vetting).
    recurrence: >
      THIRD FAILURE INSTANCE of "biome ci run not executed against all authored files before
      push; per-file or tsc-only check misses cross-file format/import-ordering violations;
      CI lint job catches them first."

      Failure lineage:
        - wave-38 obs-1: B-5 specialist omits repo-root `biome ci .`; 3 errors at CI. HOLD.
        - wave-42 obs-2: test-automator uses tsc-only before pushing T-4 spec; lint fails CI.
          PROMOTION-ELIGIBLE; karen REJECTED as near-dup; disposition: rule 7 scope edit.
        - wave-43 (this wave): per-file biome check used at B-5; misses API/shared files;
          5 errors; fixed via `biome check --write` (commit 2f03a04).

      The scope-edit-not-made is the observable gap. Three failure instances across two
      stages (B-5, T-4) and two specialists confirm the issue is broader than rule 7's
      current scope.
    promotion_status: >
      NOT A NEW PROMOTION CANDIDATE. Karen's wave-42 ruling (near-dup of BUILD rules 7+8;
      in-place edit at head-builder's discretion) applies here as well. This observation
      documents the third failure instance as escalated pressure for the rule 7 scope
      amendment. No new principle class opened.
```

---

## Prior held observations — second-instance status check (wave-43)

| origin | obs | class | wave-43 status |
|--------|-----|-------|----------------|
| wave-42 | obs-1 | Integration specs deferred from B-block to T-4 (Pattern B active); CI green without new-boundary coverage | CONFIRMED — second instance. See obs-1 above. PROMOTION-ELIGIBLE. |
| wave-42 | obs-2 | Test-automator pushes T-4 spec after tsc only, not biome ci; CI lint fails | THIRD FAILURE INSTANCE confirmed (wave-43 B-5 per-file gap). Karen wave-42 ruling stands: not a new obs, in-place rule 7 edit at head-builder's discretion. See obs-4 above. |
| wave-42 | obs-3 | Return route resolves on submission PK; roster DTO does not expose id; frontend sends userId → 404s | NOT CONFIRMED. New scheduling routes resolve on scheduled_session_id (UUID); shared schema was correct at B-1; no B-6 REWORK for missing PK. Remains 1-wave HOLD (BUILD rule 9 candidate). |
| wave-42 | obs-4 | default-false includeSubmission flag on listAssignments; reload returns null; resubmit silently clears educator return state | NOT CONFIRMED. Scheduling has no "include related entity" flag with a nullable default on a list endpoint backing a writable form. Remains 1-wave HOLD (BUILD rule 9 candidate). |
| wave-41 | obs-1 | V-3 redeploy false-green: unparameterized serviceInstanceDeployV2 on git-connected service | NOT CONFIRMED. No V-3 fast-fix redeploy this wave (V-3 stage files present; wave-43 V-3 had no fast-fix items). Remains 2-wave HOLD (CI-PRINCIPLES rule 7 amendment candidate). |
| wave-41 | obs-2 | Symbol-grep false-positive: canModerateMembers in old bundle from pre-existing component | NOT CONFIRMED. No V-1/V-3 bundle verification step this wave relied on symbol-name grep alone; karen's V-1 verified via endpoint behavior and source trace. Remains 2-wave HOLD (VERIFY-PRINCIPLES rule 3 candidate). |
| wave-41 | obs-3 | Parallel-path enforcement gap: assertNotMuted on createMessage only; createReply unguarded | NOT CONFIRMED. No new enforcement gate on a primary write path with unchecked sibling methods in the scheduling diff. Remains 2-wave HOLD (BUILD rule 9 candidate). |

---

## Signals evaluated and dropped

**Signal: direct-playwright executablePath bypass (T-5, 3rd wave running):**
Wave-43 T-5-e2e.md: "Direct playwright-core (chromium-1208, MCP bypassed)." T-5 rules 1 and
2 were promoted at wave-42 — rule 1 (drive bundled chromium on MCP launch failure) and rule 2
(patch .mcp.json with browser flag after bypass). Wave-43 is a CONFIRMATION-BY-APPLICATION of
both promoted rules. No new observation class; rules are working as designed. DROPPED.

**Signal: B-6 H1 updateSession range bypass (missing range validation on single-field PATCH):**
B-6 round 1 caught HIGH: updateSession did not re-check the effective endsAt>startsAt invariant
when only one of the two fields was patched. Fixed at 0fbeae0. This is the same "effective-value
re-check on partial update" class as several prior B-6 HOW-TO observations but has not been
recorded as a standalone L-2 class in waves 36-43. First instance of the "single-field PATCH
must re-derive the effective pair to validate the invariant" class. However, it is closely related
to obs-2 (service-level defense-in-depth independent of the controller path) and does not add a
distinct principle beyond it — the root is the same: service must own its business invariants.
ABSORBED into obs-2 lineage; dropped as standalone observation.

**Signal: M2 missing .datetime() on startsAt/endsAt request schemas:**
B-6 round 1 caught MEDIUM: startsAt/endsAt Zod fields lacked .datetime() validation,
allowing malformed ISO strings through to Date constructors and producing 500s. Fixed at 0fbeae0
alongside H1. This is an input-schema completeness gap; it is a first instance of the
"datetime field without .datetime() validator → 500 on malformed input" class. First instance,
warning severity, no near-dup in existing BUILD rules. Wave-specific execution correction;
B-6 Phase-2 is the correct catch-point per rule 4. The generalizable class is defensible but
narrow (applies only to Zod date schemas). Insufficient for a standalone obs at first instance —
the existing rule 4 mechanism caught and fixed it correctly. DROPPED.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Integration specs deferred from B-block to T-4 (Pattern B active, 3rd consecutive wave) | warning | 2nd confirming instance (wave-42 = 1st; wave-43 = 2nd) | T-4.md rule 1 or BUILD rule 9 | PROMOTION-ELIGIBLE — 2-wave bar met; karen vet + head-tester or head-builder slot decision pending |
| obs-2 | createSession missing weekly defensive guard present in updateSession; service-layer defense independent of Zod controller path | warning | 1st instance | BUILD-PRINCIPLES | HOLD — rule 9 candidate; promote on 2nd confirming wave |
| obs-3 | New detail drawer at 1024px co-visible with DESIGN-SYSTEM-collapsible members panel → layout-budget collision; T-6 MAJOR finding; D-block gap | informational | 1st instance | VERIFY-PRINCIPLES rule 3 (contested) | HOLD — promote on recurrence; escalate to warning if second wave |
| obs-4 | Third failure instance of biome-ci-not-run-before-push; reinforces head-builder disposition to amend BUILD rule 7 scope in-place | warning | 3rd failure (cross-wave pressure on rule 7 scope edit) | BUILD-PRINCIPLES rule 7 | NOT A NEW CANDIDATE — karen wave-42 ruling stands; in-place rule 7 edit at head-builder's discretion |

**Observations emitted: 4 (obs-1, obs-2, obs-3, obs-4)**
**Severities: 2 warning (obs-1, obs-2, obs-4), 1 informational (obs-3)**
**Candidate files: T-4.md or BUILD-PRINCIPLES (obs-1), BUILD-PRINCIPLES (obs-2, obs-4 pressure), VERIFY-PRINCIPLES (obs-3)**
**Promotion-eligible this wave: obs-1 (T-4 rule 1 or BUILD rule 9; 2nd confirming instance)**
**Dropped: direct-playwright bypass (T-5 rules 1+2 confirmed-by-application); updateSession range bypass (absorbed into obs-2); .datetime() missing on date fields (B-6 rule 4 caught correctly; first instance; narrow class)**

---

## Promotion candidate flag for karen

**One observation is promotion-eligible this wave.**

**obs-1** (T-4.md rule 1 or BUILD-PRINCIPLES rule 9, warning severity) is the second
confirming instance of wave-42 obs-1 ("B-block ships new service boundaries without
integration specs; CI integration job is green throughout B-block and C-1 without real-PG
exercise of the new code; T-4 authors the spec under Pattern B"). Three consecutive Pattern-B
activations (waves 41/42/43) confirm this is structural. The wave-42 instance involved
assignment submissions (node-specialist + test-automator); the wave-43 instance involves
scheduling (same shape, different feature and migration). The confirming instances involve
different specialists, different service files, and different test harnesses — confirming the
class is not feature-specific.

Slot decision is open: T-4.md rule 1 is the most precise fit (the obligation is T-4-scoped;
Pattern-B activation is the falsifiable signal; T-4.md has no competing candidates). BUILD
rule 9 is an alternative with broader build-stage enforcement but a heavily contested slot.
Recommend T-4.md rule 1 as the primary candidate; karen to arbitrate with head-tester.
Head-tester approval required for T-4 slot; head-builder approval if BUILD slot preferred.

**Competing BUILD slot-9 candidates (all HOLDs; no change in priority order from wave-42):**
  - wave-31 obs-1 (strong, 12-wave HOLD): credential-endpoint membership-before-load.
  - wave-39 obs-1 (strong, 4-wave HOLD): async exit action with no error path.
  All others at warning severity remain HOLD (see wave-42 summary table for full list).
  obs-1 this wave is PROMOTION-ELIGIBLE and takes priority over HOLD candidates for any
  available slot.

**Competing VERIFY-PRINCIPLES rule 3 candidates (obs-3 joins; no change to other holders):**
  - wave-33 obs-2 (warning, 9-wave HOLD): error-mapping fix must fire against real upstream error.
  - wave-29 obs-2 (warning, 13-wave HOLD): V-3 head-verifier pattern scan beyond named sites.
  - wave-30 obs-3 (warning, 12-wave HOLD): accept+track+observe for spec-consistent design limitation.
  - wave-41 obs-2 (warning, 2-wave HOLD): symbol-grep false-positive from pre-existing component.
  - wave-43 obs-3 (informational, this wave): DESIGN-SYSTEM-collapsible panel collision at 1024px.
  Age priority and severity weigh against obs-3 at informational; watch for recurrence.

**Head-builder action item (not a promotion):**
BUILD rule 7 scope edit — three failure instances of biome-ci-not-run-before-push (waves 38,
42, 43) confirm the current rule 7 scope ("before reporting a build task done") is too narrow.
Karen's wave-42 ruling: in-place scope edit at head-builder's discretion (not an L-2 new rule
because near-dup of rules 7+8 as-written). This observation escalates the recommendation to
a standing action item.

---
## L-2 promotion disposition (wave-43) — 1 promotion
karen vetted the 1 promotion-eligible candidate:
- **obs-1 → BUILD rule 9 (author integration specs in B-block before C-1 merge):** APPROVE → PROMOTED (linter PASS after 1 cap-1 Why-trim). Target resolved to BUILD (not T-4) via framework stage-intent evidence — T-4 is a verify/audit layer, so a T-4 rule would codify the pathology. 3-instance recurring (waves 41/42/43), costly (false-green integration on the shipping PR; T-4 caught real bugs), binary.
- obs-2 (createSession defense-in-depth): first-instance HOLD (BUILD rule-9-adjacent — the new rule 9 indirectly helps by forcing integration specs that catch such gaps).
- obs-3 (T-6 responsive design-origin gap): first-instance HOLD (VERIFY/DESIGN candidate).
- obs-4 (biome-ci-not-before-push, 3rd instance): near-dup of BUILD rule 7/8 — head-builder's in-place rule-7 scope edit, not an L-2 promotion (karen's wave-42 ruling stands).
