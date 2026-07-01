# Wave 29 — L-2 Distill Observations

Synthesized from wave-29 artifacts (single-spec presence/members code-debt: displayName
`??`→`||` guard at 2 sites + DELETE unused ServerMembersResponseSchema; PR#42 fd03d27;
V APPROVED with P-4 REWORK on attempt 1).
Prior archives consulted: process/waves/_archive/wave-{25,26,27,28}/blocks/L/observations.md.
Principles files read: BUILD-PRINCIPLES (8 rules, rule 8 promoted w28), CI-PRINCIPLES (6 rules,
rule 6 promoted w27), PRODUCT-PRINCIPLES (2 rules, rule 2 promoted w27), VERIFY-PRINCIPLES (1 rule).

---

```yaml
observations:

  - id: obs-1
    summary: >
      When a plan describes an operator fix as "swap the middle ??" without locking a single
      expression form, a builder has two syntactically-distinct candidates: `A ?? B || C`
      (a JS/TS SyntaxError — mixing `??` with `||` without parens) and `A ?? (B||C)` (parses
      but fails the empty-string guard, violating AC1). The head-product P-4 gate caught this
      under-determination and issued a REWORK: the plan must name the ONLY legal AND AC-
      satisfying form with both rejected alternatives explicitly excluded. After REWORK, P-3
      carried the full `||`-chain form `displayName || localpart || userId` at both sites, with
      commentary excluding the two wrong candidates. B-6 and V-block verified the exact locked
      form shipped. The generalizable class: when an operator fix has more than one plausible
      builder interpretation and at least one interpretation is either a syntax error or an AC
      failure, the plan must lock the single correct form and exclude the wrong candidates by
      name — not use an informal "swap X with Y" shorthand.
    source:
      - process/waves/wave-29/blocks/P/gate-verdict.md
        # Attempt 1 REWORK defect: "an under-determined Part-1 operator fix that let the
        #   builder silently violate AC1 ... REWORK: P-3 steps 4+5 must name the single
        #   form. Both rejected forms must be explicitly excluded."
        # Attempt 2 RESOLVED: "steps 4+5 now name the single form... `A ?? B || C` —
        #   mixing `??` with `||` without parens is a JS/TS SyntaxError. Excluded.
        #   `A ?? (B || C)` — parses, but a stored-empty display_name === '' is falsy-
        #   but-defined, so ?? keeps it → renders ''. Excluded."
      - process/waves/wave-29/stages/P-3-plan.md
        # Step 4: "LOCKED form (P-4 REWORK) — replace BOTH ?? with ||: ... (NOT 'swap
        #   the middle ??' — A ?? B || C is a JS/TS SyntaxError; and A ?? (B || C) fails
        #   AC1's stored-empty-display_name guard. The full || chain is the only legal
        #   + AC1-satisfying form.)"
      - process/waves/wave-29/blocks/B/gate-verdict.md
        # "Both sites use the full ||-chain... Neither is the syntactically-illegal
        #   A ?? B || C ... nor the AC1-failing A ?? (B||C) variant."
    severity: warning
    candidate_principles_file: command-center/principles/PRODUCT-PRINCIPLES.md
    recurrence: >
      1ST INSTANCE of the "operator fix plan must lock a single expression form and exclude
      wrong candidates when multiple interpretations exist" class. HOLD.

      The class is generalizable: applies at any P-3 where the operator being changed has
      a sibling or confusion-prone alternative (??/||, ===/==, &/&&, bitwise vs logical)
      and at least one plausible "swap X for Y" reading would be a syntax error or an AC
      failure. The plan's verbal shorthand was the root; the locked-form correction is the
      pattern. A builder reading "swap the middle ??" in isolation has no basis to prefer
      the full `||`-chain over the `?? (…||…)` alternative without the explicitly excluded
      forms.

      Near-dup check against PRODUCT rule 1 ("Verify every seed claim at P-0"): rule 1
      addresses P-0 code verification of the seed's premises. This candidate targets P-3
      plan precision for operator fixes. Different stage, different axis. No near-dup.

      Near-dup check against PRODUCT rule 2 ("Verify the seed's named entity is the real
      cost source or output boundary"): rule 2 targets P-0 target identification accuracy.
      This candidate targets P-3 plan instruction precision for operator substitutions.
      No near-dup.

      PRODUCT-PRINCIPLES has 2 rules; slot 3 open. HOLD. Promote to PRODUCT-PRINCIPLES
      rule 3 on second confirming wave where a plan-level operator-fix instruction with
      multiple plausible interpretations causes a gate REWORK or a shipped bug due to the
      builder choosing the wrong form.
    promotion_gates:
      generalizable: true
        # Applies at P-3 for any wave touching a logical or bitwise operator substitution
        # where the operator family has a related-but-distinct alternative (??/||,
        # &/&&, ===/==). "Swap X" in natural-language plan prose is ambiguous when (a) a
        # partial swap leaves a mixed-operator expression that is a syntax error or (b) a
        # semantically similar swap passes a type-check but misses an edge-case AC. The
        # fix is deterministic: name the single valid complete form, exclude wrong forms.
      falsifiable: true
        # Checkable at P-3 for any operator-fix step: does the plan state the complete
        # expression form after the fix (not just the operator being changed), and does it
        # name and exclude any wrong-candidate forms that a builder might plausibly write?
        # A plan that says "swap ?? with ||" without the full expression and excluded
        # alternatives fails this rule when more than one valid-looking substitution exists.
      cited: true
        # P/gate-verdict.md attempt-1 REWORK (defect: ambiguous "swap the middle ??" admits
        #   two wrong forms; head-product named both and required exclusion);
        # P-3-plan.md step 4 (locked form + explicit exclusion of A??B||C + A??(B||C));
        # B/gate-verdict.md (confirmed: exact locked form shipped, no wrong variant).
    candidate_rule_shape: >
      3. When a plan fixes an operator, name the complete expression form after the fix
         and exclude any wrong candidate forms that parse or type-check but fail an AC.
         Why: A verbal shorthand like "swap X for Y" is ambiguous when a plausible
         alternative is a syntax error or misses an edge-case.
      Rule line = 118 chars; why line = 91 chars. No forbidden tokens.
    promotion_status: HOLD. First instance. Promote to PRODUCT-PRINCIPLES rule 3 on second
      confirming wave where a plan-level operator shorthand causes a gate REWORK or shipped AC
      failure.

  - id: obs-2
    summary: >
      Head-verifier at V-3 independently re-verified the two spec-scoped fix sites and
      discovered a third `??` (presence.gateway.ts:326) that neither karen nor jenny named.
      The head-verifier traced it and correctly classified it as a safe downstream consumer
      (socket.data.displayName is only ever written at the already-fixed :125 or as a userId
      fallback — never `''`), confirming the 2-site spec scope was correct. No false-negative
      existed; the finding was traceable and closeable. What this instance demonstrates is the
      value of the V-3 head-verifier performing an independent adversarial scan of the
      surrounding code context beyond the named spec sites — not accepting the reviewers'
      scope demarcation at face value. The reviewers approved the named sites correctly; the
      V-3 re-scan is what provided confidence that no additional site was missed. The
      generalizable class: V-3 head-verifier re-verification adds genuine signal beyond
      karen/jenny by probing the surrounding code for the same fix pattern rather than only
      re-checking the named lines.
    source:
      - process/waves/wave-29/stages/V-3-fast-fix.md
        # "Caught a reviewer-missed 3rd ?? at presence.gateway.ts:326 → traced as a SAFE
        #   downstream consumer (socket.data.displayName is never '' there, only possibly
        #   undefined where ??/|| are equivalent) — correct 2-site scope, no finding."
      - process/waves/wave-29/blocks/V/gate-verdict.md
        # "My probe surfaced a third ?? at presence.gateway.ts:326 that neither reviewer
        #   named; I traced it and confirmed it is a correct downstream consumer of the
        #   already-guarded value ... It is a spec-scope boundary, not a missed fix site."
    severity: informational
    candidate_principles_file: command-center/principles/VERIFY-PRINCIPLES.md
    recurrence: >
      1ST INSTANCE of the "V-3 head-verifier contextual scan beyond named sites catches
      a reviewer-missed related occurrence" class. HOLD.

      The class is generalizable: applies at any V-3 where the wave's fix is a local
      pattern (operator substitution, guard insertion, config flag) that could plausibly
      appear at more sites than the spec names. The head-verifier's independent re-scan
      of the codebase for the same pattern — rather than only re-reading the named lines
      — provides a distinct verification signal from the reviewers' claim-by-claim check.

      Near-dup check against VERIFY rule 1 ("Verify seeding ACs by inspecting create-path
      source, not runtime behavior"): rule 1 targets AC verification methodology at V-1.
      This candidate targets V-3's scope of independent re-verification: probing beyond
      named fix sites to locate same-pattern occurrences. Different stage, different axis.
      No near-dup.

      Near-dup check against wave-28 obs-4 (HOLD, "spec-GAP vs spec-drift: classify
      before acting"): obs-4 targets V-2 triage classification of divergence findings.
      This candidate targets V-3 re-verification scope breadth. No near-dup.

      VERIFY-PRINCIPLES has 1 rule; slot 2 open. HOLD. Promote to VERIFY-PRINCIPLES rule 2
      on second confirming wave where a V-3 head-verifier scan beyond the named sites finds
      a related occurrence (either a real missed fix or a safe consumer requiring a
      documented scope-boundary call).
    promotion_gates:
      generalizable: true
        # Applies at V-3 for any wave where the fix is a repeated pattern (operator
        # substitution, null guard, flag rename, import path change) that could plausibly
        # appear at unlisted callsites. "Scan for the same pattern beyond the spec scope"
        # is falsifiable: grep for the old form in the relevant files/dirs and trace each
        # match. A V-3 that only re-reads the named spec lines and calls APPROVED without
        # checking for same-pattern neighbors fails this rule on pattern-fix waves.
      falsifiable: true
        # Checkable at V-3 for any pattern-fix wave: did the head-verifier run a search
        # for the old form (old operator, old API call, old flag) beyond the named spec
        # sites and trace each result to either "correctly scoped out" or "missed fix
        # site"? A V-3 approval that cites only the named lines without a surrounding-
        # context scan fails this rule when the fix is a repeatable local pattern.
      cited: true
        # V-3-fast-fix.md (head-verifier found third ?? at :326 via independent re-scan;
        #   traced as safe — socket.data.displayName never '' at that site; 2-site spec
        #   scope confirmed correct);
        # V/gate-verdict.md (same: "probe surfaced a third ?? ... confirmed a downstream
        #   consumer ... spec-scope boundary, not a missed fix site").
    candidate_rule_shape: >
      2. At V-3, scan for the same fix pattern beyond the spec-named sites and trace each
         result to "correctly scoped out" or "missed site."
         Why: A reviewer approves only named lines; an independent pattern scan catches
         neighbors the spec boundary silently excluded.
      Rule line = 117 chars; why line = 90 chars. No forbidden tokens.
    promotion_status: HOLD. First instance. Promote to VERIFY-PRINCIPLES rule 2 on second
      confirming wave where a V-3 pattern scan beyond named sites finds a related occurrence
      (safe or real).

  - id: obs-3
    summary: >
      The append-only product-decisions log had a gap: wave-28's P-1 under-floor override-
      ship was never logged at the decision point, leaving the entry missing until jenny
      flagged it at P-4 and it was backfilled at L-1. Karen confirmed the gap at V-1 and
      head-verifier routed it to L-1 rather than blocking V. The gap mattered: the
      product-decisions log is CLAUDE.md-defined as the BOARD/founder-proxy signal amplifier
      ("staleness here weakens BOARD signal") and the precedent chain for floor-merge
      override-ships runs through it. An entry logged two waves late reduces the log's
      reliability as a real-time chain-of-record for sequential decisions. The generalizable
      class: every P-1 BOARD-vote or PRECEDENT-APPLICATION override-ship decision must be
      logged to product-decisions.md at the P-1 stage itself, not deferred to a later
      reconciliation. The decision-point discipline prevents the log from drifting out of
      sync with the actual wave sequence.
    source:
      - process/waves/wave-29/blocks/P/gate-verdict.md
        # Phase 2 jenny: "wave-28 override-ship was never logged to product-decisions.md
        #   (only the wave-28 RBAC decision) — precedent still stands on w24/25/26/27;
        #   reconcile the log at L-1."
      - process/waves/wave-29/stages/V-1-karen.md
        # Finding 7: "product-decisions.md logs consecutive floor-merge override-ship
        #   entries for w23 (:300), w24 (:306), w25 (:312), w26 (:318), w27 (:325) —
        #   then jumps to a wave-28 entry (:331) that is an RBAC invite-rotate drift
        #   decision, NOT a P-1 floor-merge / override-ship record... The gap jenny
        #   flagged at P-4 is real and still open."
      - process/waves/wave-29/blocks/V/gate-verdict.md
        # "F29-K7 (wave-28 override-ship log gap): product-decisions.md is missing the
        #   wave-28 under-floor override-ship entry ... Route to L-1 to append the
        #   wave-28 + wave-29 under-floor override-ship entries."
    severity: warning
    candidate_principles_file: command-center/principles/PRODUCT-PRINCIPLES.md
    recurrence: >
      1ST INSTANCE of the "override-ship decision not logged to product-decisions.md at
      the P-1 decision point" class surfaced in L-2 history. HOLD.

      Near-dup check against PRODUCT rule 1 (P-0 code verification): different stage and
      axis (P-0 premise checks vs P-1 decision logging). No near-dup.

      Near-dup check against PRODUCT rule 2 (P-0 entity verification): different stage.
      No near-dup.

      Note on CLAUDE.md always-on rule: the trigger table row "After any material Tier 3 /
      refresh / scope-change decision resolves... → Append entry to product-decisions.md"
      is already a standing process rule. This obs identifies the gap between the existing
      trigger (broadly worded for Tier-3 product decisions) and the concrete class of
      decisions that needs inclusion: P-1 BOARD-vote AND PRECEDENT-APPLICATION override-
      ship entries, which are operational decisions, not always Tier-3 product decisions,
      and therefore may be omitted if the writer interprets "material Tier 3" narrowly.
      The candidate rule closes that interpretation gap by naming the class explicitly.

      Is this wave-29 a SECOND instance given wave-28 was the gap wave? The gap was in
      wave-28's process (the entry was never written at wave-28 P-1). Wave-29 is the FIRST
      wave to surface and document the gap in an L-2 observation. The corrective was the
      wave-28 entry's backfill, not a recurrence of the failure. Treat as 1ST INSTANCE.
      HOLD. Promote to PRODUCT-PRINCIPLES rule 3 (or the next available slot, noting that
      obs-1 above is also a slot-3 candidate) on second confirming wave where a P-1
      override-ship is missing from the log when a downstream gate checks it.

      Per-file promotion cap note: obs-1 and obs-3 are both PRODUCT-PRINCIPLES candidates
      this wave. Both are 1st-instance HOLDs. If both confirm on the same future wave,
      obs-1 (plan precision, gate REWORK measured cost) takes precedence over obs-3 for
      the per-wave slot if they cannot be distinguished by severity at that point.
    promotion_gates:
      generalizable: true
        # Applies at every wave P-1 where a BOARD vote or PRECEDENT-APPLICATION override-
        # ship is the disposition: the entry MUST be appended to product-decisions.md
        # before the wave exits P-1. Applies regardless of wave type (single-spec,
        # multi-spec, test-infra) and regardless of whether the decision is "fresh BOARD"
        # or "standing precedent applied." The log is the chain-of-record; a gap weakens
        # every downstream gate that reads the log for precedent context.
      falsifiable: true
        # Checkable at any P-4 or V-1 that looks at the precedent chain: does
        # product-decisions.md have an entry for EACH wave's P-1 floor-merge / override-
        # ship decision, in wave-number order, with no gap? A gap (a wave number in the
        # "8th consecutive" chain that is absent from the log) fails this rule.
      cited: true
        # P/gate-verdict.md Phase 2 jenny (gap identified; backfill routed to L-1);
        # V-1-karen.md finding 7 (gap confirmed: entries present for w23-w27, then
        #   wave-28 RBAC decision, no wave-28 floor-merge entry; grep for "wave-28.*floor"
        #   returns no match);
        # V/gate-verdict.md (F29-K7 carry to L-1; non-blocking but real).
    candidate_rule_shape: >
      3. Log every P-1 override-ship decision to product-decisions.md at the P-1 stage;
         do not defer to a later reconciliation.
         Why: A missing entry breaks the precedent chain that BOARD votes and reviewer
         gates depend on for sequential decision context.
      Rule line = 115 chars; why line = 95 chars. No forbidden tokens.
    promotion_status: HOLD. First instance. Promote to PRODUCT-PRINCIPLES rule 3 on second
      confirming wave where a P-1 override-ship is missing from the log when a downstream
      gate checks the precedent chain.
```

---

## Prior held observations — second-instance status

| origin | obs | class | wave-29 status |
|--------|-----|-------|----------------|
| wave-28 | obs-1 | Entropy scanner false-positives on model-authored transcript directories | NOT CONFIRMED this wave. No gitleaks or entropy-scanner interaction at C-1 (clean CI). Remains 1-wave HOLD (CI-PRINCIPLES rule 7 candidate). |
| wave-28 | obs-2 | CI-config fix pushed unverified reproduces identical failure | NOT CONFIRMED this wave. No CI-config fix cycle occurred. Remains 1-wave HOLD (CI-PRINCIPLES rule 7/8 candidate). |
| wave-28 | obs-4 | V-block spec-GAP vs spec-drift: classify before acting | NOT CONFIRMED this wave. No spec-divergence finding at V-2 (0 blocking findings; sole open item F29-K7 was a log-staleness docs item, not a spec-code divergence). Remains 1-wave HOLD (VERIFY-PRINCIPLES rule 2 candidate). NOTE: wave-29 obs-2 is also a VERIFY-PRINCIPLES rule 2 candidate (different class). If both confirm on the same future wave, one holds for the following wave per-file cap. |
| wave-27 | obs-1 | EXPLAIN test on small-seeded table needs enable_seqscan=off | NOT CONFIRMED this wave. No integration EXPLAIN test authored. Remains HOLD (T-4 rule 1 candidate). |
| wave-27 | obs-3 | Perf wave: spec structural proofs sufficient for T-7, no load test | NOT CONFIRMED this wave. No performance wave. Remains HOLD (T-7 rule 1 candidate). |
| wave-26 | obs-1 | Unit fixture seeds store with value real producer excludes; T-5 live E2E caught it | NOT CONFIRMED this wave. No unit store fixture authored; no T-5 run (backend-only wave). Remains HOLD (T-2 rule 2 candidate). |
| wave-26 | obs-3 | Hard-coded date fixture without clock-mock rots as wall-time advances | NOT CONFIRMED this wave. No date-dependent test authored. Remains HOLD (T-2 candidate next slot after obs-1). |

---

## Signals evaluated and dropped

**Signal 3 — BUILD rule 8 honored this wave (no B-4 remediation):**
Both specialists ran the formatter before commit; B-4 reported lint 0-error with no fixup
commit needed. This is a REINFORCEMENT of BUILD rule 8 (promoted wave-28). The rule
working on first application is the expected result, not a new observation. The prompt
correctly pre-classified this as drop-worthy. DROPPED.

**Signal 5 — `railway` binary absent; resolved via `npx @railway/cli@latest`:**
This is an operational workaround, not a generalizable principle. It is project-specific
(Railway CLI PATH issue on a particular host), tool-version-specific, and not falsifiable
as a principle a future reviewer can check against a different codebase or scenario. A
memory update to MEMORY.md is the correct home for operational install notes of this
kind, not PRINCIPLES. DROPPED as too narrow.

**Signal 6 — 8th consecutive under-floor M5-debt override-ship + ceo-reviewer RECONSIDER
(pivot to M6, non-executable without founder park):**
The structural failure mode (a milestone whose remaining buildable scope is exhausted by a
single founder-clearable credential) is correctly documented in the escalation chain and
the founder digest. The process has worked: the escalation is with the founder; the
PRECEDENT-APPLICATION mechanism correctly prevented infinite BOARD re-litigations; the
ceo-reviewer's RECONSIDER surfaced a concrete credential-free alternative.

The candidate principle would be: "When a milestone's remaining scope is entirely blocked
on a founder credential for N waves, escalate the park decision as a HARD gate rather
than draining adjacent debt." However, this is NOT promotable now for three reasons:
(1) the situation is founder-pending and may resolve on the next wave — the process
has not yet failed, it is waiting on an external decision; (2) the "hard gate" mechanism
would require the DISPATCHER or P-1 stage logic to change, not a PRODUCT-PRINCIPLES
rule that a reviewer can check; (3) the observation is not falsifiable as stated — what
constitutes "N waves" is undefined and the distinction between "hard gate" and the current
escalation (carried in every digest, sharpened with a concrete alternative at wave-28/29)
is unclear. DROPPED for this wave. If the founder digest goes unanswered for 2+ more
waves with the escalation active, that would be a clearer second instance.

---

## Summary table

| id    | title (short)                                                                      | severity      | recurrence   | candidate file              | disposition                                                                           |
|-------|------------------------------------------------------------------------------------|---------------|--------------|-----------------------------|----------------------------------------------------------------------------------------|
| obs-1 | Plan-level operator fix must lock a single expression form and exclude wrong candidates | warning   | 1st instance | PRODUCT-PRINCIPLES          | HOLD — rule 3 candidate; promote on 2nd confirming wave (plan shorthand causes REWORK or AC failure) |
| obs-2 | V-3 head-verifier pattern scan beyond named sites caught a reviewer-missed 3rd `??` | informational | 1st instance | VERIFY-PRINCIPLES           | HOLD — rule 2 candidate; promote on 2nd confirming wave (same-pattern scan finds related occurrence) |
| obs-3 | Override-ship log gap: wave-28 P-1 entry missing from product-decisions.md until backfill | warning   | 1st instance | PRODUCT-PRINCIPLES          | HOLD — rule 3 candidate (lower priority than obs-1 for same slot); promote on 2nd confirming wave |

**Observations emitted: 3**
**Severities: 2 warning, 1 informational**
**Candidate files: PRODUCT-PRINCIPLES (obs-1, obs-3), VERIFY-PRINCIPLES (obs-2)**
**Dropped: Signal 3 (BUILD rule 8 reinforcement), Signal 5 (too narrow/operational), Signal 6 (founder-pending, not yet a process failure)**

---

## Promotion candidate flags for karen

**No observations are promotable this wave.** All three are 1st-instance HOLDs.

**obs-1** (PRODUCT-PRINCIPLES rule 3 candidate) is the highest-value HOLD: the P-4 REWORK
is a measured gate-failure event with a clear root cause (plan verbal shorthand admitting
a SyntaxError candidate), a concrete fix pattern (locked form + excluded alternatives),
and a falsifiable check. Promote on second confirming wave where a plan operator-fix
instruction causes a gate REWORK or shipped AC failure.

**obs-3** (PRODUCT-PRINCIPLES rule 3 candidate, lower priority) is genuine but addresses
a process discipline gap that exists at the intersection of the CLAUDE.md trigger rule
and P-1 execution. The gap is real (a wave of override-ship entries had to be backfilled
two waves late), but requires a second instance to promote. If obs-1 and obs-3 both
confirm on the same wave, obs-1 takes the per-wave slot.

**obs-2** (VERIFY-PRINCIPLES rule 2 candidate) is informational because the outcome this
wave was a correct "safe consumer" trace — no missed fix site. The value is in the
scan discipline, not a found defect. Note that wave-28 obs-4 (spec-GAP vs spec-drift
classification) is ALSO a VERIFY-PRINCIPLES rule 2 candidate at 1st-instance HOLD. If
both obs-2 (this wave) and wave-28 obs-4 confirm on the same future wave, the one with
higher severity takes the per-file slot.
