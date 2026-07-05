# T-6 — Layout (wave-51)
**Pattern:** B (active). Surface: the DM app-shell geometry (restores canonical 3-panel design/direct-messages.html). Evidence from the T-5 live run (measured widths + screenshots at 1024/1280 + mobile 390).

## Deployed-state geometry vs canonical
- **DM surface = canonical 3-panel** (ServerRail 72 + DmConversationList 320 + DmThread flex-1) — the server ChannelSidebar (260px) is gone. Matches design/direct-messages.html (3 panels, no channel column).
- **DmThread width: 632px @1024, 888px @1280** (measured) — full canonical width, resolving the wave-46 F9 defect (was ~372px, message wrap). No premature wrap.
- **Server view unchanged** (ChannelSidebar 260px present) — no regression.
- **Mobile (<1024):** DM surface clean (no orphaned drawer/backdrop after the open-drawer→DM path — the B-6 backdrop fix).

## Diffs / findings
No layout diffs. The geometry matches the canonical DM design at 1024/1280. F-1 (S5 toggle race) is an interaction bug, not a layout diff (logged at T-5 → V-2). No token/geometry regression.

```yaml
test_pattern: active
skipped: false
surfaces_audited: [dm-app-shell-3panel]
breakpoints: [1024, 1280, 390]
diffs:
  - {surface: dm-thread, breakpoint: 1024, diff_pct: "resolved (632px full width)", verdict: PASS}
  - {surface: dm-thread, breakpoint: 1280, diff_pct: "888px full width", verdict: PASS}
token_violations: []
fix_up_cycles: 0
findings: []
```
