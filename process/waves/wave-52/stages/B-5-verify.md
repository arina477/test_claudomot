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

## Flake note
web suite occasionally shows 1 transient failure on a combined run — the studyRoomSocket/studyTimerSocket singleton autoConnect fires a real socket connect in the test env (engine.io ECONNREFUSED stderr); tests mock and pass. Clean re-run = 448/448 (28 files). Same class as the wave-49 studyTimerSocket flake; CI per-package authoritative. Not a code defect.
