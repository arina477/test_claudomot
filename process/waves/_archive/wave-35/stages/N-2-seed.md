# N-2 — Seed (wave-35 → wave-36 bundle)

Head: head-next. Mode: automatic.

## Actions

- **Action 1 — pick seed:** Candidates (parent NULL, wave NULL, todo, M7), oldest-first: a1299e88 (2026-06-29, Resend domain — **credential-blocked, not buildable → skipped per brief**), then 622a7bf3 / 73e96a9d / b7feab30 (all 2026-07-02 16:48, V-2 follow-up batch). Judgment applied (N-2 Action 1 re-order allowance): seed = **622a7bf3** "Add automated tests for the M7 privacy endpoints" — the substantive buildable task and the one M7's polish scope needs next.
- **Action 2 — siblings:** The two tiny fixes (73e96a9d states-AC re-scope, b7feab30 Last-updated date) were independent top-level V-2 follow-ups. Per brief authorization, **re-parented under the seed** (`UPDATE tasks SET parent_task_id=622a7bf3 …`, 2 rows) to form one coherent WIP-limited polish wave rather than fragmenting trivial work across 3 waves. No INSERT — existing V-2 rows only re-grouped. `bundled_sibling_ids = [73e96a9d, b7feab30]`.
- **Action 3 — validate:** all 3 rows confirmed against DB — seed parent_task_id NULL; both siblings parent_task_id=622a7bf3; all `status=todo`, `wave_id=NULL`, `milestone_id=6e2f68d8` (M7). Dependencies sequenced: tests seed does not depend on the tiny fixes; the two fixes are mutually independent. **Validation PASS.**
- **Action 5 — claimed_task_ids:** `[622a7bf3, 73e96a9d, b7feab30]` (B-0 claims batch; L-2 closes batch).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 622a7bf3-94ff-464b-ad14-b37bcedf290d"
  - "bundled siblings: 2"
  - "validation: pass"
seed_task_id: 622a7bf3-94ff-464b-ad14-b37bcedf290d
seed_task_title: "Add automated tests for the M7 privacy endpoints"
bundled_sibling_ids:
  - 73e96a9d-bf8f-4999-8ea8-1446178955c7
  - b7feab30-77cf-4814-b170-d1541e58c677
claimed_task_ids:
  - 622a7bf3-94ff-464b-ad14-b37bcedf290d
  - 73e96a9d-bf8f-4999-8ea8-1446178955c7
  - b7feab30-77cf-4814-b170-d1541e58c677
active_milestone_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
queue_exhausted: false
validation_failed: false
note: "Coherent M7 privacy-polish + test-hardening wave-36. Credential-blocked a1299e88/84e09891 left unseeded."
```
