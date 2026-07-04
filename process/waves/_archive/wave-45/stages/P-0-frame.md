# Wave 45 — P-0 Frame

## Discover section
- wave_db_id: 88a86a93-8e78-4047-a586-43ff627f6196 (wave_number 45, running, milestone_id=M8)
- Prior-work citation: sources are wave-15 V-2 (T5-F1, Playwright MCP) + wave-16 V-2 (T-1/B-5, biome warnings). Both long-standing V-2 follow-ups; re-homed into M8 at wave-44 N-1 daily-checkpoint (BOARD 6/7 APPROVE).
- Roadmap milestone: M8 (84e17739, in_progress). Both seeds already milestone-aligned; wave milestone_id backfilled at INSERT.
- Spec-contract short-circuit verdict: **no-prior-spec** (both seeds are prose descriptions, no fenced YAML head) → full P-1..P-3 run.
- Product-decision resolutions: none (infra/hygiene; no money/security/UX-tradeoff signal → no Tier-3).

## Reframe section
- Original framing: tech-debt hygiene wave under M8 — (1) 67881a58 seed: reconfigure Playwright MCP to bundled chromium (default the proven bypass); (2) 4e994e96 sibling: clean up 9 biome lint warnings (useTyping noNonNull ×6 + ServerRolesPage dead suppressions).
- **problem-framer: PROCEED.** Both root-caused. Task 1 = cause-layer (MCP config points at absent chrome channel; proven bundled-chromium bypass IS the fix). Task 2 = real hygiene, no antipattern, coherent co-claim (not scope-creep). NOTE: "typers[0]! throws on empty array → latent bug" is OVERSTATED — each `!` sits inside a `typers.length===N` guard, logically safe today. Fix action unchanged; P-2 must frame task-2 ACs as lint-hygiene, not crash-fix. Also: ServerRolesPage.tsx has 4 biome-ignore comments (task said 3) — P-1/P-2 confirm dead count. PRODUCT-PRINCIPLES § Antipatterns is empty; fell back to universal catalog.
- **ceo-reviewer: PROCEED (HOLD-SCOPE).** Right-sized. Playwright fix = compounding leverage (removes recurring per-UI-wave BLOCK tax on all future M8 UI E2E). biome fix = cheap coherent co-passenger. Rejected SCOPE-EXPANSION to broad test-infra pass (undiagnosed grab-bag + would deepen debt-drain-while-blocked exposure while founder metric pending). FORWARD NOTE (non-blocking): a SECOND consecutive debt-only wave before the founder resolves the M8 metric should re-escalate the metric fork rather than bundle more debt — bites at wave-46 N-1, not here.
- **mvp-thinner: OK** (thinness lens n/a for infra hygiene; no product ACs to split; M8 metric _TBD so no mvp-critical floor to thin against; not OVER-CUT — coherent debt-drain, LOC-floor is P-1's call per wave-16 test/infra-floor-exemption precedent).
- Mediation: none needed (no ceo/mvp disagreement).
- Sibling task IDs created: none.
- Disposition: **PROCEED** (all reviewers clear).
- Final framing: two-task metric-independent hygiene bundle under M8. Seed 67881a58 (Playwright MCP → bundled chromium default) sequenced ahead of sibling 4e994e96 (biome warning cleanup). No product/UX/data surface. Expected design_gap_flag=false. P-2 to frame biome ACs as lint-hygiene.

```yaml
p_stage_verdict: COMPLETE
disposition: PROCEED
short_circuit: no-prior-spec
reframe: {problem-framer: PROCEED, ceo-reviewer: PROCEED-HOLD-SCOPE, mvp-thinner: OK}
carry_forward:
  - "P-2: biome task ACs = lint-hygiene not crash-fix (! sites length-guarded)"
  - "P-1/P-2: confirm ServerRolesPage dead-suppression count (4 comments found vs 3 claimed)"
  - "wave-46 N-1: 2nd consecutive debt-only wave => re-escalate M8 metric, not more debt"
```
