# Wave 23 — T-3 Contract

**Pattern:** A (CI-verified). Project-internal Zod/shared-type contracts (no external SDK).

## Contract surface (B-1)
- `EffectivePermissionsSchema` + type `EffectivePermissions` (NEW) — response contract for GET /servers/:serverId/me/permissions.
- `RolePermissionsSchema` / `CreateRoleSchema` / `UpdateRoleSchema` — +manage_assignments.

## Coverage trace
- **EffectivePermissions shape:** server emits → the 7 getEffectivePermissions unit tests assert the exact `{owner, manage_server, manage_roles, manage_channels, manage_members, manage_assignments}` shape on every branch; client consumes → AssignmentsPanel reads `perms.owner || perms.manage_assignments` against the same shared type (B-1 isolated typecheck clean → no server↔client drift). Contract traced.
- **Role DTOs:** +manage_assignments flows RolePermissionsSchema → RoleSchema → roleToDto nested permissions (P-4 karen carry, verified at B-6); create/update round-trip covered by existing rbac role tests. Negative: invalid role body → 400 (existing Zod validation, unchanged).
- CI `test` job (run 28485682987) green on merge commit — the contract-bearing unit tests ran.

## Findings
None blocking. The contract surface is fully typed end-to-end (shared package is the single source; both api response + web consumer import it) → the most expensive bug class (server↔client boundary drift) is compile-time-prevented.

```yaml
test_pattern: ci-verified
skipped: false
contracts_audited: [EffectivePermissionsSchema, RolePermissionsSchema, CreateRoleSchema, UpdateRoleSchema]
ci_evidence: ["C-1 test job run 28485682987 success (contract-bearing unit tests)"]
active_probe_results: []
infrastructure_gap_recorded: false
findings: []
```

## Exit
Every B-1 contract traced to a passing test; end-to-end typed (no drift). → T-5 (after T-4).
