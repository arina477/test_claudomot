# N-2 — Seed (wave-8 close-out → wave-9 bundle)

> Block: N (Next). Stage N-2 of N-1 → N-2 → N-3. Mode: automatic. head-next gating.
> Active milestone: M2 — Servers, channels & membership (`41e61975-c92e-49b1-9ae5-45498dd04925`, in_progress).

## Action 1 — Pick the seed
Seed selection is the BOARD-ratified ordering from N-1 (`N-1-seed-priority-wave-9`, 5-1-1 APPROVE), NOT default oldest-`created_at`. N-2 grants the LLM re-ordering authority ("prefer whichever the milestone scope needs next"); the BOARD adopted the invite-completion slice over the older test/E2E follow-ups.

**seed_task_id:** `863c10ef-4f58-4451-9172-d319e751ec07` — "Invite-revoke endpoint + UI".

(The 3 test/E2E follow-ups — `46f16288`, `4a2ad286`, `25523fb0` — remain top-level M2 seed candidates for a later polish wave; not claimed.)

## Action 2 — Load siblings
`WHERE parent_task_id = 863c10ef AND status='todo' AND wave_id IS NULL` →
- `08ff762f-c4fb-4f80-87f6-e12796a2a485` — "8a: Backfill servers.invite_code for pre-existing rows"
- `5331b7d5-511c-4370-9d86-b6729b60ced5` — "8b: Share modal defaults to permanent invite code"

## Action 3 — Validate the bundle — PASS
```
id        | status | wave_id | milestone_id | parent_task_id
863c10ef  | todo   | NULL    | M2           | NULL          (seed)
5331b7d5  | todo   | NULL    | M2           | 863c10ef      (sibling)
08ff762f  | todo   | NULL    | M2           | 863c10ef      (sibling)
```
All rows: `status='todo'`, `wave_id IS NULL`, `milestone_id = M2`. Siblings `parent_task_id = seed`. No concurrent-write race. Validation PASS.

## Action 5 — claimed_task_ids
`[863c10ef-4f58-4451-9172-d319e751ec07, 08ff762f-c4fb-4f80-87f6-e12796a2a485, 5331b7d5-511c-4370-9d86-b6729b60ced5]`
B-0 of wave-9 claims this batch; L-2 closes it.

---

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 863c10ef-4f58-4451-9172-d319e751ec07 (invite-revoke endpoint + UI)"
  - "bundled siblings: 2 (08ff762f invite_code-backfill, 5331b7d5 share-modal-default)"
  - "validation: pass (3 rows; seed parent NULL, siblings parent=863c10ef, all todo/wave_id NULL/M2)"
seed_task_id: 863c10ef-4f58-4451-9172-d319e751ec07
seed_task_title: "Invite-revoke endpoint + UI"
bundled_sibling_ids:
  - 08ff762f-c4fb-4f80-87f6-e12796a2a485
  - 5331b7d5-511c-4370-9d86-b6729b60ced5
claimed_task_ids:
  - 863c10ef-4f58-4451-9172-d319e751ec07
  - 08ff762f-c4fb-4f80-87f6-e12796a2a485
  - 5331b7d5-511c-4370-9d86-b6729b60ced5
active_milestone_id: 41e61975-c92e-49b1-9ae5-45498dd04925
queue_exhausted: false
validation_failed: false
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Bundle WIP-limited to one seed + two tightly-scoped invite-surface siblings (no bloat).
    Seed has parent_task_id IS NULL; both siblings parent_task_id = seed.id; all carry
    milestone_id = M2, wave_id NULL, status todo. Dependencies sequenced — backfill and
    share-modal-default are independent of and complementary to the revoke seed, no sibling
    depends on an unbuilt later sibling. The bundle was assembled from existing decomposer/
    V-2/L follow-up rows (authored in-ritual originally) and re-parented by an authorized
    N-1 ordering reconciliation; no hand-INSERT of new task rows. Validation passed against
    live DB.
  next_action: PROCEED_TO_N-3
note: "Wave-9 binding conditions (P-3 backfill idempotency/collision-safety, revoke affordance + server-side authz, RBAC=wave-10 seed) propagated to the wave-9 checklist by N-3."
```
