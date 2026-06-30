# Wave 13 — D-block review artifacts (DELTA)
**Block:** D · **Wave topic:** message-row edit/delete-tombstone/reaction-pill primitives · **Gate:** D-3 · **Status:** gate-passed

## Block-exit handoff
```yaml
design_block_status:    complete
gaps_resolved:          [message-lifecycle]   # edit/(edited) + delete→tombstone + reaction-pills + add-reaction popover, hover+focus row-actions
gaps_deferred:          []
design_system_updates:  []                     # head-designer gate blessed zero token additions
canonicalized_at:       2026-06-30T03:00:00Z
canonical_path:         design/server-channel-view.html
```

## Gate verdict log
| Attempt | Phase 1 matrix | Phase 2 (head-designer) | Outcome |
|---|---|---|---|
| 1 | iter1 APPROVE\|REVISE → refine; iter2 APPROVE\|APPROVE | APPROVED | canonicalized in place |

Reviewer substitution: `/ui-ux-pro-max` → `accessibility-tester` (contrast/focus/keyboard load-bearing on this dark-theme delta) — per design/review-gate.md § Reviewer substitution.

## Gap (delta — design/server-channel-view.html EXISTS w/ message-row + composer from wave-12): add (1) EDIT — own message → inline-edit (textarea in place of the row content, save/cancel) + an "edited" indicator on edited messages; (2) DELETE — own message (or moderator on others') → a hover/menu delete affordance → confirm → a TOMBSTONE row ("This message was deleted", muted, no content/reactions); (3) REACTIONS — a reaction-pill row under a message (emoji + count; highlighted if reactedByMe) + an add-reaction affordance (emoji pick → toggle); click a pill toggles. Hover-actions on a message-row (edit/delete/react). Compose on the wave-12 message-row. Dark theme, accent, Phosphor. NO threads/mentions/attachments/presence. Prior art: design/server-channel-view.html (the message-row + composer).
