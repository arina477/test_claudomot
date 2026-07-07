# Wave 74 — B-5 Verify
- Lint: `pnpm lint` (biome ci) clean after auto-fix (unused imports + format in the DI-updated integration tests).
- Unit tests: api 771/771 (41 files; 7 new entitlements + gate tests incl. the binding restrictive-cap-THROWS; subscriptions migration runs in CI with postgres). web unchanged (build ✓, zero-require).
- Build: web build ✓, zero raw require (P0 guard); api tsc clean.
- Dev-smoke: deferred to CI boot-probe (confirms the new EntitlementsModule + ServersModule→EntitlementsModule wiring boots — no DI cycle) + C-2.
```yaml
lint_passed: true
unit_tests_passed: true
build_passed: true
dev_smoke_passed: deferred-to-CI-boot-probe-and-C2
flakes_documented: []
```
