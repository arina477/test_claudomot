# Wave 29 — B-1 Contracts (FIRED — dead-schema deletion)

typescript-pro deleted the unused `ServerMembersResponseSchema`. Safety gate passed: grep found exactly 4 hits (definition + type + 2 barrels), **zero real consumers** → safe to delete (no align-fallback needed).

- `packages/shared/src/servers.ts`: removed `ServerMembersResponseSchema` (:66-68) + `ServerMembersResponse` type (:69). `ServerMemberSchema`/`ServerMember` kept (live).
- `packages/shared/src/index.ts`: removed BOTH barrel re-exports (:23 schema + :34 type).
- `pnpm --filter @studyhall/shared typecheck` → green (exit 0). biome clean.
- Commit `2c18c22`, pushed. No deviation.

```yaml
skipped: false
contracts_authored: []
contracts_deleted: [ServerMembersResponseSchema, ServerMembersResponse]
sdk_regenerated: false
fast_path_approved: false   # B-1 fired (not a skip); B-2 sequences after
deviations: []
```

## Exit
Dead schema removed, shared typecheck green. → B-2 (backend ||-fix).
