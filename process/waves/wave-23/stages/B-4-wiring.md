# Wave 23 — B-4 Wiring

## Repo-wide typecheck (Action 1)
`pnpm -w typecheck` (turbo, 3 packages) → **4/4 successful, exit 0**. No server↔client contract drift.

## Route registration (Action 2)
- Backend: `GET /servers/:serverId/me/permissions` — ServerPermissionsController registered in `rbac.module.ts:12` controllers[] ✓.
- Client: `getMyPermissions(serverId)` in api.ts, consumed by AssignmentsPanel ✓.
- No new frontend route (AssignmentsPanel + ServerRolesPage pre-exist; CTA/checkbox are in-component changes).

## Env wiring (Action 3)
No new env vars this wave. N/A.

## Biome lint (CI-PRINCIPLES rule 4 — caught at wiring before CI)
`pnpm lint` (= `biome ci .`, biome 1.9.4 frozen-lockfile = CI's exact command) initially FAILED (exit 1):
- **2 format errors** in `apps/api/src/rbac/rbac.module.ts` + `rbac.service.ts` — introduced by B-2 (f779bb5), typecheck-clean but format-dirty. **3rd instance of the biome-format-drift-passes-local-fails-CI pattern (w19/w22/w23)** — exactly what CI-PRINCIPLES rule 4 (promoted wave-22) exists to catch. Rule 4 working: caught at B-4, not in CI.
- **3 `suppressions/unused` errors** in ServerRolesPage.tsx — dead `// biome-ignore lint/a11y/useSemanticElements` comments on role="dialog" divs (biome 1.9.4 no longer fires that rule there → suppressions dead). PRE-EXISTING on main (main silently red since a biome bump post-wave-22); surfaced because wave-23 touches this file.

**Resolution (Iron Law → react-specialist a6d83d649eff7d1c1):** `biome format --write` on the 2 backend files (format-only, no logic change) + removed the 3 dead suppression comments (correct fix — the rule isn't firing). Re-ran: `pnpm lint` exit 0, `pnpm -w typecheck` exit 0.

```yaml
typecheck_passed: true
routes_registered: ["GET /servers/:serverId/me/permissions (rbac.module.ts controllers[])", "client getMyPermissions in api.ts"]
env_vars_wired: []
drift_defects:
  - {stage: B-2, defect: "biome format drift in rbac.module.ts + rbac.service.ts (3rd instance w19/w22/w23)", fix: "biome format --write via react-specialist", classification: "CI-PRINCIPLES rule 4 catch"}
  - {stage: pre-existing, defect: "3 dead biome suppressions/unused in ServerRolesPage.tsx (main silently red)", fix: "removed dead ignore comments", classification: "surfaced by wave-23 touching the file"}
lint_passed: true
```

## L-block note
The biome-format-drift recurrence (3rd instance) + the fact that the specialist B-2 report claimed typecheck-clean without running `biome format` is a candidate B-block-process observation: **B-2/B-3 specialists should run `biome format --write` on touched files before reporting.** Feed to L-2 (may reinforce CI-PRINCIPLES rule 4 or spawn a BUILD-PRINCIPLES candidate on specialist format discipline).

## Exit
Repo typecheck + lint both green (CI-mirror). Routes registered. → B-5 Verify.
