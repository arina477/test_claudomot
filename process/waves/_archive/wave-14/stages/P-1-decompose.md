# Wave 14 — P-1 Decompose

## Maximum size rubric (no threshold trips)
| Measure | Estimate | Threshold | Pass |
|---|---|---|---|
| Files touched | ~20-24 (presence gateway/module/service, presence client store, member-list panel, typing client+server, server-channel-view wiring, shared types, tests) | >60 | ✓ |
| New primitives | ~9 (/presence namespace, PresenceService, presence ref-count store, typing events, MemberListPanel, presence client store, presence/typing Zod types, snapshot endpoint) | >60 | ✓ |
| Net LOC | ~2650 (post mvp-thinner dots cut) | >5000 | ✓ |
| Stage-4 working set | <350K | >350K | ✓ |

## Wave type + floor
- claimed_task_ids = [d1c4693d, 58633934, 058984c5] → length 3 → **multi-spec**.
- Floor (multi-spec): net LOC >2500 OR specs >=6. ~2650 LOC > 2500 → **above floor**.

## Verdict: PROCEED (multi-spec)
- No split (under all maxima), no merge (above floor). 10b9d18e (author-row dots) deferred at P-0 (mvp-thinner THIN) — stays parked M3 sibling, NOT re-parented (already a valid future seed candidate).
- floor_merge_attempt: 0

## design_gap_flag: TRUE
```yaml
design_gap_flag: true
missing_surfaces:
  - right-sidebar-member-list-panel: live-presence member roster (online/offline grouping, per-member presence dot, member row + hover/click affordance). Prior art: server-channel-view.html L463-517 (current = "minimal shell, out of D-block scope") + DESIGN-SYSTEM tokens. Task 058984c5.
  - typing-indicator: "X is typing…" affordance for OTHER users (debounced; 1-3 names + "and N others"), rendered near the composer/message-list foot. NOT the composer's own send-state machine (which is designed). Task 58633934.
```
Note: presence-dots-on-author-rows (10b9d18e) deferred at P-0 → not a wave-14 surface. /presence namespace (seed d1c4693d) is backend-only (no UI surface of its own; consumed by the two surfaces above).
