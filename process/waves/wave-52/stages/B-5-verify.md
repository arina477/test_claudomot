# B-5 — Verify (wave-52)
CI-identical commands (BUILD rule-10) before B-6:
- `biome ci .` repo-wide: **0 errors (303 files)**.
- `pnpm -w typecheck`: clean.
- api: **687 passed** (647 + 40 study-room; wave-49 timer 36/36 intact = parity).
- web: **448 passed** (422 + 26 focus-room/socket).
```yaml
biome_ci_repo_wide: PASS
typecheck: clean
api_tests: 687 passed
web_tests: 448 passed
schema/migration: none (MUST-lock 1 in-memory)
flakes_documented: []
```
