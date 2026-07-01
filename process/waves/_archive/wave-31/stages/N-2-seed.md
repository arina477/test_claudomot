# N-2 — Seed (wave-31 → wave-32)

Bundle picked + validated against the live `tasks` table this turn. N-2 only identifies; never writes status (B-0 claims, L-2 closes).

## Actions

- **Action 1 — Pick the seed:** query (`milestone_id=M6`, `status='todo'`, `wave_id IS NULL`, `parent_task_id IS NULL`, oldest) → **`78f51968-2c48-4368-93d4-7d3f02111a7b`** "Add who's-in-room voice occupancy indicator". The mvp-thinner split-out from wave-31's original bundle. Sole candidate.
- **Action 2 — Load siblings:** query (`parent_task_id=78f51968`, `status='todo'`, `wave_id IS NULL`) → **0 rows**. Single-task bundle (valid).
- **Action 3 — Validate:** seed re-confirmed against DB — `status='todo'` ✓, `wave_id IS NULL` ✓, `milestone_id=8702a335 (M6)` ✓, `parent_task_id IS NULL` ✓. Validation **PASS**.
- **Action 4 — Empty-queue path:** not reached (seed found).
- **Action 5 — Emit:** `claimed_task_ids = [78f51968-2c48-4368-93d4-7d3f02111a7b]`.

## Carry note for wave-32 P-0

Occupancy (who's-in-room) reads LiveKit room occupancy server-side → like the token-mint, it is **credential-dependent for LIVE verification but buildable credential-independent** (code + tests with a mock/placeholder). LiveKit creds still not set → same build-now-defer-live-verify pattern as token-mint (VERIFY rule 2 / credential-independent-build). Likely a **small design_gap** (small UI + a server occupancy query) or reuse of the existing voice-study-room surface — P-1 decides the D-block skip.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 78f51968-2c48-4368-93d4-7d3f02111a7b"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: 78f51968-2c48-4368-93d4-7d3f02111a7b
seed_task_title: "Add who's-in-room voice occupancy indicator"
bundled_sibling_ids: []
claimed_task_ids: [78f51968-2c48-4368-93d4-7d3f02111a7b]
active_milestone_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
queue_exhausted: false
validation_failed: false
note: "Single-task bundle — WIP-minimal, not bloat. Seed selected (pre-existing top-level todo), not INSERTed. LiveKit-creds-pending carry for wave-32 live-verify."
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Single-task bundle (seed 78f51968, 0 siblings) is WIP-minimal — opposite of
    bundle-bloat. Seed validated (parent NULL, status=todo, wave_id NULL, milestone=M6);
    sibling-FK/sequencing vacuously satisfied. No out-of-ritual INSERT — N-2 selects an
    existing top-level todo task as seed, inserts nothing. A single-task bundle is a
    complete buildable seed with zero preemptive-pause implication; loop proceeds to
    wave-32 P-0. Carry note is P-0 guidance, not a pause trigger.
  next_action: PROCEED_TO_N-3
```
