# Wave 1 — T-6 Layout (active — partial: browser-blocked)

Live visual-diff vs the design mockups could NOT run (same Playwright MCP 'chrome'-channel limitation as T-5). Layout fidelity instead assured by: B-3 built the shell directly from design/DESIGN-SYSTEM.md tokens + design/app-home.html + design/server-channel-view.html; the v9 ui-designer cross-page consistency audit validated the design surfaces; Biome + the RTL render tests pass. No live pixel-diff this wave.
```yaml
test_pattern: active-partial
skipped: false
findings:
  - {severity: low, scenario: live-layout-diff, description: "Live visual regression vs mockups not run (MCP chrome-channel absent). Shell built from approved design tokens/mockups; pixel-diff deferred. Forward to V-2/infra."}
```
