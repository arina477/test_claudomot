# N-2 — Seed (wave 1 → wave 2 bundle)

Pick the next bundle under active milestone M1 (`5a6efc9e-9de7-4594-a75d-d45e30d9a417`).

## Action 1 — Pick the seed
Two seed candidates (`parent_task_id IS NULL`, `wave_id IS NULL`, `status='todo'`, same `created_at`):

| id | title |
|---|---|
| `b9118041-06c0-4478-9d15-dfc715e3b97a` | Postgres + Drizzle + SuperTokens auth backend |
| `9aae8255-34b3-4f63-bdd4-97f39cf1d842` | Auth + profile frontend pages |

**Picked: `b9118041` (auth backend).** Dependency-ordered choice — the auth/profile frontend (`9aae8255`)
consumes the auth backend's session/cookie contract, so the backend must ship first. WIP-limit holds: one seed,
frontend deferred to a subsequent wave. (Tie on `created_at`; the backend is the prerequisite, so it leads.)

## Action 2 — Load siblings
`SELECT … WHERE parent_task_id = 'b9118041…' AND status='todo' AND wave_id IS NULL` → **0 rows.**
This is a single-task bundle (valid). The 3 V-2 follow-ups (`c51589cd`, `e38c306e`, `a7667fb7`) carry
`wave_id=wave-1` and are NOT siblings of this seed (`parent_task_id IS NULL`); they remain tracked M1 work,
not part of the wave-2 bundle.

## Action 3 — Validate the bundle
`SELECT id, status, wave_id, milestone_id, parent_task_id FROM tasks WHERE id = ANY([b9118041])`:

| check | expected | actual | result |
|---|---|---|---|
| `status` | `todo` | `todo` | PASS |
| `wave_id` | NULL | NULL | PASS |
| `milestone_id` | `5a6efc9e…` (active) | `5a6efc9e…` | PASS |
| `parent_task_id` | NULL (seed) | NULL | PASS |

**Validation: PASS.**

## Action 5 — Emit claimed_task_ids
`claimed_task_ids = [b9118041-06c0-4478-9d15-dfc715e3b97a]`. Propagates to N-3 handoff, wave-2 B-0 (claim
batch), and wave-2 L-2 (close batch).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: b9118041-06c0-4478-9d15-dfc715e3b97a"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: b9118041-06c0-4478-9d15-dfc715e3b97a
seed_task_title: "Postgres + Drizzle + SuperTokens auth backend"
bundled_sibling_ids: []
claimed_task_ids:
  - b9118041-06c0-4478-9d15-dfc715e3b97a
active_milestone_id: 5a6efc9e-9de7-4594-a75d-d45e30d9a417
queue_exhausted: false
validation_failed: false
note: >
  Single-task bundle (auth backend). Auth/profile frontend (9aae8255) deferred to a later wave — it depends on
  this backend's session contract. SECURITY-SCOPE CARRY-FORWARD: this seed touches auth (signup/login/sessions/
  cookies/CSRF/rate limits), so wave-2 P-4 MUST apply the security-scope tightened gate and wave-2 must run the
  T-8 Security stage. Recorded here so wave-2's P-0/P-4 inherit it.
```

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Bundle WIP-limited to one seed + zero siblings. Seed has parent_task_id IS NULL; no sibling depends on an
    unbuilt later sibling (none exist). All bundled-task columns correct (milestone_id=active, wave_id=NULL,
    status=todo), verified against the live DB. No out-of-ritual INSERT — N-2 only identifies, never writes status.
    Dependency sequencing respected: auth backend leads, auth frontend deferred. Security-scope carry-forward
    recorded for wave-2 P-4.
  next_action: PROCEED_TO_N-3
```
