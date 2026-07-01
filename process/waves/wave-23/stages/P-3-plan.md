# Wave 23 — P-3 Plan

## Approach

**Extend the existing capability-based RBAC with a 5th permission `manage_assignments`, then gate both the server-side assignments authz and the client CTA on it.** No new module, no new dep, no new SDK — this is an extend/swap on M2's RbacService + wave-22's AssignmentsModule (PRODUCT-PRINCIPLES rule 1: all surfaces verified to exist).

### Architecture deltas
- **RbacService (apps/api/src/rbac/rbac.service.ts):** `Permission` union 4→5 (+`manage_assignments`, line 29). `can()` is generic over the union (indexes `role[permission]`), so adding the value + the column is sufficient — owner superuser short-circuit (line 58) unchanged. createRole (123-126) + updateRole (155-158) gain the flag; the RoleDto interface (550) + roleToDto gain the boolean. **New read:** `getEffectivePermissions(userId, serverId)` → `{ owner: boolean, manage_server, manage_roles, manage_channels, manage_members, manage_assignments }`, session-user-scoped. *Alternative considered:* a generic `/me/roles` returning raw role rows — rejected: leaks role internals + forces the client to compute effective perms; an effective-permissions projection is the standard "compute server-side, gate UI on returned grants" pattern (industry-expert). Trade-off: one more service method vs a thinner but client-coupled contract.
- **AssignmentsService (apps/api/src/assignments/assignments.service.ts):** `assertOrganizer` swaps its single `can(...,'manage_channels')` → `can(...,'manage_assignments')`. One line; no other call site.
- **Failure-domain impact:** the swap changes one permission check. Blast radius verified empty (risk-officer): only owners post assignments today (superuser path), no non-owner `manage_channels` role posts; the migration backfill (below) preserves any that might be created before deploy. `can()` fail-closed: `role['manage_assignments'] === true`, absent column → `undefined === true` → false (default-deny).
- **AssignmentsPanel (apps/web/src/shell/AssignmentsPanel.tsx):** create/edit CTA gate swaps `isOwner` → `effectivePerms.owner || effectivePerms.manage_assignments`, fetched via the new endpoint. Non-permitted force-POST already returns 403 server-side; surface it as an honest message (no dead button).

### Data model (migration 0011, additive)
- `ALTER TABLE roles ADD COLUMN manage_assignments boolean NOT NULL DEFAULT false;` (roles columns live in `apps/api/src/db/schema/servers.ts:35-38`; add at :39).
- **Backfill (BOARD condition 1):** `UPDATE roles SET manage_assignments = true WHERE manage_channels = true;` — no silent privilege loss for any current organizer. Owner roles pass via superuser regardless.
- No index change (permission lookups are by role PK / membership, already indexed). No FK/unique change.

### API contracts
- **GET /servers/:serverId/me/permissions** — authed (session guard); identity = `session.getUserId()` ONLY (no `?userId=`/body). Response 200 `EffectivePermissionsDto { owner: boolean, manage_server, manage_roles, manage_channels, manage_members, manage_assignments: boolean }`; 403 if caller is not a member of the server. Idempotent GET, no retry semantics.
- **Role create/update** (existing `rbac.controller.ts` routes) — request DTOs gain optional `manage_assignments?: boolean` (default false on create; patch-only on update); response RoleDto gains `manage_assignments`.
- **Assignments organizer routes** (existing) — POST/PATCH/DELETE /servers/:serverId/assignments + attachment presign/confirm: auth model changes from `can(manage_channels)` → `can(manage_assignments)`; paths/schemas unchanged.

### New deps / SDK
None. No external SDK → no external-sdk-integration-rules pre-build needed.

## Plan (file-level steps by B-stage)

### B-1 Schema (postgres-pro)
- `apps/api/drizzle/migrations/0011_*.sql` — CREATE: ADD COLUMN manage_assignments + backfill UPDATE (additive). [create]
- `apps/api/src/db/schema/servers.ts` — add `manage_assignments` boolean to the roles table def (after :38). [modify]

### B-2 Contracts (typescript-pro)
- `packages/shared/src/*` (rbac/role DTOs) — add `manage_assignments` to role create/update DTOs + RoleDto; add `EffectivePermissionsDto` (Zod). [modify/create]
- `apps/api/src/rbac/rbac.service.ts:29` — extend `Permission` union (+`manage_assignments`). [modify]

### B-3 Backend (backend-developer)
- `apps/api/src/rbac/rbac.service.ts` — createRole (123-126) + updateRole (155-158) handle the flag; RoleDto/roleToDto (550) carry it; NEW `getEffectivePermissions(userId, serverId)` (owner check + role booleans, session-user-scoped). [modify]
- `apps/api/src/rbac/rbac.controller.ts` — NEW `GET /servers/:serverId/me/permissions` → getEffectivePermissions(session userId, serverId); membership-gated, 403 non-member. [modify]
- `apps/api/src/assignments/assignments.service.ts` — `assertOrganizer` can() call-site swap manage_channels→manage_assignments. [modify]
- `apps/api/src/db/backfill-roles.ts` — owner seed gains manage_assignments=true (forward create path parity with the migration backfill — BUILD rule 3). [modify]

### B-4 Frontend (react-specialist)
- `apps/web/src/shell/AssignmentsPanel.tsx` — CTA gate swap owner-only → owner||manage_assignments via the new endpoint; honest 403 surface on force-POST. [modify]
- `apps/web/src/**/api.ts` — add the GET /me/permissions call + a small query hook. [modify]

### B-5 Wiring (orchestrator/backend-developer)
- Repo typecheck; route registration (rbac.controller already registered); `biome format --check` before commit (CI-PRINCIPLES rule 4); boot-probe; /me/permissions serves 401-not-404 unauth.

### Specialist routing (vs AGENTS.md): postgres-pro, typescript-pro, backend-developer, react-specialist — all present (wave-22 set).

### Parallelization
- B-1 → B-2 serial (schema before contracts). B-3 after B-2. B-4 after B-3 (needs the endpoint contract). B-1 migration ∥ schema-def are the same concern (serial within postgres-pro).

### Self-consistency sweep
1. Every AC → step: Permission union (B-2); roles column + migration + backfill (B-1); role DTO + roleToDto (B-2/B-3); can() fail-closed + call-site swap (B-3); /me endpoint session-scoped (B-3); CTA gate + honest 403 (B-4); owner superuser unchanged (B-3, no edit to :58). ✓
2. Specialist each. ✓ 3. No file in two parallel batches. ✓ 4. design_gap_flag=false (no new mockup; CTA visibility change on existing component). ✓ 5. Reuse named (RbacService.can(), existing roles table, AssignmentsService.assertOrganizer). ✓ 6. Contracts concrete (EffectivePermissionsDto shape, migration DDL, endpoint). ✓ 7. No new dep. ✓ 8. No SDK. ✓

## BOARD conditions → enforcement
1. Migration backfill (B-1) + can() fail-closed (B-3) — T-8 reproduces no-flag→403 + absent-column→deny. 2. /me session-scoped (B-3) — T-8 IDOR assertion (?userId ignored). 3. Honest 403 CTA (B-4). 4. Owner-lockout guardrails (owner-lockout.service.ts) extend to the new flag — B-3 confirm self-demotion can't strand a server (owner superuser already covers; verify no role-edit path removes the last manage_assignments without owner fallback — owner always passes, so non-issue, document). 5. Reminders deferred (no work this wave).

→ P-4 Gate.
