# Wave 81 — P-1 Decompose

## Maximum size rubric — NO threshold tripped
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | >60 | ~7-9 (new FullPageScroll wrapper; ProfilePage + SettingsPrivacyPage + PrivacyPage + TermsPage + LandingPage roots; router or per-page apply; tests) | no |
| New primitives | >60 | ~1 (FullPageScroll component) | no |
| Estimated net LOC | >5,000 | ~120-220 | no |
| Stage-4 working set | >350K | tiny | no |
No split.

## Wave type + floor
- `claimed_task_ids` = [2340d2d3] → 1 → **single-spec**.
- Single-spec floor: net LOC >1,500. Estimate ~120-220 → **floor NOT met on raw size**.
- **Floor WAIVED:** a FOUNDER-DIRECTED bug fix, no valid split (the class-fix — a shared scroll wrapper applied to the affected standalone routes — is one coherent unit), and NO active milestone exists (roadmap complete → RESCOPE-AUTO-MERGE/expand-current-bundle is impossible + inapplicable). The floor targets wasteful greenfield micro-waves; a requested bug fix is exempt (PRODUCT-PRINCIPLES rule 5 spirit). mvp-thinner not spawned (no product-feature milestone). `floor_merge_attempt: 0`.

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []
```
Rationale: a scroll-container fix on EXISTING adopted pages, reusing the shipped 6px dark DS scrollbar (globals.css §9). No new UI surface/component visual — a layout primitive. No D-block.

## Verdict
- **PROCEED** (single-spec; max clear; floor waived; no split; design_gap FALSE → skip D, straight to B).
- **Binding refinements carried P-0 → P-2:** global body overflow:hidden UNTOUCHED (wrong-layer if removed); shared FullPageScroll `h-dvh overflow-y-auto` (h-dvh not h-screen — mobile URL bar); preserve 6px DS scrollbar; apply to standalone full-page routes (no-op-safe on short pages), NOT the shell routes /app /discover (double-scroll regression); LIVE scroll-to-bottom on /settings/profile a required AC.

```yaml
verdict: PROCEED
wave_type: single-spec
claimed_task_ids: [2340d2d3-f405-4d16-b8fb-a2111c141ea7]
floor_merge_attempt: 0
floor_waived: true
floor_waiver_basis: "founder-directed bug fix, no valid split, no active milestone to expand-merge (roadmap complete)"
design_gap_flag: false
missing_surfaces: []
```
