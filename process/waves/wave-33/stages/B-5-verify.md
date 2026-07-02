# Wave 33 — B-5 Verify
- **Lint:** biome on apps/api/src/auth + test/integration — clean.
- **Unit:** api 27 files, 467/467 green (449 + 18 new filter unit tests). The 10 real-DB integration tests (malformed-uuid-params.spec.ts) `skipIf(!DATABASE_URL_TEST)` → skip locally, run in CI Postgres v16. **CARRY to C-1/T-8: confirm they ACTUALLY RUN in CI (not silently skipped) — real-DB proof of the 22P02 branch (jenny/head-product).**
- **Build:** turbo build (api+web+shared) success.
- **Dev-smoke:** api boots clean with the modified filter; unauth `GET /channels/not-a-uuid/voice/participants` → HTTP 401 missing_bearer (guard-first, NOT 500). AC7 live-confirmed; authed-malformed→400 via unit+integration.
```yaml
lint_passed: true
unit_tests_passed: true
build_passed: true
dev_smoke_passed: true
flakes_documented: []
```
