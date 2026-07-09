# Wave 82 — P-1 Decompose
## Max rubric — no trip
Files ~3-5 (api.ts request()/requestNoContent() + a shared refresh-and-retry helper; api.test additions; maybe a small shared refresh-lock util). Primitives ~1-2. Net LOC ~120-250. Working set tiny. **No split.**
## Wave type + floor
- claimed_task_ids [0e58af8e] → 1 → **single-spec**. Floor >1,500 LOC; ~120-250 → below.
- **Floor WAIVED:** founder-directed bug fix, no valid split (one shared api-client seam), no active milestone to expand-merge (roadmap complete). Rule-5 spirit (a requested bug fix is exempt). floor_merge_attempt: 0.
## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []
```
Rationale: an api-client/auth-resilience fix (no new UI surface). No D-block.
## Verdict
- **PROCEED** (single-spec; floor waived; design_gap false → skip D → B). Binding refinements carried (global refresh-and-retry once on 401; genuine-logout guard on refresh=false; single shared refresh for burst-401s; deterministic tests incl. a non-DM route + concurrency; scope = the shared seam only).
```yaml
verdict: PROCEED
wave_type: single-spec
claimed_task_ids: [0e58af8e-efed-43cb-b3eb-f1b962066c51]
floor_merge_attempt: 0
floor_waived: true
design_gap_flag: false
```
