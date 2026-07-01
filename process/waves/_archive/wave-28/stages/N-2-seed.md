# N-2 — Seed (wave-28)

Mode: `automatic`. head-next gate: **APPROVED** (agentId a6467c4a5561f5e97).

## Bundle pick (Actions 1–3 — verified against live Postgres)

- **Seed (Action 1):** `d23a0740-0326-4748-a158-62e69ea733e7` — "Presence/members code-debt: displayName empty-fallback + unused ServerMembers wrapper schema". Oldest top-level todo under M5 (created 2026-06-30), the only seed candidate.
- **Siblings (Action 2):** `parent_task_id = d23a0740` AND status='todo' AND wave_id IS NULL → **0 rows** → solo bundle → single-spec next wave.
- **Validation (Action 3):** seed row confirmed — `status='todo'`, `wave_id IS NULL`, `milestone_id = a5232e16` (M5), `parent_task_id IS NULL`. All checks pass. Authored by the milestone-decomposer ritual in a prior wave (no out-of-ritual INSERT).

`claimed_task_ids = [d23a0740-0326-4748-a158-62e69ea733e7]` — propagates to N-3 handoff, B-0 claim batch, and L-2 close batch.

**Wave-29 P-0 flag:** d23a0740 is a code-debt cleanup (presence/members displayName empty-fallback + unused-var / unused ServerMembers wrapper schema) — likely another sub-floor single-spec (the 8th M5-debt wave). The standing PRECEDENT-APPLICATION override-ship applies at wave-29 P-0 (disposition is a P-0 concern, not an N-2 gate item).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: d23a0740-0326-4748-a158-62e69ea733e7"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: d23a0740-0326-4748-a158-62e69ea733e7
seed_task_title: "Presence/members code-debt: displayName empty-fallback + unused ServerMembers wrapper schema"
bundled_sibling_ids: []
claimed_task_ids: [d23a0740-0326-4748-a158-62e69ea733e7]
active_milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
queue_exhausted: false
validation_failed: false
note: "Solo bundle → single-spec wave-29. Sub-floor single-spec likely; PRECEDENT-APPLICATION override-ship applies at wave-29 P-0."
```
