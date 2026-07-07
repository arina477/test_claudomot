# Wave 75 — P-1 Decompose

## Maximum size rubric — NO threshold tripped
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | >60 | ~15–21 (billing.provider interface + MockBillingProvider + billing.controller + billing.module + shared DTO + tests [seed]; entitlements.service edit + educator-tools enforcement endpoint/guard + tests [69765cee]; "Your plan" panel + api client fn + settings wiring + tests [77665ee5]) | no |
| New primitives | >60 | ~8–10 (BillingProvider interface + MockBillingProvider + billing controller + billing module + tier-change endpoint + educator-tools enforcement endpoint + "Your plan" component + api fn) | no |
| Estimated net LOC | >5,000 | ~2,200–2,800 | no |
| Stage-4 working set | >350K | modest (reuses wave-74 substrate + shipped panel/guard idioms) | no |
No split.

## Wave type + floor
- `claimed_task_ids` = [4bc40741, 69765cee, 77665ee5] → 3 → **multi-spec**.
- Multi-spec floor: >2,500 LOC OR ≥6 specs. Estimate ~2,200–2,800 net LOC (full T-1..T-9 test surface: contract test for the tier-change DTO, integration for the endpoint + owner-check + upsert + mock-mode, e2e for the upgrade flow, component for the panel, non-regression cap test) / 3 specs — **borderline, straddles 2,500**.
- **Floor disposition: PROCEED.** mvp-thinner returned `floor_constraint_active: false` (judged the residual a coherent charging slice) and its only split (db90252a, accepted at P-0) was a defer-for-untestability, NOT a too-big split — the remaining 3 tasks are each load-bearing for the success metric (seed IS the checkout; 69765cee makes entitlements take effect + proves live via educator-tools; the panel IS the verified-live surface). No valid further split exists (downgrade shares the seam → zero net split; storage/voice enforcement need real quota-metering + LiveKit wiring = genuine future slices; db90252a untestable at non-restrictive caps). Under the conservative sub-2,500 read, **PRODUCT-PRINCIPLES rule 5 waives the floor** (feature with no valid split is exempt; no BOARD). Forcing a padding sibling via RESCOPE-AUTO-MERGE would gold-plate exactly what the floor guards against. `floor_merge_attempt: 0`.

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []
```
Rationale: the only UI is the "Your plan" panel + upgrade/downgrade affordance (77665ee5) — a thin read+action panel reusing shipped design-system patterns (SettingsPrivacyPage.tsx / PrivacyActivityPanel.tsx panel chrome + credentialed-fetch idiom), like the wave-72/73 read panels. No novel visual surface, new icon, or new flow; the mock-checkout marking is plain-language copy, not a pricing-table/checkout UI (fenced with real Stripe). Matches the wave-72/73/74 precedent (backend + thin panel → false → B directly). B-3 falls back to D-1 if it hits a real gap.

## Verdict
- **PROCEED** (multi-spec; max-rubric clear; floor satisfied-or-waived per rule 5; no split; no new siblings).
- Binding refinements carried from P-0: (1) pin the canonical M9 brain-set caps (free 2GB/10-voice/no-tools; server_pro 50GB/50/no-tools; school 500GB/100/tools-ON); (2) explicit non-regression AC keeping maxServersPerOwner non-restrictive (wave-74 free-cap guard); (3) seam mutates subscriptions.tier by serverId (per-server key); (4) BillingProvider interface shaped for real Stripe async-redirect + webhook reality, not just the mock synchronous shape; (5) owner-only tier-change endpoint no-IDOR → P-4 security-scope tightened gate + T-8.

```yaml
verdict: PROCEED
wave_type: multi-spec
claimed_task_ids: [4bc40741-146a-4f05-8970-1614eb6b2b43, 69765cee-9764-48b1-bdad-2c45ef05f25a, 77665ee5-f484-464c-b4ee-3b86cae65480]
floor_merge_attempt: 0
floor_waived_rule: "PRODUCT-PRINCIPLES rule 5 (mvp-thinner floor_constraint_active:false / no valid split of residual) — applies only if net LOC lands under 2,500"
design_gap_flag: false
missing_surfaces: []
```
