# Wave 33 — T-3 (Pattern A — CI-verified)
Behavior contract only (no new endpoint/type). Contract delta: malformed-UUID param → 400 (was 500); valid-UUID + auth + app-HttpException byte-unchanged. Enforced by the 18 unit + 10 integration assertions; strict typecheck. No shared-contract (Zod/OpenAPI) change.
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
findings: []
```
