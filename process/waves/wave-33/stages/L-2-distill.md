# Wave 33 — L-2 Distill

## Action 1-2 — Tasks done
- a2dd9f3d → done (verified). Single-spec, no siblings.

## Action 3 — Observations (knowledge-synthesizer): 4 at process/waves/wave-33/blocks/L/observations.md
- obs-1 (warning, HOLD 1st): plan named a framework error class absent from the stack (@Catch(QueryFailedError) TypeORM on a Drizzle stack) → PRODUCT candidate.
- obs-2 (warning, HOLD 1st): error-mapping fix must fire against a REAL upstream error, not a unit-mock → VERIFY candidate (head-verifier flag).
- obs-3 (info, HOLD 1st): clone the shipped .cause.code error-walk depth for new pg codes → BUILD candidate.
- obs-4 (warning, PROMOTABLE 2nd event): T-8 malformed :id-param probe obligation → T-8.md rule 2.

## Action 5-6 — karen vetting + promotion
- **T-8.md rule 2: PROMOTED** ✓ — karen APPROVE (evidence real: wave-32 T-8 CAUGHT F-32-T-8-1, wave-33 T-8 CLOSED it, satisfying wave-32 obs-2's HOLD condition). karen RE-AUTHORED (the synthesizer again fabricated char counts — 138/153 actual vs reported 102/99). Linter PASS on karen's block (rule 113, why 95). Appended: "At T-8, probe each :id route param with a malformed non-UUID value on the authed path and assert 400, not 500."
- obs-1/obs-2/obs-3: 1st-instance HOLDs, retained for future 2nd-instance promotion.

## Per-file cap: 1 promotion (T-8.md). Distinct file.

## Process note (recurring): the knowledge-synthesizer has now fabricated char counts at BOTH wave-32 and wave-33 L-2 (reported vs actual off by 20-40+). karen + the orchestrator's linter caught both. Recommend head-learn/maintainers require a mechanical `awk '{print length}'` count in each candidate block (2nd instance of this synthesizer-miscount pattern — itself a future L-2 candidate).

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: a2dd9f3d done"
  - "observations: process/waves/wave-33/blocks/L/observations.md (4)"
  - "principles promotions: 1 (T-8.md rule 2)"
tasks_marked_done: [a2dd9f3d-1b93-4dfc-a6a8-5afded4a3354]
observations_emitted: 4
promotion_candidates: 1
karen_verdicts: [{candidate_id: obs-4, target_file: T-8.md, verdict: APPROVE}]
linter_runs: [{candidate_id: obs-4, target_file: T-8.md, attempt: 1, verdict: PASS}]
candidates_dropped_by_linter: []
promotions_applied: [{file: test-layer-principles/T-8.md, line: "rule 2", rule: "At T-8, probe each :id route param with a malformed non-UUID value on the authed path and assert 400, not 500."}]
```
