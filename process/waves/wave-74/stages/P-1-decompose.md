# Wave 74 — P-1 Decompose

## Maximum size rubric — NO threshold tripped
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | >60 | ~12-18 (subscriptions schema + migration; EntitlementsService + placeholder-caps config; shared tier/entitlements Zod contract; gate wiring in servers.service; optional thin "Your plan" display; api + web tests) | no |
| New primitives | >60 | ~6 (1 table + 1 migration + 1 service + 1 shared contract + gate-wiring + optional display) | no |
| Estimated net LOC | >5,000 | ~2,000–2,800 | no |
| Stage-4 working set | >350K | modest (reuses reports.ts idiom + existing DI/gate) | no |
No split.

## Wave type + floor
- `claimed_task_ids` = [53d18d7f, e34642ef, 2f61a317] → 3 → **multi-spec**.
- Multi-spec floor: >2,500 LOC OR ≥6 specs. Estimate ~2,000–2,800 (borderline) / 3 specs. Whether or not it clears 2,500 by test count, **mvp-thinner returned OK with ZERO split candidates** (seed irreducible; EntitlementsService is the resolver half of the substrate — not splittable; gate-wiring is the thin proof-of-read-path whose removal would push under the floor; the only expandable scope — Stripe/pricing/enforcement — is founder-reserved). → **PRODUCT-PRINCIPLES rule 5 floor waiver applies** (a feature with no valid split is exempt; no BOARD). **Verdict: PROCEED.**

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []
```
Rationale: backend-heavy (schema + service + gate wiring). The only UI is the OPTIONAL thin "Your plan = Free" read display on an existing settings/server surface — a trivial static-text/label reusing existing DS patterns + panel chrome (like the wave-73 read panels). No novel visual surface, no new icon/flow, no checkout/pricing UI (fenced). Matches the wave-72/73 precedent (backend + thin read display → false → B directly). B-3 falls back to D-1 if it hits a real gap.

## Verdict
- **PROCEED** (multi-spec; floor waived per PRODUCT-PRINCIPLES rule 5 / mvp-thinner OK; no split; no new siblings).
- Binding refinements carried from P-0: (1) VERIFY-the-gate-reads test (stubbed restrictive cap blocks, free doesn't — no coverage theater); (2) server-tier primary subject (user_id only if a wired gate consumes it); (3) enum + caps = founder-tunable placeholders; (4) NO Stripe/prices/checkout/quotas (fenced).

```yaml
verdict: PROCEED
wave_type: multi-spec
claimed_task_ids: [53d18d7f-a9f2-4b53-9ede-890e3dbb5c96, e34642ef-31f5-4b03-b9fd-6e4e532cb688, 2f61a317-6262-4c19-98a8-36aedee13fc4]
floor_merge_attempt: 0
floor_waived_rule: "PRODUCT-PRINCIPLES rule 5 (mvp-thinner OK / zero split candidates)"
design_gap_flag: false
missing_surfaces: []
```
