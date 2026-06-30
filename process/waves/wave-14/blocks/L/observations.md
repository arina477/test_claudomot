# Wave 14 — L-2 Distill Observations

Synthesized from wave-14 artifacts (M3 presence layer: online/offline + typing + member-list; LIVE, PR#26 + V-3 fast-fix commits e85848e + 0f7db24; main @ final CI green).
Prior archives consulted: process/waves/_archive/wave-{9,10,11,12,13}/blocks/L/observations.md.
Principles files read: BUILD-PRINCIPLES (3 rules), VERIFY-PRINCIPLES (1 rule), CI-PRINCIPLES (2 rules), DESIGN-PRINCIPLES (0 rules), T-2.md (0 rules), T-5.md (0 rules), T-8.md (1 rule).

---

```yaml
observations:

  - id: obs-1
    summary: >
      The typing fan-out unit test (presence.gateway.spec.ts:373-407) mocked
      PresenceService.getTypers and asserted only that the typing:active event fired on the
      correct room — it never asserted the payload a RECIPIENT receives contains the actor.
      The production bug (emitTypingActive computed ONE actor-excluded list and broadcast it
      to the whole room, so every recipient got typers:[]) was structurally invisible to the
      unit test because the mock bypassed the real composition path entirely. T-8 two-client
      wire verification (assert recipient B receives actor A in payload, not just that
      typing:active was received) was the only layer that caught F-4. Karen confirmed at V-1:
      "coverage theater confirmed — existence of tests != correctness of behavior."
      The V-3 fix added a mandatory recipient-sees-actor regression test using REAL
      PresenceService (not a mocked getTypers), asserting recipient receives actor in typers
      and actor receives empty list. The false-green class is: room-broadcast composition bug
      where the mock makes the service correct-in-isolation, hiding a wrong-layer exclusion.
    source:
      - process/waves/wave-14/blocks/T/findings-aggregate.md
        # F-4: "Unit test passed because it tested getTypers() in isolation, not the gateway
        #  broadcast composition — classic single-layer false-green."
      - process/waves/wave-14/stages/V-1-karen.md lines 43-44
        # "Coverage theater confirmed (why the green suite missed it): gateway test mocks
        #  PresenceService.getTypers ... never asserts the actor appears in what a recipient receives."
      - process/waves/wave-14/stages/V-3-fast-fix.md
        # "Mandatory recipient-sees-actor test: added using REAL PresenceService.startTyping
        #  (NOT mocked getTypers), asserts recipient receives actor {userId,displayName} in
        #  non-empty typers."
      - process/waves/wave-14/blocks/L/observations.md (pre-existing head-tester note)
        # "must assert the payload CONTENTS (the typer is present), not mere delivery"
    severity: strong
    candidate_principles_file: command-center/principles/test-layer-principles/T-2.md
    recurrence: >
      First confirmed occurrence of this specific class: a gateway test mocks a service
      dependency and asserts the side-effect (event fires), not the composed payload a
      downstream recipient receives. Wave-12/13 two-client probes caught no equivalent unit
      test false-green — those waves built correct fan-out from the start. This is the first
      wave where the unit tier gave a false green that survived to T-8.
      HOLD: single-wave occurrence. Promote if a second wave has a unit-test false green on
      a broadcast-composition or fan-out path due to mocking the composed dependency.
    near_dup_check: >
      T-2.md Rules: empty (no rules). T-8.md rule 1 addresses the live authz probe requirement,
      not the unit-layer composition-mock false-green. No near-dup found.
    promotion_gates:
      generalizable: true
        # Applies to any room-broadcast / fan-out feature where a service is mocked at the
        # gateway test layer; the mock makes the service correct in isolation and hides a
        # wrong-layer composition bug in the broadcast path.
      falsifiable: true
        # Checkable at T-2: for every gateway test that mocks a service feeding a broadcast,
        # does at least one test assert the payload a distinct recipient (non-sender) receives
        # contains the expected actor/data, using the real service (not the mock)?
      cited: true
        # findings-aggregate F-4, V-1-karen lines 43-44, V-3-fast-fix mandatory test note.
    candidate_rule_shape: >
      1. For any room-broadcast test, assert what a recipient's payload contains using the real
         service; a mock that bypasses composition hides a wrong-layer exclusion.
         Why: A mocked service makes isolation correct while the broadcast composition is wrong
         for every recipient.
      Rule line = 107 chars (within 120); why line = 77 chars (within 100). No forbidden tokens.

  - id: obs-2
    summary: >
      A web-layer TypeScript file imported PRESENCE_EVENTS as a runtime value from the shared
      CJS package (@studyhall/shared). Rollup/Vite cannot resolve named value exports from CJS
      dist when bundling for the browser, breaking the build at B-5. The established pattern
      (messagingSocket.ts, wave-12) is type-only imports from shared; runtime string constants
      are re-declared as local literals in the consuming module. The fix was a type-only import
      plus a local const with literal event strings. The value-import / type-only split is a
      build-time constraint of the monorepo's CJS-shared-to-ESM-web boundary, not a lint or
      type error — it passes typecheck and is invisible until the vite bundler resolves exports.
      B-6 noted the workaround as accepted debt (L-2 observed client-side constant duplication
      as L-2 in B-6 debt: "drift risk; documented rollup-CJS reason").
    source:
      - process/waves/wave-14/stages/B-5-verify.md fix cycle 3
        # "BUILD-BREAK: presenceSocket imported PRESENCE_EVENTS as runtime value from CJS
        #  shared dist (rollup can't resolve named value export — all other web files import
        #  shared type-only). Fixed: type-only import + local const of literal event strings."
      - process/waves/wave-14/stages/V-1-karen.md Claim 2
        # "Client deliberately re-declares the constants rather than runtime-importing them —
        #  documented CJS/rollup workaround at presenceSocket.ts:32-35; values verified equal."
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      First occurrence of this specific sub-class (CJS-shared runtime value import breaking
      vite web build). Wave-12 obs-2 was about a type-only import of a NestJS DI token
      breaking the DI container at boot — a different mechanism (tsc erasure of design:paramtypes)
      caught by the boot-probe. Both relate to the type/value import boundary but at different
      layers and with different failure modes. Treating as first occurrence of the web-CJS-value
      sub-class. HOLD: single-wave. Promote if a second wave hits a build break caused by a
      value import from the shared CJS dist in a web/ESM bundle context.
    near_dup_check: >
      BUILD-PRINCIPLES rules 1-3: rule 1 (boot-prod), rule 2 (push after stage), rule 3
      (backfill/create parity). None addresses the CJS-to-ESM value-import constraint.
      No near-dup found.
    promotion_gates:
      generalizable: true
        # Applies to any monorepo with a shared CJS package consumed by an ESM/Vite web build;
        # the CJS named-value-export resolution constraint is bundler-level, not project-specific.
      falsifiable: true
        # Checkable at B-5 / B-3: does any web-layer file import a non-type from @studyhall/shared?
        # If yes, the rule is violated (it will build locally with tsc but break the vite bundle).
      cited: true
        # B-5-verify.md fix cycle 3 + V-1-karen.md Claim 2 both cite the same root cause.
    candidate_rule_shape: >
      4. Web modules import from the shared package type-only; re-declare runtime string
         constants as local literals.
         Why: CJS named-value exports are opaque to Vite/Rollup, breaking the web bundle silently
         through typecheck.
      Rule line = 90 chars (within 120); why line = 79 chars (within 100). No forbidden tokens.

  - id: obs-3
    summary: >
      The member-list panel's offline name treatment (text-white/40 on --surface-900 #121214)
      computed to 3.83:1, below WCAG AA 4.5:1 for normal text. The intent was visual
      de-emphasis (muted but readable) on a dark surface; the alpha value felt visually
      subdued but did not meet the contrast threshold. Caught at D-3 iteration 2 by the
      accessibility reviewer; fixed to text-white/50 = 5.32:1. Wave-9 L-2 held an adjacent
      candidate: semantic-color text (text-danger red at ~3.5:1 on surface-800) caught at
      D-3 of that wave. Both instances share the pattern: a "muted" text treatment on a
      dark surface is chosen for state-differentiation, the designer judges it readable, and
      D-3 accessibility review measures it below 4.5:1. The sub-classes differ (wave-9:
      semantic color; wave-14: alpha-reduced neutral white), but the root is identical —
      dark-surface muting via color or alpha that passes visual inspection and fails the
      contrast formula. Both required a D-3 re-iteration cycle to fix.
    source:
      - process/waves/wave-14/stages/D-3-review-and-adopt/server-channel-view-ui-ux-pro-max.md
        # "Offline member name contrast: text-white/40 on surface-900 = 3.83:1, fails 4.5:1.
        #  Fix: text-zinc-300 (12.66:1) or text-white/50 (5.32:1)."
      - process/waves/wave-14/blocks/D/gate-verdict.md
        # "the one blocking issue caught at iteration-2 — offline names at text-white/40 = 3.83:1,
        #  a WCAG 1.4.3 AA failure — is resolved"
      - process/waves/_archive/wave-9/blocks/L/observations.md (D-block candidate)
        # "text-danger (#ef4444) on surface-800 (#1c1c1f) ≈ 3.5:1, below WCAG AA 4.5:1 for body text.
        #  Caught by the D-3 accessibility reviewer. Status: single-wave occurrence — do NOT promote."
    severity: warning
    candidate_principles_file: command-center/principles/DESIGN-PRINCIPLES.md
    recurrence: >
      CONFIRMED RECURRENCE: wave-9 D-block (semantic-color red text, 3.5:1) and wave-14
      (alpha-reduced white text, 3.83:1). Both dark-surface muting failures caught at D-3.
      Two waves. Recurrence condition met. The wave-9 candidate rule was narrower (semantic
      color only); the broader class across both instances is "de-emphasized text on dark
      surfaces chosen for state-differentiation falls below AA when muted via color or alpha."
      No near-dup in DESIGN-PRINCIPLES (0 rules). Cap is clear (first rule this wave).
      PROMOTE candidate for karen.
    near_dup_check: >
      DESIGN-PRINCIPLES Rules: empty. No near-dup possible.
    promotion_gates:
      generalizable: true
        # Applies to any dark-surface UI where state-differentiation uses alpha or semantic color
        # to visually mute a text element; the visual "looks muted" judgment does not map to
        # the contrast formula, making under-4.5:1 a recurring design-review trap.
      falsifiable: true
        # Checkable at D-3: for every de-emphasized text element (offline, muted, secondary,
        # revoked, etc.) on a dark surface, does a contrast calculation confirm >= 4.5:1?
      cited: true
        # wave-14 D-3 review artifact + D gate-verdict + wave-9 L-2 D-block candidate.
    candidate_rule_shape: >
      1. Verify de-emphasized text on dark surfaces meets WCAG AA (>= 4.5:1) by calculation;
         visual muting via alpha or semantic color routinely falls below threshold.
         Why: A "visually muted" alpha or semantic-color token reads as acceptable but often
         computes below 4.5:1 on near-black surfaces.
      Rule line = 107 chars (within 120); why line = 82 chars (within 100). No forbidden tokens.

  - id: obs-4
    summary: >
      The D-3 reviewer B (ui-ux-pro-max) issued an APPROVE verdict at iteration 3 after the
      contrast fix was applied, but the artifact file (server-channel-view-ui-ux-pro-max.md)
      on disk retained the iteration-2 REVISE verdict. The iteration-3 APPROVE was not
      persisted to a file. The head-designer gate-verdict independently confirmed the fix
      was genuinely present in the staging HTML (re-read the file directly), noted the
      artifact-persistence gap as process hygiene, and flagged it to L-2. The substantive
      gate outcome was not affected (the fix was confirmed by independent direct inspection),
      but the Phase-1 matrix is missing a recorded iteration-3 artifact for reviewer B.
    source:
      - process/waves/wave-14/blocks/D/gate-verdict.md (Gate-integrity note)
        # "The iteration-3 B-APPROVE verdict was not persisted to its own file...
        #  Before canonicalizing (Action 6), the orchestrator should persist reviewer B's
        #  iteration-3 APPROVE verdict ... surface this artifact-persistence gap to L-2."
      - process/waves/wave-14/stages/D-3-review-and-adopt/server-channel-view-ui-ux-pro-max.md line 191-197
        # "(Note: iter3 APPROVE returned by the reviewer agent but not persisted to file at the
        #  time — restored here per head-designer gate-integrity flag)"
    severity: informational
    candidate_principles_file: none
    recurrence: >
      First recorded instance of a reviewer verdict not persisted to disk in D-3. The gate
      machinery (independent direct file inspection by head-designer) caught it and the
      outcome was not corrupted. Single-wave occurrence; no principle warranted. Noting for
      the record so future L-2 agents recognize this class if it recurs.
```

---

## Wave-14 L-2 distill disposition

**obs-1 (unit-test false green on broadcast composition via mock) — HOLD.**

Strongest technical candidate. Well-evidenced: F-4 root cause confirmed by karen + jenny independently, V-3 fix adds the correct recipient-sees-actor assertion with real service. The mechanism is generalizable and falsifiable. However: first wave where this specific class (gateway mock suppresses composition bug) appears. Wave-12/13 two-client probes caught no equivalent unit-test gap — those waves had correct broadcast semantics from the start. Recurrence condition not yet met. Hold in observations; promote to T-2.md rule 1 if a second wave has a unit-test false green on a fan-out or room-broadcast path due to mocking the composed dependency.

Candidate rule for next qualifying wave:
```
1. For any room-broadcast test, assert what a recipient's payload contains using the real
   service; a mock that bypasses composition hides a wrong-layer exclusion.
   Why: A mocked service makes isolation correct while the broadcast composition is wrong
   for every recipient.
```

**obs-2 (CJS shared package / web runtime value import build break) — HOLD.**

Clear single-wave occurrence; first instance of the vite/CJS-named-value-export break in this project. The pattern is already documented as a convention (messagingSocket precedent from wave-12); this wave is the first time the convention was violated and caused a build break. Hold; promote to BUILD-PRINCIPLES rule 4 if a second wave hits a build break from a value import from the shared CJS dist.

**obs-3 (dark-surface de-emphasized text below WCAG AA) — STRONG CANDIDATE for DESIGN-PRINCIPLES.**

Two-wave confirmed: wave-9 (semantic-color red, 3.5:1) + wave-14 (alpha-reduced white, 3.83:1). Both caught at D-3 accessibility review, both required a re-iteration cycle. Both share the same root class (dark-surface muting chosen by visual judgment fails the contrast formula). The sub-classes differ (semantic color vs alpha) but are unified by the broader rule: any muted text treatment on a dark surface must be formula-verified, not visually judged. DESIGN-PRINCIPLES Rules section is empty — no near-dup. Cap clear (0 rules currently; this is rule 1). Promote at karen.

Candidate rule for karen to format:
```
1. Verify de-emphasized text on dark surfaces meets WCAG AA (>= 4.5:1) by calculation;
   visual muting via alpha or semantic color routinely falls below threshold.
   Why: A "visually muted" alpha or semantic-color token reads as acceptable but often
   computes below 4.5:1 on near-black surfaces.
```
Rule line = 107 chars (within 120); why line = 82 chars (within 100). No forbidden tokens.

**obs-4 (D-3 iter-3 verdict not persisted) — INFORMATIONAL; NO PROMOTION.**

Single-wave process hygiene event. Gate machinery caught it; no outcome corruption. No principle warranted.

**Summary table:**

| id    | title (short)                                   | severity      | recurrence | disposition                                           |
|-------|-------------------------------------------------|---------------|------------|-------------------------------------------------------|
| obs-1 | Unit-test false green on broadcast composition  | strong        | 1 wave     | keep-as-observation; promote if recurs (T-2 rule 1)   |
| obs-2 | CJS shared value import breaks vite web build   | warning       | 1 wave     | keep-as-observation; promote if recurs (BUILD-4)      |
| obs-3 | Dark-surface de-emphasis text below WCAG AA     | warning       | 2 waves    | PROMOTE to DESIGN-PRINCIPLES rule 1 (karen)           |
| obs-4 | D-3 iter-3 reviewer verdict not persisted       | informational | 1 wave     | informational; no promotion                           |
