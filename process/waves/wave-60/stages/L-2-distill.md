# L-2 — Distill (wave-60)

Head-learn gate for the L-block Distill stage. Wave-60 shipped seed 5bcbd27f (DM off-token surface
substitutions — 3 DM surfaces converted to canonical design-token consumption via `var()`).

## Action 1/2 — Mark claimed tasks done + verify

Single claimed task, 0 siblings: `5bcbd27f-16f3-4928-a535-c4104da34a19`. Already `done` at L-block
entry (B-0 claimed it at wave start; V-block closed clean). Verified via DB:

```
5bcbd27f-16f3-4928-a535-c4104da34a19 | done
```

No re-run needed. No skipped/cancelled rows.

## Action 3 — knowledge-synthesizer

Spawned (`subagent_type: knowledge-synthesizer`, background). Inputs: full wave-60 deliverable set,
prior 5 waves' L-observations (_archive/wave-{55..59}), and recent principles files (PRODUCT 5 /
BUILD 10 / CI 10 / VERIFY 4 / DESIGN 1). Output: `process/waves/wave-60/blocks/L/observations.md`.

**6 observations emitted** (1 strong, 5 informational):
- **obs-1** (strong) — hardcoded palette hex in 45 web-shell `.tsx` files where consumable CSS
  tokens exist; wave-46 T-6 F10 origin; wave-60 fix confirms architectural root cause. STRONG
  promotion candidate → sent to karen (see Action 5). **NOT PROMOTED — see decision below.**
- **obs-2** (info) — wave-58 obs-A (soft-check-hardening) NO-CONFIRM this wave; HOLD maintained.
- **obs-3** (info) — wave-58 obs-B (prod-baseURL e2e) NO-CONFIRM this wave; HOLD maintained.
- **obs-4** (info) — sub-floor override via PRODUCT rule 5, 11th instance; rule functioning; no action.
- **obs-5** (info) — P-4 gate caught a 50%→40% opacity spec defect before B-block; resolved at the
  cheapest correction point; clean-gate health-check; no promotion.
- **obs-6** (info) — status-check table on all prior HOLDs; wave-52 obs-3(a) confirmed-by-application
  again (karen + jenny both used live-probe verification independently).

## Action 4 — Filter to promotion candidates

One candidate cleared the generalizable / falsifiable / cited screen: **obs-1** (the hardcoded-hex
antipattern). obs-2/obs-3 are 1st-instance HOLDs (no confirming wave — wave-60 is orthogonal to
both classes). obs-4/obs-5/obs-6 are informational (rule-already-promoted / positive-signal /
status-check). Sole nomination to karen: obs-1, target PRODUCT-PRINCIPLES `## Antipatterns`.

## Action 5 — karen promotion vetting

Spawned `karen` (agentId a5e2c6d2e5da81d75) against the obs-1 candidate + PRODUCT-PRINCIPLES
"Contract for new rules" header + the live codebase. **Verdict: REJECT.** Four dimensions:

1. **Format — FAIL.** Rule line 136 chars (>120 limit); why line 119 chars (>100 limit). The
   proposed `A1.` prefix + a new `## Antipatterns` H2 for a single rule is NOT contract-legal:
   the contract mandates sequential integer numbering and permits a new H2 only when >=3 rules
   share a theme. No forbidden tokens present, but the hard char limits fail outright.
2. **Code-claim verification — claims TRUE.** Tokens exist and are consumable
   (globals.css:10-19: `--color-surface-950..600`, `--color-accent-emerald`). Pervasiveness real:
   `rg -l '#(0a0a0b|121214|1c1c1f|27272a|10b981)' apps/web/src --glob '**/*.tsx'` = **45 files**
   (the prior "39" figure was stale). NOT a hallucinated-claim reject. BUT: even the 3 surfaces
   this wave "converted" (ServerRail.tsx, StartDmPicker.tsx) still carry heavy raw hex at HEAD —
   only a handful of properties were switched to var()/color-mix. The wave did not clean its own
   touched files.
3. **Enforceability — FAIL (the disqualifier).** Promoted today, the binary rule is violated by 45
   existing files whose remediation is a DELIBERATE carry-forward migration (V-1-jenny: broad
   inline-hex→var() migration is an intentional future wave; only 3 of ~45 surfaces touched here).
   A binary antipattern the current tree fails 45x by design is a standing 45-line waiver the next
   B-6 must rubber-stamp — aspirational, not a gate. Code does NOT PASS cleanly against it today.
   A scope qualifier ("in any component you add or edit") is required for enforceability but will
   not fit the 120-char limit alongside the token examples.
4. **Duplication/contradiction — none.** Nearest PRODUCT rule (1) is P-0 seed-verification, not
   token discipline; nearest DESIGN rule (1) is contrast math. No near-dup, no contradiction. But
   karen flags the candidate's natural home is **DESIGN-PRINCIPLES** (design-system hygiene), not
   PRODUCT-PRINCIPLES (scope/problem-framing) — a categorization miss.

## Action 6 — Lint + promote

**Not reached.** karen REJECTed the sole candidate → 0 surviving candidates → deterministic linter
not run, no principles-file append. **PROMOTE-ZERO this wave.**

## HEAD-LEARN PROMOTION DECISION: HOLD obs-1 (promote zero)

The antipattern is REAL and its recurrence is genuine (45 grep-confirmed files + a materialized
prior cost at wave-46 T-6 F10) — so this is neither a recurrence-insufficiency nor a
hallucinated-claim rejection. It is held on **enforceability**: a permanent binary rule that the
codebase already breaks 45 times by deliberate deferral is not a gate, it is bloat wearing a gate's
uniform, and promoting it would erode the file's authority — the exact failure this role exists to
prevent. Format and wrong-target-file are secondary confirming faults.

**Disposition (recorded in observations.md under obs-1):**
- Keep obs-1 in the ledger; recurrence is already satisfied for a future promotion.
- Promote only AFTER the deferred inline-hex→var() migration wave lands and the tree passes clean.
- Re-file then against **DESIGN-PRINCIPLES** as a plain sequential rule, bounded to changed code.
- karen's compliant shape (presented, explicitly NOT endorsed for this wave):
  `In any component you add or edit, consume a var(--color-*) token instead of a raw palette hex.`
  / `Why: A hardcoded hex can drift from its design-system value; a token cannot.`

## Action 7 — Observation pipeline state

6 observations recorded in `process/waves/wave-60/blocks/L/observations.md`. No promotions.
Soft founder-signal: none new this wave (the M8-tail / M9-M12 founder-direction flag is carried by
L-1 + the strengthened checkpoint, not L-2). obs-1 is flagged for the future migration wave.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: 5bcbd27f-16f3-4928-a535-c4104da34a19 done (verified; single claim, 0 siblings)"
  - "observations: process/waves/wave-60/blocks/L/observations.md (6 observations)"
  - "principles promotions: 0 (karen REJECT on sole candidate; no file touched)"
tasks_marked_done: ["5bcbd27f-16f3-4928-a535-c4104da34a19"]
tasks_skipped_with_reason: []
observations_emitted: 6
promotion_candidates: 1
karen_verdicts:
  - {candidate_id: "obs-1", target_file: "command-center/principles/PRODUCT-PRINCIPLES.md", verdict: "REJECT",
     primary_reason: "enforceability (45 existing violations, deliberately deferred; not a binary gate today)",
     secondary_reasons: ["format: rule 136c>120, why 119c>100, A1./new-H2 not contract-legal", "wrong target file (belongs in DESIGN-PRINCIPLES)"]}
linter_runs: []                        # not reached — 0 surviving candidates after karen REJECT
candidates_dropped_by_linter: []
promotions_applied: []
note: >
  PROMOTE-ZERO. obs-1 (hardcoded-palette-hex antipattern) is real + recurring (45 files, wave-46 T-6
  origin) but HELD on enforceability: a binary rule the tree already breaks 45x by deliberate
  carry-forward is a standing waiver, not a gate. Held for the future inline-hex->var() migration
  wave, to be re-filed against DESIGN-PRINCIPLES bounded to changed code. wave-58 obs-A / obs-B both
  NO-CONFIRM this cosmetic wave; HOLD maintained. PRODUCT-PRINCIPLES stays at 5 rules; no principles
  file modified.
head_signoff:
  verdict: APPROVED
  stage: L-2-distill
  reviewers: {karen: "REJECT (obs-1 -> PRODUCT-PRINCIPLES)"}
  failed_checks: []
  rationale: >
    Every L-2 exit check ticks. Single claimed task confirmed done. knowledge-synthesizer ran on
    full input and emitted 6 blameless, artifact-cited observations. The one promotion candidate was
    vetted by karen against the contract AND the live codebase; karen REJECTed on enforceability
    (45 deliberately-deferred violations) with confirming format + wrong-file faults. As gate I HOLD
    it (promote zero) — the disciplined outcome: the rule is true but not yet an enforceable binary
    gate, and promoting it would bloat the canon. No candidate reached the linter; at-most-one-per-
    file cap trivially satisfied (zero promoted). No contradiction introduced; no promotion left
    pending. Clean handoff to N-block.
  next_action: PROCEED_TO_N_BLOCK
```
