# Wave 26 — B-4 Wiring

## Action 1 — Repo-wide typecheck
`pnpm -w turbo run typecheck` → **4/4 packages successful**. PresenceDot + consumers type-check end-to-end; `getPresenceStatus(authorId)` types clean.

## Action 2/3 — Routes / env
No new routes, no new env vars (frontend-only, reuses /presence). N/A.

## Action 5 — Adjudicate technical errors — TWO PRE-EXISTING main-CI-RED defects CAUGHT + REPAIRED
B-4 lint/CI check found main's CI has been **RED** (lint + test jobs failing across the last 8 pushes) — caused by wave-25 process commits pushed to main via branch-protection bypass (docs-only pushes don't gate on CI, so the breakage went unnoticed). Both block the wave-26 PR. Root-caused + fixed on this branch (the wave-26 PR repairs main):

1. **Lint (format error):** `process/waves/_archive/wave-25/stages/t5-evidence/results.json` — the wave-25 T-5 tester's DOM-dump evidence, committed as an artifact, is not biome-formatted → `biome ci .` format error → lint job RED. **Fix (config, orchestrator):** added `process/**` to `biome.json` `files.ignore` — biome must not lint runtime transcripts/evidence (they are not source). Commit on branch. `pnpm lint` → 0 errors (was 1).
2. **Test (time-dependent):** `apps/web/src/shell/assignments.test.tsx` — 2 chip tests failed deterministically. Root cause: the test anchors due dates to a fixed `NOW=2026-06-30` but `AssignmentCard` computes chips from the REAL `Date.now()` (now 2026-07-01), and the clock is never mocked → the 48h-boundary offsets drifted out of sync as wall-time advanced. **Fix (Iron-Law routed → react-specialist, `fa6c9e6`):** `vi.useFakeTimers()` + `vi.setSystemTime(NOW)` in the chip-states `beforeEach`, `vi.useRealTimers()` in `afterEach` (scoped, no leakage). assignments.test.tsx → 22/22.

**Classification note:** these are NOT wave-26 defects — they are pre-existing main-breakage discovered by the B-4 wiring gate (its value). Fixed on-branch because a red main blocks the wave-26 merge; documented as incidental main-CI repair. → V-2 informational (L-block observation candidate: docs/process pushes to main via branch-protection bypass skip CI, so code-adjacent breakage in committed artifacts goes unnoticed until the next real CI run).

## Post-fix repo verify
typecheck 4/4 · `pnpm lint` 0 errors / 7 pre-existing warnings (exit 0) · build 3/3 · api 395/395 · web 249 (16 files; 1 pre-existing timing flake, green on re-run).

```yaml
typecheck_passed: true
routes_registered: []
env_vars_wired: []
lint_gate_passed: true                # biome ci 0 errors after process/** ignore
drift_defects: []                     # no B-2/B-3 contract drift
pre_existing_main_ci_repairs:
  - {kind: lint-format, file: "process/waves/_archive/wave-25/stages/t5-evidence/results.json", fix: "biome.json ignore process/**", by: orchestrator-config}
  - {kind: test-time-dependent, file: "apps/web/src/shell/assignments.test.tsx", fix: "vi.setSystemTime(NOW) clock-mock", by: react-specialist, commit: fa6c9e6}
last_commit_sha: fa6c9e6
```

## Exit
Repo typecheck + lint green, 2 pre-existing main-CI-red defects repaired on-branch (wave-26 PR will land green + repair main). → B-5.
