# V-1 — Summary (wave-51)
Karen (a0177b6f) + jenny (ad4773f5) independent, both **APPROVE**.
- **Karen APPROVE — 0 findings.** Diff = exactly 2 code files (AppShell.tsx +67, AppShell.test.tsx +117); no api/schema/migration. Gates confirmed file:line (desktop 68, drawer 90, backdrop `sidebarOpen && !dmHomeActive` 78, onDmHome setSidebarOpen(false) 55-58); mirrors MemberListPanel guard. 5 gating tests / 11 assertions non-decorative. **Live bundle** contains the gate logic + `mobile-sidebar-backdrop` testid → post-B-6-fix code serving (not stale). F-1 confirmed in ServerRail, not the gate.
- **jenny APPROVE — 0 drift/gap.** 5/5 ACs MATCH live: DM 3-panel (channel-sidebar=0), DmThread **632px @1024 / 888px @1280** measured, no stale channels, mobile backdrop/drawer=0 @390, toggle correct both directions. Contracts empty; DM data flow intact. F-1 matched to the known finding (ServerRail.tsx:237 selectServer doesn't exit dmHomeActive; exit handler only on DM rail button) — NOT a regression.

## Findings (raw → V-2)
- **F-1 (medium, pre-existing, non-blocking):** DM→server RETURN first-click swallowed — ServerRail.tsx:237 selectServer (+ Home) don't setDmHomeActive(false). Recoverable. From T-5.
```yaml
karen_verdict: APPROVE
karen_findings_count: 0
jenny_verdict: APPROVE
jenny_findings_count: 0
spec_drift_count: 0
findings:
  - {id: F-1, severity: medium, kind: pre-existing-interaction, description: "DM→server return race — ServerRail selectServer/Home don't clear dmHomeActive"}
```
