# Wave 18 — D-block review artifacts

**Block:** D (Design)
**Wave topic:** M3 threads UI — thread-view panel + in-list thread affordance
**Block exit gate:** D-3
**Status:** gate-passed

## Stage deliverables
| Stage | Deliverable file(s) | Status | Notes |
|---|---|---|---|
| D-1 | stages/D-1-brief/{thread-panel,thread-affordance}-brief.md | done | 2 briefs, mask PASS |
| D-2 | stages/D-2-variants/* | done | thread panel + affordance composed; checkpoint skipped (automatic) |
| D-3 | stages/D-3-review-and-adopt/* | done | both APPROVE (1 refine); head-designer APPROVED; canonicalized |

## Block-specific context
- **Wave topic:** thread-view side panel (parent pinned + replies + composer) + in-list thread affordance (reply count + last-reply on parent rows when reply_count>0)
- **design_gap_flag:** true (P-1). server-channel-view.html has NO thread markup.
- **Gaps inventoried:** [thread-panel, thread-affordance]
- **Both COMPOSE onto design/server-channel-view.html** (canonical channel view).
- **DESIGN-PRINCIPLES rule 1 (contrast):** muted text on dark surfaces ≥4.5:1 by calculation — applies to affordance metadata + panel.

## Open escalations carried into gate
none

## Gate verdict log
<appended by head-designer at D-3>

## Block exit handoff
```yaml
design_block_status: complete
adopted: design/server-channel-view.html (thread panel + affordance)
refine_cycles: 1
b_block_carries: [focus-trap, esc-close, reply_count==0-hide, list-semantics, aria-live]
ready_for_build: true
```
