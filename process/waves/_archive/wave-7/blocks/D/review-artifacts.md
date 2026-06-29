# Wave 7 — D-block review artifacts [REBUILD post-restart]
**Block:** D · **Wave topic:** create-server modal + server-rail/channel-sidebar · **Gate:** D-3 · **Status:** gate-passed

| Stage | Status | Notes |
|---|---|---|
| D-1 brief | done | 2 briefs: `D-1-brief/create-server-brief.md`, `D-1-brief/server-rail-sidebar-brief.md` |
| D-2 variants | done | authored directly (recovery, known target); staged + committed; iter logs at `D-2-variants/*-iterate.md` |
| D-3 review & adopt | gate-passed | dual reviewers (ui-designer + accessibility-tester, fresh/parallel) → reconciled APPROVE/APPROVE → head-designer APPROVED → canonicalized |

## Gaps
1. **create-server** — re-scoped reverted 3-step wizard → single-step name modal matching `POST /servers {name}`; 6 states + too-long variant. Adopted → `design/create-server.html`.
2. **server-rail-sidebar** — regenerated rail (loading/empty/loaded, + create) + channel sidebar (no-server/loading/loaded/error, `#general`). NO M3 chrome. Adopted → `design/server-rail-sidebar.html`.

## Reviewers
- Reviewer A (design critique + token audit): `ui-designer` — APPROVE / APPROVE
- Reviewer B (WCAG AA contrast/focus/keyboard/ARIA): `accessibility-tester` — REVISE→resolved (create-server) / APPROVE (rail-sidebar)
- Substitution (vs. `/plan-design-review` + `/ui-ux-pro-max`) documented in reconciliation files per `design/review-gate.md` § Reviewer substitution.

## Status (block-exit handoff)
```yaml
design_block_status:    complete
gaps_resolved:          [create-server, server-rail-sidebar]
gaps_deferred:          []
design_system_updates:  [--glow-danger]
canonicalized_at:       2026-06-29T16:30:00Z
```
