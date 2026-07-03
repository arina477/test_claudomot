# Wave 40 — T-1 Static (Pattern A — CI-verified)
- C-1 evidence: lint (biome ci) + typecheck GREEN on merge (run 28660221936, all required checks pass). One out-of-scope web flake (server-roles.test.tsx async race) cleared via 1 documented flake-rerun (non-regression: backend-only diff, passes on main).
- Bypass grep: 1 intentional biome-ignore (noControlCharactersInRegex on the guard regex — required + documented). No ts-ignore/as-any.
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["C-1 lint+typecheck green (run 28660221936)"]
findings: []
ts_bypasses_in_wave_diff: 0
note: "1 documented biome-ignore for the control-char guard regex (intentional)"
```
