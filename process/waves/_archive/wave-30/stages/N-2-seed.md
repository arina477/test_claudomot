# N-2 — Seed (wave-30 → wave-31 bundle)

Mode: `automatic`. head-next gate: APPROVED (N-2, conditional on Action 3 validation echo — SATISFIED below).

## Actions

### Action 1 — Pick the seed
Active milestone = M6 (8702a335). Seed query (`parent_task_id IS NULL, wave_id IS NULL, status='todo', milestone_id=M6, ORDER BY created_at LIMIT 1`) returns exactly one candidate:
- `seed_task_id = d8a85de0-3015-45f0-84be-e879ccd90c91`
- `seed_task_title = "Implement VoiceModule LiveKit token-mint service"`

### Action 2 — Load siblings
`WHERE parent_task_id = d8a85de0 AND status='todo' AND wave_id IS NULL`:
- `1dd1f2ca-7679-4fc4-a130-4a6e2fe48e41` — Build minimal voice-study-room client join surface
- `78f51968-2c48-4368-93d4-7d3f02111a7b` — Add who's-in-room voice occupancy indicator

`bundled_sibling_ids = [1dd1f2ca, 78f51968]`.

### Action 3 — Validate the bundle (PASS)
Per-row re-confirm against the DB (`claimed_task_ids`):

| id | status | wave_id IS NULL | milestone_id=M6 | parent_task_id |
|---|---|---|---|---|
| d8a85de0 (seed) | todo | ✓ | ✓ | NULL ✓ |
| 1dd1f2ca | todo | ✓ | ✓ | d8a85de0 ✓ |
| 78f51968 | todo | ✓ | ✓ | d8a85de0 ✓ |

All checks pass. Validation: **pass**. Bundle is dependency-sequenced groundwork-first (server token-mint seed before client join + occupancy siblings). No sibling depends on an unbuilt later sibling.

### Action 5 — Emit claimed_task_ids
`claimed_task_ids = [d8a85de0, 1dd1f2ca, 78f51968]` → propagates to N-3 handoff, wave-31 B-0 claim batch, wave-31 L-2 close batch.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: d8a85de0-3015-45f0-84be-e879ccd90c91"
  - "bundled siblings: 2"
  - "validation: pass"
seed_task_id: d8a85de0-3015-45f0-84be-e879ccd90c91
seed_task_title: "Implement VoiceModule LiveKit token-mint service"
bundled_sibling_ids: [1dd1f2ca-7679-4fc4-a130-4a6e2fe48e41, 78f51968-2c48-4368-93d4-7d3f02111a7b]
claimed_task_ids: [d8a85de0-3015-45f0-84be-e879ccd90c91, 1dd1f2ca-7679-4fc4-a130-4a6e2fe48e41, 78f51968-2c48-4368-93d4-7d3f02111a7b]
active_milestone_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
queue_exhausted: false
validation_failed: false
note: "M6 first bundle (LiveKit voice groundwork). ~2200 LOC. design_gap likely TRUE (voice-study-room page) — expect a D-block in wave-31."

head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: "Action 3 validation echo confirms all 3 rows: status='todo', wave_id IS NULL, milestone_id=M6, seed parent_task_id IS NULL, both siblings parent_task_id=seed.id. Exactly one bundle, WIP-limited (1 seed + 2 siblings, ~2200 LOC), groundwork-first sequencing. Ritual-authored (milestone-decomposer), not hand-INSERTed. Conditional APPROVED now unconditional."
  next_action: PROCEED_TO_N-3
```
