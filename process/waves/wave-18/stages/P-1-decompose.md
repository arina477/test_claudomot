# Wave 18 — P-1 Decompose

## Maximum size rubric (no threshold trips)
| Measure | Estimate | Threshold | Pass |
|---|---|---|---|
| Files touched | ~26-32 (migration 0008, messages schema thread cols, messages.service thread-reply methods + transactional count, messages.controller thread routes, messaging.gateway thread event, shared thread types, ThreadPanel + thread-affordance in MessageList, outbox extension for replies, tests) | >60 | ✓ |
| New primitives | ~12 (thread_parent_id index + reply_count/last_reply_at cols, createReply, listThreadReplies, thread realtime event, ThreadPanel, thread-affordance, outbox-reply path, Zod thread types) | >60 | ✓ |
| Net LOC | ~2800 | >5000 | ✓ |
| Stage-4 working set | <350K | >350K | ✓ |

## Wave type + floor
- claimed_task_ids = [497c2ae6, 6c008dd6, 0b728319] → length 3 → **multi-spec**.
- Floor (multi-spec): >2500 LOC OR >=6 specs. ~2800 LOC > 2500 → **above floor** (the floor concern mvp-thinner raised is moot since all 3 tasks are KEPT per P-0 mediation).

## Verdict: PROCEED (multi-spec)
- floor_merge_attempt: 0. mvp-thinner's THIN-split of 0b728319 REJECTED at P-0 (coherent slice + M4 handoff + keeping it holds the wave above floor).

## design_gap_flag: TRUE
```yaml
design_gap_flag: true
missing_surfaces:
  - thread-view-panel: side panel showing the parent message pinned at top + its replies (oldest-first), with a reply composer. server-channel-view.html has NO thread markup. Prior art: the existing message-list rows + composer + the wave-14 member-list panel (right-sidebar pattern) + reaction popover. Task 6c008dd6.
  - thread-affordance: in-list cue on a parent message row showing reply-count + last-reply timestamp when reply_count>0, click opens the panel. New. Prior art: reaction-pill row + message-row metadata. Task 6c008dd6.
```
