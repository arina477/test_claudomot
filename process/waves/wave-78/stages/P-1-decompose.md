# Wave 78 — P-1 Decompose

## Maximum size rubric — NO threshold tripped
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | >60 | ~6-9 (seed: packages/shared/src/profile.ts, apps/api/src/profile/users(profile).service.ts, apps/web ProfilePage editor, +tests; sibling: apps/web MemberProfileCard.tsx, apps/web/src/auth/api.ts, +tests) | no |
| New primitives | >60 | ~0-2 (nullable academicRole at contract layer; a client error-kind discriminant) | no |
| Estimated net LOC | >5,000 | ~90 (seed ~35, sibling ~55, incl. tests) | no |
| Stage-4 working set | >350K | small (reuses shipped wave-77 profile/card substrate) | no |
No split.

## Wave type + floor
- `claimed_task_ids` = [4be3b084 (seed), 3b3530d8 (sibling)] → length 2 → **multi-spec**.
- Multi-spec floor: net LOC >2,500 OR ≥6 specs. Estimate ~90 LOC / 2 specs → **floor NOT met on raw size**.
- **Floor WAIVED per PRODUCT-PRINCIPLES rule 5:** mvp-thinner returned OK with **zero split candidates** (metric-absence abstention; explicitly judged the 2-task bundle "a legitimate minimum, not starved"). Rule 5: "When mvp-thinner returns ... zero split candidates, waive the floor; no BOARD is required. The floor targets wasteful greenfield micro-waves; a feature with no valid split is exempt."
- **RESCOPE-AUTO-MERGE (expand-current-bundle) deliberately NOT taken:** the only adjacent unauthored M13 scope is leg-3 (privacy / E2E) — a security-sensitive slice that warrants its own full P-block framing (P-0 reframe + P-2 security ACs + P-4 security-scope gate), NOT a bolt-on to a UX-polish wave. Bundling it here would be worse than a thin-but-coherent wave. Both claimed tasks are the entire M13 open seed-candidate queue; deferring the sibling would strand it.
- `floor_merge_attempt: 0`.

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []
```
Rationale: both touched surfaces were ADOPTED at wave-77 D-3 — the academic-identity editor (ProfilePage, reuses settings-form DS) and the MemberProfileCard (`design/member-profile-card.html`, adopted). Changes are field/state additions reusing existing DS tokens + patterns:
- Seed: the editor's academic-role `<select>` gains a working empty/unset option — pure form-field behavior on an adopted form, no new surface.
- Sibling: the card gains a "couldn't load — retry" state that reuses the card's EXISTING error-state container + standard DS button; it is a copy/affordance variant of the already-adopted "Profile Unavailable" state, not a new component/page/flow. **Design constraint carried to B/T (not a gap):** the retryable state must be VISUALLY DISTINCT from the hidden state, while the hidden state stays byte-identical to blocked/nonexistent (uniform-404 anti-oracle). This is a copy/affordance rule within the adopted pattern, resolvable against DESIGN-SYSTEM.md at B-block — no D-block.

## Verdict
- **PROCEED** (multi-spec; max-rubric clear; floor waived per rule 5; no split; design_gap_flag FALSE → skip D, straight to B).
- **Binding refinements carried P-0 → P-2 (LOAD-BEARING):** (1) uniform-404 anti-oracle: card 404→hidden branch byte-identical, retryable state ONLY for client-observable transport failures, no server error-kind field (T-8 re-prove); (2) service write-path must distinguish `undefined` (leave) from `null` (write NULL) with an AC asserting PATCH `{academicRole: null}` persists + round-trips null; do NOT over-touch the visibility read path.

```yaml
verdict: PROCEED
wave_type: multi-spec
claimed_task_ids: [4be3b084-c86f-48f6-b3fc-fe9e95d60556, 3b3530d8-f452-4e26-b50d-be2d3dabf384]
floor_merge_attempt: 0
floor_waived: true
floor_waiver_basis: "PRODUCT-PRINCIPLES rule 5 (mvp-thinner OK, zero split candidates)"
design_gap_flag: false
missing_surfaces: []
```
