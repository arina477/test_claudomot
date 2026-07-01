# Wave 23 — L-2 Distill

## Task done-marking (Action 1-2)
UPDATE 2 → both done, verified: 8aa67564 (manage_assignments permission) + edbdea8f (/me-permissions + CTA gate).

## Knowledge synthesis (Action 3-7)
knowledge-synthesizer (agentId a27436bda0ac0b4f6) → 5 observations at `process/waves/wave-23/blocks/L/observations.md`:
- **obs-1 (STRONG)** — biome-format-drift authored by B-block SPECIALISTS (not caught by them; caught downstream). 4th instance (w19+w22+w23×2). Distinct from CI-PRINCIPLES rule 4 (wiring-check) → **BUILD-PRINCIPLES rule 6 candidate (PROMOTED).**
- **obs-2 (informational)** — BUILD rule 4 validated 6th wave; new sub-pattern (specialist citing "T-8 asserts" as coverage substitute, caught at B-6 Phase-1 REWORK). No re-promotion.
- **obs-3 (informational)** — Playwright chrome-absent blocks visual E2E 3rd+ UI wave (67881a58). Infra, not a principle → founder-digest escalation.
- **obs-4 (WARNING)** — under-floor override-ship for externally-blocked scope, 3rd instance (w16/w21/w23) → PRODUCT-PRINCIPLES rule 2 candidate (**REJECTED by karen**, see below).
- **obs-5 (informational)** — principles-write-outside-L-block guard: 3rd consecutive hold (w21/w22/w23) vs prior 8-wave bypass streak. Structural guard still unimplemented → founder digest.

## Promotion (Action 4-6)
karen (agentId a6bae9ad806687dbd) vetted 2 candidates:
- **BUILD rule 6 (formatter-before-report): APPROVE** — distinct from CI rule 4 (specialist authoring-time vs orchestrator wiring-check), 4× recurrence, binary/falsifiable, no near-dup. Linter → **OK** (rule 104, why 97, 2 lines, no forbidden tokens). **PROMOTED + committed.**
- **PRODUCT rule 2 (override-ship under-floor): REJECT** — non-falsifiable. karen showed the trigger token `incomplete-scope` is contractually the VAGUE-PROSE signal (per milestone-decomposition-ritual.md:100,183 — remedy = tighten milestone in planning), NOT the external-block signal the rule assumes; a read-time reviewer can't distinguish the two causes → the rule would rationalize thin ships. Dropped; obs-4 stays in observations.md as a soft signal. karen offered a tightening rewrite (name the external dependency) but it exceeds 120 chars — deferred, not force-fit this wave.

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: 8aa67564 done, edbdea8f done"
  - "observations: process/waves/wave-23/blocks/L/observations.md (5 observations)"
  - "principles promotions: 1 (BUILD-PRINCIPLES rule 6)"
tasks_marked_done: [8aa67564-a142-4628-b658-f020d4d2872c, edbdea8f-71c9-43f0-8f1f-0bcea355f183]
tasks_skipped_with_reason: []
observations_emitted: 5
promotion_candidates: 2
karen_verdicts:
  - {candidate_id: build-formatter-before-report, target_file: BUILD-PRINCIPLES.md, verdict: APPROVE}
  - {candidate_id: product-override-ship-underfloor, target_file: PRODUCT-PRINCIPLES.md, verdict: REJECT, reason: non-falsifiable trigger token}
linter_runs: [{candidate_id: build-formatter-before-report, attempt: 1, verdict: OK}]
candidates_dropped_by_karen: [{candidate_id: product-override-ship-underfloor, final_reason: "incomplete-scope token is the vague-prose signal, not external-block; non-falsifiable at read-time"}]
promotions_applied: [{file: BUILD-PRINCIPLES.md, line: 85, rule: "B-block specialists run the formatter on all touched files before reporting done, not only typecheck."}]
note: "M5 stays in_progress (L-1: 5 done / 10 open). Founder-digest carries: chrome-absent 67881a58 (3rd+ UI wave), principles-write structural guard still unimplemented (3rd hold)."
```

## Exit
Both tasks done. 5 observations. 1 promotion (BUILD rule 6). L-block exits → N-block.
