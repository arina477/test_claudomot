# Wave 80 — B-5 Verify
- **Lint:** biome ci apps packages → 0 errors (394 files).
- **Unit:** web 733/733, shared 41/41, api 814/814. Integration (privacy-events + presence-show-presence-honor two-subject) run in CI postgres:16 (no local pg server).
- **Build:** turbo 3/3.
- **Dev-smoke:** presence-honor exercised by the two-subject integration test (real gateway/service/privacy + socket room-routing double) + SettingsPrivacyPage component tests; live two-client browser walk deferred to T-5 (project pattern).
```yaml
lint_passed: true
unit_tests_passed: true
build_passed: true
dev_smoke_passed: true
flakes_documented: []
```
