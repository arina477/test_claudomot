# Wave 87 — B-1 Contracts (SKIPPED)

No contract surface change. Per P-3 plan § API contracts: no new/modified endpoint (both join responses stay `{ serverId }`), no new SDK, no Zod schema change, no shared-types edit. `role_id` is already an existing nullable field on the `server_members` insert type (`roles.id` FK) — the fix only populates a value that was previously omitted. Nothing to author or lock.

Fast-path (B-2 || B-3): N/A — B-3 frontend is skipped (backend-only wave), so there is nothing to parallelize. Sequence to B-2.

```yaml
skipped: true
contracts_authored: []
sdk_regenerated: false
fast_path_approved: false
deviations: []
```
