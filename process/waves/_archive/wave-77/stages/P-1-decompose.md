# Wave 77 — P-1 Decompose

## Maximum size rubric — NO threshold tripped
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | >60 | ~18–26 (users migration + schema/model; UsersService.updateProfile + GET/PATCH profile; shared profile contract; cross-server profile-view controller+service+visibility resolver; academic-identity editor + member profile card web + api client; tests across all) | no |
| New primitives | >60 | ~10–14 (migration + academic columns + profile DTO extensions + public-profile DTO + visibility resolver + cross-server view endpoint + editor + member card + api fn) | no |
| Estimated net LOC | >5,000 | ~2,300–3,000 | no |
| Stage-4 working set | >350K | modest (reuses shipped profile/privacy/block substrate) | no |
No split.

## Wave type + floor
- `claimed_task_ids` = [10a68f9e, a51e281d, bf0ad2a8, a98286cb] → 4 → **multi-spec**.
- Multi-spec floor: >2,500 LOC OR ≥6 specs. Estimate ~2,300–3,000 net LOC / 4 specs — borderline. mvp-thinner returned **OK** (metric-absence flag; no valid split — the 4 tasks are one irreducible self-edit→cross-server-view loop). **PROCEED:** floor met on the upper estimate; under a conservative sub-2,500 read, PRODUCT-PRINCIPLES rule 5 waives (coherent feature, no valid split — mvp-thinner OK). `floor_merge_attempt: 0`.

## design_gap_flag
```yaml
design_gap_flag: true
missing_surfaces:
  - "Cross-server member profile card (apps/web) — a NEW surface: when viewing a member (cross-server), show their self-declared academic identity (pronouns/bio/institution/program/academic-role/year) as a card, honoring profile_visibility. No existing mockup in design/. New composed surface."
  - "Academic-identity editor — extends the profile-edit surface with the new fields; MAY reuse the existing settings-form patterns (assess at D-1 — if it's pure field-addition to an existing form it is NOT a gap; the CARD is the load-bearing gap). D-1 audit resolves which surfaces are true gaps."
```
Rationale: the cross-server member profile card is a genuinely new surface (a profile card shown when viewing a member across servers) → design_gap_flag TRUE → D-block. The editor may reuse existing profile-form DS (D-1 audit decides). Backend legs (profile fields + self API + cross-server view endpoint) are design-independent. **D-block MUST honor the no-verification fence: render educator/staff as plain text, NO verification badge** (problem-framer + ceo-reviewer).

## Verdict
- **PROCEED** (multi-spec; max-rubric clear; floor met/waived; no split; design_gap_flag TRUE → D-block).
- **Binding refinements carried from P-0 → P-2 (LOAD-BEARING privacy enforcement):** (1) the cross-server profile-view endpoint's `'server-members'` visibility MUST resolve via an EXPLICIT viewer↔target shared-server check (NOT the listServerMembers co-member shortcut — would leak to any authed stranger); (2) branch on the literal shipped enum `['everyone','server-members','nobody']`; (3) fail-closed → unknown/missing visibility on a cross-user read = HIDDEN; reuse the bidirectional block check + deleted_at suppression; (4) self-declared/no-verification fence (academic role = plain self-label, no authz semantics, no badge); (5) cross-user data-exposing endpoint honoring visibility → P-4 security-scope tightened gate + T-8.

```yaml
verdict: PROCEED
wave_type: multi-spec
claimed_task_ids: [10a68f9e-047d-4f1d-b42e-aa5c73996dfe, a51e281d-3c3a-42d0-9e9d-eb4a3eff61cb, bf0ad2a8-93d2-4234-afa5-397fe802af73, a98286cb-7cc9-4381-9c2f-ba5db3723af5]
floor_merge_attempt: 0
design_gap_flag: true
missing_surfaces: ["cross-server member profile card", "academic-identity editor (D-1 assesses if reuse)"]
```
