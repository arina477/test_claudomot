# Wave 10 — P-3 Plan (M2 RBAC capstone, multi-spec)

## Data model (B-0, database-administrator/postgres-pro) — one migration + backfill
- `roles` (id uuid pk, server_id→servers cascade, name text, position int default 0, manage_server bool default false, manage_roles bool default false, manage_channels bool default false, manage_members bool default false, is_default bool default false, created_at). 
- `channel_permission_overrides` (id uuid pk, channel_id→channels cascade, role_id→roles cascade, can_view bool not null, unique(channel_id, role_id)).
- server_members.role_id (existing nullable scaffold) → FK roles.id (add the FK; null = default Member role).
- BACKFILL (app-side script, per the wave-9 lesson — NOT pgcrypto): for each existing server seed a default 'Member' role (all-false, is_default) ; existing members get role_id=null (→ default Member). owner_id stays superuser. (0 prod servers → moot but correct + re-runnable.)

## Backend (B-2, backend-developer) — RbacModule (apps/api/src/rbac/, imported by/alongside ServersModule per arch #3)
- 35f191f4: RbacService.can(userId, serverId, perm) — SERVER-SIDE: owner_id → true (superuser); else resolve server_members.role_id → roles.<perm> flag; default-DENY (no role/flag → false). Role CRUD endpoints (POST/PATCH/DELETE roles, gated can(manage_roles)); assign-member-role endpoint (gated can(manage_members), no self-promote). userId from session (no IDOR).
- 2c927c44: ChannelPermissionGuard — resolves channel→server from ROUTE PARAMS, computes can-view (owner OR [no-override AND not-private] OR override.can_view=true; private default-deny), 403 else. findServerDetail FILTERS channels server-side by the caller's effective visibility (non-visible absent from response). channel-override CRUD (gated can(manage_channels)).
- 7a10f13d: owner-lockout — in the role-change/member-remove/leave service paths, a TRANSACTIONAL check (row-lock / re-check in txn) that the server retains ≥1 owner (owner_id present + reachable); block (409) the last-owner-removal. (Ownership transfer minimal/deferred — the invariant just blocks.)
- shared: packages/shared/src/rbac.ts (Role, RolePermissions, ChannelOverride, AssignRole Zod). Build shared FIRST.

## Design (D-block, head-designer) — design_gap_flag TRUE-delta
- server-settings.html roles tab: list/create/edit roles + permission flags + per-channel visibility + member-role assignment. Compose on the existing server-settings shell.

## Frontend (B-3, react-specialist) — server settings Roles tab
- consumes role CRUD/assignment + channel-override + can() (or the server detail reflecting the caller's perms). UI gates controls by can() BUT server enforces. Loading/empty/error/Toast. Per the D design.

## Specialists (AGENTS.md ✓): database-administrator/postgres-pro, backend-developer, head-designer, react-specialist.
## Security (T-8 heavy): can() server-side+IDOR; no-self-promote; guard route-params-only+body-spoof; default-deny (incl private channels); channel-list server-filter (no enumeration); owner-lockout txn (concurrent race). single-role-per-member #6.
## Module placement: RbacModule (decomposer-named) imported by ServersModule, OR methods in ServersModule — backend-developer per arch #3 (invites were in ServersModule; RBAC as its own cohesive module is acceptable). P-4 karen checks.
## Sequencing: B-0 schema+backfill → B-1 shared → B-2 backend (RbacService+guard+owner-lockout, commit-per-spec) → [D-block] → B-3 UI → B-4/5/6. PUSH after each. C-2: apply migration + run backfill on prod. Verified-prod-fixture (4a2ad286) for live RBAC authed verification.
