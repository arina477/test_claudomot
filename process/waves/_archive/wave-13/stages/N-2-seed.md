# N-2 — Seed (wave-13 → wave-14 bundle)

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: d1c4693d-b793-4960-8adf-f561aad20677"
  - "bundled siblings: 3"
  - "validation: pass (4/4 rows: status=todo, wave_id NULL, milestone_id=M3, siblings parent_task_id=seed)"
seed_task_id: d1c4693d-b793-4960-8adf-f561aad20677
seed_task_title: "Wire /presence Socket.IO namespace: online/offline tracking"
bundled_sibling_ids:
  - 58633934-e6c4-45a7-9432-62ab2d8adbac   # Add typing indicators over /presence namespace
  - 058984c5-b57a-4b8c-b2a5-cefce88357a9   # Build member-list panel with live presence on server-channel-view
  - 10b9d18e-5071-41dc-85de-ef257b9dfde0   # Add presence dots to message author rows and DM/member affordances
claimed_task_ids:
  - d1c4693d-b793-4960-8adf-f561aad20677
  - 58633934-e6c4-45a7-9432-62ab2d8adbac
  - 058984c5-b57a-4b8c-b2a5-cefce88357a9
  - 10b9d18e-5071-41dc-85de-ef257b9dfde0
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
queue_exhausted: false
validation_failed: false
note: >
  Seed pick: 4 raw top-level seed candidates existed (the just-authored presence seed + 3 parked tech-debt todos
  46f16288 / 25523fb0 / d058283d). Per N-2 Action 1 LLM re-ordering ("prefer whichever the milestone scope needs next"),
  picked the freshly-decomposed presence seed (created 2026-06-30T04:16) — the next-most-valuable M3 feature slice — over
  the parked tech-debt (deprioritized, no siblings, carried M2 lineage). The 3 tech-debt todos remain in M3's queue untouched,
  available for a later wave. Bundle: 1 seed + 3 siblings, ~2800 LOC, dependency-sequenced (presence namespace → typing →
  member panel → author dots; every sibling consumes the seed's /presence namespace — no sibling depends on an unbuilt later sibling).
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    WIP-limited to one seed + 3 tight siblings. Seed has parent_task_id IS NULL; every sibling has parent_task_id = seed.id.
    Every bundled task carries milestone_id = M3, wave_id = NULL, status = 'todo' (verified by Action 3 query, 4/4 pass).
    Dependencies sequenced — no sibling depends on an unbuilt later sibling. Bundle authored by the milestone-decomposer ritual,
    not hand-INSERTed. claimed_task_ids populated for B-0 claim / L-2 close. All N-2 exit checkboxes ticked.
  next_action: PROCEED_TO_N-3
```
