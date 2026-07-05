# Wave 51 — T-block review artifacts

**Block:** T (Test) · **Wave topic:** DM surface canonical 3-panel layout fix (gate ChannelSidebar off DM) — LIVE (merge 01399a5) · **Block exit gate:** T-9 · **Status:** in-progress

## Stage deliverables
| Stage | Deliverable | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | stages/T-1-static.md | ci-verified | done | lint+typecheck green on merge; 0 prod bypasses |
| T-2 | stages/T-2-unit.md | ci-verified | done | web 422 (incl. 5 AppShell gating/backdrop tests) |
| T-3 | stages/T-3-contract.md | n/a | skipped | no contract surface change (layout-only) |
| T-4 | stages/T-4-integration.md | n/a | skipped | no schema/service change (frontend-only) |
| T-5 | stages/T-5-e2e.md | active | pending | DM 3-panel live + mobile backdrop no-strand |
| T-6 | stages/T-6-layout.md | active | pending | DmThread full width @1024/1280; ChannelSidebar gone on DM |
| T-7 | stages/T-7-perf.md | active | skipped | not heavy (single conditional-render) |
| T-8 | stages/T-8-security.md | active | skipped | non-auth/session wave (pure client layout; no endpoint/state-change) |
| T-9 | stages/T-9-journey.md | active | pending | journey annotate + head-tester gate |

## Block-specific context
- **wave_type:** ui (single-spec frontend layout fix). LIVE at web-production-bce1a8.
- **Stages skipped:** T-3/T-4 (no contract/schema/service change), T-7 (not heavy), T-8 (non-auth — no endpoint/session/state surface).
- **Carries into T:** DM surface = 3-panel no ChannelSidebar (T-5/T-6); DmThread full width @1024/1280 (T-6); mobile backdrop no-strand on open-drawer→DM (T-5, the B-6 High fix); server-view no regression (T-5/T-6).

## Findings aggregation
`process/waves/wave-51/blocks/T/findings-aggregate.md`

## Gate verdict log
<head-tester at T-9>
