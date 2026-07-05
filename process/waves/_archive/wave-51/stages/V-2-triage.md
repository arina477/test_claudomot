# V-2 — Triage (wave-51)
## Inputs: T-block 1 (F-1) + Karen 0 + jenny 0 = 1 distinct finding. Zero blocking (both reviewers APPROVE; all 5 ACs match live).
| Finding | Source | Bucket | Disposition |
|---|---|---|---|
| **F-1** DM→server return first-click race | T-5 / V-1 jenny | **Non-blocking** | task `ff09c4c9` (M8, wave_id NULL seedable). PRE-EXISTING (not this wave's gate change — source-verified against 01399a5^ by head-tester + Karen + jenny); recoverable papercut. Fix target: ServerRail.tsx:237 selectServer + Home should setDmHomeActive(false). Good future DM-polish seed. NOT V-3 fast-fix (non-blocking + outside this wave's ChannelSidebar-gate scope). |

## Fast-fix queue: EMPTY (0 blocking). V-3 Phase 2 skips.
```yaml
findings_input_count: 1
findings_blocking: []
findings_non_blocking:
  - {id: F-1, source: T-5+V-1-jenny, summary: "DM->server return race (ServerRail doesn't clear dmHomeActive)", task_id: ff09c4c9-1fea-4d70-bd03-0f0a8742a5f5, milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4}
findings_noise: []
fast_fix_queue: []
b_block_re_entry_required: []
```
