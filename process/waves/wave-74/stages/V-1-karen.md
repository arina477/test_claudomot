# V-1 Karen — wave-74 (M9 entitlements substrate) source-claim verification

**Verdict: APPROVE**

Verified against the DEPLOYED production state — live commit **d79dd18** ("fix: raise free-tier placeholder cap (no owner regresses) (#92)"), API `https://api-production-b93e.up.railway.app`. All claims checked via `git show d79dd18:<path>` (deployed tree, not working tree) and live curl.

**Free cap confirmed = 100_000** (claim 3, explicitly requested): `apps/api/src/billing/entitlements.service.ts` `TIER_CAPS.free.maxServersPerOwner = 100_000`. The regression fix (646-server owner was blocked under the old `100` placeholder) is live in the deployed code.

---

## Claim-by-claim findings

### Claim 1 — Files exist @ d79dd18 — TRUE
`git cat-file -e d79dd18:<path>` returns EXISTS for all:
- `apps/api/src/db/schema/subscriptions.ts`
- `apps/api/src/billing/entitlements.service.ts`
- `apps/api/src/billing/entitlements.module.ts`
- `packages/shared/src/entitlements.ts`
- migration `apps/api/drizzle/migrations/0029_clammy_the_fallen.sql` (+ `meta/0029_snapshot.json`)

### Claim 2 — EntitlementsService surface + append-only-READ + shared exports — TRUE
`entitlements.service.ts` exposes:
- `resolveForServer(serverId)` — `db.select(...).from(subscriptions).where(eq(server_id))` (READ), no row → `'free'` default, out-of-enum tier safe-defaults to `'free'` with a logged warning.
- `resolveCreateGateForOwner(ownerId)` — `db.select({count})` over `servers` (READ). Returns `{tier, caps, currentServerCount}`.
- **No update/insert/delete against `subscriptions` anywhere in the service** — grep for `insert|update|delete` on the deployed file returns nothing. Append-only-read guarantee holds.
- Shared package (`packages/shared/src/entitlements.ts`): `TierSchema = z.enum(['free','server_pro','school'])` and `EntitlementsSchema = z.object({storageMb, callCapacity, educatorAdminTools})`, both exported with inferred types. ESM (bare `import { z } from 'zod'`, no CJS require).

### Claim 3 — Free-cap FIX live @ d79dd18 — TRUE (100_000 confirmed)
`TIER_CAPS.free.maxServersPerOwner = 100_000` with inline comment: "NON-RESTRICTIVE PLACEHOLDER: must exceed largest existing owner count (646 as of wave-74)". `server_pro`=200_000, `school`=500_000 (all ≥ free). This is the deployed value on d79dd18. Confirmed.

### Claim 4 — createServer gate is real — TRUE
`apps/api/src/servers/servers.service.ts`:
- L23 imports `EntitlementsService`; L70 injected via ctor.
- L76 `createServer(ownerId, name)`; L82–83 calls `resolveCreateGateForOwner(ownerId)` **before** the insert/transaction; L84 `if (currentServerCount >= caps.maxServersPerOwner)` → L85 `throw new ForbiddenException(...)`. Gate is pre-insert and reads the resolved cap. Real, not decorative.

### Claim 5 — Migration 0029 applied to prod — TRUE (inferred, well-supported)
`0029_clammy_the_fallen.sql` creates `subscriptions` (id/server_id/tier/created_at/updated_at) + FK to `servers.id` (`ON DELETE no action`) + `UNIQUE(server_id)`. Registered in `drizzle/migrations/meta/_journal.json` (tag `0029_clammy_the_fallen`). No wave-74 C-block deploy records are present on this branch (`process/waves/wave-74/blocks/C/*` absent — V-1 running pre-C-record), so direct "0 rows" DB confirmation was not available; but /health 200 on d79dd18 with the subscriptions schema imported into the booted app (see claim 6) plus journal registration (Railway applies migrations on deploy) makes application highly reliable. Server-free-by-default (0 rows) is the schema's documented resolve semantic, not a claim requiring a row count.

### Claim 6 — /health 200 on d79dd18, no DI cycle — TRUE
`curl` → HTTP 200, body `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`. The app booted with `EntitlementsModule` (providers+exports `EntitlementsService`, no controllers) and `ServersModule` importing `EntitlementsModule` one-way (`servers.module.ts` L3, L14 `imports: [AuthModule, RbacModule, EntitlementsModule]`). EntitlementsModule does NOT import ServersModule → acyclic. A live 200 confirms Nest resolved the DI graph without a circular-dependency boot failure.

### Claim 7 — Fence (no Stripe/price columns) — TRUE (airtight)
Grep for `stripe|price|amount|currency|payment|charge` across the deployed `subscriptions.ts` schema, `entitlements.service.ts`, and shared `entitlements.ts`: the ONLY hits are in comments that explicitly *exclude* these ("capability limits only, NOT prices"; "EXCLUDED (founder-reserved / later M9 slices): stripe_customer_id, stripe_subscription_id, price columns"). No actual Stripe/price fields. All caps are clearly labelled FOUNDER-TUNABLE PLACEHOLDER. Fence holds.

### Claim 8 — Antipattern check — CLEAN
- **Binding verify-gate-reads test is REAL, not coverage theater:** `apps/api/src/billing/entitlements.service.spec.ts` Group B constructs the **real** `ServersService` (`new ServersService(rbacMock, entitlementsMock)`) and stubs ONLY the injected EntitlementsService — so it exercises the actual gate logic in `createServer`. Three assertions:
  - restrictive cap=0, count=1 → `rejects.toThrow(ForbiddenException)` (LOAD-BEARING, comment: "proves the gate is not dead code").
  - boundary cap=1, count=1 (count >= cap) → `rejects.toThrow(ForbiddenException)`.
  - permissive cap=100_000, count=0 → SUCCEEDS (non-regression assertion).
- **The free-cap fix did NOT weaken it:** the throwing assertions use caps 0 and 1 (independent of the placeholder value); the success assertion pins `100_000` matching the shipped `TIER_CAPS.free`. Raising the placeholder to 100_000 keeps the throw path fully asserted.
- **Module boundary acyclic:** confirmed one-way import (claim 6); live 200 proves no boot cycle.

---

## Minor (non-blocking) note
`servers.service.ts:79` carries a **stale comment**: "Under the free-tier placeholder (maxServersPerOwner=100) this check is..." — says `100`, but the actual runtime value read from `TIER_CAPS.free` is `100_000`. The **runtime value is correct** (the fix landed in `entitlements.service.ts`); only the doc-comment in the caller was not updated. Similarly the service.spec permissive stub uses `maxServersPerOwner: 100` in its comment/mock, but that stub's cap value is irrelevant to its assertions (it only guarantees non-blocking with count=0). Neither affects behavior. Recommend an L-2 tidy of the stale `=100` comment; not a REJECT condition.

---

## Conclusion
Every load-bearing claim is true in the deployed state (d79dd18): files+exports present, service is append-only-read, **free cap = 100_000 fix is live**, createServer gate is real and pre-insert, migration 0029 authored+journaled (application inferred from live boot), /health 200 with acyclic EntitlementsModule↔ServersModule wiring, Stripe/price fence airtight, and the binding verify-gate-reads test is a genuine assertion against the real service. **APPROVE.**
