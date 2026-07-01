# Wave 24 — B-4 Wiring

## Repo typecheck (Action 1) — PASS
`pnpm -w typecheck` → 4/4 packages clean. The 3 new integration specs typecheck against the real service signatures (getCoMemberUserIds, listServerMembers, getEffectivePermissions, can).

## Route registration (Action 2) — N/A (test-only, no routes).

## Env wiring (Action 3) — N/A (no new env vars; DATABASE_URL_TEST is the existing wave-17 integration var).

## Biome (CI-PRINCIPLES rule 4 + BUILD rule 6) — PASS
`pnpm lint` → exit 0. NO biome-format drift this wave — the B-2 test-automator ran `biome format --write` before reporting (BUILD rule 6, promoted wave-23, HELD its first wave). First clean B-block with no format-drift fix-up since the rule.

## Integration glob — PASS
The 3 new specs (presence-comembers / servers-member-gate / rbac-assignments-authz) are under apps/api/test/integration/ → picked up by vitest.integration.config.ts `include: test/integration/**/*.spec.ts`. 3 harness helpers present in pg-harness.ts.

```yaml
typecheck_passed: true
routes_registered: []
env_vars_wired: []
drift_defects: []   # NO biome drift — BUILD rule 6 held (1st clean wave)
lint_passed: true
```

## Exit
Typecheck + lint green; specs wired into the integration glob. → B-5.
