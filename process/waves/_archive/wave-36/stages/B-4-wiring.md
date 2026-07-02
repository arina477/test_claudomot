# Wave 36 — B-4 Wiring
- **Repo typecheck:** `turbo typecheck` 4/4 clean.
- **Route/env:** n/a (no new routes/env — test wave).
- **Integration-tier-executes verification (LOAD-BEARING, wave-17/24 false-green guard):** CONFIRMED the new real-PG integration specs WILL execute in CI (not silently skip): (1) turbo.json `test:ci` task declares `"env": ["DATABASE_URL_TEST"]` → Turbo passes it through; (2) ci.yml sets `DATABASE_URL_TEST` (job env) + runs `pnpm test:ci`; (3) api `test:ci` script explicitly runs `vitest run --config vitest.integration.config.ts` (which globs test/integration/*.spec.ts, fileParallelism:false) AFTER the unit run. The new specs' `skipIf(!DATABASE_URL_TEST)` therefore does NOT skip in CI. T-4 will re-verify the tier actually ran (nonzero real-DB row counts, not skipped).
- **Local test:** unit 503/503 (api) + web new tests pass; integration skips locally (no local PG — correct, runs in CI). 1 web failure = pre-existing server-roles flake (untouched by wave-36; 24/24 in isolation; full-suite-parallel only). Documented.
```yaml
typecheck_passed: true
routes_registered: []
env_vars_wired: []
integration_tier_will_run_in_ci: true   # turbo test:ci env passthrough verified
drift_defects: []
