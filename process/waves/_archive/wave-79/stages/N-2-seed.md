# N-2 — Seed (wave-79 → wave-80 bundle)

## Action 1 — Seed pick

Oldest `parent_task_id IS NULL` / `wave_id IS NULL` / `status='todo'` task under M13:

- **Seed:** `3038a4bc-8eeb-49aa-ab3c-096e1ff5b8e1` — "Add read-receipt and presence privacy controls to settings" (M13 leg-3b, split out at wave-79 P-0).

(Transient `57014` statement-timeout on first attempt; retried per call-site policy — not an infra hard-stop. Retry returned the row.)

## Action 2 — Siblings

`SELECT ... WHERE parent_task_id='3038a4bc...'` → 0 rows. Single-task bundle (valid).

## Action 3 — Validation

```
id=3038a4bc | status=todo | wave_id=NULL | milestone_id=b7400254(M13) | parent_task_id=NULL
```

- status = 'todo' ✓
- wave_id IS NULL ✓
- milestone_id = M13 ✓
- no siblings to check

Validation PASS. Did NOT set wave_id/status — B-0 of wave-80 claims the bundle.

## Carry-forward note for wave-80 P-0

Leg-3b was flagged at wave-79 P-0 as having a scope hole: `sendReadReceipts` gates a read-receipt feature that does not exist yet. Wave-80 P-0 must resolve this hole (either build the read-receipt primitive first, or narrow the AC to presence-only + a deferred read-receipt sibling).

## Deliverable footer

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 3038a4bc-8eeb-49aa-ab3c-096e1ff5b8e1"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: 3038a4bc-8eeb-49aa-ab3c-096e1ff5b8e1
seed_task_title: "Add read-receipt and presence privacy controls to settings"
bundled_sibling_ids: []
claimed_task_ids: [3038a4bc-8eeb-49aa-ab3c-096e1ff5b8e1]
active_milestone_id: b7400254-9c16-4b97-a898-2619b949fc5e
queue_exhausted: false
validation_failed: false
note: "Single-task bundle (leg-3b). Wave-80 P-0 must resolve the sendReadReceipts scope hole (gates a read-receipt feature that doesn't exist yet)."
```
