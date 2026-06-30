# N-2 — Seed (wave-18 close-out → wave-19 bundle)

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 20db0c16-f894-4c84-a441-0a52559d628c (attachment upload/storage data plane)"
  - "bundled siblings: 2 (7c39c9e3 composer send, cf1ae370 message-row render)"
  - "validation: pass (all 3 todo / wave_id NULL / milestone_id=M3 / siblings parent_task_id=seed.id)"
seed_task_id: 20db0c16-f894-4c84-a441-0a52559d628c
seed_task_title: "Implement attachment upload/storage data plane (object storage + ≤10MB)"
bundled_sibling_ids:
  - 7c39c9e3-b6e9-48bd-b61c-c8b53334d33a
  - cf1ae370-a7a1-4ee9-8f7c-a03fdc07276e
claimed_task_ids:
  - 20db0c16-f894-4c84-a441-0a52559d628c
  - 7c39c9e3-b6e9-48bd-b61c-c8b53334d33a
  - cf1ae370-a7a1-4ee9-8f7c-a03fdc07276e
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
queue_exhausted: false
validation_failed: false
note: >
  Action 1 LLM re-ordering applied (the stage explicitly permits this — "prefer whichever the milestone
  scope needs next"). M3 holds 6 top-level seed candidates; the attachments seed 20db0c16 is the NEWEST
  by created_at (16:02), so the default oldest-created pick would have selected d058283d (invite-rotation
  tech-debt) — the exact feature-displacement the wave-17 BOARD BINDING (N-1-ordering-wave-17, feature-
  first) forbids. Governing override: pick the attachments feature seed. The 5 parked tech-debt seeds
  stay todo/wave_id NULL (not cancelled) for future M3 closeout waves. Single-bundle WIP discipline held.
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Bundle limits WIP to one seed + 2 tight siblings. Seed has parent_task_id IS NULL; both siblings
    parent_task_id = seed.id. All three carry milestone_id=M3, wave_id=NULL, status=todo (validated against
    the live tasks table at Action 3). Dependencies sequenced: seed (data plane/contract) lands first;
    composer-send + message-row-render siblings both consume the seed contract and do not depend on each
    other. Bundle was authored by the milestone-decomposer ritual, not hand-INSERTed. Seed pick honors the
    wave-17 feature-first binding rather than the bare oldest-created default.
  next_action: PROCEED_TO_N-3
```
