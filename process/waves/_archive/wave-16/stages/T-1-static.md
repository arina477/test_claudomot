# T-1 — Static (wave-16)

**Pattern A — Verified-via-CI.** Confirm typecheck + lint ran green on the merge commit; audit static coverage.

## Action 1 — CI evidence
C-1 `verdict_evidence` (run 28437054848, HEAD 12dedc0, merge 6982ffe):
- **lint** job: PASS — Biome `biome ci .` 0-errors (9 pre-existing warnings unchanged).
- **typecheck** job: PASS — tsc project-references.

## Action 2 — Coverage audit
Wave diff is test-infra only (`apps/web/e2e/{auth.setup.ts,create-server.spec.ts}`, `playwright.config.ts`,
`.gitignore`, `.github/workflows/ci.yml`, `biome.json`). New `.ts` files ARE linted/typechecked by CI.
No `@ts-expect-error` / `@ts-ignore` / `: any` / `as any` introduced in the wave diff (B-6 grep + head-builder
ratified `none`). `ts_bypasses_in_wave_diff: 0`.

## Action 3 — Discipline note
KNOWN CARRY (NOT a wave-16 finding): 9 pre-existing biome WARNINGS — `useTyping` noNonNull (wave-14) +
`ServerRolesPage` unused suppressions. Warnings (not errors), present on `main`, byte-identical pre/post this
wave, do NOT fail CI. Out-of-scope tech-debt; recorded for visibility only.

```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence:
  - "C-1 lint job: run 28437054848 green (Biome 0-errors)"
  - "C-1 typecheck job: run 28437054848 green (tsc project-references)"
findings: []
ts_bypasses_in_wave_diff: 0
known_carries:
  - "9 pre-existing biome warnings (useTyping noNonNull wave-14 + ServerRolesPage unused suppressions) — out-of-scope tech-debt, on main, do not fail CI"
head_signoff:
  verdict: APPROVED
  stage: T-1
  failed_checks: []
  rationale: "Lint + typecheck both green on merge commit (run 28437054848); zero static-analysis bypasses in the wave diff; the only warnings are 9 pre-existing wave-14 tech-debt items recorded as a known carry, not a wave-16 finding."
  next_action: PROCEED_TO_T-2
```
