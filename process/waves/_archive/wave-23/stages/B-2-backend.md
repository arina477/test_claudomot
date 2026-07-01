# Wave 23 — B-2 Backend

## Specialist: backend-developer (agentId a32dcefc188c6f52f)

## Files implemented
- **apps/api/src/rbac/rbac.service.ts:** createRole insert +manage_assignments (?? false); updateRole patch +manage_assignments; roleToDto param + nested `permissions` object +manage_assignments (P-4 karen carry — role-read path); NEW `getEffectivePermissions(userId, serverId)`.
- **apps/api/src/rbac/rbac.controller.ts:** NEW `ServerPermissionsController` `@Controller('servers/:serverId')` + `@Get('me/permissions')` → getEffectivePermissions(session userId, serverId). Path = GET /servers/:serverId/me/permissions ✓ (matches spec AC).
- **apps/api/src/rbac/rbac.module.ts:** ServerPermissionsController registered in controllers[] (forced by NestJS routing — accepted deviation).
- **apps/api/src/assignments/assignments.service.ts:61:** assertOrganizer single literal swap manage_channels→manage_assignments (4 call sites untouched).
- **apps/api/src/db/backfill-roles.ts:** Member seed enumerates manage_assignments:false (column completeness / BUILD rule 3).

## getEffectivePermissions semantics (BOARD cond 2 + 4)
- Owner (server.owner_id===userId): owner:true + all 5 flags true (mirrors can() :58 superuser).
- Member with role: owner:false + role's 5 booleans (same query path as can()).
- Member null role_id / missing role row: owner:false + all-false (default-deny, mirrors can() :73-83).
- Non-member: ForbiddenException (403). Server-not-found: 403 (no enumeration).
- Identity from SESSION only (no client userId) → IDOR-safe (BOARD cond 2; T-8 asserts).
- Owner-lockout (BOARD cond 4): owner superuser path covers it — owner always sees full grants regardless of flag; T-8 asserts.

## Typecheck
`pnpm --filter @studyhall/api typecheck` → exit 0 (built @studyhall/shared dist first — normal CI ordering).

## Deviations (adjudicated)
- ServerPermissionsController added to rbac.module.ts controllers[] — **ACCEPTED**: required for NestJS route reachability; no new module/provider, minimal registration, not scope expansion.

```yaml
skipped: false
fast_path_active: false
specialists_spawned: [backend-developer]
files_implemented: [apps/api/src/rbac/rbac.service.ts, apps/api/src/rbac/rbac.controller.ts, apps/api/src/rbac/rbac.module.ts, apps/api/src/assignments/assignments.service.ts, apps/api/src/db/backfill-roles.ts]
deviations: [{specialist: backend-developer, change: "register ServerPermissionsController in module controllers[]", plan_said: "register nothing new in the module", why: "NestJS route reachability", adjudication: accepted}]
simplify_applied: true
```

## Exit
Backend implemented + typecheck clean. → B-3 Frontend.
