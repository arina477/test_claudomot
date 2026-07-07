# Wave 75 — B-4 Wiring

- **Repo-wide typecheck:** `pnpm turbo typecheck` → 4/4 successful (@studyhall/shared, @studyhall/api, @studyhall/web). No B-2↔B-3 drift. Turbo builds shared before api/web (dependency ordering).
- **Route registration (verified, not authored):**
  - Backend: `BillingController` + `EducatorToolsController` in `entitlements.module.ts` controllers array; `EntitlementGuard` + `{provide: BILLING_PROVIDER, useClass: MockBillingProvider}` in providers; `EntitlementsModule` imported in `app.module.ts:45`.
  - Client: `getServerPlan` + `changeServerTier` present in `apps/web/src/auth/api.ts`.
- **Env wiring:** none (no new env vars).
- **Import sanity:** covered by typecheck (clean).
- **Carry to B-5:** confirm the CI TEST job builds @studyhall/shared before running vitest (B-2 hit a stale local dist; turbo typecheck/build order it, but a bare `vitest` leg would not). B-5 runs the exact CI commands to catch this.

```yaml
typecheck_passed: true
routes_registered: [POST /servers/:serverId/billing/tier, GET /servers/:serverId/billing/plan, GET /servers/:serverId/educator-tools/status]
env_vars_wired: []
drift_defects: []
```
