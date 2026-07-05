# N-2 — Seed (wave-52)

Single-seed bundle per N-1 disposition. Seed picked = `fb1c367a` — the study-room + app-wide non-UUID `serverId` info-disclosure security fix (F-1). Chosen as a quality/security-first drain of the M8 hardening tail, overriding pure oldest-`created_at` ordering (LLM re-order permitted by N-2 Action 1 when the milestone scope needs it next). M8 substantive scope has shipped; the remaining M8 queue is polish/hardening being drained wave-by-wave.

- Seed row confirmed against live `tasks`: `status='todo'`, `wave_id IS NULL`, `parent_task_id IS NULL`, `milestone_id = 84e17739-af5e-4396-beb9-b6f3d6836fc4` (M8).
- Siblings (`parent_task_id = <seed>` AND `status='todo'` AND `wave_id IS NULL`): 0 rows → single-task bundle (valid).
- Action 3 validation batch (`id = ANY(claimed_task_ids)`): per-row checks pass.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: fb1c367a-4f63-47a5-8f35-10a8d0fd492a"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: fb1c367a-4f63-47a5-8f35-10a8d0fd492a
seed_task_title: "study-room + app-wide: non-UUID serverId leaks raw DB error via gateway catch (info-disclosure)"
bundled_sibling_ids: []
claimed_task_ids: [fb1c367a-4f63-47a5-8f35-10a8d0fd492a]
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
queue_exhausted: false
validation_failed: false
note: "Single-seed security-first drain of the M8 hardening tail (info-disclosure F-1). Seed re-ordered ahead of pure oldest-created_at per N-2 Action 1 (quality/security-first). DM-scale pair c5051444+874bd233 is a natural later 2-task bundle."
```

---
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Seed fb1c367a computed from the live tasks table (not a sidecar). Exactly one
    seed, zero siblings — WIP-limited single-task bundle. Every stage-exit check
    ticked from concrete DB state: seed parent_task_id IS NULL; milestone_id =
    active M8; wave_id IS NULL; status='todo'. Dependencies trivially sequenced
    (single task). No hand-INSERT — bundle members already exist in the queue from
    prior decomposition; N-2 only identifies, never writes status.
  next_action: PROCEED_TO_N-3
