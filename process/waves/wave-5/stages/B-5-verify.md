# Wave 5 — B-5 Verify
typecheck/build/lint green; test:ci 57/57 api (+web). api boots without storage creds (graceful). 6 specs: 5 code commits (commit-per-spec) + 1 ops (branch-protection active). Live: rate-limit 429 + avatar real-upload verify at C-2/T-8 (avatar needs founder bucket). e2e job runs in CI (non-required).
```yaml
lint: pass
typecheck: pass
build: pass
unit_tests: pass (94: 57 api + 37 web; vitest scoped to src e6d286c after Playwright-collision fix)
smoke: deferred-to-deploy (rate-limit 429 + avatar @ C-2/T)
```
