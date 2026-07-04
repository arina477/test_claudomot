# N-2 — Seed (wave-47 N-block)

## Seed selection

Per BOARD N-1-wave-48-direction: wave-48 = DM-polish/hardening bundle. All 7 open M8 candidates are independent top-level seeds (`parent_task_id IS NULL`) — there is NO pre-formed FK bundle. N-2 picks ONE seed; its FK-linked sibling set is empty (a valid single-task bundle per N-2 Action 2).

**No decomposer fired:** the milestone-decomposition ritual's Step 1 validation (condition 4, `next-bundle` mode) requires `seed_candidates = 0`. Here `seed_candidates = 7`, so the ritual would refuse (`validation-failed`). N-2 does NOT hand-INSERT or re-parent tasks (rule 15 / out-of-ritual-INSERT anti-pattern). Bundle expansion, if wave-48 falls below the P-1 floor, is P-1 RESCOPE-AUTO-MERGE's job (`expand-current-bundle` mode, which IS supported and takes the seed id) — not N-2's.

### Action 1 — Seed pick
Candidates (7, by created_at): f8eb49c1, a1dda389, 39fc1c5e, 5bcbd27f, 03ccf636, 874bd233, c5051444.

Per N-2 Action 1 LLM re-ordering ("prefer whichever the milestone scope needs next"): selected **`03ccf636`** — "DM: live-prove who_can_dm=nobody exclusion + candidate negative-isolation." Rationale: the BOARD's strongest cross-cutting signal was hardening the SHIPPED DM privacy/correctness surface; both (a)-voters (realist, risk-officer) centered this exact item — risk-officer: "proves the trust-boundary exclusion actually holds"; realist: evidence-grounded test-coverage on a shipped privacy-sensitive feature. It anchors the live bet's "privacy controls" wedge. The premature-scale item (c5051444 getDmCandidates pagination) was deprioritized per realist + counter-thinker.

- `seed_task_id` = `03ccf636-ceb2-4ebc-aff7-6c55e8283521`
- `seed_task_title` = "DM: live-prove who_can_dm=nobody exclusion + candidate negative-isolation"

### Action 2 — Siblings
`SELECT ... WHERE parent_task_id = 03ccf636... AND status='todo' AND wave_id IS NULL` → **0 rows**. Single-task bundle (valid). The other 6 follow-ups remain independently seedable for later waves (or P-1 expand).

### Action 3 — Validation → PASS
Seed row: `status=todo`, `wave_id=NULL`, `milestone_id=84e17739` (M8), `parent_task_id=NULL`. All checks pass.

### Action 5 — claimed_task_ids
`claimed_task_ids = [03ccf636-ceb2-4ebc-aff7-6c55e8283521]`.

---

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 03ccf636-ceb2-4ebc-aff7-6c55e8283521"
  - "bundled siblings: 0 (single-task bundle; all 7 candidates are independent top-level seeds)"
  - "validation: pass (status=todo, wave_id=NULL, milestone_id=M8, parent=NULL)"
seed_task_id: 03ccf636-ceb2-4ebc-aff7-6c55e8283521
seed_task_title: "DM: live-prove who_can_dm=nobody exclusion + candidate negative-isolation"
bundled_sibling_ids: []
claimed_task_ids: [03ccf636-ceb2-4ebc-aff7-6c55e8283521]
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
queue_exhausted: false
validation_failed: false

head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Bundle limits WIP to one seed (single-task, 0 siblings) — well within the WIP-limit.
    Seed has parent_task_id IS NULL; no siblings to sequence. All bundle columns validated
    against the live DB (todo / wave_id NULL / milestone M8). No task was hand-INSERTed or
    re-parented — the 7 candidates pre-exist as clean seeds; the decomposer was correctly
    NOT fired (its seed_candidates=0 gate does not hold at 7). Seed pick honors the BOARD's
    DM-hardening direction, prioritizing the highest-value privacy-correctness item over the
    premature-scale item. P-1 RESCOPE-AUTO-MERGE at wave-48 owns any floor-driven expansion.
  next_action: PROCEED_TO_N-3
note: "Single-task DM-hardening seed. Other 6 DM follow-ups stay seedable. Sub-floor risk is a wave-48 P-1 concern (expand-current-bundle), not N-2's."
```
