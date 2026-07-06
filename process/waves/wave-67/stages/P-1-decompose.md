# P-1 Decompose — wave-67 (M11 server discovery bundle #1)

## Maximum rubric (all four)
- Files touched: ~14-20 — api: servers schema + migration, servers.service (discover query + public-join), servers.controller (2 endpoints), DTO/Zod (shared); web: new /discover page + components, api client, route registration, ServerContext wiring; + tests across all. Under 60.
- New primitives: ~8 — is_public/description/topic columns + migration, GET /servers/discover endpoint, public-join endpoint, discover DTO, /discover page + browse-list component + search, Join action. Under 60.
- Est net LOC: seed ~450 (schema+migration+discover query+endpoint+DTO+tests) + UI sibling ~700 (new page+search+cards+client+route+tests) + join sibling ~400 (endpoint+service+client+button+tests) ≈ **~1,550 net LOC**. Under 5,000.
- Working set: moderate (multi-file plan + api+web + design brief). Under 350K.
→ Max rubric: no threshold trips.

## Wave type + floor
- claimed_task_ids = [609c9bdd, 37b78777, e363dac2] → length 3 → **wave_type: multi-spec**.
- Multi-spec floor: net LOC > 2,500 **OR** >= 6 specs. Est ~1,550 LOC + 3 specs → BELOW floor → RESCOPE-AUTO-MERGE.

## Floor resolution — OVERRIDE-SHIP BY RULE (precedent-application, no BOARD)
- Override-ship the sub-floor multi-spec wave. floor_merge_attempt: 0.
- **Why (precedent-application):** this is the coherent MINIMAL first-bundle of a freshly-promoted milestone under the per-wave decomposition model (which authors ONE bundle per wave — later M11 bundles ship separately). Both scope reviewers fenced against expansion: mvp-thinner OK (every AC traces to M11's explicit metric — search/topic/size/one-click-join all named; nothing to peel), ceo-reviewer HOLD-SCOPE (NOT expandable — ranking/trending/categories/moderation all sort an empty shelf at 0 users = speculative polish + rework risk; deferred to later bundles by design). The only "floor-fill" candidates are deliberately-deferred future-bundle scope; adding them would violate the P-0 reframe + pad = the floor's own anti-goal. Exactly the PRODUCT-PRINCIPLES rule 5 + wave-21/23-27/50/53/65/66 floor-exemption lineage (coherent reuse/completion slice, no valid non-premature merge candidate). Per the wave-24 "do NOT re-litigate a Nth per-wave floor-merge" standing ruling → precedent-application, NO fresh BOARD.

## design_gap_flag
```yaml
design_gap_flag: true
missing_surfaces:
  - "/discover page: new public server-directory browse surface (list + search + community-info cards + Join action) — no mockup exists; reuses design-system tokens + existing server-card/list/search patterns but the directory layout/hierarchy is a new surface → D-block brief"
```
→ Routes P → **D** → B (new UI surface warrants a design brief).

```yaml
wave_type: multi-spec
verdict: RESCOPE-AUTO-MERGE → override-ship-by-rule (precedent-application)
floor_merge_attempt: 0
claimed_task_ids: [609c9bdd-0a7b-4173-affa-298344325ac3, 37b78777-1196-4c84-8b2c-ac5dec3fd05b, e363dac2-bfed-448d-a740-36631bd5ddcf]
design_gap_flag: true
