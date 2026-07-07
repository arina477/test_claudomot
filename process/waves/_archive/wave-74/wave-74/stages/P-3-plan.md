# Wave 74 — P-3 Plan

## Approach

### Architecture deltas
- **New:** a `subscriptions` table + a new `EntitlementsModule` (or `BillingModule`) housing `EntitlementsService` (registered in AppModule). One read-only entitlement check added inside the EXISTING `servers.service.createServer`. Optional thin "Your plan = Free" read display on an existing surface.
- **Changed:** `servers.service.createServer` gains a pre-create entitlement read (non-restrictive under free defaults). ServersModule imports EntitlementsModule (one-way).
- **Why this approach over alternatives:** (a) a single `EntitlementsService` seam vs. scattered inline `if (tier === 'free')` checks — chosen so the future real-charging slice is one integration point (point subscriptions at Stripe + swap placeholder caps), not N rewrites (ceo-reviewer 9/10). (b) default-tier-when-absent vs. a backfill-a-free-row-per-server migration — chosen default-when-absent (cheaper, no backfill, no data risk; every server resolves 'free' with no row). (c) placeholder caps as a single config map vs. hardcoded/DB — config map keeps the founder-tunable values in one clearly-marked place.
- **Failure-domain impact:** the entitlement check is a read (resolve tier + caps) added before createServer's write; under free defaults it's permissive (no behavior change). No transaction-scope change. New module boundary ServersModule→EntitlementsModule (acyclic — EntitlementsModule imports only the DB/shared, not Servers).

### Data model
- **Added:** `subscriptions` (`apps/api/src/db/schema/subscriptions.ts`, reports.ts idiom): id uuid PK; server_id text (FK servers.id, match the servers FK convention); tier text (NO pgEnum; app-boundary Zod-validated); created_at + updated_at timestamptz. NO Stripe/price/quota columns (fenced). No user_id this wave (server-tier primary; add only if a gate consumes it — it doesn't). Migration (additive; default-tier resolves free with no row → no backfill).

### API / contracts
- Shared `packages/shared/src/entitlements.ts`: `TierSchema` z.enum(['free','server_pro','school']) + `EntitlementsSchema` ({storageMb, callCapacity, educatorAdminTools} — shape not final values). Internal: `EntitlementsService.resolveForServer(serverId) → {tier, entitlements}`. No new public REST required (gate is internal); optional GET for the thin "Your plan" display if it ships.

### New deps
- None (NO Stripe this wave — fenced).

## Plan (file-level by B-stage)
**B-0 Schema** — `apps/api/src/db/schema/subscriptions.ts` (create) + Drizzle migration (0029) | **postgres-pro** | first.
**B-1 Contracts** — `packages/shared/src/entitlements.ts` (TierSchema + EntitlementsSchema + types) + index.ts re-export (.js, ESM) | **typescript-pro** | after B-0.
**B-2 Backend** — `apps/api/src/billing/entitlements.service.ts` (create, resolveForServer + founder-tunable placeholder caps config) + `entitlements.module.ts` (create, wire into AppModule) + `servers.service.ts` (read-only entitlement check in createServer) + `servers.module.ts` (import EntitlementsModule) + integration/unit test incl. the **VERIFY-GATE-READS** test (stubbed restrictive cap → createServer BLOCKS; free cap → succeeds) | **backend-developer** | after B-1.
**B-3 Frontend** — OPTIONAL thin "Your plan = Free" display (only if cheap): a small indicator on an existing server/settings surface reusing DS patterns + a `getMyPlan`/tier api fn if a GET is added; tests | **react-specialist** | after B-2. (If not cheap, B-3 records skip — backend-only substrate is a valid slice.)
**B-4 Wiring / B-5 Verify / B-6 Review** — standard.

## Specialist routing (AGENTS.md): postgres-pro, typescript-pro, backend-developer, react-specialist.

## Parallelization: B-0→B-1→B-2→B-3 serial (B-1 needed by B-2+B-3; B-2 gate+service needed by B-3; B-0 schema needed by B-2).

## Self-consistency sweep
1. Every P-2 AC → a step: tier enum+entitlements shape (B-1); subscriptions table+migration+free-default (B-0+B-2); EntitlementsService+placeholder caps (B-2); createServer gate + verify-reads test (B-2); optional "Your plan" display (B-3). ✓
2. Every step has a specialist. ✓ 3. Serial, no parallel-batch overlap. ✓ 4. design_gap_flag=false referenced (P-1). ✓ 5. Architecture deltas + trade-offs declared. ✓ 6. Data/contracts concrete, no TBD (placeholder caps are intentionally founder-tunable, not TBD-in-code). ✓ 7. No new deps (Stripe fenced). ✓ 8. No new external SDK this wave (Stripe deferred → external-SDK-integration-rules apply to the NEXT M9 slice, not this one). ✓

**Binding refinement carried (problem-framer):** B-2's test MUST assert a stubbed RESTRICTIVE cap makes createServer BLOCK (proves the gate reads the entitlement — not dead-code plumbing); the free-cap-succeeds assertion alone is insufficient. B-6 verifies the gate actually enforces the resolved entitlement.
