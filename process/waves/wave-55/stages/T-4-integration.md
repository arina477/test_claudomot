# T-4 — Integration (wave-55) — Pattern A (CI-verified) — THE KEY LAYER
This wave's deliverable IS the integration coverage. CI run 28761913177 `test` job (postgres:16) executed the new case:
`✓ test/integration/dm-candidates.spec.ts > ... > (c) who_can_dm=server-members: co-member in shared server is included, disjoint user is excluded (78ms)`
Ran + PASSED (not skipped — C-1 watch satisfied). The full 18-file integration suite green (regression). The who_can_dm='server-members' privacy truth-table (positive INCLUDED + negative disjoint EXCLUDED) is authoritatively verified on real Postgres. No findings.
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["CI 28761913177 test job: case (c) executed+passed 78ms on postgres:16"]
findings: []
```
