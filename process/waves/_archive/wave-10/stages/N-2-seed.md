# N-2 — Seed (wave-10 → wave-11)

Mode: automatic. head-next gate: APPROVED.

## Bundle pick

- **Seed (Action 1):** `4a2ad286-c068-406b-a2b3-4fee2a4d528b` — "Provision a persistent verified prod test fixture."
  - 4 equal-priority seed candidates under M3 (3 share `created_at` 17:27, 1 is 19:37). LLM re-order per N-2 Action 1: selected `4a2ad286` over the oldest-tie test-infra tasks because the L-block flagged it ESCALATION-CRITICAL (4 consecutive authed-feature waves without a verified prod fixture). It gates live C-2/T-8 verification of all authed/session-gated routes, so it must precede M3's authed/messaging build to de-risk it.
- **Siblings (Action 2):** none (`parent_task_id = 4a2ad286` → 0 rows). Single-task bundle (valid). The other 3 reassigned tasks remain independent top-level seed candidates for future M3 waves — NOT force-bundled (avoids bundle bloat).
- **Validation (Action 3):** PASS. `4a2ad286`: status=todo, wave_id NULL, milestone_id=M3 (`6198650e…`), parent_task_id NULL.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 4a2ad286-c068-406b-a2b3-4fee2a4d528b"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: 4a2ad286-c068-406b-a2b3-4fee2a4d528b
seed_task_title: "Provision a persistent verified prod test fixture"
bundled_sibling_ids: []
claimed_task_ids: [4a2ad286-c068-406b-a2b3-4fee2a4d528b]
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
queue_exhausted: false
validation_failed: false
note: "Single-task test-infra bundle; verified-prod fixture gates M3's authed/messaging waves. 3 sibling-eligible M3 seed candidates left independent for future waves."
```
