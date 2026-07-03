# Wave 40 — T-2 Unit (Pattern A — CI-verified)
- CI `test` job GREEN: 543 api tests. New: users.controller.spec (NUL/control→400, REGRESSION non-UUID→404, happy path), files.service.spec (+4 NoSuchKey/re-throw), files.controller.spec (+2 NotFound propagation).
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["C-1 test job green: 543 api unit pass"]
findings: []
```
