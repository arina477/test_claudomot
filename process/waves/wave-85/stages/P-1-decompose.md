# Wave 85 — P-1 Decompose

## Maximum-size rubric (split when over)
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | > 60 | ~3 (apps/web/src/shell/AssignmentCard.tsx; a reused/extracted toast; AssignmentCard test) | no |
| New primitives | > 60 | 0-1 (reuse ReportDialog Toast pattern; no new component ideally) | no |
| Estimated net LOC | > 5,000 | ~40 (snapshot prior status + restore-on-error + toast wiring + a11y + test) | no |
| Stage-4 working set | > 350K | small | no |
No maximum threshold trips.

## Wave type
`claimed_task_ids.length == 1` (3ad35a42) → **single-spec**. wave_type: [ui].

## Minimum floor
- single-spec floor: net LOC > 1,500. Estimate ~40 → **BELOW FLOOR (trips)**.
- RESCOPE-AUTO-MERGE un-runnable (roadmap complete → no active milestone).
- **Floor WAIVED** per PRODUCT-PRINCIPLES #5 (floor targets wasteful greenfield micro-waves; a bug-fix wave with no valid merge candidate is exempt). ceo-reviewer already spun the coherent expansion (app-wide consistency) OUT to a separate task — bundling it back would contradict the P-0 disposition + gold-plate. Natural coherent size. No BOARD (PRODUCT-5).

## Verdict
**PROCEED** (floor_waived: true).

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []   # reuses the EXISTING Toast pattern (shell/ReportDialog.tsx: role=alert, aria-live=assertive, auto-dismiss) + the existing onAnnounce a11y channel. No new page/component/icon/flow. D-block skips.
```

## Footer
```yaml
wave_type: single-spec (ui)
verdict: PROCEED
floor_merge_attempt: 0
floor_waived: true
siblings_created: []
spin_out_task: 3b878f96-0fea-48f5-ac1e-7ba639e0072b (app-wide optimistic-error consistency — separate, not this wave)
design_gap_flag: false
```
