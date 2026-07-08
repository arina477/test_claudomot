# Wave 80 — P-1 Decompose

## Maximum size rubric — NO threshold tripped
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | >60 | ~6-9 (migration + users.ts show_presence col; packages/shared/src/privacy.ts UpdatePrivacySchema+PrivacySettingsResponseSchema field; privacy.service honor + audit event; presence.gateway honor at emit points; apps/web SettingsPrivacyPage toggle + api; tests) | no |
| New primitives | >60 | ~4 (column + 2 schema fields + gateway honor gate) | no |
| Estimated net LOC | >5,000 | ~300-500 | no |
| Stage-4 working set | >350K | small (reuses shipped privacy/presence substrate) | no |
No split.

## Wave type + floor
- `claimed_task_ids` = [3038a4bc] → 1 → **single-spec**.
- Single-spec floor: net LOC >1,500. Estimate ~300-500 → **floor NOT met on raw size**.
- **Floor WAIVED per PRODUCT-PRINCIPLES rule 5:** mvp-thinner returned THIN and its split (deferring sendReadReceipts + the read-receipt subsystem to sibling 12f6135e) was applied at P-0; the remaining showPresence slice is "a complete AC that stands as a wave" (mvp-thinner: NOT OVER-CUT) with **zero further valid split candidates** — a coherent honest feature. Rule 5: "a feature with no valid split is exempt." Expanding via RESCOPE-AUTO-MERGE would re-admit the deferred read-receipts subsystem (the exact scope the reframe removed as too-big + unratified) — NOT taken.
- `floor_merge_attempt: 0`.

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []
```
Rationale: the presence toggle reuses the EXISTING SettingsPrivacyPage privacy-toggle pattern — profileVisibility + whoCanDm toggles already render there. This is a field-addition to an adopted surface using existing DS tokens, not a new component/page/flow. No D-block.

## Verdict
- **PROCEED** (single-spec; max-rubric clear; floor waived per rule 5; no split; design_gap_flag FALSE → skip D, straight to B).
- **Binding refinements carried P-0 → P-2 (LOAD-BEARING):** (1) showPresence ONLY, no sendReadReceipts (anti-theater, matches whoCanDm-Beta precedent); (2) `show_presence boolean NOT NULL DEFAULT true` on users + 1 field each schema; (3) **mandatory honor point:** presence.gateway emit paths exclude show_presence=false — TWO-CLIENT acceptance test (single-client = coverage theater); (4) toggle writes a privacy-audit event; (5) N-1: M13 disposition point after this ships (surface to founder/BOARD, don't auto-close).

```yaml
verdict: PROCEED
wave_type: single-spec
claimed_task_ids: [3038a4bc-8eeb-49aa-ab3c-096e1ff5b8e1]
floor_merge_attempt: 0
floor_waived: true
floor_waiver_basis: "PRODUCT-PRINCIPLES rule 5 (mvp-thinner THIN split applied; remaining slice coherent, no further split)"
design_gap_flag: false
missing_surfaces: []
```
