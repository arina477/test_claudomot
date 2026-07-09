# Wave 87 — B-2 Backend

Specialist: `node-specialist` (NestJS). Implemented per P-3 plan; one follow-up cleanup (doc-comment reposition).

## Files implemented
- `apps/api/src/servers/servers.service.ts` (+38/-2):
  - New private `resolveDefaultRoleId(tx, serverId): Promise<string | null>` — `select roles.id where server_id=$ and is_default=true order by position asc, id asc limit 1`; returns `row?.id ?? null`. LIMIT 1 + stable ORDER BY load-bearing (no unique idx on (server_id,is_default)); null fallback for zero-default legacy servers (never throws).
  - `joinPublicServer`: resolve roleId before insert, set `role_id: roleId` on `.values(...).onConflictDoNothing()`.
  - `joinViaInvite`: same, on `.values(...).onConflictDoNothing().returning()` — `.returning()` / `newMemberJoined` / invite use-count accounting untouched.
  - No new imports (roles, and, eq, asc already present).

## /simplify
Intent satisfied by construction — the edit is a minimal resolver + two one-line value additions; the fully-shared-insert-helper over-abstraction (plan Alt-C) was explicitly avoided; no dead code. Follow-up moved the resolver above joinPublicServer's JSDoc so the doc comment is not orphaned.

## Typecheck
`pnpm --filter @studyhall/api typecheck` — clean (both after initial impl and after the reposition).

## Deviations from plan
none.

```yaml
skipped: false
fast_path_active: false
specialists_spawned: [node-specialist]
files_implemented: [apps/api/src/servers/servers.service.ts]
deviations: []
simplify_applied: true
```
