# Wave 39 — T-2 Unit (Pattern A — CI-verified)
- CI `test` job GREEN: 341 web tests (8 new UserMenu tests incl. the [C1] logout-reject-still-navigates guard). New coverage: menu renders 3 items, nav routes, signOut+redirect, Esc close+refocus, outside-click close, close-on-select, reject-path.
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["C-1 test job green: 341 web unit pass"]
findings: []
```
