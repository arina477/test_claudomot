# Wave 29 — L-2 Distill

## Task done-marking
`d23a0740` (claimed) → `done` (UPDATE 1). M5 (a5232e16): **12 done / 6 open / 0 seed candidates** → stays `in_progress` (open≠0). **N-1 flag: 0 seed candidates** → decomposition fires; likely `incomplete-scope` (M5's only unbuilt scope = Resend-blocked reminders) → park-or-key fork may be mechanically forced at N-block.

## Observations captured
`process/waves/wave-29/blocks/L/observations.md` — 3 (knowledge-synthesizer), all 1st-instance HOLD:
| id | title | severity | recurrence | disposition |
|----|-------|----------|------------|-------------|
| obs-1 | P-3 plan must lock a single operator/expression form when a builder's reasonable pick could be a SyntaxError or fail an AC | warning | 1st | HOLD (PRODUCT candidate — highest-value; measured REWORK cost) |
| obs-2 | V-3 head-verifier greps the old pattern beyond spec-named sites, traces each to scoped-out-or-missed | informational | 1st | HOLD (VERIFY candidate; shares slot with wave-28 obs-4 spec-gap-vs-drift) |
| obs-3 | Log every P-1 override-ship/floor-merge to the append-only decision log AT the decision point, not via later reconciliation | warning | 1st | HOLD (PRODUCT candidate, lower priority than obs-1) |

Dropped: signal 3 (BUILD rule 8 honored — reinforcement of already-promoted rule), signal 5 (railway npx — too narrow, memory note), signal 6 (8th-wave override-ship + ceo RECONSIDER — escalation process functioned correctly; the "hard gate after N blocked waves" candidate is not yet falsifiable/threshold-defined; re-evaluate if 2+ more waves pass unanswered).

## Promotions this wave — 0
All 3 observations are 1st-instance HOLDs. No karen vetting required. Most waves promote zero — this is the healthy default.

## Deliverable
```yaml
l2_stage_verdict: COMPLETE
tasks_marked_done: [d23a0740]
observations_captured: 3
promotions: 0
holds: [obs-1 (PRODUCT), obs-2 (VERIFY), obs-3 (PRODUCT)]
per_file_cap_respected: true   # 0 promotions
milestone_delta: {M5: "11 done → 12 done", transition: none, stays: in_progress, seed_candidates: 0}
n1_flag: "M5 0 seed candidates → decomposition fires, likely incomplete-scope → park-or-key fork may be mechanically forced at N-block"
```
