# N-2 — Seed (wave-38 → wave-39)

Pick the next bundle under M7 (`6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007`) for wave-39.

## Actions

- **Action 1 — Pick the seed:** two equivalent candidates (`todo`, `wave_id NULL`, `parent_task_id NULL`, under M7). Default heuristic (oldest `created_at`) AND value judgment agree on **`c208e91e`** ("Wire the profile-settings entry so avatar upload is reachable in the UI"):
  - `c208e91e` created `2026-07-03 10:13:16.150` (oldest).
  - `7525b759` created `2026-07-03 10:13:16.203`.
  - `c208e91e` is the F1 fix from this wave's T-5 — it completes the *user-reachability* of the avatar feature whose storage go-live this wave delivered. Highest value, buildable now, zero founder dependency. `7525b759` (LOW-severity endpoint hardening) is deferred to a future seed; it is a **top-level** task (`parent_task_id NULL`), NOT a child of `c208e91e`, so it is not a sibling.
- **Action 2 — Load siblings:** `SELECT ... WHERE parent_task_id='c208e91e...'` → **zero rows**. Single-task bundle.
- **Action 3 — Validate bundle** `[c208e91e]`:
  - `status='todo'` ✓
  - `wave_id IS NULL` ✓
  - `milestone_id = 6e2f68d8-...` (M7) ✓
  - siblings: n/a (empty)
  - **Validation: PASS.**
- **Action 5 — Emit:** `claimed_task_ids = [c208e91e-f3d8-4ca9-87be-2adda2808b54]`.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: c208e91e-f3d8-4ca9-87be-2adda2808b54"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: c208e91e-f3d8-4ca9-87be-2adda2808b54
seed_task_title: "Wire the profile-settings entry so avatar upload is reachable in the UI"
bundled_sibling_ids: []
claimed_task_ids: [c208e91e-f3d8-4ca9-87be-2adda2808b54]
active_milestone_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
queue_exhausted: false
validation_failed: false
note: "7525b759 (LOW avatar-endpoint hardening) is a top-level candidate held as a future seed, not a sibling of c208e91e."

head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    WIP-limited to one seed + zero siblings. Seed has parent_task_id IS NULL; no sibling
    depends on unbuilt work (none exist). All bundle columns verified against the live DB:
    milestone_id=M7, wave_id=NULL, status=todo. No out-of-ritual INSERT — this bundle was
    authored by the milestone-decomposer during M7's active life and is only being selected
    here. No bundle bloat: the LOW-priority hardening task is deliberately left as a future
    seed rather than crammed in.
  next_action: PROCEED_TO_N-3
```
