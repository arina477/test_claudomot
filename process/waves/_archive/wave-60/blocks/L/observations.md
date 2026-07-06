# Wave 60 — L-block observations ledger

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read: process/waves/wave-60/stages/ full artifact set (P-0-problem-framer, P-0-frame,
P-0-ceo-reviewer, P-0-mvp-thinner, P-1-decompose, P-2-spec, P-3-plan, P-4-gemini-review,
B-0-branch-and-schema, B-3-frontend, B-4-wiring, B-5-verify, B-6-review-output, C-1-pr-ci-merge,
C-2-deploy-and-verify, T-9-journey, V-1-karen, V-1-jenny, V-1-summary, V-2-triage, V-3-fast-fix).
Gate verdicts checked: process/waves/wave-60/blocks/P/gate-verdict.md (REWORK Attempt 1 →
APPROVED Attempt 2; B, T, C, V all APPROVED; V-2 triage empty; V-3 fast-fix queue empty).
Prior archives consulted: process/waves/_archive/wave-{55,56,57,58,59}/blocks/L/observations.md
(recurrence checks on soft-check-hardening class, prod-baseURL e2e class, dead-onClick class,
YAGNI/premature-scope class, and all prior held HOLDs).
Principles files read: PRODUCT-PRINCIPLES.md (5 rules), BUILD-PRINCIPLES.md (10 rules),
CI-PRINCIPLES.md (10 rules), VERIFY-PRINCIPLES.md (4 rules), DESIGN-PRINCIPLES.md (1 rule).
Grep run: `#(0a0a0b|121214|1c1c1f|27272a|10b981)` against apps/web/src/**/*.tsx →
  **45 files** (exact count verified; confirms problem-framer's figure).

---

- **[obs-1 — FIRST INSTANCE (STRONG CANDIDATE): the web shell carries hardcoded palette hex
  literals in 45 .tsx files where consumable CSS custom-property tokens exist; P-0 flagged it as
  a pervasive architectural antipattern; the wave-46 T-6 F10 finding is the documented origin;
  shade drift is the known recurring cost]**

  Wave-60 was seeded as a 3-surface cosmetic swap (server rail, DM picker modal card, disabled
  send button). P-0 problem-framer ran a grep and confirmed the following structure: the dark-mode
  design token system is fully defined and consumable in `apps/web/src/styles/globals.css`
  (e.g. `--color-surface-900: #121214`, `--color-accent-emerald: #10b981`); yet no component in
  the web shell references those tokens via `var()` — every component hardcodes raw palette hex
  inline via `style={{...}}`. The problem-framer counted 45 `.tsx` files carrying at least one of
  the five canonical palette hex values (`#0a0a0b`, `#121214`, `#1c1c1f`, `#27272a`, `#10b981`).
  This count was independently verified by grep during L-2 synthesis: `rg -l
  '#(0a0a0b|121214|1c1c1f|27272a|10b981)' apps/web/src --glob '**/*.tsx'` returned **exactly 45
  files** (P-0-problem-framer.md §Evidence: "Scope of the cause: 45 .tsx files under apps/web/src
  carry hardcoded palette hex").

  The origin of the finding is wave-46 T-6 F10, which logged three off-token surface substitutions
  as LOW/cosmetic (process/waves/_archive/wave-46/stages/T-6-layout.md: "server rail surface-950
  vs DS-§1 surface-900 (adjacent, on-palette)"; "modal card surface-800 vs 900"; "disabled-send
  surface-700 vs canonical emerald-50%"). Wave-60 is the first wave that actually fixes three of
  those F10 surfaces — but the mechanism of the fix (converting 3 inline hex literals to
  `var(--color-surface-900)` / `color-mix(in srgb, var(--color-accent-emerald) 40%, transparent)`)
  simultaneously confirms the root cause is architectural: the token system exists but is never
  consumed, so every shade-drift defect requires a dedicated fix wave rather than being prevented
  at authoring time.

  Structural analysis for generalizable pattern candidacy:

  1. FALSIFIABLE: "does this .tsx file reference any of these five hex literals without a
     corresponding var() consumption?" is a one-command grep check. The count is 45 now, will
     decrease toward 0 as token-consumption waves run. Checkable at any point.

  2. PERVASIVE: 45 of roughly 45 components in the shell are affected — this is not an outlier,
     it is the default authoring pattern that existed before the token system was published.

  3. COSTLY-IF-IGNORED: shade drift (the operational cost already observed at wave-46 T-6) will
     recur at any surface whose hex literal diverges from the DESIGN-SYSTEM.md assignment. Each
     drift requires a dedicated fix wave. The same structural gap will produce the same class of
     findings indefinitely unless the consumption pattern is changed.

  4. NOT COVERED BY ANY EXISTING RULE: grepped all promoted principles files (PRODUCT 1-5,
     BUILD 1-10, CI 1-10, VERIFY 1-4, DESIGN 1). DESIGN-PRINCIPLES rule 1 addresses contrast
     calculation on muted text on dark surfaces ("Calculate contrast for muted text on dark
     surfaces...") — it does NOT encode a norm about token-consumption architecture (var() vs
     hardcoded hex). BUILD-PRINCIPLES rules 1-10 address runtime config, branch push, backfill
     seeds, authz negative paths, reconnect guards, formatter, lint, pre-commit hooks, integration
     specs, B-5 CI parity — none encodes a token-consumption authoring norm. PRODUCT-PRINCIPLES
     rules 1-5 address P-0 code-entity verification, entity targeting, credential-independent ACs,
     cross-surface reachability, floor waivers — none encodes the inline-hex antipattern class.
     Not a near-dup.

  5. RECURRENCE across waves: wave-46 T-6 F10 is the documented origin observation; wave-60 is
     the first wave that physically converted surfaces and confirmed the cause is architectural.
     Searched all five prior-wave L-2 archives (waves 55-59) for "hardcoded.*hex", "palette.*hex",
     "token.*consumption", "design.token", "F10" — NO prior L-2 observation of the class was found.
     This means the wave-46 T-6 finding was never elevated to an L-2 observation, and wave-60 is
     the FIRST instance as an L-2 observation. The wave-46 T-6 origin evidence establishes the
     underlying architectural condition has been present for at least 14 waves without being
     encoded as a principle.

  Assessment of L-2 candidate quality:

  The problem-framer explicitly nominated this as a candidate for L-2 promotion as an antipattern
  (P-0-problem-framer.md scope_note: "candidate for L-2 promotion as a new project antipattern
  ('hardcoded palette hex where a consumable token exists')"; P-0-frame.md: "CARRY-FORWARD (future
  wave / L-2): ...an L-2 antipattern candidate 'hardcoded palette hex where a consumable token
  exists' (PRODUCT-PRINCIPLES § Antipatterns currently empty)"). PRODUCT-PRINCIPLES.md currently
  has 5 rules and NO Antipatterns section.

  Pre-shaped candidate rule for PRODUCT-PRINCIPLES (new Antipatterns section):
    "A1. Never hardcode a palette hex literal in a component where a consumable CSS token
        (var(--color-*)) exists; consume the token instead."
    Rule line = 103 chars. PASS (<=120).
    "    Why: A hardcoded hex that drifts from its DESIGN-SYSTEM assignment requires a dedicated
        fix wave; a var() never drifts."
    Why line WITH 4-space indent = 98 chars. PASS (<=100).
    No forbidden tokens (no `we`, `our`, `the team`, `wave-<N>`, em-dash). PASS.
    Near-dup check: DESIGN-PRINCIPLES rule 1 (contrast calc) is the closest; that rule covers
    contrast computation, not token-consumption architecture. Not a near-dup. PASS.

  Source artifacts:
  - process/waves/wave-60/stages/P-0-problem-framer.md (verdict: PROCEED; scope_note: "45 .tsx
    files under apps/web/src carry hardcoded palette hex (grep confirmed), none consuming var()")
  - process/waves/wave-60/stages/P-0-frame.md (Reframe section: "CARRY-FORWARD (future wave / L-2):
    a token-consumption migration wave...an L-2 antipattern candidate 'hardcoded palette hex where a
    consumable token exists' (PRODUCT-PRINCIPLES § Antipatterns currently empty)")
  - process/waves/wave-60/stages/V-1-jenny.md (§Behavior/scope checks: "off-token hex
    (#0a0a0b/#1c1c1f/#27272a) still appears across ~10+ web files...Only the 3 wave-46 T-6 F10
    surfaces were converted...The broad inline-hex→var() migration is a deliberate carry-forward
    wave")
  - process/waves/wave-60/stages/V-1-karen.md (Claim 4: "The ~36 other files carrying the same
    hex literals are untouched"; Claim 5: "Net hex count strictly decreases")
  - process/waves/_archive/wave-46/stages/T-6-layout.md (F10 origin: "server rail surface-950 vs
    DS-§1 surface-900 (adjacent, on-palette)"; "No invented / off-palette hex. The three N rows are
    1-step-adjacent surface substitutions")
  - L-2 grep (this synthesis): `rg '#(0a0a0b|121214|1c1c1f|27272a|10b981)' apps/web/src
    --glob '**/*.tsx' -l` → 45 files confirmed.

  Severity: strong (architectural antipattern with 45 confirmed offending files; documented
    operational cost at wave-46 T-6 and wave-60; will produce recurring shade-drift fix waves
    until the consumption pattern changes; P-0 explicitly nominated for L-2 promotion; meets all
    four candidacy criteria: falsifiable, pervasive, costly-if-ignored, not covered by existing
    rules).
  Candidate principles file: command-center/principles/PRODUCT-PRINCIPLES.md (Antipatterns section,
    rule A1 candidate — PRODUCT-PRINCIPLES currently has no Antipatterns section; this would be
    its first entry).
  Recurrence verdict: FIRST INSTANCE as L-2 observation (wave-46 T-6 F10 is the origin finding
    documenting the operational cost; no prior L-2 ledger in any archived wave records this class).
    The two-wave bar for promotion is NOT met as a formal L-2 observation chain. However, the
    wave-46 T-6 finding constitutes a prior documented occurrence of the underlying operational
    consequence (shade drift from a hardcoded hex diverging from its DESIGN-SYSTEM assignment),
    and wave-60's conversion confirms the root cause. Karen should assess at L-2 whether the
    wave-46 T-6 functional finding + wave-60 architectural confirmation constitutes a sufficient
    two-data-point base for promotion, or whether a second explicit L-2 observation (e.g., the
    future token-consumption migration wave) is required.
  Promotion flag: STRONG HOLD — meets candidacy criteria; wave-46 T-6 origin + wave-60 fix is a
    2-data-point recurrence argument; awaits karen's L-2 ruling on whether wave-46 T-6 counts as
    the first L-2-equivalent instance or whether a second explicit L-2 observation is required
    before promotion.

  L-2 KAREN VET + HEAD-LEARN RULING (wave-60): REJECT / HOLD — NOT PROMOTED THIS WAVE.
  Recurrence is genuine (this is NOT a recurrence-insufficiency reject; NOT a hallucinated-claim
  reject — karen confirmed tokens exist in globals.css:10-19, and the real offender count is 45
  .tsx files, not 39). Rejected on two independently-fatal grounds:
  (1) ENFORCEABILITY (disqualifier): promoted today the binary rule would be violated by 45 existing
      files whose remediation is a DELIBERATE carry-forward migration (only 3 of ~45 surfaces
      touched this wave, and even those 3 — ServerRail.tsx / StartDmPicker.tsx — still carry heavy
      raw hex at HEAD). A binary antipattern the current tree fails 45x by design is a standing
      45-line waiver, not a gate — it trains reviewers to ignore the rule and erodes the file's
      authority. Not PASS/FAIL-clean today.
  (2) FORMAT: rule line 136 chars (>120) + why line 119 chars (>100); the `A1.` prefix + a new
      `## Antipatterns` H2 for a single rule is not contract-legal (contract mandates sequential
      integer numbering; new H2 only when >=3 rules share a theme). A scope qualifier ("in any
      component you add or edit") is needed to make it enforceable but will not fit the 120-char
      limit alongside the token examples.
  Also: WRONG TARGET FILE — this is design-system token-hygiene, natural home is DESIGN-PRINCIPLES,
  not PRODUCT-PRINCIPLES (scope/problem-framing).
  Disposition: keep obs-1 in this ledger (recurrence already satisfied); promote only AFTER the
  deferred inline-hex->var() migration wave lands and the tree passes clean, re-filed against
  DESIGN-PRINCIPLES as a plain sequential rule. karen's compliant shape (presented, NOT endorsed
  for this wave): "In any component you add or edit, consume a var(--color-*) token instead of a
  raw palette hex. / Why: A hardcoded hex can drift from its design-system value; a token cannot."
  karen agentId a5e2c6d2e5da81d75; full vet in the L-2 deliverable.

---

- **[obs-2 — HOLD UPDATE (obs-A from wave-58, 1st instance): hardening a pass-regardless soft-check
  into a gating assertion surfaces a masked defect — NO-CONFIRM this wave; HOLD maintained]**

  Wave-58 obs-1 (FIRST INSTANCE) documented: when a pass-regardless soft-check is converted to a
  gating hard assertion, the first honest CI run may gate red because a pre-existing production
  defect previously concealed by the softness is now visible. The pre-shaped VERIFY-PRINCIPLES rule
  5 candidate is held pending a confirming wave.

  Wave-60 assessment: this wave is a 3-surface cosmetic token swap with no test changes and no
  assertions being converted. The wave has no soft-check in its diff (B-6-review-output.md: "3
  inline CSS backgroundColor value changes... No logic, no control flow, no data/contract change.
  Production-bug patterns: NONE APPLICABLE"). CI ran 7/7 green on first attempt (C-1-pr-ci-merge.md
  confirmed via V-1-karen.md cross-check). No production defect was found, fixed, or disclosed
  beyond the cosmetic token values. The structural prerequisite for obs-A to fire (an existing
  pass-regardless test assertion being converted to a hard assertion) is entirely absent from this
  wave's scope.

  Determination: NOT CONFIRMED. Wave-60 is not a confirming instance of the wave-58 obs-A class.
  The wave is cosmetic-token-hygiene only; no assertion hardening occurred.

  Source artifacts: B-6-review-output.md ("No logic, no control flow, no data/contract change"),
  V-3-fast-fix.md (phase1_head_verifier_verdict: APPROVED; fast_fix_rounds: 0),
  V-1-karen.md (6/6 claims verified; zero findings).

  Candidate rule shape preserved from wave-58 (NOT a nomination — still 1st instance only):
    "5. When converting a pass-regardless soft-check to a gating assertion, budget a production fix;
       surfacing the masked defect is the expected outcome."
    Rule = 104 chars. PASS. Why = "A soft-check that passes regardless hides whether the behavior
    works; the first honest run may gate red." Why with indent = 97 chars. PASS.
    No forbidden tokens. Not a near-dup of VERIFY rules 1-4. PASS.

  Severity: informational (status update only; wave structure is entirely orthogonal to the class).
  Candidate principles file: command-center/principles/VERIFY-PRINCIPLES.md (rule 5 candidate).
  Recurrence verdict: NO-CONFIRM this wave. Still FIRST INSTANCE (wave-58 only). HOLD maintained.
  Promotion flag: HOLD — 1st instance; watch for a wave where a pass-regardless check is converted
    to a gating assertion and triggers a production-fix contingency.

---

- **[obs-3 — HOLD UPDATE (obs-B from wave-58, 1st instance): a prod-baseURL e2e is post-deploy
  verification, not a pre-merge gate — NO-CONFIRM this wave; HOLD maintained]**

  Wave-58 obs-2 (FIRST INSTANCE) documented: a Playwright suite whose baseURL targets the live
  production URL is a post-deploy verification instrument, not a pre-merge gate; marking it required
  in CI would block the branch fix that resolves the failing e2e.

  Wave-60 assessment: CI ran 7/7 green including the e2e check (V-1-karen.md: "C/gate-verdict.md:
  C-1 PASS (PR #75, 7/7 CI, merged 7a1af6f)"). The wave's changes are 3 inline-style backgroundColor
  swaps with no behavioral delta — the e2e running against deployed prod has no reason to gate
  differently between pre-deploy and post-deploy states. No scenario arose where the
  production-baseURL classification of the e2e suite was relevant to any merge decision this wave.
  The wave is not a confirming or falsifying instance.

  Determination: NOT CONFIRMED. Wave-60 provides no new evidence for the wave-58 obs-B class.
  The clean CI run on a behavior-inert change does not stress-test the classification distinction.

  Source artifacts: V-1-karen.md (C/gate-verdict corroborated: C-1 PASS, 7/7 CI), V-3-fast-fix.md
  (APPROVED, fast_fix_rounds: 0).

  Candidate rule shape preserved from wave-58 (NOT a nomination — still 1st instance only):
    "11. Classify an e2e suite whose baseURL targets deployed prod as non-required in CI; it is
       post-deploy verification, not a pre-merge gate."
    Rule = 113 chars. PASS. Why = "A production-baseURL e2e tests the deployed binary, not the
    branch; gating merge on it blocks the fix." Why with indent = 99 chars. PASS.
    No forbidden tokens. Not a near-dup of CI rules 1-10. PASS.

  Severity: informational (status update; wave structure orthogonal to the class).
  Candidate principles file: command-center/principles/CI-PRINCIPLES.md (rule 11 candidate).
  Recurrence verdict: NO-CONFIRM this wave. Still FIRST INSTANCE (wave-58 only). HOLD maintained.
  Promotion flag: HOLD — 1st instance; watch for a wave where baseURL = prod classification is
    applied correctly or missed (creating a merge deadlock).

---

- **[obs-4 — RECURRING (11th instance): sub-floor single-spec wave resolved by override-ship via
  PRODUCT rule 5 (wave-16 test-coverage / debt-fix exemption); recurrence count updated; rule
  functioning correctly]**

  Wave-60 P-1 tripped the single-spec floor (cosmetic 3-surface token swap, sub-floor vs.
  1,500-LOC threshold). Resolution: floor waived under the standing wave-16 / wave-21 / wave-50
  sub-floor debt-fix-on-shipped-surfaces precedent (P-4 gate-verdict Attempt 1 rationale confirms:
  "the floor-waiver is legitimately applied (wave-50/16 sub-floor debt-fix-on-shipped-surfaces
  precedent verified in product-decisions.md)"). No BOARD required.

  This obs is a STATUS UPDATE only: PRODUCT-PRINCIPLES rule 5 (promoted at wave-52) covers the
  general floor-override-by-rule path. The system is operating as designed. No new learning gap.

  Recurrence lineage:
  - wave-50 obs-B: 1st instance. wave-51 obs-B: 2nd instance. wave-52 obs-4: 3rd instance
    (PROMOTED as PRODUCT-PRINCIPLES rule 5). waves 53, 54, 55: instances 4, 5, 6.
    wave-56 obs-3: 7th instance. wave-57 obs-2: 8th instance. wave-58 obs-3: 9th instance.
    wave-59 obs-4: 10th instance. wave-60: 11th instance.
    Rule applied correctly each time; no override friction.

  Source artifacts:
  - process/waves/wave-60/blocks/P/gate-verdict.md (Attempt 1 rationale: "floor-waiver is
    legitimately applied (wave-50/16 sub-floor debt-fix-on-shipped-surfaces precedent)").

  Severity: informational (rule 5 functioning correctly; zero override friction; no new gap).
  Candidate principles file: none (PRODUCT-PRINCIPLES rule 5 already exists and was applied).
  Recurrence: 11th instance. Rule 5 in force. No action needed.
  Promotion flag: NO — rule already promoted; this is a health-check confirmation.

---

- **[obs-5 — INFORMATIONAL: P-4 gate caught a 50% vs 40% opacity mismatch between the spec and
  DESIGN-SYSTEM.md on the disabled-send button; the gate-rework cycle resolved it before B-block
  entry; P-4 functioning as designed]**

  Wave-60 P-4 Attempt 1 returned REWORK on a single wrong-value defect: the P-2 spec locked the
  disabled-send canonical opacity at emerald@50%, but DESIGN-SYSTEM.md line 97 specifies
  "disabled (40% opacity, no pointer)" for the Button component. P-4 gate-verdict Attempt 1
  rationale: "Shipping 50% would produce a non-canonical disabled state on an already-shipped
  surface — exactly the load-bearing spec detail this gate must not launder into the build block."
  The fix (correct AC3 from 50% to 40%; add DESIGN-SYSTEM §Button citation; tighten the a11y AC
  to distinguish contrast-exempt disabled controls from the rail/picker text that must remain AA)
  was applied in P-2 and P-3, and Attempt 2 returned APPROVED. No B-block rework was required;
  the gate-rework cycle resolved the defect at the cheapest possible point in the wave.

  The systemic observation: a one-number spec error (50% vs 40% opacity) is the class of defect
  a P-4 gate is designed to catch before the builder implements it. The gate caught it. Verified
  by jenny in V-1 (V-1-jenny.md §Surface 3: "color(srgb 0.0627451 0.72549 0.505882 / 0.4)...=
  rgb(16,185,129) = #10b981 = accent-emerald, at 0.4 alpha = emerald @40%") — meaning the
  shipped value exactly matches the DESIGN-SYSTEM.md §Button contract, not the original incorrect
  50%.

  This is a positive confirmation that the P-4 gate is doing its job. It does not represent a gap
  in the authoring process; spec authors can mis-read token values, and P-4 is the correct
  correction point. No rule promotion is warranted — the mechanism worked. Logged as a clean-gate
  health-check signal.

  Source artifacts:
  - process/waves/wave-60/blocks/P/gate-verdict.md (Attempt 1: REWORK, "wrong canonical token:
    spec's disabled-state value diverges from the design-system's own component contract";
    Attempt 2: APPROVED, "single Attempt-1 defect is fixed and nothing regressed")
  - process/waves/wave-60/stages/V-1-jenny.md (§Surface 3: live getComputedStyle probe confirms
    emerald@40% on deployed prod)
  - design/DESIGN-SYSTEM.md (line 97: "disabled (40% opacity, no pointer)")

  Severity: informational (gate functioning correctly; no B-block rework needed; defect resolved
    at cheapest correction point; positive system-health signal).
  Candidate principles file: none.
  Recurrence: N/A (positive confirmation; no gap identified).
  Promotion flag: NO.

---

- **[obs-6 — status check on prior held observations]**

  Updating carried status from wave-59 obs-5 and all prior HOLDs:

  | origin | obs | class | wave-60 status |
  |--------|-----|-------|----------------|
  | wave-58 obs-1 / obs-A | Hardening a pass-regardless soft-check into a gating assertion exposes a masked production defect | NOT CONFIRMED. Wave-60 is cosmetic-token-hygiene; no assertions converted; CI 7/7 green first attempt. See obs-2 above. HOLD maintained. |
  | wave-58 obs-2 / obs-B | Prod-baseURL e2e is post-deploy verification, not a pre-merge gate | NOT CONFIRMED. CI 7/7 green; behavior-inert change; classification not stress-tested. See obs-3 above. HOLD maintained. |
  | wave-59 obs-3 | Test a multi-branch pure formatter with a single it.each table covering every output bucket | NOT CONFIRMED. Wave-60 adds no unit tests; sole test infra is 467/467 vitest passing with no changes. Not an exercising instance of the it.each-table-per-bucket class. HOLD maintained. |
  | wave-57 obs-1 | Interactive nav/rail button shipped with no onClick; gap invisible to test suite; surfaced as UX papercut | NOT CONFIRMED. Wave-60 makes no onClick changes; the ServerRail.tsx edits are a backgroundColor value swap (line 111), not a handler addition or removal. Not a confirming instance. HOLD maintained. |
  | wave-56 obs-1 | P-0 three-reviewer convergence caught seed conflating scale-independent correctness cap with premature pagination UX; YAGNI split at P-0 | NOT CONFIRMED. Wave-60 P-0 is a clean PROCEED on a minimal cosmetic tail-drainage item; problem-framer matched antipattern #1 (symptom-vs-cause), not #4 (premature abstraction). Not a confirming instance. HOLD maintained. |
  | wave-56 obs-2 | ceo-reviewer explicitly retracted its own wave-55 N-2 seed nomination | NOT CONFIRMED. Wave-60 ceo-reviewer is a HOLD-SCOPE PROCEED with a milestone-stockout escalation; no prior-wave call to retract. Not a confirming instance. HOLD maintained. |
  | wave-55 obs-1 | Seed positive-only assertion redundant with existing control; load-bearing cell was the untested negative | NOT CONFIRMED. Wave-60 is not a test-coverage wave; no assertion-coverage value claim made or falsified at P-0. Not a confirming instance. HOLD maintained. |
  | wave-54 obs-2 | Seed premise about entire WS info-disclosure vulnerability class being open was false; P-0 collapsed sweep to verify-only | NOT CONFIRMED. Wave-60 has no security sweep; seed premise was accurate (three off-token surfaces, verified by code inspection). Not a confirming instance. HOLD maintained. |
  | wave-52 obs-3 (a) | VERIFY: independently re-probe load-bearing claims at gate before accepting zero-finding verdict | CONFIRMED BY APPLICATION. Karen independently fetched the live bundle and verified each claim against deployed source and the content-hash-matched CSS bundle (V-1-karen.md: verified via HTTP probe + byte-identical diff, not dist/ mtime alone). Jenny independently ran live getComputedStyle probes on prod for all 3 surfaces. Head-verifier independently confirmed convergence of both live-verification methods. Behavior continues correctly; still 1st-instance HOLD for VERIFY-PRINCIPLES rule 5 candidate. |
  | wave-52 obs-3 (b) | Gate agent direct-writes to principles files | NOT CONFIRMED. No gate agent wrote directly to a principles file this wave. Remains 1st-instance HOLD. |
  | wave-50 obs-B | Parallel T-5 testers block on shared MCP Chrome profile | NOT CONFIRMED. T-5 verification was handled by jenny via live getComputedStyle probe; no parallel Playwright swarm. Remains multi-wave HOLD. |
  | wave-50 obs-C | P-4/plan review enumerate compute-on-read walk paths for new per-row parameter | NOT CONFIRMED. Wave-60 has no compute-on-read walk. Remains multi-wave HOLD. |
  | wave-49 obs-B | Socket.IO namespace mismatch invisible to mocked-both-sides unit suite; T-4.md rule 1 | NOT CONFIRMED. Wave-60 has no Socket.IO changes. Remains multi-wave HOLD. |
  | wave-49 obs-C | Responsive breakpoint not validated against D-3 adopted design at B-block | NOT CONFIRMED. D-block skipped (design_gap_flag false; token-hygiene on existing surfaces). Remains multi-wave HOLD. |
  | wave-44 obs-1 | Responsive/layout fix introduces overlay without WCAG dialog contract | NOT CONFIRMED. No layout fix or overlay. Remains multi-wave HOLD. |
  | wave-45 obs-1 | Browser resolution in committed playwright config | NOT CONFIRMED. No Playwright config change. Remains multi-wave HOLD. |
  | wave-45 obs-2 | playwright test --list false-green for browser-resolution change | NOT CONFIRMED. No Playwright config change. Remains multi-wave HOLD. |
  | wave-47 obs-C | Display-identifier vs opaque-id mismatch | NOT CONFIRMED. No component rendering user identities. Remains multi-wave HOLD. |
  | wave-41 obs-1 | V-3 redeploy false-green | NOT CONFIRMED. V-3 Phase 2 not triggered (fast-fix queue empty). Remains multi-wave HOLD. |
  | wave-41 obs-2 | Symbol-grep false-positive | NOT CONFIRMED. V-1 karen used live HTTP probe + content-hash filename correlation. Remains multi-wave HOLD. |
  | wave-41 obs-3 | Parallel-path enforcement gap | NOT CONFIRMED. No new parallel sibling method. Remains multi-wave HOLD. |
  | wave-40 obs-1 | T-8 fix mechanism contradicts architectural decision | NOT CONFIRMED. No T-8 security surface; token-hygiene only. Remains multi-wave HOLD. |
  | wave-40 obs-4 | Global 22P02 filter / text-keyed route params | NOT CONFIRMED. No text-keyed route params. Remains multi-wave HOLD. |

  Severity: informational (status checks only; wave-52 obs-3(a) continues confirmed by application).
  Candidate principles file: none.
  Promotion flag: NO.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Hardcoded palette hex in 45 web-shell .tsx files where consumable CSS tokens exist; shade drift is the documented cost (wave-46 T-6 F10 origin; wave-60 fix confirms root cause) | strong | FIRST INSTANCE as L-2 obs; wave-46 T-6 F10 is prior documented operational consequence; no prior L-2 in any archived wave | PRODUCT-PRINCIPLES (Antipatterns section, rule A1 candidate) | STRONG HOLD — meets all candidacy criteria; karen to assess whether wave-46 T-6 + wave-60 constitutes 2-data-point confirmation or a 2nd explicit L-2 obs is required |
| obs-2 | wave-58 obs-A (soft-check-hardening class) — NO-CONFIRM; 1st instance only (wave-58) | informational | NO-CONFIRM wave-60; still 1st instance | VERIFY-PRINCIPLES rule 5 candidate shape | HOLD |
| obs-3 | wave-58 obs-B (prod-baseURL e2e = post-deploy verification class) — NO-CONFIRM; 1st instance only (wave-58) | informational | NO-CONFIRM wave-60; still 1st instance | CI-PRINCIPLES rule 11 candidate shape | HOLD |
| obs-4 | Sub-floor token-hygiene wave resolved by PRODUCT rule 5 override-ship; 11th instance; rule functioning correctly | informational | 11th instance (waves 50-60); PRODUCT rule 5 promoted wave-52 | none | NO ACTION — rule 5 in force |
| obs-5 | P-4 gate caught 50%→40% opacity spec defect before B-block; resolved at cheapest correction point; gate functioning | informational | positive signal; no gap; no confirming class from prior waves | none | NO PROMOTION — clean-gate health-check |
| obs-6 | Status check on prior held observations | informational | status checks | none | STATUS CHECK ONLY |

**Observations emitted: 6 (obs-1 through obs-6)**
**Severities: 1 strong (obs-1), 4 informational (obs-2 through obs-5), 1 informational/status-check (obs-6)**
**Promotion-eligible this wave: obs-1 is the sole strong candidate; its promotion status depends on karen's ruling on whether wave-46 T-6 + wave-60 satisfies the 2-wave bar**
**Nominations for karen vetting: obs-1 (strong antipattern candidate; PRODUCT-PRINCIPLES § Antipatterns, rule A1 candidate)**

---

## Explicit recurrence verdicts on the two named wave-58 HELD candidates

### obs-A: "hardening a pass-regardless soft-check into a gating assertion surfaces a masked
production defect" (VERIFY-PRINCIPLES rule 5 candidate)

**Wave-60 verdict: NO-CONFIRM.**

Wave-60's diff is exactly 2 source files and 3 backgroundColor value changes (V-1-karen.md Claim 4:
"git show 7a1af6f --stat → exactly apps/web/src/shell/ServerRail.tsx (2 ±) + apps/web/src/shell/
StartDmPicker.tsx (6 ±), 2 files changed, 5 insertions(+), 3 deletions(-)"). No test file was
modified. No existing assertion was converted from soft to hard. CI 7/7 green on first attempt. No
production defect was found. The structural prerequisite for obs-A to fire (an existing
pass-regardless check being converted to a hard assertion) is absent from this wave in every
respect. Not a confirming or falsifying instance.

HOLD maintained. Pre-shaped VERIFY-PRINCIPLES rule 5 candidate unchanged from wave-58.

---

### obs-B: "a prod-baseURL e2e is post-deploy verification, not a pre-merge gate"
(CI-PRINCIPLES rule 11 candidate)

**Wave-60 verdict: NO-CONFIRM.**

Wave-60's deployed behavioral state is identical before and after the merge for any assertion a
production-baseURL e2e could make about runtime behavior — the changes are 3 backgroundColor value
swaps, not behavior changes detectable by a Playwright user-flow assertion. The e2e ran green in
7/7 CI (the behavioral state was unchanged before and after deploy). No situation arose where the
production-baseURL classification of the e2e suite as non-required was relevant. The wave does not
exercise the obs-B class in any direction.

HOLD maintained. Pre-shaped CI-PRINCIPLES rule 11 candidate unchanged from wave-58.

---

## Antipattern candidate assessment (the strong obs-1 candidate)

**Question:** Is "hardcoded palette hex in a component where a consumable CSS token exists"
generalizable, falsifiable, cited, recurring, and costly-if-ignored to a degree that warrants
a STRONG classification and a promotion candidacy for PRODUCT-PRINCIPLES?

**Answer: YES on all five criteria — STRONG, PROMOTE-WORTHY pending karen's recurrence ruling.**

1. GENERALIZABLE: the pattern is not specific to any one component or surface. 45 `.tsx` files
   across the entire web shell — shell, pages, and components subdirectories — share the same
   authoring pattern of inline `style={{ backgroundColor: '#...' }}` rather than
   `style={{ backgroundColor: 'var(--color-*)' }}`. The fix demonstrated by wave-60 is replicable
   at any of the 43 remaining files without any architectural change.

2. FALSIFIABLE: a one-command grep (`rg '#(0a0a0b|121214|1c1c1f|27272a|10b981)' apps/web/src
   --glob '**/*.tsx' -l`) gives the exact file count at any point. L-2 distill ran this and got
   45. After the carry-forward token-migration wave, the same grep should approach 0 for those
   specific palette values. Any new offender added after a rule is in force would be immediately
   detectable.

3. CITED: P-0-problem-framer.md documents the finding with exact file and line references; wave-46
   T-6-layout.md documents the operational consequence (F10 shade-drift finding); V-1-jenny.md
   confirms 43 remaining deferred files post-wave-60.

4. RECURRING: wave-46 T-6 F10 is the prior documented instance of the operational cost; wave-60
   is the first wave to execute a fix and confirm the architectural root cause. The recurrence
   mechanism (any surface authored with a literal hex can drift independently of the DESIGN-SYSTEM
   assignment) is structural and will produce more F10-class findings unless the token-consumption
   norm is encoded.

5. COSTLY-IF-IGNORED: each off-token surface requires a dedicated fix wave. Wave-60 was a
   ~1/10-value tail-drainage item by the ceo-reviewer's own assessment
   (P-0-frame.md: "~1/10 value; contract-correct tail-drainage"). At the current rate, each of
   the 43 remaining offending files could produce a wave of similar value unless a bulk migration
   is prompted by a promoted norm that makes inline-hex-over-a-consumable-token a reviewable
   antipattern at B-6.

**Recurrence ruling for karen:** the wave-46 T-6 F10 finding is a prior-wave documented occurrence
of the downstream operational consequence (shade drift) of the same root cause that wave-60
confirms architecturally. Whether this constitutes "2+ waves" for promotion purposes is a judgment
call: T-6 is a test-layer observation, not an L-2 ledger entry, but it documents the same
pattern's cost. If karen accepts T-6 F10 + wave-60 as a 2-data-point confirmation, obs-1 is
immediately promotion-eligible. If karen requires a second explicit L-2 observation (e.g., the
future token-migration wave's L-2 entry), the carry-forward wave is expected to be named as the
confirming instance. Either way, obs-1 should be escalated to karen at L-2 Distill with a request
for ruling on the recurrence bar.
