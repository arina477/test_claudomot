# N-2 — Seed (wave-53 → wave-54 bundle)

Owner: head-next. Picks the next bundle under active milestone M8 per N-1 disposition. Never writes `status`/`wave_id` (B-0 claims; L-2 closes).

## Action 1 — Pick the seed
Per N-1 disposition (security-first drain, wave-53 continuation), the seed is **`c52a7a52`**, re-ordered ahead of pure oldest-`created_at` per N-2 Action 1's LLM re-order allowance (the milestone scope needs the info-disclosure hardening class closed app-wide next; it is also, coincidentally, the newest candidate — the mvp-thinner THIN split authored this wave).

- `seed_task_id`: `c52a7a52-c2da-48d7-ac08-a8d849e9f429`
- `seed_task_title`: "App-wide sweep: apply UUID-format guard to all remaining client-serverId/roomId uuid-cast sites (info-disclosure hardening)"

## Action 2 — Load siblings
```sql
SELECT id FROM tasks WHERE parent_task_id='c52a7a52-...' AND status='todo' AND wave_id IS NULL;
```
→ 0 rows. `bundled_sibling_ids = []`. Single-task bundle (valid). The sweep is deliberately kept un-entangled; the DM-scale pair `c5051444`+`874bd233` remains a natural *later* 2-task bundle, not picked now.

## Action 3 — Validate the bundle
```sql
SELECT id, status, wave_id, milestone_id, parent_task_id FROM tasks WHERE id = ANY(ARRAY['c52a7a52-...']::uuid[]);
```
Result (live):
| id | status | wave_id | milestone_id | parent_task_id |
|---|---|---|---|---|
| c52a7a52-c2da-48d7-ac08-a8d849e9f429 | todo | NULL | 84e17739-...(M8) | NULL |

Per-row checks — all PASS:
- `status = 'todo'` ✓
- `wave_id IS NULL` ✓
- `milestone_id = 84e17739` (active M8) ✓
- seed `parent_task_id IS NULL` ✓ (no strand risk — matches MEMORY: V-2/mvp-thinner follow-up seeds MUST be top-level to be seedable)

Validation: **pass**.

## Action 5 — Emit claimed_task_ids
`claimed_task_ids = [c52a7a52-c2da-48d7-ac08-a8d849e9f429]` — B-0 (wave-54) claims this batch; L-2 (wave-54) closes it.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: c52a7a52-c2da-48d7-ac08-a8d849e9f429"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: c52a7a52-c2da-48d7-ac08-a8d849e9f429
seed_task_title: "App-wide sweep: apply UUID-format guard to all remaining client-serverId/roomId uuid-cast sites (info-disclosure hardening)"
bundled_sibling_ids: []
claimed_task_ids: [c52a7a52-c2da-48d7-ac08-a8d849e9f429]
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
queue_exhausted: false
validation_failed: false
note: "Single-seed bundle — app-wide info-disclosure hardening sweep, reuses wave-53's shipped guard. DM-scale pair (c5051444+874bd233) deferred as a natural later 2-task bundle."
```

## head_signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Bundle WIP-limited to one seed + 0 tightly-scoped siblings. Seed has parent_task_id IS NULL;
    no siblings to sequence. Seed carries milestone_id=M8, wave_id=NULL, status='todo' — all four
    Action-3 validation columns confirmed against the live tasks table. Bundle was authored by the
    mvp-thinner THIN split at wave-53 P-0 (an in-ritual pathway), not hand-INSERTed at N-2. No bundle
    bloat: the cross-cutting security sweep is intentionally un-entangled from unrelated DM work.
  next_action: PROCEED_TO_N-3
```
