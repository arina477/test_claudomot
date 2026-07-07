# Wave 76 — P-1 Decompose

## Maximum size rubric — NO threshold tripped
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | >60 | ~30–40 (educator-tools API foundation + owner/educator guard/predicate + module; analytics aggregates service + controller + shared DTOs; console web page + analytics components + api client + nav wiring; tests across all) | no |
| New primitives | >60 | ~12–16 (educator-admin API endpoints + composed authz layer + educator predicate + analytics aggregate endpoints + analytics service + shared DTOs + console page + analytics display components) | no |
| Estimated net LOC | >5,000 | ~2,500–3,500 | no |
| Stage-4 working set | >350K | modest (reuses M9 substrate + shipped RBAC/roles + settings-panel DS) | no |
No split.

## Wave type + floor
- `claimed_task_ids` = [682e0912, ecf79f4a, 80505bb1, d81e266d] → 4 → **multi-spec**.
- Multi-spec floor: >2,500 LOC OR ≥6 specs. Estimate ~2,500–3,500 net LOC / 4 specs — **meets the LOC floor** (real admin API + composed authz + analytics aggregates + a new console UI + full test surface). mvp-thinner `floor_constraint_active: false`; all 4 ACs load-bearing for a coherent leg-1 slice. `floor_merge_attempt: 0`. **PROCEED.**

## design_gap_flag
```yaml
design_gap_flag: true
missing_surfaces:
  - "Educator Admin Console (apps/web) — a NEW admin surface for a school-tier server: educator-tools section + a server analytics dashboard (aggregate stat display over members/messages/assignments/activity), gated on educatorAdminTools. No existing mockup in design/. Unlike the wave-75 thin 'Your plan' read-panel, this is a new composed console/dashboard layout — the arrangement of the tools surface + analytics cards is a design decision worth a brief."
  - "Analytics display components — how server aggregates render (stat cards / groupings / empty states) has no prior art in design/; part of the console surface above."
```
Rationale: the console+analytics is a genuinely new surface (problem-framer + ceo-reviewer both flagged 'UI wave → D-block expected'). It reuses shipped settings-panel/shell DS **tokens + primitives**, but the console LAYOUT + analytics dashboard composition is net-new → design_gap_flag TRUE → D-block runs (D-1 brief → D-2 variants → D-3 adopt) before B-3 builds it. The backend legs (seed API + gate + analytics API) are design-independent.

## Verdict
- **PROCEED** (multi-spec; max-rubric clear; floor met; no split; design_gap_flag TRUE → D-block after P-block).
- Binding refinements carried from P-0 → P-2: (1) **NOTE-1** — define the educator predicate concretely as `owner OR member holding a specific capability flag` (the `roles` table is capability-based; there is NO named "Educator/Facilitator" role — that's UI copy only); (2) **NOTE-2** — decide the /educator-tools/status endpoint disposition explicitly (preserve the wave-75 boolean contract + add richer endpoints, OR supersede with a documented migration); (3) analytics = read-only aggregates over EXISTING tables, no new telemetry/charting infra (P-3 guard); (4) authz on a data-exposing endpoint → P-4 security-scope tightened gate + T-8.

```yaml
verdict: PROCEED
wave_type: multi-spec
claimed_task_ids: [682e0912-30db-495c-984e-34dd046b1504, ecf79f4a-42db-4536-a7e8-a94ebb408bec, 80505bb1-3037-4863-aca7-ac95bbfe4e47, d81e266d-8e8c-43f4-9d3c-69a741fbbf9d]
floor_merge_attempt: 0
design_gap_flag: true
missing_surfaces: ["Educator Admin Console + analytics dashboard (apps/web)", "analytics display components"]
```
