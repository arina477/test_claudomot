# Wave 48 — P-2 Spec (pointer)
Spec in tasks.description of 03ccf636. wave_type: single-spec. design_gap_flag: false. claimed: [03ccf636].
ACs: (1) real-PG test proves who_can_dm='nobody' co-member EXCLUDED from getDmCandidates (exercises real WHERE, not mock); (2) real-PG test proves disjoint non-co-member HIDDEN (negative isolation); (3) insertFixtureUser gets a backward-compat who_can_dm param; (4) both run+pass in CI, positive coverage retained. TEST-ONLY, no production/schema change. Applies test-writing §26.
```yaml
p_stage_verdict: COMPLETE
spec_location: "tasks.description of 03ccf636"
wave_type: single-spec
design_gap_flag: false
claimed_task_ids: [03ccf636-ceb2-4ebc-aff7-6c55e8283521]
```
