# Wave 41 — B-1 Contracts
packages/shared/src/rbac.ts: moderate_members added to RolePermissionsSchema + CreateRoleSchema + UpdateRoleSchema + EffectivePermissions; NEW MemberTimeoutSchema (durationMinutes 1–10080) + MemberTimeoutInput. servers.ts ServerMemberSchema +mutedUntil (nullable). Mirrors existing manage_assignments field shape.
