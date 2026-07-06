# N-2 — Seed (wave-60 → wave-61)

Head-next gated: **APPROVED**.

## Bundle picked for wave-61

Single-task bundle (WIP-limited: 1 seed + 0 siblings). No decomposition ran this wave — a
pre-existing drainable M8 tail task is being seeded, not authored.

**Seed:** `874bd233-e5fc-4c29-a851-4474b330c0e6`
"DM: reconcile /dm/candidates throttle policy + message-poll 429 backoff"

### DB validation (live)

| Check | Result |
|---|---|
| exists | yes |
| `milestone_id = 84e17739` (M8 child) | yes |
| `status = 'todo'` | yes |
| `parent_task_id IS NULL` (valid seed) | yes |
| `wave_id IS NULL` (not claimed, seedable) | yes |
| not already claimed by any running wave | yes |

**Excluded:** `999a14d1-b744-4bb6-bd7e-80e11f4023af` (getDmCandidates pagination) — DO-NOT-AUTO-DRAIN, wave-56 deferral stands, premature at zero users.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed 874bd233-e5fc-4c29-a851-4474b330c0e6 validated: M8 child, todo, parent NULL, wave NULL, unclaimed"
  - "siblings: [] (single-task bundle)"
  - "excluded: 999a14d1 (do-not-auto-drain)"
seed_task_id: 874bd233-e5fc-4c29-a851-4474b330c0e6
bundled_sibling_ids: []
claimed_task_ids: [874bd233-e5fc-4c29-a851-4474b330c0e6]
loop_state: ready
note: "Last drainable M8 tail item. B-0 of wave-61 claims this list; L-2 of wave-61 closes it."

head_signoff:
  verdict: APPROVED
  stage: N-2-bundle
  reviewers: {}
  failed_checks: []
  rationale: >
    WIP-limited to one seed + 0 siblings. Seed validated against live DB (M8 child, todo,
    parent_task_id NULL, wave_id NULL, unclaimed). 999a14d1 correctly excluded. No
    out-of-ritual INSERT — pre-existing tail task seeded, not newly authored.
  claimed_task_ids: ["874bd233-e5fc-4c29-a851-4474b330c0e6"]
  next_action: PROCEED_TO_N-3
```
