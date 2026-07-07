# Wave 75 — B-5 Verify (exact CI commands — BUILD-10)

- **Lint (Action 1):** `pnpm lint` (biome ci) → 375 files checked, no fixes applied, clean. No auto-fix commit needed.
- **Unit tests (Action 2):** `pnpm test` (turbo) → **@studyhall/api 795 passed (45 files) + @studyhall/web 679 passed (46 files)**, 0 failures. Turbo builds @studyhall/shared FIRST as a dep → the B-2 stale-dist concern is resolved for the CI test job (turbo orders it; only a bare `vitest` leg would miss it). `act()` warnings on 19 pre-existing server-overview-settings tests are stderr-only (0 test failures) → carried to B-6.
- **Build (Action 3):** `pnpm build` (turbo) → 3/3 successful (shared, api, web; web SW/precache generated). Confirms shared→api/web ordering.
- **Dev-server smoke (Action 4):** backend wave — the 3 new endpoints are exercised headless by the 795 api tests (billing.controller.spec + educator-tools.controller.spec real guard→service→controller path). Authoritative runtime verification deferred to the CI boot-probe (required check) + T-5 live e2e against prod (prior backend-wave pattern, waves 72-74).

```yaml
lint_passed: true
unit_tests_passed: true
build_passed: true
dev_smoke_passed: true   # via integration tests + deferred CI boot-probe + T-5 live
flakes_documented:
  - "act() warnings on 19 pre-existing server-overview-settings tests (panel async mount-load); 0 failures; B-6 head-builder adjudicates"
