# N-2 — Seed (wave-34)

> Block: N (Next), stage N-2 (bundle pick). Owner: head-next (spawn-pattern). Mode: automatic.
> Picks the next wave's (wave-35) bundle under the active milestone M7.

## Actions

### Action 1 — Pick the seed

Two structural seed candidates under M7 (`parent_task_id IS NULL, wave_id IS NULL, status='todo'`):

| id | title | created_at | disposition |
|---|---|---|---|
| a1299e88 | Verify a Resend domain for transactional email | 2026-06-29 | **PARKED** — credential-blocked founder DNS/ops action; seeding it stalls the loop on a founder-ask |
| **56a50862** | **Build settings-privacy page: profile visibility + who-can-DM gating** | 2026-07-02 | **PICKED** — buildable, credential-independent, the M7 ## Success-metric-load-bearing piece |

**Re-order applied** per N-2 Action 1 ("LLM may re-order if multiple equivalent candidates exist — read prose, prefer whichever the milestone scope needs next"). The oldest candidate (a1299e88) is skipped because it is a founder-credential-blocked ops action; picking it would strand the autonomous loop. The buildable seed `56a50862` is selected. Divergence is documented in N-1 (Action 7) and confirmed by project-manager.

`seed_task_id = 56a50862-790e-4868-a5c5-305b08b81e40`
`seed_task_title = "Build settings-privacy page: profile visibility + who-can-DM gating"`

### Action 2 — Load siblings

`WHERE parent_task_id = 56a50862… AND status='todo' AND wave_id IS NULL`:

- `a4169fac` — Add account data view + data download request to settings-privacy
- `d40ece71` — Wire Sentry error tracking across api + web
- `13b7ebfd` — Add privacy/terms stub pages + empty/error/loading states across surfaces

`bundled_sibling_ids = [a4169fac, d40ece71, 13b7ebfd]` (3 siblings).

### Action 3 — Validate

Per-row check on `claimed_task_ids`:

| id | status | wave_id | milestone_id | parent_task_id | verdict |
|---|---|---|---|---|---|
| 56a50862 (seed) | todo | NULL | 6e2f68d8 (M7) | NULL | PASS |
| a4169fac | todo | NULL | 6e2f68d8 (M7) | 56a50862 | PASS |
| d40ece71 | todo | NULL | 6e2f68d8 (M7) | 56a50862 | PASS |
| 13b7ebfd | todo | NULL | 6e2f68d8 (M7) | 56a50862 | PASS |

Validation **PASS**. Bundle dependency-sequenced (Sentry wires before final deploy-verify; privacy page is the metric driver with no upstream blocker; account-data/download adjacent to seed surface; stubs + states standalone). No sibling depends on an unbuilt later sibling.

### Action 5 — Emit claimed_task_ids

`claimed_task_ids = [56a50862, a4169fac, d40ece71, 13b7ebfd]` — propagates to N-3 handoff, B-0 claim batch, L-2 close batch.

## Deliverable footer

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 56a50862-790e-4868-a5c5-305b08b81e40 (re-ordered over blocked a1299e88)"
  - "bundled siblings: 3"
  - "validation: pass"
seed_task_id: 56a50862-790e-4868-a5c5-305b08b81e40
seed_task_title: "Build settings-privacy page: profile visibility + who-can-DM gating"
bundled_sibling_ids: [a4169fac-a6d8-4f76-9d46-87c5207615e2, d40ece71-bf8c-4266-b921-b06ef3e12086, 13b7ebfd-6ae1-486b-87f2-d84894ed779d]
claimed_task_ids: [56a50862-790e-4868-a5c5-305b08b81e40, a4169fac-a6d8-4f76-9d46-87c5207615e2, d40ece71-bf8c-4266-b921-b06ef3e12086, 13b7ebfd-6ae1-486b-87f2-d84894ed779d]
active_milestone_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
queue_exhausted: false
validation_failed: false
note: >
  Wave-35 bundle = M7's first launch-polish slice. Seed re-ordered to the buildable
  credential-independent task; the older Resend-domain candidate is parked (founder-ops).

head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Bundle limits WIP to one seed + 3 tightly-scoped credential-independent siblings. Seed has
    parent_task_id NULL; every sibling carries parent=seed, milestone_id=M7, wave_id=NULL,
    status=todo (re-validated against the DB). Dependencies sequenced — no sibling depends on an
    unbuilt later sibling. Bundle authored by the milestone-decomposer ritual, not hand-INSERTed.
    Seed correctly re-ordered over the older credential-blocked candidate per N-2 Action 1
    authority to keep the loop flowing without a founder-ask stall.
  next_action: PROCEED_TO_N-3
```
