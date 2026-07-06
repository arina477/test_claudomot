# N-2 — Seed (wave-55)

Mode: automatic. head-next gate: APPROVED (see footer).

## Actions

### Action 1 — Pick the seed
Active milestone M8 (`84e17739-af5e-4396-beb9-b6f3d6836fc4`). 6 seed candidates (all `parent_task_id IS NULL`, `wave_id IS NULL`, `status='todo'`). Per N-2 Action 1 LLM re-order latitude ("prefer whichever the milestone scope needs next"), picked **`c5051444`** — "DM: add LIMIT/pagination to getDmCandidates for large-server scale" — over the oldest-`created_at` default. Rationale: this is the ONE high-leverage remaining M8 item (real scale-correctness — unbounded `getDmCandidates` co-member list, a wave-47 T-7-deferred scope-fence slice). The other 5 candidates are cosmetic/test-debt. Draining the high-leverage item keeps the loop shipping real value while the founder weighs the M9-vs-drain question (see N-1 soft flag).

### Action 2 — Load siblings
`SELECT ... WHERE parent_task_id = c5051444 AND status='todo' AND wave_id IS NULL` → 0 rows. Single-task bundle (valid).

### Action 3 — Validate the bundle
```
id                                    status  wave_id  milestone_id                          parent_task_id
c5051444-318f-4a90-a79a-947b4452e42f  todo    (null)   84e17739-af5e-4396-beb9-b6f3d6836fc4  (null)
```
- `status='todo'` ✓
- `wave_id IS NULL` ✓
- `milestone_id = $active` (M8) ✓
- seed `parent_task_id IS NULL` ✓ (no siblings to check)

Validation **PASS**.

### Action 5 — claimed_task_ids
`claimed_task_ids = [c5051444-318f-4a90-a79a-947b4452e42f]`. Propagates to N-3 handoff, B-0 (claim batch), L-2 (close batch).

---

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: c5051444-318f-4a90-a79a-947b4452e42f"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: c5051444-318f-4a90-a79a-947b4452e42f
seed_task_title: "DM: add LIMIT/pagination to getDmCandidates for large-server scale"
bundled_sibling_ids: []
claimed_task_ids: [c5051444-318f-4a90-a79a-947b4452e42f]
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
queue_exhausted: false
validation_failed: false
note: "Single-task bundle. Prose-driven pick of the one high-leverage scale-correctness item (DM pagination) over 5 cosmetic/test-debt candidates. Keeps loop shipping value while founder weighs M9 (soft-flagged at N-1)."

head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Seed c5051444 validated against live Postgres: status=todo, wave_id=NULL,
    milestone_id=M8, parent_task_id=NULL, 0 live siblings — the tightest possible
    WIP-limited bundle under the active milestone. Not hand-INSERTed (pre-existing
    M8 decomposition child); N-2 only identifies. The prose-driven pick of the one
    high-leverage scale-correctness item over 5 cosmetic/test-debt candidates is
    within N-2 Action 1 latitude. claimed_task_ids=[c5051444] correct.
  next_action: PROCEED_TO_N-3
```
