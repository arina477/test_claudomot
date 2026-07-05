# B-5 — Verify (wave-50)

**Ran the CI-IDENTICAL commands (obs-A lesson / BUILD rule intent) before B-6:**
- `biome ci .` (repo-wide, NOT scoped) — initially found **2 format-drift files** (apps/api/test/integration/study-timer.integration.spec.ts + apps/web/src/styles/globals.css) that scoped `biome ci src/...` missed. Applied `biome format --write` → re-ran → **0 errors (294 files checked)**. Fix committed 3d5b53b.
- `pnpm -w typecheck` — clean (all packages).
- `pnpm --filter @studyhall/api test` — **647 passed** (36 files).
- web `npx vitest run` — **416 passed** (direct vitest; the pnpm-recursive turbo startup crash is the known local flake — CI authoritative).

```yaml
biome_ci_repo_wide: PASS   # after format-fix 3d5b53b
typecheck: clean
api_tests: 647 passed
web_tests: 416 passed
flakes_documented: [turbo pnpm-recursive combined-run vitest startup crash (local only; CI runs per-package)]
migration_0023_local_apply: deferred-to-C-2 (local dev DB unreachable)
```

## Note for L-2
obs-A (B-5 CI-command parity) recurred AGAIN this wave — B-5 running `biome ci .` caught format escapes the scoped specialist runs missed. This is the 4th instance (waves 38/42/49/50). The BUILD rule-10 promotion (karen-APPROVED, linter-dropped at wave-49 L-2) should re-nominate at wave-50 L-2 with a pre-trimmed ≤100-char why line.
