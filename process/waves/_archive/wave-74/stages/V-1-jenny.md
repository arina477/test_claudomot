# Wave 74 — V-1 Jenny (semantic-spec verification vs DEPLOYED prod d79dd18)

**Verdict: APPROVE**

Deployed behavior (API `https://api-production-b93e.up.railway.app`, commit d79dd18, source tree at HEAD identical to d79dd18 for all substrate files — only docs commits on top) matches the wave-74 spec-contract intent. The M9 entitlements substrate is live, non-restrictive-under-free is honored post-fix, the gate reads+enforces, the fence is airtight, and the wave traces to M9 (in_progress).

---

## Verification against spec ACs

### Spec e34642ef — Shared contract + EntitlementsService — MATCHES
- `packages/shared/src/entitlements.ts:14` — `TierSchema = z.enum(['free','server_pro','school'])`; `EntitlementsSchema` = `{storageMb, callCapacity, educatorAdminTools}` (`:32-36`); both schemas + inferred types exported and re-exported via `.js` idiom (`packages/shared/src/index.ts:336-337`). ESM-clean. Matches AC verbatim.
- `apps/api/src/billing/entitlements.service.ts` — `EntitlementsService.resolveForServer(serverId)` (`:72`) SELECTs subscriptions by server_id, defaults `'free'` when no row (`:79`), validates against `TierSchema` with **safe-default-to-free** on out-of-enum (`:81-90`) — the documented, spec-preferred choice. Tier→caps from a SINGLE founder-tunable `TIER_CAPS` placeholder map (`:37-56`), capability caps only, no prices. Registered as provider and exported by `EntitlementsModule` (`entitlements.module.ts:19-23`), imported into `AppModule` (`app.module.ts:45`). Matches.

### Spec 53d18d7f — subscriptions data model + free-default — MATCHES
- `apps/api/src/db/schema/subscriptions.ts` mirrors reports.ts idiom: uuid PK defaultRandom, `server_id` uuid FK→servers.id (no cascade, matches convention), `tier` text (NO pgEnum), created_at/updated_at timestamptz. `UNIQUE(server_id)`. `user_id` correctly OMITTED (create-gate keys on owner via `servers.owner_id`, no consumer needed it). Migration `0029_clammy_the_fallen.sql` generated + committed, forward-clean.
- Default-when-absent = free (no backfill) — the cheaper option the AC preferred. Fresh server → no row → 'free'. Out-of-enum rejected at app boundary via TierSchema, not pgEnum. Matches.

### Spec 2f61a317 — read-only createServer gate + verify-gate-reads — MATCHES
- `apps/api/src/servers/servers.service.ts:76-89` — `createServer` resolves `resolveCreateGateForOwner(ownerId)` **before** insert, reads `caps.maxServersPerOwner`, THROWS `ForbiddenException` when `currentServerCount >= cap`. Read-only; no upgrade/assignment flow built. Matches.
- **Verify-gate-reads (binding refinement) — SATISFIED.** `entitlements.service.spec.ts:153-188` — restrictive cap=0 (count=1) → THROWS, plus a boundary cap=1/count=1 → THROWS, AND the permissive free cap (100_000, count=0) → SUCCEEDS. The mandatory restrictive-blocks assertion is present — not coverage theater. CI-proven per T-5 (`gate-enforces-throws PASS`).

---

## Directed checks

1. **Substrate semantics** — CONFIRMED. Billing-agnostic tier record (default free), EntitlementsService resolving tier→caps, read-only createServer gate. All three seams live and wired (one-way ServersModule→EntitlementsModule, no DI cycle).

2. **Non-restrictive-under-free (the spec's core promise)** — HONORED post-fix. The initial cap=100 violated "permissive enough that no existing owner regresses" (blocked the 646-server fixture owner). PR #92 (d79dd18) raised free `maxServersPerOwner` to 100_000 (`entitlements.service.ts:42`); T-5 re-ran the authed create-server e2e GREEN on d79dd18 (646 < 100_000). **Resolved spec-gap, not residual drift** — the deployed value is non-restrictive.

3. **Verify-gate-reads** — CONFIRMED. Gate READS + ENFORCES (restrictive → THROWS), CI-proven (T-5), matches the binding AC.

4. **Fence** — AIRTIGHT. No functional Stripe/price/checkout/quota/customer_id anywhere in `billing/`, `subscriptions.ts`, or `entitlements.ts` — the only match is the EXCLUDED-list comment (`subscriptions.ts:24`). Placeholder caps clearly commented founder-tunable. M9 success-metric absent and fenced (`milestones` M9 prose: `## Success metric / _TBD by founder_`). Founder checkpoint surfaced non-blocking (`process/session/updates/founder-checkpoint-2026-07-07-m9.md`).

5. **Trace** — CONFIRMED. Task 53d18d7f → milestone `3e507bc0` "M9 — Monetization: freemium tiers" (**in_progress**, the founder-picked pivot). Substrate is the pricing/credential-independent first slice.

---

## Findings

### Non-blocking (spec-drift, cosmetic — does NOT change behavior)
- **[spec-drift, LOW] Stale inline comment in createServer.** `servers.service.ts:79-81` still reads `maxServersPerOwner=100` / `(100 servers max)` in the comment prose, while the actual enforced value (`TIER_CAPS.free.maxServersPerOwner`) is `100_000`. The COMMENT drifted from the CODE; the deployed behavior is correct (100_000 non-restrictive). Doc-only — flag for L-1 cleanup, not a rework. No functional impact.

### Deferred (spec-gap → V-2, correctly out of scope)
- **[spec-gap, LOW] createServer entitlement gate is non-transactional (read-then-insert TOCTOU).** The count-and-check (`:82-88`) runs before the insert transaction (`:91`), so two concurrent creates could each pass a boundary cap. Irrelevant under the 100_000 free placeholder (never restrictive), but when real low caps ship the gate must move inside the txn or use a constraint. The spec's "read-only, non-restrictive scaffolding" clause did not anticipate concurrency because the placeholder is intentionally permissive. Correctly a V-2 follow-up, not a wave-74 blocker.

### Spec-gap resolved this wave
- The "set free-tier caps permissive enough that no existing server regresses" clause under-specified the actual permissive value; the initial cap=100 was a real gap the T-block caught on live prod and fixed forward to 100_000. Now resolved and re-verified.

---

## Relevant files
- `/home/claudomat/project/packages/shared/src/entitlements.ts`
- `/home/claudomat/project/packages/shared/src/index.ts` (lines 336-337)
- `/home/claudomat/project/apps/api/src/billing/entitlements.service.ts`
- `/home/claudomat/project/apps/api/src/billing/entitlements.module.ts`
- `/home/claudomat/project/apps/api/src/billing/entitlements.service.spec.ts`
- `/home/claudomat/project/apps/api/src/db/schema/subscriptions.ts`
- `/home/claudomat/project/apps/api/drizzle/migrations/0029_clammy_the_fallen.sql`
- `/home/claudomat/project/apps/api/src/servers/servers.service.ts` (lines 76-89; stale comment 79-81)
- `/home/claudomat/project/apps/api/src/servers/servers.module.ts`
- `/home/claudomat/project/apps/api/src/app.module.ts` (line 45)
- `/home/claudomat/project/process/session/updates/founder-checkpoint-2026-07-07-m9.md`
