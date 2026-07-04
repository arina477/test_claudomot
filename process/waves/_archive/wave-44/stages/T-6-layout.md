# Wave 44 — T-6 Layout (active — folded into T-5 direct-playwright)
- **T6-F1 (the wave's fix) VERIFIED RESOLVED @1024:** detail is now a proper overlay dialog; agenda card readable (311px, not the 28px crush). 1280/1440 inline unchanged (breakpoint switches correctly ≤1024). This closes the wave-43 MAJOR responsive defect.
- Token/layout: the overlay reuses shipped dialog tokens (surface, radius, glow-focus); muted-indicator pr-2 gutter is in the diff (layout-verified in code; live-unreachable — no muted member in fixture).
- No new invented hex; no overflow.
```yaml
test_pattern: active
skipped: false
breakpoints: [1440, 1280, 1024]
token_violations: []
findings: []
```
