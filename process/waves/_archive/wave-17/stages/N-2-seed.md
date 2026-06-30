# N-2 — Seed (wave-17 → seeds wave-18)

## Actions

- **Action 1 — pick seed:** Default oldest-first would return `d058283d` (tech-debt). Per N-2 Action 1 ("LLM may re-order … prefer whichever the milestone scope needs next") and the BOARD verdict `N-1-ordering-wave-17` (7/7 APPROVE B, threads-first), the seed is the threads data-plane task **`497c2ae6`** — "Implement thread-reply data plane and realtime fan-out". The 5 tech-debt seeds stay parked.
- **Action 2 — load siblings:** `WHERE parent_task_id = 497c2ae6 AND status='todo' AND wave_id IS NULL` → `6c008dd6` (thread-view panel + parent affordance), `0b728319` (optimistic-send outbox parity for thread replies). `bundled_sibling_ids = [6c008dd6, 0b728319]`.
- **Action 3 — validate:** all 3 rows confirmed `status=todo`, `wave_id=NULL`, `milestone_id=6198650e`; seed `parent_task_id=NULL`; both siblings `parent_task_id=497c2ae6`. **PASS.**
- **Action 4 — empty-queue path:** not taken (seed found).
- **Action 5 — emit:** `claimed_task_ids = [497c2ae6, 6c008dd6, 0b728319]` (seed first). Dependency order: data plane (seed) → UI panel + outbox parity (siblings); no sibling depends on an unbuilt later sibling.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 497c2ae6-844b-4910-9f21-677a536d2dc2"
  - "bundled siblings: 2"
  - "validation: pass"
seed_task_id: 497c2ae6-844b-4910-9f21-677a536d2dc2
seed_task_title: "Implement thread-reply data plane and realtime fan-out"
bundled_sibling_ids:
  - 6c008dd6-d904-457b-966b-dcafe029a7d6
  - 0b728319-bc09-4847-bef5-3b9c2f3a228c
claimed_task_ids:
  - 497c2ae6-844b-4910-9f21-677a536d2dc2
  - 6c008dd6-d904-457b-966b-dcafe029a7d6
  - 0b728319-bc09-4847-bef5-3b9c2f3a228c
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
queue_exhausted: false
validation_failed: false
note: "BOARD-directed seed (threads) over oldest-first (tech-debt). wave-18 likely a UI wave (P→D→B…) — thread panel is a design gap in server-channel-view.html per decomposer."
```

## head_signoff (head-next)

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Bundle WIP-limited to 1 seed + 2 tightly-scoped siblings. Seed has parent_task_id IS NULL;
    both siblings parent_task_id = seed.id. Every bundled task carries milestone_id=M3, wave_id=NULL,
    status=todo — re-confirmed against the live DB at Action 3. Dependencies sequenced (data plane →
    UI/outbox; no forward dependency on an unbuilt sibling). Authored by the milestone-decomposer
    ritual, not hand-INSERTed. Seed selection follows the BOARD scope-need directive, a legal N-2
    Action 1 re-order.
  next_action: PROCEED_TO_N-3
```
