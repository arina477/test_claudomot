# N-2 — Seed (wave-19 → wave-20)

n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 92d85e0e-87de-459a-8f84-468ad3bc4135"
  - "bundled siblings: 3"
  - "validation: pass"
seed_task_id: 92d85e0e-87de-459a-8f84-468ad3bc4135
seed_task_title: "Idempotent message-send contract (UNIQUE idempotency_key + replay-safe POST)"
bundled_sibling_ids:
  - 7332a4b8-9815-402b-8bac-c6d164039422   # IndexedDB local store foundation (cached reads + outbox table)
  - 9a4ab31d-3628-4980-9e43-54c20c6801b2   # Outbox enqueue + optimistic-send integration into the M3 send-path
  - e29f6566-60a2-49bd-aa40-90578a77ddf8   # Offline send-path test harness (fake-indexeddb unit + idempotency integration)
claimed_task_ids:
  - 92d85e0e-87de-459a-8f84-468ad3bc4135
  - 7332a4b8-9815-402b-8bac-c6d164039422
  - 9a4ab31d-3628-4980-9e43-54c20c6801b2
  - e29f6566-60a2-49bd-aa40-90578a77ddf8
active_milestone_id: eb2a1688-c6b5-416c-84b4-3ede41d07b4c
queue_exhausted: false
validation_failed: false
note: >
  Seed pick (Action 1) applied LLM re-ordering, not raw oldest-created_at. The raw seed-candidate query
  returned 6 top-level rows: 5 re-homed M3 tech-debt tasks (d058283d, 6a546c7b, 02fa8011, d23a0740,
  c18b8089) + the new offline-first seed 92d85e0e. The 5 tech-debt rows are carried-forward backlog, NOT
  M4 offline-first feature seeds; M4's ## Scope (offline-first) is unshipped and the freshly-authored
  exactly-once send-path seed 92d85e0e is exactly what the milestone scope needs next. Picked 92d85e0e per
  the N-2 "prefer whichever the milestone scope needs next" allowance. The tech-debt remains M4 backlog for
  later P-0 unassigned/decomposition passes. Action 3 validation passed on all 4 bundle rows: status=todo,
  wave_id IS NULL, milestone_id=eb2a1688, siblings parent_task_id=92d85e0e. Bundle ~2,800–3,800 LOC / ~20–30
  files — within the P-1 rubric. Wave-20 P-0 carries an IndexedDB-wrapper (Dexie + fake-indexeddb) SDK-research
  dependency (encoded in seed/sibling prose); no founder credential-ask (client-side only).
