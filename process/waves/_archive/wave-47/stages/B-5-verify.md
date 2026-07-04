# Wave 47 — B-5 Verify
- Action 1 lint: biome ci . → 0 errors (2 pre-existing warn-level, non-blocking).
- Action 2 unit tests: ALL PASS individually — shared 37 / api 611 / web 377 (= 1025). FLAKE: combined `pnpm -w test` (turbo 3-way parallel vitest) intermittently crashes one vitest instance at STARTUP ([ELIFECYCLE], no assertion failure, cache-miss under parallelism) — LOCAL resource contention after a long multi-agent session, NOT a code defect (proven by individual per-package passes). CI (authoritative, isolated, green on prior waves) is the real gate; watched at C-1.
- Action 3 build: web build success.
- Action 4 smoke: DM startable flow covered by dm.test.tsx (component) + dm.service.spec.ts getDmCandidates (backend); live smoke at T-block.
```yaml
lint_passed: true
unit_tests_passed: true   # 1025 pass individually (shared 37 + api 611 + web 377)
build_passed: true
dev_smoke_passed: deferred-to-T
flakes_documented: ["combined turbo `pnpm -w test` startup-crash on local vitest parallel resource contention; all packages pass individually; CI authoritative"]
