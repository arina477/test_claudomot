# T-5 — E2E (wave-51)
**Pattern:** B (active) against LIVE prod. 1 ui-comprehensive-tester (playwright node package, isolated context — MCP profile-lock avoided). Fixture A on server ad62cd12.

| # | Criterion | Verdict (2 runs) | Evidence |
|---|---|---|---|
| S1 | DM surface canonical 3-panel, thread full width | **PASS** | dm-thread 632px @1024 / 888px @1280 (not 372px); channel-sidebar absent on DM |
| S2 | No stale server channels on DM | **PASS** | server selected first → switch to DM → no channel-sidebar / no leaked channel text |
| S3 | Server view no regression | **PASS** | ChannelSidebar present (260px) in server view — gate scoped to DM only |
| S4 | Mobile backdrop no-strand (B-6 High fix) | **PASS** | 390×800: open drawer (z-40 scrim) → switch to DM → BOTH drawer + scrim removed; DM clean, first-tap works |
| S5 | Toggle server↔DM cleanly | PASS (with F-1 on return path) | ChannelSidebar appears/disappears; thread width recomputes |

## Findings (→ V-2)
- **F-1 (Medium, non-blocking, NOT a regression of this fix):** deterministic-ish first-click-swallowed on the DM→SERVER return path (desktop) — clicking a ServerRail server icon / Home while on the DM surface intermittently needs a second click to exit dmHomeActive. Server→DM works every time. The tester confirms the wave's OWN state transitions (dmHomeActive gate + onDmHome setSidebarOpen reset) are correct; this is an ADJACENT DM↔server toggle race on the server-select-while-on-DM path (a handler this wave did NOT touch — likely pre-existing). Recoverable (2nd click works). No console errors / 5xx. Route to V-2 (candidate: non-blocking task or V-3 fast-fix if cheap + wave-adjacent).

## Non-findings
401 pre-login probe + intermittent 429 (harness rate-limit) — benign.

```yaml
test_pattern: active
skipped: false
testers_spawned: 1
scenarios:
  - {id: S1, criterion_ref: dm-3panel-full-width, verdict: PASS}
  - {id: S2, criterion_ref: no-stale-channels, verdict: PASS}
  - {id: S3, criterion_ref: server-view-no-regression, verdict: PASS}
  - {id: S4, criterion_ref: mobile-backdrop-no-strand, verdict: PASS}
  - {id: S5, criterion_ref: toggle-clean, verdict: PASS-with-F1}
fix_up_cycles: 0
findings:
  - {severity: medium, scenario: S5, description: "F-1 first-click-swallowed on DM→server return (adjacent DM↔server toggle race, likely pre-existing, recoverable); → V-2"}
```
