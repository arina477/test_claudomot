# N-2 — Seed (wave-56)

## Actions

- **Action 1 — pick seed:** Among 6 M8 seed candidates, LLM-selected **ff09c4c9** (DM→server return: ServerRail selectServer/Home should exit dmHomeActive — a real UX correctness bug) over oldest `created_at`. Rationale: highest residual value of the 6 — the others are test debt (f8eb49c1, a1dda389), cosmetic token polish (5bcbd27f), throttle/backoff policy (874bd233), and premature-at-zero-users pagination (999a14d1, explicitly do-not-auto-drain). A correctness bug outranks test/cosmetic/throttle work.
- **Action 2 — siblings:** 0 rows (`parent_task_id = ff09c4c9`). Single-task bundle — valid.
- **Action 3 — validate:** PASS. `status=todo`, `wave_id IS NULL`, `milestone_id=84e17739` (M8), `parent_task_id IS NULL`.
- **Action 5 — claimed_task_ids:** `[ff09c4c9-1fea-4d70-bd03-0f0a8742a5f5]`.

**999a14d1 deliberately NOT seeded** — pagination/load-more is premature at zero users; its own title marks it "deferred to a real later point." Draining it would manufacture low-value work.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: ff09c4c9-1fea-4d70-bd03-0f0a8742a5f5"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: ff09c4c9-1fea-4d70-bd03-0f0a8742a5f5
seed_task_title: "DM->server return: ServerRail selectServer/Home should exit dmHomeActive"
bundled_sibling_ids: []
claimed_task_ids: [ff09c4c9-1fea-4d70-bd03-0f0a8742a5f5]
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
queue_exhausted: false
validation_failed: false
note: "head-next APPROVED (PROCEED_TO_N-3). Single-seed, no bundle bloat. 999a14d1 excluded (do-not-auto-drain)."

head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {head-next: APPROVED}
  failed_checks: []
  rationale: "WIP-limited to 1 seed + 0 siblings. ff09c4c9 is the only genuine correctness bug among 6 candidates; ranked above test/cosmetic/throttle/deferred items. Validated against live table: todo/wave_id NULL/parent NULL/milestone_id=M8. Seed is selected (pre-existing decomposer row), not hand-INSERTed. 999a14d1 correctly excluded."
  next_action: PROCEED_TO_N-3
```
