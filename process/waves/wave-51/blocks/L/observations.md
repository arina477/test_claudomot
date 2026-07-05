# Wave 51 — L-block observations ledger

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read: process/waves/wave-51/ full artifact set (P-1-decompose, P-4/gate-verdict,
B-6-review-output, B/gate-verdict, T-5-e2e, T/gate-verdict, V-1-karen, V-1-jenny, V-2-triage,
V-3-fast-fix, V/gate-verdict).
Prior archives consulted: process/waves/_archive/wave-{46,47,48,49,50}/blocks/L/observations.md
(recurrence checks on floor-carve-out class, P-4 reachability-reasoning class, B-5 CI parity,
and all prior held HOLDs).
Principles files read: BUILD-PRINCIPLES.md (10 rules), PRODUCT-PRINCIPLES.md (3 rules),
VERIFY-PRINCIPLES.md (4 rules).

---

- **[obs-A — RECURRING (2nd instance): P-4 "unreachable state" claim misses pre-existing transient state carried across a surface transition]**

  The P-4 Phase-2 gate-verdict records that karen confirmed "`sidebarOpen` can't become true
  while `dmHomeActive`" — which is correct FOR STATE CHANGES INITIATED ON THE DM SURFACE, but
  misses the case where `sidebarOpen=true` was set BEFORE the DM surface was activated and
  then carried over. B-6 Phase-2 code-reviewer caught this as a HIGH finding: a user who opens
  the mobile drawer (server view) then taps Direct Messages arrives on the DM surface with
  `sidebarOpen` still `true`, so the `z-40` backdrop renders over `DmHome`'s `z-10` content.
  The P-4 reachability claim was correct within-state but wrong across-transition.

  This is the reachability-reasoning class first flagged at wave-46 obs-1 in a different form
  (T-5 E2E tested the DM picker from a server context, missing the cold-start entry-point
  state). Here the analogous gap is in P-4 gate reasoning: reviewers evaluated "can this state
  be reached while dmHomeActive?" but not "can this state have been set before dmHomeActive
  became true, and does it persist across the transition?" A "this state is unreachable" gate
  claim must account for pre-existing transient state that carries over from a prior surface,
  not only for state changes reachable from within the current surface.

  The finding was caught at B-6 (not shipped), and the fix was clean and correctly authored.
  The cost is one B-6 rework cycle.

  Source artifacts:
  - process/waves/wave-51/blocks/P/gate-verdict.md (Phase 2 karen carry: "sidebarOpen can't
    become true while dmHomeActive — channel-drawer toggle unreachable on DM surface")
  - process/waves/wave-51/stages/B-6-review-output.md (Finding 1 HIGH: "sidebarOpen is NOT
    reset when the DM surface is activated... Reachable sequence: open drawer → click Direct
    Messages → dmHomeActive=true; sidebarOpen stays true")
  - process/waves/wave-51/blocks/B/gate-verdict.md (B-6 APPROVED after fix commit c0b6f07;
    belt-and-suspenders fix: `setSidebarOpen(false)` reset + backdrop `!dmHomeActive` guard)

  Recurrence: SECOND INSTANCE of the "gate reviewer reasons about state reachability
  within-surface, missing pre-existing transient state that arrives via a cross-surface
  transition" class. Wave-46 obs-1 is the first: a T-5 tester exercised the DM picker from
  a server context (state-rich), missing the cold-start entry point where the required state
  was absent. Both instances share the structural gap: reachability from the current state
  was evaluated; the pre-existing / carried state from a prior context was not.

  Severity: warning (B-6 caught before ship; one rework cycle; preventable at P-4 if the
  reviewer's cross-transition check had been scoped).
  Candidate principles file: command-center/principles/PRODUCT-PRINCIPLES.md (rule 4 —
  next open slot; P-4 is a P-block gate and the class affects gate reasoning).
  Candidate rule shape:
    4. A P-4 "this state is unreachable" claim must account for state carried over from a
       prior surface, not only for transitions within the current surface.
       Why: A toggle unreachable on the current surface can arrive pre-set from a prior
       surface, leaving orphaned UI elements at higher z-index.
    Rule line: "4. A P-4 'this state is unreachable' claim must account for state carried over from a prior surface, not only for transitions within the current surface." = 159 chars. OVER 120.
    Shorter:
    "4. Gate a 'state unreachable here' claim by also checking whether it can arrive pre-set from a prior surface transition." = 119 chars. PASS (≤120).
    Why line: "   Why: A flag unreachable on surface A can still arrive set from surface B, stranding UI." = 90 chars. PASS (≤100).
    No forbidden tokens. No near-dup with PRODUCT rules 1-3. PASS.
  Promotion flag: YES — meets the 2-wave bar (wave-46 obs-1 is the first confirming instance;
    wave-51 is the second); generalizable (any multi-surface app with shared transient state);
    falsifiable (checkable at P-4: does the reachability claim consider state arriving via
    cross-surface transitions, not only within-surface transitions?); cited (P/gate-verdict
    karen carry + B-6-review-output Finding 1). NOMINATION for karen vetting at L-2.

---

- **[obs-B — RECURRING (2nd instance): sub-floor reuse-heavy V-2-debt fix correctly overridden without BOARD; floor-carve-out candidate approaches promotion threshold]**

  Wave-51 P-1 tripped the single-spec sub-floor (~<100 LOC vs 1,500 threshold) and correctly
  waived it by rule: mvp-thinner returned `floor_constraint_active: true` with zero split
  candidates; the AC is atomic; all three P-0 reviewers scope-fenced against expansion; the
  floor's purpose (block wasteful tiny waves) does not apply to a V-2-triaged user-visible
  defect fix on a shipped surface.

  Wave-50 P-1 was the first recorded instance of this exact class: multi-spec sub-floor waived
  for a reuse-heavy feature-completion + regression-fix wave where expansion was ruled out by
  unanimous P-0 scope endorsement. Wave-51 is the second instance with the same resolution
  path. P-1 explicitly logs it: "same floor-carve-out candidate as wave-50 (2nd occurrence —
  approaching promotion threshold)."

  The floor rubric mechanically trips on legitimately-small high-value V-2-debt fixes and
  reuse-heavy completions. The recurring resolve-by-rule path (mvp-thinner forced `floor_
  constraint_active` + 0 split candidates + P-0 trio scope-fence + ceo-reviewer HOLD-SCOPE
  ruling = no BOARD) is consistent across both instances.

  Near-dup check against PRODUCT rules 1-3: rule 1 (verify seed claims), rule 2 (verify
  named entity), rule 3 (credential-independent ACs). None address the floor-waiver class.
  Near-dup check against wave-16 observations (test-infra override): wave-16 was a test-infra
  wave that did NOT trip the floor. Not the same class.

  Source artifacts:
  - process/waves/wave-51/stages/P-1-decompose.md (floor trip, override-ship, l2_flag:
    "sub-floor reuse-heavy debt-fix override — same floor-carve-out candidate as wave-50
    (2nd occurrence — approaching promotion threshold)")
  - process/waves/_archive/wave-50/stages/P-1-decompose.md (first instance; l2_flag:
    "recurring sub-floor feature-completion override — floor rubric carve-out candidate")

  Severity: warning (floor trips mechanically on legitimate high-value fixes; the recurring
  resolve-by-rule path adds cognition overhead and a logged product-decisions entry each time).
  Candidate principles file: command-center/principles/PRODUCT-PRINCIPLES.md (rule 4 slot
  — competing with obs-A above; only one promotion per file per wave; obs-A has higher
  causal-cost evidence (B-6 rework) and broader gate-reasoning applicability; obs-B is a
  sizing/process class. If obs-A takes rule 4, obs-B waits for rule 5 slot on third wave).
  Candidate rule shape:
    4. Waive the P-1 floor for a V-2-triaged shipped-surface fix when mvp-thinner returns
       floor_constraint_active and zero split candidates; no BOARD is required.
       Why: The floor targets wasteful tiny greenfield waves; it should not block
       high-value defect fixes with no valid expansion path.
    Rule line: "4. Waive the P-1 floor for a V-2-triaged shipped-surface fix when mvp-thinner returns floor_constraint_active and zero split candidates; no BOARD is required." = 160 chars. OVER 120.
    Shorter:
    "4. When mvp-thinner returns floor_constraint_active with zero split candidates, waive the floor; no BOARD convene is required." = 126 chars. OVER 120.
    "4. A V-2-triaged defect fix with zero mvp-thinner split candidates waives the floor by rule; no BOARD." = 103 chars. PASS.
    Why: "   Why: The floor blocks wasteful tiny greenfield waves; a defect fix with no split path is not that class." = 107 chars. OVER 100.
    Shorter why: "   Why: The floor targets wasteful greenfield tiny waves; a defect fix with no expansion path is not that class." = 111 chars. OVER.
    "   Why: The floor is for wasteful tiny greenfield waves; a defect fix with no split path is exempt." = 100 chars. EXACTLY 100. PASS.
    No forbidden tokens. PASS.
  Recurrence: SECOND INSTANCE (waves 50, 51). PROMOTION-ELIGIBLE.
  Promotion flag: HOLD-SECONDARY — generalizable and falsifiable and 2-wave bar met; but
    PRODUCT-PRINCIPLES rule 4 slot is contested by obs-A (cross-surface reachability), which
    has stronger causal evidence (B-6 rework cost, gate-reasoning gap with direct gate impact).
    Only one rule promoted per file per wave. Promote obs-A at rule 4; obs-B carries to wave-52
    assessment for rule 5.

---

- **[obs-C — status check on prior held observations]**

  | origin | obs | class | wave-51 status |
  |--------|-----|-------|----------------|
  | wave-50 obs-B | Parallel T-5 testers block on shared MCP Chrome profile | NOT CONFIRMED. Wave-51 T-5 used a single tester (pattern B, 1 ui-comprehensive-tester). Remains 1-wave HOLD. |
  | wave-50 obs-C | P-4/plan review enumerate all compute-on-read walk paths for new per-row parameter | NOT CONFIRMED. Wave-51 has no compute-on-read walk; it is a conditional-render gating change. Remains 1-wave HOLD. |
  | wave-49 obs-B | Socket.IO namespace mismatch invisible to mocked-both-sides unit suite | NOT CONFIRMED. Wave-51 has no new Socket.IO gateway. Remains 2-wave HOLD. |
  | wave-49 obs-C | Responsive breakpoint not validated against D-3 adopted design at B-block | NOT CONFIRMED. Wave-51 has no D-3 adopted design (design_gap_flag=false; D skipped). Remains 2-wave HOLD. |
  | wave-46 obs-1 | T-5 E2E tests start-affordance from state-rich context; cold-start entry unreachable | CONFIRMED AS SECOND INSTANCE — see obs-A above (different surface, same reachability-reasoning class). The specific T-5 entry-point coverage aspect is one face of the class; the P-4 across-transition reasoning gap is the other. Both trace to "reachability assessed within-surface, missing cross-surface pre-set state." Candidate rule for PRODUCT-PRINCIPLES obs-A above. |
  | wave-44 obs-1 | Responsive/layout fix introduces overlay without WCAG dialog contract | NOT CONFIRMED. Wave-51 has no new overlay. Remains 7-wave HOLD. |
  | wave-45 obs-1 | Browser resolution in committed playwright config | NOT CONFIRMED. T-5 launched cleanly via node package. Remains 6-wave HOLD. |
  | wave-45 obs-2 | `playwright test --list` false-green for browser-resolution change | NOT CONFIRMED. No Playwright config change. Remains 6-wave HOLD. |
  | wave-47 obs-C | Display-identifier vs opaque-id mismatch | NOT CONFIRMED. No component rendering user identities via opaque-id. Remains 4-wave HOLD. |
  | wave-41 obs-1 | V-3 redeploy false-green | NOT CONFIRMED. V-3 Phase 2 not triggered (fast-fix queue empty). Remains 10-wave HOLD. |
  | wave-41 obs-2 | Symbol-grep false-positive | NOT CONFIRMED. V-1 karen verified the bundle at the minified-JS level (not symbol-name grep). Remains 10-wave HOLD. |
  | wave-41 obs-3 | Parallel-path enforcement gap | NOT CONFIRMED. No new parallel sibling method introduced. Remains 10-wave HOLD. |
  | wave-40 obs-1 | T-8 fix mechanism contradicts architectural decision | NOT CONFIRMED. No T-8-sourced architectural conflict. Remains 11-wave HOLD. |
  | wave-40 obs-4 | Global 22P02 filter / text-keyed route params | NOT CONFIRMED. No text-keyed route params. Remains 11-wave HOLD. |

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-A | P-4 "unreachable state" claim missed pre-existing transient state carried across surface transition; B-6 caught mobile backdrop strand | warning | 2nd instance (wave-46 obs-1 is first; same cross-surface reachability class) | PRODUCT-PRINCIPLES rule 4 | PROMOTION CANDIDATE — 2-wave bar met; generalizable; falsifiable; cited; nominate for karen |
| obs-B | Sub-floor reuse-heavy V-2 debt-fix correctly overridden; floor-carve-out candidate at 2nd instance | warning | 2nd instance (waves 50, 51) | PRODUCT-PRINCIPLES rule 4 | HOLD-SECONDARY — promotion-eligible on substance but loses rule-4-slot competition to obs-A; carry to wave-52 for rule 5 |
| obs-C | Status check on prior held observations | informational | status checks | null | STATUS CHECK ONLY |

**Observations emitted: 3 (obs-A through obs-C)**
**Severities: 2 warning (obs-A, obs-B), 1 informational (obs-C)**
**Promotion-eligible: obs-A (PRODUCT-PRINCIPLES rule 4 — 2-wave bar met; cross-surface reachability reasoning gap with B-6 rework evidence)**
**Secondary eligible: obs-B (2-wave bar met; HOLD-SECONDARY on slot competition — carry to rule 5)**
**Nomination for karen vetting: obs-A (primary, rule 4 candidate)**
