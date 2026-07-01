# Wave 31 — L-2 Distill

## Task done-marking
2 claimed tasks (d8a85de0, 1dd1f2ca) → `done`. M6 (8702a335): **2 done / 1 open** (occupancy 78f51968, split to a future wave) → stays `in_progress` (M6 metric NOT met — live voice + screen-share + audio-fallback + occupancy are future M6 waves).

## Observations captured
`process/waves/wave-31/blocks/L/observations.md` — 4:
| id | title | severity | recurrence | disposition |
|----|-------|----------|------------|-------------|
| obs-1 | Credential-endpoint gate: membership-check BEFORE any load/branch that varies by resource existence/type (no enumeration oracle) | strong | 1st | HOLD (BUILD candidate) |
| obs-2 | Spec-GAP: when deployed behavior diverges from a spec AC AND is more-correct, reconcile the SPEC (not the code) | strong | **2nd** (w28 200→201 + w31 404→403) | **PROMOTED → VERIFY rule 2** |
| obs-3 | Credential-independent build for external-SDK features + defer live-verify to when the founder-cred lands + proactive flag | informational | 1st | HOLD (PRODUCT candidate) |
| obs-4 | ESM-only npm dep in a CJS service → cached dynamic import() + memoized in-flight promise + map import-failure to domain error | warning | 1st | HOLD (BUILD candidate) |

Dropped: audio-scoped-grant (too narrow, covered by BUILD rule 4); wave-30 obs-2/obs-3 not re-confirmed.

## Promotion this wave — 1 (VERIFY, karen-vetted, ≤1/file)

### VERIFY-PRINCIPLES rule 2 (from obs-2, strong, 2nd instance)
```
2. When deployed behavior diverges from a spec AC and is more correct, amend the spec to match, not the code.
   Why: Reverting correct shipped behavior to a weaker spec ships the worse option; the spec was the defect.
```
- **Recurrence:** w28 (spec said 200, deployed 201 more-correct for a create → reconciled spec 200→201) + w31 (spec said 404-missing, deployed uniform-403 security-correct on a credential endpoint → reconciled spec 404→403). Both: jenny spec-GAP at V-1 → V-2 spec-doc reconciliation → V-3 0-code-LOC → head-verifier re-verify. Stable, falsifiable, generalizable.
- **Not a near-dup** of VERIFY rule 1 (that's how-to-verify-seeding-ACs; this is which-side-to-reconcile-on-divergence). karen confirmed.
- **Contract:** rule 108 chars (≤120 ✓), why 100 chars (≤100 ✓), no forbidden tokens. karen PROMOTE.

## Held — obs-1 (BUILD, credential-endpoint gate-first), obs-3 (PRODUCT, credential-independent-build-then-defer — reminders-w30 was a precedent but its L-2 dropped the build-disposition pattern; this is the 1st standalone instance), obs-4 (BUILD, ESM-in-CJS bridge). All promotable on a 2nd instance.

## Deliverable
```yaml
l2_stage_verdict: COMPLETE
tasks_marked_done: [d8a85de0, 1dd1f2ca]
observations_captured: 4
promotions: 1
promoted: [{file: VERIFY-PRINCIPLES.md, rule: 2, source_obs: obs-2, recurrence: "w28+w31 (2nd)", karen_vetted: true}]
holds: [obs-1 (BUILD), obs-3 (PRODUCT), obs-4 (BUILD)]
milestone_delta: {M6: "0 done → 2 done", metric_met: false, transition: none, stays: in_progress}
n_block_carry: "M6 stays in_progress (first slice); N-1 seed = occupancy 78f51968 (the 1 seed candidate) for the next M6 wave"
```
