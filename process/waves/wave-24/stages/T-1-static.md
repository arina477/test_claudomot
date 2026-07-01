# Wave 24 — T-1 Static
**Pattern A (CI-verified).** C-1 (PR#36, run 28498812550): lint + typecheck jobs = success on merge 149a081. Static-bypass grep on the diff: 0 production bypasses (all touched files are apps/api/test/integration/*; the one `{} as never` in servers-member-gate.spec is test-mock DI for the unused rbacService ctor arg — /review-confirmed never called; acceptable idiom). No new tsconfig flags.
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["C-1 lint+typecheck run 28498812550 success"]
findings: []
ts_bypasses_in_wave_diff: 0
```
