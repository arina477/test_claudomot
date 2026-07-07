# Wave 75 — V-2 Triage

Inputs: T-block findings-aggregate (6) + karen (2) + jenny (2), deduplicated. **0 blocking → wave ships.**

## Classification
```yaml
findings_input_count: 8   # 6 T + 2 karen + 2 jenny (overlaps merged)
findings_blocking: []
findings_non_blocking:
  - {id: T8-F1/jenny-G1, source: T-8 + V-1-jenny, summary: "educator-tools endpoint has no owner/member check (harmless now, load-bearing for real fenced tools)", task_id: ecf79f4a-42db-4536-a7e8-a94ebb408bec, milestone_id: 3e507bc0}
  - {id: T2-low, source: T-2, summary: "act() warnings on 19 pre-existing server-overview-settings tests (latent flake, head-builder accepted at B-6)", task_id: d28f6174-61c2-443a-ae16-44cb8cbbb917, milestone_id: null}
findings_tracked_elsewhere:
  - {id: T2-medium+T4-medium+karen (upsert unit-stubbed / uncommitted pg-harness test), tracked_by: "PR #94 + task ab75b8d8-5c85-4451-8540-dcb2f8077f75"}
  - {id: T4-low (truncateTables omits subscriptions), tracked_by: "fold into PR #94 work (ab75b8d8)"}
findings_noise:
  - {id: T1-info, source: T-1, summary: "11 as-any casts, ALL in test files, 0 in prod source", rationale: "standard Vitest mock-injection idiom; not a defect"}
  - {id: jenny-G2, source: V-1-jenny, summary: "panel prices $0/$8/$99 hardcoded frontend", rationale: "acceptable under the mock disclosure; authoritative pricing is inherent to the fenced real-Stripe M9 slice — no separate task needed"}
fast_fix_queue: []
b_block_re_entry_required: []
```
- **Blocking: 0.** All M9 ACs met live; crown-jewel security negatives all PASS; karen + jenny both APPROVE. Wave ships.
- 2 non-blocking → tasks (ecf79f4a M9, d28f6174 unassigned; both wave_id NULL = seedable, provenance in prose per the stranding lesson).
- Upsert-test items consolidated under the existing PR #94 + task ab75b8d8.
- V-3 Phase-2 fast-fix SKIPS (0 in-scope blocking); V-3 Phase-1 head-verifier gate still runs.
