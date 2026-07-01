# Wave 23 — B-3 Frontend

## Specialist: react-specialist (agentId aff31468d9725f5a3 + a750ca620c68451db)

## Files implemented
- **apps/web/src/auth/api.ts:** NEW `getMyPermissions(serverId): Promise<EffectivePermissions>` → GET /servers/:serverId/me/permissions (mirrors existing GET pattern; imports EffectivePermissions from shared).
- **apps/web/src/shell/AssignmentsPanel.tsx:** CTA gate swap. Before: `isOrganizer = myUserId === ownerId` (owner-only). After: `isOrganizer = permsStatus==='ready' && (perms.owner || perms.manage_assignments)`. Fetched via getMyPermissions in useEffect+useState (mirrors existing getMe/listAssignments pattern; re-fires on serverId change). CTA hidden while loading + on fetch error (no flash).
- **apps/web/src/shell/ServerRolesPage.tsx:** (1) B-1-induced fix — manage_assignments:false added to RolePermissions initial state + fixtures; (2) **PERM_FLAGS 5th entry** `{key:'manage_assignments', label:'Manage Assignments', description:'Post, edit, and delete assignments for members to track.'}` — wires the new permission into the existing role-editor checkbox list so an owner can GRANT it in-product (the UI realization of the seed's grantable-permission DTO work; without it manage_assignments was ungrantable).
- **apps/web/src/shell/server-roles.test.tsx:** manage_assignments:false in 3 fixture literals (B-1-induced).

## Honest-403 (BOARD condition 3)
No new system needed. AssignmentForm.handleSubmit already wraps create/update in try/catch → sets submitError → rendered as role="alert" with --danger-text (#f87171). A 403 (permission revoked between load and submit) flows into that existing inline error path. No dead button, no silent failure.

## End-to-end completion (scope note)
The role-editor PERM_FLAGS addition is the UI completion of seed 8aa67564's grantable-permission DTO work (CreateRoleSchema/UpdateRoleSchema carry manage_assignments; ServerRolesPage is the UI for those DTOs). jenny at P-4 flagged this as "a token-level add, not a new surface"; P-2 "out of scope" was role-management UI *redesign*, not a single checkbox in the existing PERM_FLAGS list. Adding it makes the wave's stated capability (delegate assignment-posting to a non-owner) reachable through the product — otherwise manage_assignments would be ungrantable in-UI. NOT scope creep: it wires an already-in-scope DTO field to its existing editor.

## Typecheck
`pnpm --filter @studyhall/web typecheck` → exit 0.

## Deviations (adjudicated)
- ServerRolesPage.tsx + server-roles.test.tsx RolePermissions literals gained manage_assignments:false — **ACCEPTED** (necessary B-1-schema-addition consumer fix; blocking clean typecheck; additive false, zero behavioral effect).
- PERM_FLAGS 5th entry — **ACCEPTED as scope-completion** (UI realization of the in-scope grantable permission; token-level; documented above + in B-3 deliverable).

```yaml
skipped: false
fast_path_active: false
specialists_spawned: [react-specialist]
files_implemented: [apps/web/src/auth/api.ts, apps/web/src/shell/AssignmentsPanel.tsx, apps/web/src/shell/ServerRolesPage.tsx, apps/web/src/shell/server-roles.test.tsx]
designs_consumed: []   # design_gap_flag=false; existing DESIGN-SYSTEM tokens + existing components
deviations:
  - {specialist: react-specialist, change: "RolePermissions literals +manage_assignments:false in ServerRolesPage + test", plan_said: "not in B-3 target list", why: "B-1 schema-addition consumer fix for clean typecheck", adjudication: accepted}
  - {specialist: react-specialist, change: "PERM_FLAGS 5th entry (role-editor checkbox)", plan_said: "role-editor toggle treated as follow-on", why: "wave-value completion — makes manage_assignments grantable in-product; token-level per P-4 jenny", adjudication: accepted-scope-completion}
simplify_applied: true
```

## Exit
Frontend implemented (CTA gate + /me/permissions + role-editor checkbox) + web typecheck clean. Wave is end-to-end. → B-4 Wiring.
