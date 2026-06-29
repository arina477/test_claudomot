# Wave 4 — P-1 Decompose — PROCEED (no split)
Both P-0 reviewers declined RESCOPE-AUTO-SPLIT (coherent already-split slice; storage design pre-decided → integration not net-new).
## Max rubric — none trip
| Measure | Threshold | Est | Trips |
|---|---|---|---|
| Files | >60 | ~18-26 (users migration + profile API extend + FilesModule[presign/upload/serve controller+service] + S3 client + settings-profile wiring + tests) | no |
| Primitives | >60 | ~12 | no |
| Net LOC | >5,000 | ~2,000-3,000 | no |
| Stage-4 working set | >350K | within budget | no |
## Floor: single-spec >1,500 LOC → above. wave_type single-spec.
```yaml
wave_type: single-spec
verdict: PROCEED
floor_merge_attempt: 0
claimed_task_ids: [2a655960-a429-432d-8633-e8f149368ca3]
design_gap_flag: false
missing_surfaces: []   # settings-profile.html mockup exists (avatar/username/accent controls already in it)
```
