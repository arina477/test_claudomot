# Wave 75 — B-1 Contracts

Added to `packages/shared/src/entitlements.ts` (+ index.ts re-export, ESM named exports, `.js` paths):
- `TierChangeRequestSchema` = `z.object({ targetTier: TierSchema })` + type `TierChangeRequest`
- `ServerPlanSchema` = `z.object({ serverId: z.string(), tier: TierSchema, entitlements: EntitlementsSchema })` + type `ServerPlan`
- `TierChangeResponse` = type alias of `ServerPlan` (POST tier + GET plan share the shape)

Reuses existing `TierSchema` (z.enum) + `EntitlementsSchema` — no pgEnum, no enum redefinition. ESM/named-export discipline honored (wave-72 P0 lesson). Shared-package typecheck clean in isolation.

```yaml
skipped: false
contracts_authored: [packages/shared/src/entitlements.ts, packages/shared/src/index.ts]
sdk_regenerated: false
fast_path_approved: false
deviations: []
```
Commit: 2a8c224 (task: 4bc40741)
