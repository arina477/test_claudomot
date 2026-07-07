# Wave 74 — B-2 Backend
**Specialist:** backend-developer (tasks e34642ef + 2f61a317).
## Files
- `apps/api/src/billing/entitlements.service.ts` (NEW) — `resolveForServer(serverId)` (SELECT subscriptions; no row → tier 'free' default-when-absent; out-of-enum → safe-default 'free' logged) + `resolveCreateGateForOwner(ownerId)` (owner treated free-tier; counts owner's servers vs cap). Single FOUNDER-TUNABLE PLACEHOLDER caps config (free/server_pro/school → storage/call/educator + maxServersPerOwner 100/500/2000 — caps only, NO prices). `entitlements.module.ts` (NEW, in AppModule).
- `servers.service.ts` — createServer reads resolveCreateGateForOwner BEFORE insert; throws ForbiddenException if currentServerCount >= maxServersPerOwner. Free cap=100 → NON-RESTRICTIVE (no existing owner regresses). ServersModule→EntitlementsModule (one-way, acyclic).
- `entitlements.service.spec.ts` (NEW) — **BINDING verify-gate-reads**: restrictive cap (maxServersPerOwner=0) → createServer THROWS ForbiddenException (proves the gate READS+ENFORCES, not dead code); boundary (cap=1,count=1→block); non-regressive (cap=100,count=0→no throw); resolveForServer (no row→free, server_pro→caps, out-of-enum→free). Plus existing-test DI updates.
## Gate decision (jenny note): servers-per-owner dimension (no server-level sub at create-time; owner resolved free-tier; free cap 100 permissive). Documented.
## Carry-forward honored: server_id uuid FK (B-0); verify-gate-reads THROWS assertion (binding); gate-subject concrete; fence (no Stripe/price/quota beyond the single gate).
## Deviations (accepted): resolveCreateGateForOwner (create-gate-specific name); CreateGateCaps extends Entitlements internally with maxServersPerOwner (not in shared schema, per plan).
## Verify: typecheck clean; biome clean (6 files); 7 new + 73 existing tests pass.
```yaml
skipped: false
specialists_spawned: [backend-developer]
files_implemented: [entitlements.service.ts, entitlements.module.ts, app.module.ts, servers.service.ts, servers.module.ts, entitlements.service.spec.ts, +test-DI-updates]
deviations: [{change: resolveCreateGateForOwner-name, adjudication: accept}, {change: CreateGateCaps-internal-extends-Entitlements, adjudication: accept}]
simplify_applied: true
```
