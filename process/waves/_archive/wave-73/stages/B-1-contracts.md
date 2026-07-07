# Wave 73 — B-1 Contracts

## Authored (task 03940edd)
- **`packages/shared/src/privacy-events.ts`** (NEW): `PrivacyEventTypeSchema` (z.enum: account_deleted/data_exported/privacy_settings_changed/user_blocked/user_unblocked) + `PrivacyEventSchema` (camelCase wire: id/actorId/eventType/targetType/targetId nullable/context record nullable/createdAt ISO string) + `PrivacyEventListResponseSchema` ({events}). Each schema + z.infer type. Mirrors account-deletion.ts + reports.ts idiom.
- **`packages/shared/src/index.ts`**: `.js` re-exports for the 3 schemas + 3 types (after account-deletion block).
- **DTO camelCase / DB snake_case:** backend maps DB→DTO at B-2.

## Verify
- `pnpm --filter @studyhall/shared typecheck` → clean.
- `pnpm --filter @studyhall/shared build` → clean; **dist/privacy-events.js confirmed ESM (export, no require)** — the wave-72 P0 ESM fix stays intact.

## Deviations
- none.

```yaml
skipped: false
contracts_authored: [packages/shared/src/privacy-events.ts, packages/shared/src/index.ts]
sdk_regenerated: false
fast_path_approved: false
deviations: []
```
