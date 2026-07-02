# Wave 33 — T-4 (Pattern A — CI-verified)
The 10 real-DB integration tests (malformed-uuid-params.spec.ts) RAN in CI PR #46 (DATABASE_URL_TEST + postgres:16, fail-loud harness) — 10 passed, 0 skipped. Proves real Postgres 22P02 → filter → 400 + clean body + valid-UUID no-false-positive. This is the load-bearing real-DB proof (head-builder/jenny required).
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
findings: []
```
