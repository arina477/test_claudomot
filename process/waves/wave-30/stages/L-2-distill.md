# Wave 30 — L-2 Distill

## Task done-marking
3 claimed tasks (4a4c2715, c5c30363, 0ba853e2) → `done`. M5 (a5232e16): **15 done / 6 open**. M5 metric MET (reminders was the sole unbuilt scope item); stays `in_progress` (open≠0) — N-block disposes the 6 open non-metric tasks then closes M5.

## Observations captured
`process/waves/wave-30/blocks/L/observations.md` — 3, all 1st-instance HOLD:
| id | title | severity | recurrence | disposition |
|----|-------|----------|------------|-------------|
| obs-1 | LEFT JOIN + IS DISTINCT FROM for a nullable-status exclusion mirroring an app-code `?? default` (NULL-safe; inner-join/`!=` silently drops no-status rows) | strong | 1st | HOLD (BUILD candidate; mutation-genuine, would-have-been-a-real-defect) |
| obs-2 | INSERT ON CONFLICT DO NOTHING RETURNING-gated external side-effect for at-most-once cron delivery (DB UNIQUE is the arbiter, not SELECT-then-insert TOCTOU) | strong | 1st | HOLD (BUILD candidate; generalizable beyond email) |
| obs-3 | Accept+track+observe: disposition triple for a spec-consistent design-limitation review finding | informational | 1st | HOLD (VERIFY candidate; queues w28-obs4 + w29-obs2 for slot 2) |

Dropped: signal 1 (migration-before-cutover — a standing violation-free practice across every migration-bearing wave, not an L-2 signal), signal 5 (sub-agent incomplete-handoff — too operational, already default behavior), signal 6 (credential-blocked-milestone-as-hard-fork — not falsifiable, threshold undefined; same as wave-29 determination).

## Promotions this wave — 0
All 3 are 1st-instance HOLDs. No karen vetting required. obs-1 + obs-2 are the highest-value HOLDs (both strong, mutation-genuine-test-backed) — promotable on a 2nd confirming instance.

## Deliverable
```yaml
l2_stage_verdict: COMPLETE
tasks_marked_done: [4a4c2715, c5c30363, 0ba853e2]
observations_captured: 3
promotions: 0
holds: [obs-1 (BUILD), obs-2 (BUILD), obs-3 (VERIFY)]
milestone_delta: {M5: "12 done → 15 done", metric_met: true, transition: none, stays: in_progress}
n_block_carry: "dispose M5's 6 open non-metric tasks (3ad35a42,4b397de0,6f257c82,72cb6ebb,226c7e42,fdb444fc) then close M5 → done; promote M6 (voice/video)"
followup_filed_at_b6: 4905dc3a
```
