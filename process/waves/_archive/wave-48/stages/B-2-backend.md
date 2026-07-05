# Wave 48 — B-2 (test-only implementation)
node-specialist: apps/api/test/integration/pg-harness.ts (insertFixtureUser += backward-compat who_can_dm param, default 'everyone') + NEW apps/api/test/integration/dm-candidates.spec.ts (2 real-PG negative controls: (a) who_can_dm='nobody' co-member excluded + everyone-control included; (b) disjoint non-co-member hidden). Real DmService.getDmCandidates (real EventEmitter2, real db path — NO mocks). Mirrors presence-comembers.spec.ts. biome 0 errors, tsc clean, 611 pass (no regression).
**Real-execution honesty:** did NOT run locally (DATABASE_URL_TEST→:5433 not running; ALL 17 integration specs fail identically here = env limit, not defect). CI (.github/workflows/ci.yml test job) provisions postgres:16 + DATABASE_URL_TEST + runs the integration pass (pnpm test:ci → vitest.integration.config.ts). Spec structured identically to the green presence-comembers.spec.ts → WILL run in CI. **C-1/T-3 MUST confirm it RAN green (not skipped).**
```yaml
skipped: false
files: [apps/api/test/integration/pg-harness.ts, apps/api/test/integration/dm-candidates.spec.ts]
production_code_changed: false
tests: {total: 611, new_spec_local: "skipped-no-test-PG", ci: "structured-to-run"}
CARRY_C1_T3: "confirm dm-candidates.spec.ts RAN green in CI integration pass, not skipped"
