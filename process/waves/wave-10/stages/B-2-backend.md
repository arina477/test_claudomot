# Wave 10 — B Backend (RBAC core, commit-per-spec)
- B-0 schema (afb1018): roles (4 fixed flags + is_default) + channel_permission_overrides (UNIQUE(channel_id,role_id)+INDEX) + server_members.role_id FK (set null). migration 0004_green_madripoor.sql + db:backfill-roles (app-side, default Member seed). Table=channel_permission_overrides.
- B-1 shared (e3d8afe): rbac.ts (Role/RolePermissions/ChannelOverride/CreateRole/UpdateRole/AssignRole/UpsertChannelOverride).
- 35f191f4 (114bf5f): RbacService.can() SERVER-SIDE (owner_id superuser; role flag; default-DENY; userId session no-IDOR). Role CRUD (can manage_roles). assignRole (can manage_members, no self-promote 403). RbacModule imported by ServersModule.
- 2c927c44 (71eccf8): ChannelPermissionGuard (route-params only, no body-spoof). canViewChannel (owner all; private default-DENY unless override; public unless override deny). findServerDetail FILTERS via getVisibleChannelIds (non-visible ABSENT, no enumeration). override CRUD (can manage_channels).
- 7a10f13d (c5d24db): OwnerLockoutService — demote/remove/leave with SELECT FOR UPDATE row-lock + last-owner 409; transferOwnership atomic; concurrent-demote race serialized.
- 173 api tests (each P-4 T-8 condition).
