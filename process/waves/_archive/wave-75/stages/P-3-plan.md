# Wave 75 — P-3 Plan

## Approach section

### Architecture deltas
- **New — BillingProvider seam** (`apps/api/src/billing`): a `BillingProvider` interface + `MockBillingProvider` impl bound to DI token `BILLING_PROVIDER`. Single swap point — a `StripeBillingProvider` replaces the binding later with zero call-site changes. Interface returns `{ status, tier, entitlements, checkoutUrl?: string|null }` so a real provider's async redirect + webhook flow fits the same signature (ceo-reviewer binding). **Alt considered:** inline tier-mutation in a service method with no interface — rejected: couples the mock to call sites and forces a rewrite when Stripe lands (defeats the drop-in thesis).
- **New — billing controller** (`billing.controller.ts` in the billing module): `POST /servers/:serverId/billing/tier` (owner-only change) + `GET /servers/:serverId/billing/plan` (read). **Alt:** extend `servers.controller.ts` — rejected: keeps the billing surface cohesive in the billing module (wave-74 boundary; ServersModule→EntitlementsModule stays one-way/acyclic).
- **New — educator-tools entitlement enforcement:** an `EntitlementGuard` (or thin guarded endpoint) that resolves `educatorAdminTools` for the server and returns 403 when false. Proves entitlements gate for real (the substrate's first live enforcement) without building the actual educator tools (fenced). **Alt:** enforce a storage/voice quota instead — rejected: those need real metering + LiveKit-join wiring (genuine later slices); a boolean flag is the cheapest honest proof.
- **Changed — EntitlementsService.TIER_CAPS:** placeholder capability numbers → canonical brain-set values. `maxServersPerOwner` stays non-restrictive (free 100_000) — hard non-regression guard (wave-74 free-cap incident).
- **Changed — server settings UI:** a "Your plan" panel added to the per-server settings surface (`ServerOverviewSettings.tsx`) — tier is per-server, so this is the natural home (not the user-level privacy page).
- **Failure-domain impact:** tier-change is a single upsert behind an owner-check (no new transaction scope); educator guard + plan read are reads. New controller lives in the existing billing module — no new cross-service boundary. The createServer TOCTOU is untouched (deferred at P-0; caps stay non-restrictive).

### Data model
- **No schema change.** Reuse `subscriptions` (wave-74 migration 0029, `UNIQUE(server_id)`). Tier change = `INSERT ... ON CONFLICT (server_id) DO UPDATE SET tier=$1, updated_at=now()`. `tier` stays text (NO pgEnum), Zod-validated at the boundary. No migration, no backfill, no index change.

### API contracts (concrete)
- **POST `/servers/:serverId/billing/tier`** — body `{ targetTier: Tier }` (Zod `TierChangeRequest`); auth `AuthGuard` + `req.session.getUserId()`; owner-check before write. → 200 `{ serverId, tier, entitlements }` | 400 invalid targetTier | 401 unauth | 403 non-owner | 404 unknown server. Idempotent on same-tier (200 no-op).
- **GET `/servers/:serverId/billing/plan`** — auth `AuthGuard`; owner or member may read. → 200 `{ serverId, tier, entitlements }` | 401 | 404.
- **Educator-tools guarded endpoint** (e.g. `GET /servers/:serverId/educator-tools/status`) — `AuthGuard` + `EntitlementGuard(educatorAdminTools)` resolving the server tier → 200 when true (school) | 403 `{ message }` when false (free/server_pro).

### New deps
- **None.** Mock billing only; real Stripe SDK fenced (rule 6). No SDK pre-build checklist required this wave.

## Plan section

### File-level steps by B-stage
**B-0 Branch & schema** — create branch `wave-75-mock-billing`; NO migration (reuse subscriptions). | orchestrator | first.

**B-1 Contracts** — `packages/shared/src/entitlements.ts` (add `TierChangeRequest` `{targetTier}` + `TierChangeResponse`/`ServerPlan` `{serverId, tier, entitlements}` Zod + types) + `packages/shared/src/index.ts` (`.js` ESM re-export). | **typescript-pro** | after B-0.

**B-2 Backend** — | **backend-developer** | after B-1:
- `apps/api/src/billing/billing-provider.interface.ts` (create) — `BillingProvider` + `BILLING_PROVIDER` token.
- `apps/api/src/billing/mock-billing.provider.ts` (create) — `MockBillingProvider.startTierChange` upserts `subscriptions.tier`, returns `{status:'ok', tier, entitlements, checkoutUrl:null}`, marked test-mode.
- `apps/api/src/billing/billing.controller.ts` (create) — POST tier (owner-check, TierSchema-validate, no-IDOR) + GET plan.
- `apps/api/src/billing/entitlements.module.ts` (modify → billing module) — provide `BILLING_PROVIDER`→MockBillingProvider, register billing.controller + EntitlementGuard.
- `apps/api/src/billing/entitlements.service.ts` (modify) — TIER_CAPS → canonical (free callCapacity 10; server_pro storageMb 51200/callCapacity 50; school storageMb 512000/callCapacity 100); `maxServersPerOwner` unchanged non-restrictive.
- `apps/api/src/billing/entitlement.guard.ts` (create) — resolves a named entitlement flag for `:serverId`, 403 when false.
- educator-tools endpoint (thin) guarded by EntitlementGuard('educatorAdminTools').
- specs: `billing.controller.spec.ts` (owner→200+persist, non-owner→403, unauth→401, invalid→400, unknown→404, upsert one-row, same-tier idempotent), `entitlements.service.spec.ts` (canonical caps + non-regression maxServersPerOwner), `entitlement.guard.spec.ts` (403 free/server_pro, allow school), integration for free→school unlock.

**B-3 Frontend** — | **react-specialist** | after B-2:
- `apps/web/src/auth/api.ts` (modify) — `getServerPlan(serverId)` + `changeServerTier(serverId, targetTier)` (credentialed-fetch idiom).
- `apps/web/src/shell/ServerPlanPanel.tsx` (create) — current tier + limits display + owner-only upgrade/downgrade affordance + mock-checkout label + refresh-on-success + error state; reuse DS patterns from apps/web/src/pages/SettingsPrivacyPage.tsx + apps/web/src/shell/PrivacyActivityPanel.tsx (note the differing dirs — pages/ vs shell/).
- `apps/web/src/shell/ServerOverviewSettings.tsx` (modify) — mount ServerPlanPanel.
- tests: `ServerPlanPanel.test.tsx` (owner affordance, non-owner read-only, refresh-on-success, error-unchanged, mock label).

**B-4 Wiring** — module registration + route wiring + repo typecheck. | backend-developer + react-specialist | after B-3.
**B-5 Verify** — lint (Biome) / unit / build green. | orchestrator-coordinated. **B-6 Review** — head-builder + /review + /simplify.

### Specialist routing (validated against AGENTS.md)
typescript-pro · backend-developer · react-specialist — all present (used wave-74). postgres-pro NOT needed (no migration).

### Parallelization map
- B-1 → B-2 → B-3 serial (B-2 needs B-1 contracts; B-3 needs B-2 endpoints). Within B-2: interface+provider → controller+guard → TIER_CAPS (TIER_CAPS edit is independent, can run parallel to the provider work). Within B-3: api client fns → panel → mount (serial).

### Self-consistency sweep
1. Every P-2 AC → ≥1 step: tier-change endpoint+owner-check+upsert (B-2 controller/provider); canonical caps+non-regression (B-2 service); educator-tools 403/allow+free→school unlock (B-2 guard/endpoint+integration); plan read (B-2 GET); Your-plan panel+affordance+refresh+error+mock-label (B-3). ✓
2. Every step has a specialist. ✓ 3. No file in two parallel batches. ✓ 4. design_gap_flag: false (referenced). ✓ 5. Architecture deltas + alternatives declared. ✓ 6. Data/API contracts concrete, no TBD. ✓ 7. No new deps. ✓ 8. No new external SDK (Stripe fenced) → no pre-build. ✓

**Binding refinements carried:** per-serverId seam key; BillingProvider shaped for real-Stripe async/webhook; owner-only no-IDOR → P-4 security-scope tightened gate + T-8; canonical caps pinned; non-regression AC on maxServersPerOwner.
