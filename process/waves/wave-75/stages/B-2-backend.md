# Wave 75 — B-2 Backend

Specialist: backend-developer. Two per-spec commits.

## Block 1 (task 4bc40741) — commit a63264c
- `billing-provider.interface.ts` (create) — `BillingProvider` (`startTierChange → {status, tier, entitlements, checkoutUrl}`) + `BILLING_PROVIDER` token (Stripe drop-in behind same token).
- `mock-billing.provider.ts` (create) — `MockBillingProvider`; subscriptions upsert onConflict(server_id); re-resolves entitlements; `checkoutUrl:null` mock marker.
- `billing.controller.ts` (create) — POST tier (AuthGuard, Zod→400, owner-check 404→403→mutate no-IDOR, same-tier idempotent 200) + GET plan (AuthGuard, owner-or-member read, 404). Opaque getUserId().
- `entitlements.module.ts` (modify) — imports AuthModule, registers BillingController + BILLING_PROVIDER→MockBillingProvider.
- Tests: billing.controller.spec (10) + mock-billing.provider.spec (2).

## Block 2 (task 69765cee) — commit 9b9ec24
- `entitlements.service.ts` (modify) — canonical TIER_CAPS: free {2048,10,false,100_000}, server_pro {51200,50,false,200_000}, school {512000,100,true,500_000}. **free.maxServersPerOwner stays 100_000 (hard non-regression, >646).**
- `entitlement.guard.ts` (create) — `EntitlementGuard` + `@RequireEntitlement(flag)` (type-safe BooleanEntitlementKey); resolves :serverId entitlements → 403 when false; pass-through when no metadata.
- `educator-tools.controller.ts` (create) — GET /servers/:serverId/educator-tools/status (AuthGuard + EntitlementGuard 'educatorAdminTools') → 200 school, 403 free/server_pro.
- Tests: entitlement.guard.spec (5) + educator-tools.controller.spec (3, real guard→service→controller free→school 403→200 unlock) + entitlements.service.spec (+canonical caps + 646-owner non-regression; fixed stale wave-74 assertion callCapacity>50→>10).

## Verify
- **Full api unit suite: 45 files, 795 tests, 0 failures.** Biome format + lint clean on touched files. AuthGuard on all 3 endpoints. /simplify: no changes (code already lean).

```yaml
skipped: false
fast_path_active: false
specialists_spawned: [backend-developer]
files_implemented: [billing-provider.interface.ts, mock-billing.provider.ts, billing.controller.ts, entitlement.guard.ts, educator-tools.controller.ts, entitlements.service.ts, entitlements.module.ts, +6 specs]
deviations:
  - {specialist: backend-developer, change: "rebuilt packages/shared/dist after B-1 (was stale)", plan_said: "n/a", why: "@studyhall/shared resolved without new DTOs until rebuilt; dist gitignored", adjudication: "ACCEPTED — carry to B-5/C-1: CI must build shared before api (turbo ordering)"}
  - {specialist: backend-developer, change: "updated pre-existing entitlements.service.spec assertion callCapacity>50→>10", plan_said: "canonical server_pro callCapacity=50", why: "old assert broke on exact new value; intent 'server_pro>free' preserved (free=10)", adjudication: "ACCEPTED"}
  - {specialist: backend-developer, change: "free→school unlock integration test placed in standard vitest suite (db.select stubbed) not test/integration/**", plan_said: "integration test for free→school unlock", why: "runs without live infra, exercises full decorator→guard→resolveForServer path", adjudication: "ACCEPTED but carry to T-4: add a real pg-harness upsert integration test (BUILD-9 — real subscriptions DB boundary not yet exercised against Postgres)"}
simplify_applied: true
