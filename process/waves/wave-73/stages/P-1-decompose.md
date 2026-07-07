# Wave 73 — P-1 Decompose

## Maximum size rubric (split when over) — NO threshold tripped
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | >60 | ~15 (privacy_events schema + migration; AppendPrivacyEvent service; 4 hook edits in existing services; shared DTO 2 files; read endpoint + controller/service edits; shared response type; React read-list panel + api fn; api + web tests) | no |
| New primitives | >60 | ~6 (1 table + 1 migration + 1 service + 1 read endpoint + 1 shared schema + 1 component) | no |
| Estimated net LOC | >5,000 | ~1,500–1,900 | no |
| Stage-4 working set | >350K tok | modest (reuses existing privacy module + DS patterns) | no |

No split.

## Wave type + minimum floor
- `claimed_task_ids` = [156aa2ee (seed), 03940edd (DTO), 5a2521bc (read-list)] → length 3 → **wave_type: multi-spec**.
- Multi-spec floor: net LOC >2,500 **OR** ≥6 specs. Estimate ~1,500–1,900 LOC / 3 specs → **below floor**.
- **RESCOPE-AUTO-MERGE tripped → but WAIVED per PRODUCT-PRINCIPLES rule 5:** mvp-thinner returned **OK with zero split candidates** (all 4 hook seams mvp-critical; DTO + read-list already separate siblings; no gold-plating to peel; the only expandable M10 scope is founder-reserved — FERPA/COPPA, consent, regime-entangled deletion-hardening — fenced by the N-1 decomposition). Rule 5: "a feature with no valid split is exempt; waive the floor, no BOARD." floor_merge_attempt stays 0 — calling decomposition to pad LOC would author gold-plating against mvp-thinner's OK + ceo's 9/10, and the only unfenced scope needs the founder. **Verdict: PROCEED (floor waived by rule 5).**

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []
```
Rationale: the only UI surface is the "Your privacy activity" read list on the ALREADY-SHIPPED `/settings/privacy` page (wave-35/72) — a standard reverse-chron read-only list reusing existing DS patterns (BlockedUsersPanel list chrome, the "Your data" account-data section, DangerZonePanel panel structure) + DESIGN-SYSTEM tokens. No novel visual surface, no new icon/flow. Backend is the bulk (table + service + 4 hooks + read endpoint). Matches the wave-71/72 precedent (list/panel additions to settings-privacy → design_gap_flag=false → B directly). If B-3 hits an actual design gap it falls back to D-1 per the block dispatcher.

## Verdict
- **PROCEED** (multi-spec; floor waived by PRODUCT-PRINCIPLES rule 5; no split; no new siblings).
- `wave_type: multi-spec`
- `claimed_task_ids: [156aa2ee, 03940edd, 5a2521bc]`
- `design_gap_flag: false` → B directly (no D-block)

```yaml
verdict: PROCEED
wave_type: multi-spec
claimed_task_ids: [156aa2ee-1235-4de1-b85e-995e88440eaa, 03940edd-aaea-4807-a924-52afea981edd, 5a2521bc-1b15-4310-aa27-5e32452e3c55]
floor_merge_attempt: 0
floor_waived_rule: "PRODUCT-PRINCIPLES rule 5 (mvp-thinner OK / zero split candidates)"
design_gap_flag: false
missing_surfaces: []
```
