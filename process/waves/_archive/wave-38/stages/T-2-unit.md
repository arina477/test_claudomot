# Wave 38 — T-2 Unit (Pattern A — CI-verified)
- CI `test` job GREEN on merge commit: 524 unit tests pass (31 files). New unit coverage: resolveAvatarUrl (returns presigned URL / null when unconfigured) in files.service.spec.ts; confirm tests updated for stable-URL + avatar_key persistence in files.controller.spec.ts.
- Coverage adequate for the new backend surface.
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["C-1 test job green: 524 unit pass"]
findings: []
```
