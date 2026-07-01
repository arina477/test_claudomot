# Wave 23 — B-1 Contracts

## Contracts authored (typescript-pro, agentId ae666ca66a12ad981)
- **packages/shared/src/rbac.ts:** `RolePermissionsSchema` +`manage_assignments: z.boolean()` (required, mirrors 4 siblings); `CreateRoleSchema` +`manage_assignments: z.boolean().optional()`; `UpdateRoleSchema` +`manage_assignments: z.boolean().optional()`; RoleSchema flows the nested permissions.
- **NEW `EffectivePermissionsSchema` + type `EffectivePermissions`** = `{ owner, manage_server, manage_roles, manage_channels, manage_members, manage_assignments }` all `z.boolean()`. Barrel-exported from packages/shared/src/index.ts (schema + type).
- **apps/api/src/rbac/rbac.service.ts:29:** Permission union 4→5 (+`| 'manage_assignments'`); comment "4 fixed RBAC flags"→"5".

## Isolated typecheck
`pnpm --filter @studyhall/shared typecheck` — clean (consumer breakage in api/web expected; B-4 handles repo-wide).

## Deviation (accepted)
Spec suggested `.default(false)` on CreateRoleSchema.manage_assignments, but the 4 sibling manage_* fields in CreateRoleSchema are `.optional()` with NO `.default()`. typescript-pro mirrored the siblings (omitted .default) to keep schema parity. **Accepted** — adding .default to only the new field would make it inconsistent.
- **Carry to B-2:** createRole service must default manage_assignments to false when the DTO omits it (the DB column defaults false, so the insert path must pass false, matching the existing sibling handling at rbac.service.ts:123-126).

```yaml
skipped: false
contracts_authored: [packages/shared/src/rbac.ts, packages/shared/src/index.ts, apps/api/src/rbac/rbac.service.ts]
sdk_regenerated: false
fast_path_approved: false
deviations: ["CreateRoleSchema.manage_assignments omits .default(false) to mirror siblings — B-2 service defaults it"]
```

## Exit
Contracts locked + isolated typecheck clean. → B-2 Backend.
