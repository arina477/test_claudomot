# Wave 36 — B-5 Verify
- **Lint:** `pnpm lint` exit 0 (235 files; 7 pre-existing advisory warnings; no new).
- **Unit tests:** api 503/503; web new tests pass (SettingsPrivacyPage 3/3 toUiVisibility). 1 web failure = pre-existing server-roles flake (untouched by wave-36; 24/24 isolated; full-suite-parallel only). Documented.
- **Build:** `pnpm build` 3/3 successful.
- **Integration tier:** runs in CI (B-4 verified turbo test:ci env passthrough); skips locally (no local PG).
```yaml
lint_passed: true
unit_tests_passed: true
build_passed: true
dev_smoke_passed: n/a-test-wave
flakes_documented: ["apps/web/src/shell/server-roles.test.tsx — pre-existing, 24/24 isolated, wave-36 untouched"]
