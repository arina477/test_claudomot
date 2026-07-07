# Wave 74 — B-1 Contracts
## Authored (task e34642ef)
- **`packages/shared/src/entitlements.ts`** (NEW): `TierSchema` z.enum(['free','server_pro','school'] — paid names commented as founder-tunable placeholders) + `EntitlementsSchema` ({storageMb, callCapacity, educatorAdminTools} — capability SHAPE only; values in the backend founder-tunable config). Each schema + z.infer type. Mirrors privacy-events.ts / account-deletion.ts.
- **`index.ts`**: `.js` re-exports (schemas + types). Shared package stays ESM.
- NO prices/Stripe/quotas (fence).
## Verify
- typecheck clean; build ✓; **dist/entitlements.js confirmed ESM** (export, no require).
## Deviations: none.
```yaml
skipped: false
contracts_authored: [packages/shared/src/entitlements.ts, packages/shared/src/index.ts]
sdk_regenerated: false
deviations: []
```
