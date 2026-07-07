# Wave 75 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-wave75-p4)
**Reviewed against:** process/waves/wave-75/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
Wave-75 ships the smallest honest increment of the M9 monetization bet: a mock-provider freemium upgrade path that proves the expensive charging mechanism now, so real Stripe collapses to a provider swap later — laddering cleanly to the live "academic-tools + offline-first, displace Discord" bet via the M9 milestone (3e507bc0), with pricing/tier config pre-resolved by the 2026-07-07 founder standing delegation (no orphan wave, no unresolved money-decision routing). Every acceptance criterion across the three spec blocks is falsifiable and observable — HTTP status codes (200/400/401/403/404), a persisted `subscriptions.tier` row with exactly-one-row-per-server enforced by the verified `UNIQUE(server_id)` index, `resolveForServer` returning the new tier's entitlements, a 403→allowed transition on the educator-tools endpoint as the one real live-enforcement proof, and UI state (owner affordance vs non-owner read-only, refresh-on-success, unchanged-plan-on-error, always-visible mock-mode label). The payments surface clears the tightened security gate: the tier-change endpoint is owner-only with the 401/403/404 distinctions specified, no-IDOR is an explicit hard edge case (verify caller owns serverId before any write), and the owner-check-precedes-mutation ordering matches the established `updateServer` idiom I verified in `servers.service.ts` (NotFoundException → ForbiddenException resolved in the service before the write). The plan respects the locked wave-74 architecture — no migration (reuses the subscriptions upsert on the existing UNIQUE index), no new deps (Stripe fenced per rule 6), the BillingProvider seam is DI-swappable and correctly shaped for a real async-redirect/webhook provider (status + optional checkoutUrl in the return so a StripeBillingProvider drops in with zero call-site change), and educator-tools-as-the-one-enforced-entitlement is the cheapest honest proof-of-live rather than gold-plating (storage/voice quotas genuinely need metering + LiveKit wiring = later slices). The db90252a createServer-TOCTOU defer is correctly recorded, not dropped — de-parented to a standalone M9 todo, provably unreachable at this wave's non-restrictive caps, and made testable at the future restrictive-caps slice; the maxServersPerOwner non-regression is a hard AC guarding the wave-74 free-cap incident. Load-bearing claims spot-checked against code all pass: SessionNoVerifyGuard exists and is exported from AuthModule (correct over AuthGuard — it verifies session without global claim validators), TierSchema is the exact `z.enum(['free','server_pro','school'])`, the current TIER_CAPS placeholders (free callCapacity 50; server_pro 20480/200; school 102400/1000) confirm the drift the spec corrects to canonical, and the billing module + entitlements substrate are present as claimed. design_gap_flag is correctly false (thin panel reuses shipped DS patterns → B directly). No verifiable-AC failures, no scope drift, no architecture-blind path, no gold-plating.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---

## Phase 2 — karen

**Reviewer:** karen (fresh spawn, P-4 Phase-2 code-vs-claim verification)
**Method:** spot-checked load-bearing spec/plan claims against actual code via Read/Grep. Per-claim VERIFIED / UNVERIFIED / WRONG below.

### Per-claim verdicts

1. **billing module exists at `apps/api/src/billing/` (entitlements.service.ts, entitlements.module.ts); planned new files absent** — **VERIFIED.** `apps/api/src/billing/` holds `entitlements.module.ts`, `entitlements.service.ts`, `entitlements.service.spec.ts`. The four planned new files (`billing-provider.interface.ts`, `mock-billing.provider.ts`, `billing.controller.ts`, `entitlement.guard.ts`) do NOT yet exist — correct, they are creates. `entitlements.module.ts` currently declares `controllers: []` ("billing is read-only substrate this wave — no endpoints") so the plan's "modify → billing module" (add controller + guard + BILLING_PROVIDER binding) is a real, bounded delta.

2. **`subscriptions` table has `UNIQUE(server_id)` supporting the upsert** — **VERIFIED.** `apps/api/src/db/schema/subscriptions.ts:` `uniqueIndex('subscriptions_server_id_uidx').on(table.server_id)`, `tier: text('tier').notNull()` (no pgEnum), FK `server_id → servers.id`. The `INSERT ... ON CONFLICT (server_id) DO UPDATE` upsert path is supported exactly as the spec/plan describe. No schema delta needed.

3. **Current TIER_CAPS placeholder values + spec's canonical corrections** — **VERIFIED (with one spec drift note).** `entitlements.service.ts:39-52` current placeholders: free `{storageMb 2_048, callCapacity 50, educatorAdminTools false, maxServersPerOwner 100_000}`; server_pro `{20_480, 200, false, 200_000}`; school `{102_400, 1_000, true, 500_000}`. This matches the spec's stated current values (free callCapacity 50, server_pro storageMb 20480, school storageMb 102400) — the drift the spec corrects. `maxServersPerOwner` free stays `100_000` non-restrictive (verified). NOTE: the spec's canonical free target keeps `storageMb 2048` — already correct in code — so only `callCapacity 50→10` changes for free; the spec block-2 AC lists free as `{storageMb 2048, callCapacity 10, educatorAdminTools false}`, consistent. `CreateGateCaps extends Entitlements` adds internal `maxServersPerOwner` (not in shared shape) — correctly kept out of `EntitlementsSchema`.

4. **`TierSchema z.enum(['free','server_pro','school'])` + `EntitlementsSchema {storageMb, callCapacity, educatorAdminTools}` in `packages/shared/src/entitlements.ts`** — **VERIFIED.** Exact match: `export const TierSchema = z.enum(['free', 'server_pro', 'school'])` and `EntitlementsSchema = z.object({ storageMb: z.number(), callCapacity: z.number(), educatorAdminTools: z.boolean() })`.

5. **`SessionNoVerifyGuard + req.session.getUserId()` owner-check idiom in `servers.controller.ts`** — **WRONG (load-bearing).** The servers controller does NOT use `SessionNoVerifyGuard`. Every guarded route in `apps/api/src/servers/servers.controller.ts` uses `@UseGuards(AuthGuard)` (imported at line 31 `import { AuthGuard } from '../auth/auth.guard'`). `SessionNoVerifyGuard` (`apps/api/src/auth/session-no-verify.guard.ts:11`) is a **deliberate narrow exception** whose own header says it is "Used ONLY on routes that must remain reachable for authenticated-but-unverified users (/me, /profile)" — it strips the EmailVerification claim validator (`overrideGlobalClaimValidators: () => []`). `AuthGuard` is the email-verification-REQUIRED default for all other routes. **Impact:** the spec block-1 API contract and P-3 plan both pin the billing/tier endpoints to `SessionNoVerifyGuard`. Applying that guard to a **payments/entitlement-mutation** surface would let authenticated-but-email-UNVERIFIED users change server tiers — a security regression on the exact surface the P-4 security-scope-tightened gate is meant to protect. The correct idiom for these endpoints is `AuthGuard` (matching every other server-scoped mutation), with `req.session.getUserId()` + service-layer owner-check. NOTE: Phase-1 head-product asserted "SessionNoVerifyGuard... correct over AuthGuard — it verifies session without global claim validators" — that rationale is inverted; stripping the verification validator is the *weaker* posture, not the correct one for a payment write.

6. **`getUserId()` + owner-check-precedes-mutation service idiom** — **VERIFIED.** `req.session.getUserId()` is the established accessor across `servers.controller.ts`. Owner-check-before-write idiom confirmed in `servers.service.ts` (`NotFoundException('Server not found')` then `if (server.owner_id !== callerId) throw new ForbiddenException(...)`, e.g. the rotate-invite path at ~429-433 and the documented pattern at ~464). The 404→403→write ordering the spec's no-IDOR edge case requires is real and copyable. Only the *guard* name is wrong (claim 5); the getUserId + service owner-check half of the idiom is correct.

7. **web api client `apps/web/src/auth/api.ts` + settings surface `apps/web/src/shell/ServerOverviewSettings.tsx`** — **VERIFIED.** Both exist (`api.ts` 41KB credentialed-fetch client; `ServerOverviewSettings.tsx` 28KB with sibling `server-overview-settings.test.tsx`) — valid mount point for the new `ServerPlanPanel.tsx` (absent, correctly a create).

8. **DS-pattern reference `SettingsPrivacyPage.tsx` / `PrivacyActivityPanel.tsx`** — **PARTIALLY WRONG (path).** `PrivacyActivityPanel.tsx` is at `apps/web/src/shell/PrivacyActivityPanel.tsx` (correct). `SettingsPrivacyPage.tsx` is at `apps/web/src/pages/SettingsPrivacyPage.tsx` — NOT under `shell/` as the P-3 plan implies ("reuse SettingsPrivacyPage/PrivacyActivityPanel DS patterns" listed alongside shell/ files). Low severity: the file exists and is referenceable; only the implied directory is off. B-3 should point react-specialist at `pages/SettingsPrivacyPage.tsx`.

### Antipattern sweep (PRODUCT-PRINCIPLES catalog)
- **Premature abstraction (BillingProvider seam):** NOT flagged. The DI seam with `{status, tier, entitlements, checkoutUrl?}` return is justified — it is the explicit drop-in point for real Stripe (founder-directed, rule-6 fenced) and shaped for async redirect/webhook. One interface + one impl behind one token is the minimum honest seam, not speculative generality.
- **Gold-plating (educator-tools as the one enforced entitlement):** NOT flagged. Enforcing a single boolean flag (not building the actual educator tools, not wiring storage/voice metering) is the cheapest honest proof-of-live-enforcement. Correctly fenced.
- **Mock-that-misleads:** NOT flagged. `MockBillingProvider` returns `checkoutUrl:null` + is spec-required to mark test/mock mode in response metadata AND the UI carries an always-visible mock-mode label (spec block-3 AC). The mock does not fake a real charge silently.
- **Mock-the-database antipattern (PRODUCT-PRINCIPLES rule 4):** respected — no migration, real subscriptions upsert, integration test for free→school unlock specified.

### Overall verdict: **BLOCK**

One load-bearing WRONG (claim 5) on the security-critical surface this wave's tightened gate exists to protect: the spec block-1 `contracts.api` and the P-3 plan both bind the tier-change / plan-read / educator-tools endpoints to `SessionNoVerifyGuard`, which is the email-verification-BYPASS guard reserved for `/me`+`/profile`, not the `AuthGuard` used by every other server mutation. Left uncorrected, B-2 would implement a payments endpoint reachable by email-unverified sessions. This is a spec-text fix, not a re-architecture: swap `SessionNoVerifyGuard` → `AuthGuard` in the spec block-1 `api` contract lines and P-3 API-contracts section (all three endpoints), keeping `req.session.getUserId()` + service owner-check unchanged. Also correct the DS reference path (`SettingsPrivacyPage.tsx` is under `pages/`, not `shell/`) — low severity, bundle into the same edit.

**Recommended routing:** REWORK the spec (block-1 `contracts.api` guard name ×3 endpoints) + P-3 plan (API contracts guard name + DS path) before B-0. All other load-bearing claims VERIFIED — scope, seam shape, caps drift, schema, shared contracts, and mount points are sound.

- verdict_complete: true
- phase: 2 (karen)

---

## Phase 2 — jenny

**Reviewer:** jenny (fresh spawn) — P-4 Phase-2 DRIFT check: spec + plan vs prior decisions (distinct lens from karen's code-vs-claim verification)
**Cross-referenced:** `command-center/product/product-decisions.md` (esp. 2026-07-07 entries L825-833) + `command-center/artifacts/user-journey-map.md` (wave-67 Server-Settings-Overview surface L407; wave-74 M9 substrate note L441)
**Scope note:** this phase asks only "does any spec item drift from a settled prior decision?" — it does NOT re-adjudicate karen's `SessionNoVerifyGuard` code finding (that is a code-vs-claim defect, not a prior-decision conflict). On drift, 0 items drift.

### Per-spec-item drift table

**Spec block 1 — BillingProvider seam + mock tier endpoint (`4bc40741`)**
- **Mock-only, no real charge (AC8 "mock path performs no real payment … marks it test/mock mode"; plan L6/L22 Stripe fenced)** — **MATCHES** the 2026-07-07 founder mock-charging directive (product-decisions L826: "Do NOT connect real Stripe yet — build the freemium upgrade path now behind a MOCK/TEST payment flow"). No spec item implies real charging.
- **BillingProvider seam shaped for real-Stripe drop-in later (`status` + optional `checkoutUrl`; StripeBillingProvider swaps the DI binding, zero call-site change)** — **MATCHES** L826 ("Real Stripe integration stays fenced until the founder provides Stripe API keys") + L832 ("DI-swappable for real Stripe later"). Honors rule-6 credential fence; no real SDK pulled in.
- **Owner-only tier-change endpoint, no-IDOR (401/403/404 distinctions; owner-check before write)** — **MATCHES** the wave-75 bundle spec (L832) + the P-2 security-scope carry. No conflicting prior decision; consistent with the shipped owner-authz `ForbiddenException` idiom (wave-67 owner-only publish gate, journey L407).
- **Reuse subscriptions `UNIQUE(server_id)` upsert, NO pgEnum, text+Zod tier** — **MATCHES** the wave-74 substrate decision (L820: "NO pgEnum — tier is text validated at the app boundary by a shared Zod enum ['free','server_pro','school']"). No schema drift.

**Spec block 2 — real TIER_CAPS + educator-tools enforcement (`69765cee`)**
- **Canonical caps: free {2048 MB, 10 voice, educator=false}, server_pro {51200 MB, 50, false}, school {512000 MB, 100, true}** — **MATCHES** the brain-set M9 config (product-decisions L827: free 2 GB / 10 voice / no educator tools; server_pro 50 GB / 50 voice / no educator; school 500 GB / 100 voice / educator ON). 51200 MB = 50 GB, 512000 MB = 500 GB — exact unit conversion, no drift. (Prices $8/$99 are correctly NOT in the caps map — caps model limits, prices are UI/founder config; the spec makes no pricing claim, so it cannot contradict the founder-delegated prices.)
- **Educator-admin-tools enforced as a boolean entitlement flag (403 when false / allow when true), NOT the actual educator tools built** — **MATCHES** the wave-74 fencing (product-decisions L822: "this slice models only the ENTITLEMENT flag, not the tools"; journey L441). The spec's guarded endpoint proves the entitlement gate, not a tool build-out. Consistent — this is exactly the fencing wave-74 set.
- **Non-regression: `maxServersPerOwner` non-restrictive (≥100000 for free); wave-74 free-cap regression must not recur (hard AC)** — **MATCHES** the founder tier config parenthetical (L827: "server-count cap stays non-restrictive — no wave-74 regression") + journey L441 (free placeholder=100,000 → non-restrictive). Explicitly guards the settled wave-74 incident; reinforces, does not drift.
- **db90252a createServer-TOCTOU deferred out (standalone M9 todo, not folded in)** — **MATCHES** the P-0 disposition (L832: "deferred out at P-0 per mvp-thinner THIN — provably unreachable at non-restrictive caps"). Correctly recorded, not dropped.

**Spec block 3 — "Your plan" panel + mock upgrade UI (`77665ee5`)**
- **Panel placement in the per-server Settings → Overview surface (`ServerOverviewSettings.tsx`); owner-gated affordance / non-owner read-only** — **MATCHES** the journey map's wave-67 "Server Settings — Overview" surface (L407: owner-only `isOwner`-gated dialog reached via the ChannelSidebar gear). Tier is per-server (plan L10), so the server-level settings home is correct; the plan explicitly rejects the user-level privacy page. No prior UX decision is contradicted — the wave-74 substrate note (L441) itself named "the 'Your plan' display … fenced to the next M9 slice," which IS this wave. No drift.
- **Mock-checkout affordance clearly labeled test/mock, no real charge, plain Claudomat/StudyHall-branded language (block-3 AC4)** — **MATCHES** L826 mock directive + CLAUDE.md rules 16/18 (founder/customer-facing copy, Claudomat identity). No drift.
- **Refresh-on-success (tier/limits update without full reload) + error-leaves-plan-unchanged** — **MATCHES** the M9 success metric (L827: "the higher entitlements take effect immediately, verified live"). Directly serves the delegated success metric; no conflicting decision.

### Standing-delegation check
The 2026-07-07 STANDING pricing delegation (L828: "Auto-approve product/pricing decisions that do NOT require real payment credentials … prices, plan limits, packaging, success metrics, mock/test commercial flows → brain-owned") authorizes the brain-set prices, caps, and success metric this wave consumes. The spec/plan stay entirely within the mock / no-real-credential boundary; real Stripe keys are the only thing routed back to the founder and they remain fenced. No boundary violation, no drift.

### Overall (drift lens): **APPROVE**
Every spec item traces to a settled prior decision it honors — 0 DRIFTS, 0 contradicted decisions. The mock-only fence, the exact brain-set tier caps (with correct GB→MB conversion), the per-server "Your plan" placement on the wave-67 Overview surface, and the entitlement-flag-only educator enforcement (wave-74 fencing) all align. No conflicting prior decision to name.

**Interaction with karen's BLOCK (informational, not a drift finding):** karen's `SessionNoVerifyGuard`→`AuthGuard` finding is a spec-text vs code-idiom defect on the security surface, independent of prior-decision drift — it does not change this phase's drift verdict. My APPROVE is on drift alignment only; the gate's composite disposition should still absorb karen's BLOCK.

- verdict_complete: true
- phase: 2 (jenny)

---
## Phase 2 merge — REWORK applied (attempt 1 → re-gate attempt 2)
- **karen: BLOCK** (1 WRONG, security-critical) — billing endpoints specced with `SessionNoVerifyGuard` (email-verification-bypass, reserved for /me,/profile) instead of `AuthGuard` (verification-required, every other server mutation). As written = payments/tier-mutation reachable by unverified sessions. + LOW: SettingsPrivacyPage.tsx path is pages/ not shell/.
- **jenny: APPROVE** (0 drift across all 3 blocks; explicitly flagged karen's BLOCK must be absorbed).
- **Rework applied (spec/plan text only, no re-architecture):** `SessionNoVerifyGuard → AuthGuard` in spec block-1/2 api lines (×3 endpoints) + reuse line + P-3 API contracts; `req.session.getUserId()` + service-layer owner-check unchanged (karen VERIFIED those correct). DS path corrected in P-3 (pages/ vs shell/). Cascade: P-2 spec edit → re-gate from Action 0 (fresh head-product attempt 2). Security-scope tightened gate (payments) mandates a 2nd Phase 2 pass regardless.

---

# Wave 75 — P-4 Verdict (attempt 2)

**Reviewer:** head-product (fresh spawn, agentId head-product-wave75-p4-attempt2)
**Reviewed against:** process/waves/wave-75/blocks/P/review-artifacts.md
**Attempt:** 2  (1 = first gate, 2+ = post-rework)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
The single load-bearing defect that blocked attempt 1 has been correctly and completely closed, and nothing else in a guard-name-only edit could regress the rest of the gate — which was already sound. Verifying against the source of truth (the `tasks` row, not the convenience copy): the spec's block-1 `api` contract now pins all billing endpoints to `AuthGuard` (0 `SessionNoVerifyGuard`, 3 `AuthGuard` occurrences), so the payments/tier-mutation surface is now reachable only by authenticated-AND-email-verified sessions — matching the exact idiom every other server mutation uses in `servers.controller.ts` (which I confirmed uses `@UseGuards(AuthGuard)` on every guarded route, imported at line 31, and never `SessionNoVerifyGuard`). The `req.session.getUserId()` accessor plus the service-layer owner-check-before-write remain intact (karen VERIFIED both correct at attempt 1), so the no-IDOR edge case (401/403/404 distinctions, owner-check precedes any write) still holds on the correct — now verification-required — guard. The low-severity DS-path finding is also fixed: P-3 now references `apps/web/src/pages/SettingsPrivacyPage.tsx` with an explicit pages/ vs shell/ note, so B-3 points react-specialist at the real directory. The remainder of the gate is unchanged and re-confirmed: every AC across the three spec blocks is falsifiable and observable (HTTP status codes, a persisted `subscriptions.tier` row with exactly-one-row-per-server via the verified `UNIQUE(server_id)` index, `resolveForServer` returning the new tier's entitlements, the 403→allowed educator-tools transition as the one real live-enforcement proof, and UI owner-affordance/non-owner-read-only/refresh-on-success/unchanged-on-error/always-visible-mock-label states); the plan respects the locked wave-74 architecture (no migration — real subscriptions upsert on the existing UNIQUE index; no new deps — Stripe fenced per rule 6; BillingProvider is a DI-swappable seam shaped for real-Stripe async-redirect/webhook via `status` + optional `checkoutUrl`); educator-tools-as-the-one-enforced-boolean is the cheapest honest proof-of-live rather than gold-plating (storage/voice metering is genuinely a later slice); the mock path is honest (test/mock-mode labeled, `checkoutUrl:null`, no silent fake charge); the canonical TIER_CAPS correction plus the hard non-regression AC on non-restrictive `maxServersPerOwner` guards the wave-74 free-cap incident; and db90252a (createServer TOCTOU) is correctly deferred out as a standalone M9 todo, provably unreachable at this wave's non-restrictive caps. The wave still ladders cleanly to the live displace-Discord / offline-first + academic-tools bet via the M9 milestone, with pricing/caps/success-metric pre-resolved by the 2026-07-07 founder standing delegation and real Stripe keys the only thing still fenced to the founder. design_gap_flag remains correctly false. This is a payments-surface wave, so the security-scope tightened gate applies — the guard fix was the load-bearing item and it is now provably correct; no verifiable-AC failure, no scope drift, no architecture-blind path, no gold-plating remains.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

## Phase 2 — karen (attempt 2)

**Reviewer:** karen (fresh spawn, P-4 Phase-2 RE-verification, attempt 2)
**Method:** re-verified the attempt-1 BLOCK fix against the spec source of truth (`tasks` row `4bc40741`) + P-3 plan + real code idiom; re-confirmed every claim I VERIFIED at attempt 1 is unchanged. Per-claim VERIFIED / UNVERIFIED / WRONG below.

### Fix-verification (the attempt-1 BLOCK)

1. **Spec block-1 `contracts.api` swapped `SessionNoVerifyGuard → AuthGuard` on all billing endpoints** — **VERIFIED (fix landed).** `SELECT description FROM tasks WHERE id='4bc40741'` returns **0** `SessionNoVerifyGuard` occurrences and **3** `AuthGuard`. Line 25 `POST /servers/:serverId/billing/tier … auth AuthGuard+getUserId`; line 26 `GET /servers/:serverId/billing/plan … auth AuthGuard`; the reuse line (86) now reads `AuthGuard + req.session.getUserId() (no-IDOR)`. The educator-tools endpoint is specced in block-2 as an entitlement-guarded route layered on the same auth posture. The email-verification-BYPASS guard is fully purged from the spec.

2. **Real code idiom confirms `AuthGuard` is correct (not `SessionNoVerifyGuard`)** — **VERIFIED.** `apps/api/src/servers/servers.controller.ts` uses `@UseGuards(AuthGuard)` on **every** guarded route (import line 31; usages at 47/63/76/89/106/126/147/166/180…), each with `req.session.getUserId()`. `apps/api/src/auth/session-no-verify.guard.ts:6-7` self-documents "Used ONLY on routes that must remain reachable for authenticated-but-unverified users (/me, /profile)" and `:18` strips the EmailVerification claim (`overrideGlobalClaimValidators: () => []`). So `AuthGuard` (email-verification-REQUIRED) is the correct posture for a payments/tier-mutation surface — the fix is idiomatically right, not a mechanical swap. The security regression the attempt-1 BLOCK flagged (tier changes reachable by email-unverified sessions) is closed.

3. **P-3 plan pins `AuthGuard` on all 3 endpoints + corrected DS path** — **VERIFIED.** P-3-plan.md line 17 (`POST …/billing/tier … auth AuthGuard + req.session.getUserId(); owner-check before write`), line 18 (`GET …/billing/plan … auth AuthGuard`), line 19 (`Educator-tools guarded endpoint … AuthGuard + EntitlementGuard(educatorAdminTools)`). 0 `SessionNoVerifyGuard` in the plan. DS path corrected at line 43: `reuse DS patterns from apps/web/src/pages/SettingsPrivacyPage.tsx + apps/web/src/shell/PrivacyActivityPanel.tsx (note the differing dirs — pages/ vs shell/)` — both files exist at exactly those paths.

### Re-confirmation of attempt-1 VERIFIED claims (unchanged)

4. **billing module files (creates absent)** — **VERIFIED (unchanged).** `apps/api/src/billing/` still holds only `entitlements.module.ts`, `entitlements.service.ts`, `entitlements.service.spec.ts`; the 4 planned new files remain absent (correct creates).
5. **`subscriptions` UNIQUE(server_id)** — **VERIFIED (unchanged).** `subscriptions.ts:16` documents `UNIQUE(server_id) — at most one subscription row per server`; `tier: text('tier').notNull()` (no pgEnum), FK `server_id → servers.id`. Upsert path intact, no schema delta.
6. **TIER_CAPS current placeholders + non-regression `maxServersPerOwner`** — **VERIFIED (unchanged).** `entitlements.service.ts` free `{2_048, 50, false, 100_000}`, server_pro `{20_480, 200, false, 200_000}`, school `{102_400, 1_000, true, 500_000}` — the drift the spec corrects; free `maxServersPerOwner: 100_000` non-restrictive (comment: "must exceed largest existing owner count (646 as of wave-74)"). `CreateGateCaps extends Entitlements` keeps `maxServersPerOwner` out of the shared shape. Non-regression hard AC preserved.
7. **TierSchema / EntitlementsSchema** — **VERIFIED (unchanged).** `packages/shared/src/entitlements.ts:14` `z.enum(['free','server_pro','school'])`; `:32-34` `EntitlementsSchema = z.object({ storageMb, callCapacity, educatorAdminTools })`. Exact.
8. **owner-check idiom (`getUserId()` + service-layer owner-check before write)** — **VERIFIED (unchanged).** `req.session.getUserId()` accessor across servers.controller.ts; 404→403→write ordering copyable from servers.service.ts. Guard name now correct (claim 1); the getUserId + service owner-check half was always right.
9. **web api client + settings mount + DS path** — **VERIFIED (fixed).** `apps/web/src/auth/api.ts` (41KB), `apps/web/src/shell/ServerOverviewSettings.tsx` (28KB) both exist (valid mount for the new `ServerPlanPanel.tsx`, which is correctly absent). `SettingsPrivacyPage.tsx` confirmed at `pages/` (25KB) and `PrivacyActivityPanel.tsx` at `shell/` (10KB) — the attempt-1 PARTIALLY-WRONG path finding is now corrected in P-3 with an explicit pages/-vs-shell/ note.

### Overall verdict (attempt 2): **APPROVE**

Both attempt-1 defects are closed. Security-critical (load-bearing): the spec + P-3 plan bind all three billing endpoints to `AuthGuard` (0 `SessionNoVerifyGuard`), matching the email-verification-REQUIRED idiom every other server mutation uses — the payments/tier-mutation surface is no longer reachable by email-unverified sessions. The `req.session.getUserId()` + service-layer owner-check (no-IDOR, 401/403/404 distinctions) remain intact. Low-severity: the DS reference path is corrected (`SettingsPrivacyPage.tsx` under `pages/`). Every other load-bearing claim re-verified unchanged — billing module, subscriptions UNIQUE(server_id), TIER_CAPS drift + non-restrictive maxServersPerOwner, TierSchema/EntitlementsSchema, owner-check idiom, web api client + ServerOverviewSettings mount. 0 UNVERIFIED, 0 WRONG. Clear to proceed to B-0.

- verdict_complete: true
- phase: 2 (karen, attempt 2)

---

## Phase 2 — jenny (attempt 2)

**Reviewer:** jenny (fresh spawn) — P-4 Phase-2 DRIFT RE-check (attempt 2, post security-guard rework)
**Verified against source of truth:** `SELECT description FROM tasks WHERE id='4bc40741-146a-4f05-8970-1614eb6b2b43'` (the tasks-row spec contract, NOT the convenience copy)
**Cross-referenced:** `command-center/product/product-decisions.md` (2026-07-07 M9 entries L825-828, L830-834) + `command-center/artifacts/user-journey-map.md` (wave-67 Server Settings — Overview surface L407; wave-74 M9 substrate note L441)
**Delta since my attempt-1 APPROVE (0 drift):** `SessionNoVerifyGuard → AuthGuard` on the 3 billing endpoints (spec block-1 `api` ×2 explicit + reuse line + P-3 API contracts) — a karen-raised security fix keeping the owner-check intact; plus a DS-path correction (`SettingsPrivacyPage.tsx` under `pages/`, not `shell/`). No scope / AC / pricing / caps change.
**Scope note:** this phase asks only "does any spec item drift from a settled prior decision?" — the guard swap is evaluated for whether it INTRODUCES new drift, not re-adjudicated as a code finding (karen's lane, already APPROVE at attempt 2).

### Guard-swap drift verdict (the only load-bearing change)

**`SessionNoVerifyGuard → AuthGuard` on the 3 billing endpoints — MATCHES / NO NEW DRIFT.**
Verified in the tasks-row source: spec block-1 `contracts.api` now reads `auth AuthGuard+getUserId` (POST tier) and `auth AuthGuard` (GET plan) — **3** `AuthGuard` occurrences, **0** `SessionNoVerifyGuard` — and the reuse tail reads `AuthGuard + req.session.getUserId() (no-IDOR)`. `AuthGuard` is the verification-required idiom every OTHER server-scoped mutation uses (journey L407 wave-67 owner-only Overview surface; wave-67 `/discover` + `join-public` both `AuthGuard`; every guarded `servers.controller.ts` route). The swap moves the payments surface FROM the narrow email-verification-bypass exception (reserved for `/me`,`/profile`) ONTO the project's default server-mutation guard — this is **consistency toward the established idiom, not drift away from it**. No prior decision mandated `SessionNoVerifyGuard` for this surface: the only place that name appears is the append-only decomposition-log line (product-decisions L833, historical, written before this rework) and the wave-74 substrate note (L441) names no guard at all — so there is no settled decision the swap contradicts. The owner-check-before-write half of the no-IDOR contract (`getUserId()` + service-layer `ForbiddenException`) is unchanged, so the founder's owner-only intent (401/403/404 authz) still holds — now on the STRONGER (verification-required) guard.

**DS-path correction (`SettingsPrivacyPage.tsx` pages/ not shell/) — MATCHES / NO DRIFT.** A file-location reference fix; no UX or placement decision changes. The panel still mounts on the wave-67 per-server Settings→Overview surface (journey L407), the settled placement.

### Per-spec-item drift table (re-affirmed)

**Spec block 1 — BillingProvider seam + mock tier endpoint (`4bc40741`)**
- Mock-only, no real charge (AC8) — **MATCHES** product-decisions L826 ("build the freemium upgrade path now behind a MOCK/TEST payment flow"; "Do NOT connect real Stripe yet").
- BillingProvider seam shaped for real-Stripe drop-in later (`status` + optional `checkoutUrl`, DI-swap zero call-site change) — **MATCHES** L826 + L832. Rule-6 credential fence honored.
- Owner-only tier-change, no-IDOR (401/403/404; owner-check before write) — **MATCHES** the wave-75 bundle intent (L832) + wave-67 owner-authz idiom (journey L407). **Now specced on `AuthGuard`** — stronger, still owner-only, no drift.
- Reuse subscriptions `UNIQUE(server_id)` upsert, NO pgEnum, text+Zod tier — **MATCHES** the wave-74 substrate decision (L820).

**Spec block 2 — real TIER_CAPS + educator-tools enforcement (`69765cee`)**
- Canonical caps free {2048 MB / 10 voice / educator=false}, server_pro {51200 / 50 / false}, school {512000 / 100 / true} — **MATCHES** the brain-set M9 config (L827: free 2 GB/10/no; server_pro 50 GB/50/no; school 500 GB/100/ON). 51200 MB=50 GB, 512000 MB=500 GB — exact GB→MB conversion, no drift. Prices ($8/$99) correctly NOT in the caps map — no pricing claim to contradict. **Unchanged by the guard rework.**
- Educator-admin-tools as a boolean entitlement flag (403/allow), NOT the tools built — **MATCHES** the wave-74 fencing (L822; journey L441).
- Non-regression: `maxServersPerOwner` non-restrictive (≥100000 free); wave-74 free-cap regression must not recur (hard AC) — **MATCHES** L827 + journey L441.
- db90252a createServer-TOCTOU deferred out (standalone M9 todo) — **MATCHES** the P-0 disposition (L832).

**Spec block 3 — "Your plan" panel + mock upgrade UI (`77665ee5`)**
- Panel on per-server Settings→Overview; owner-gated affordance / non-owner read-only — **MATCHES** journey L407 (wave-67 owner-only `isOwner`-gated Overview surface) + L441 (the "Your plan" display was explicitly fenced to "the next M9 slice" = this wave). DS-path fix (pages/) does not move this placement.
- Mock-checkout affordance labeled test/mock, no real charge, Claudomat/StudyHall-branded (AC4) — **MATCHES** L826 mock directive + CLAUDE.md rules 16/18.
- Refresh-on-success + error-leaves-plan-unchanged — **MATCHES** the M9 success metric (L827 "higher entitlements take effect immediately, verified live").

### Standing-delegation + directive re-affirmation
- **2026-07-07 mock-only directive (L826):** honored — spec/plan stay entirely within the mock / no-real-credential boundary; real Stripe keys remain the ONLY thing fenced to the founder. The guard swap does not touch the mock boundary.
- **Brain-set tier config (L827):** honored — canonical caps + non-restrictive `maxServersPerOwner` unchanged by this rework.
- **M9 success metric (L827: free→server_pro self-upgrade, entitlements take effect immediately, verified live):** honored — block-3 refresh-on-success + block-2 403→allowed educator transition still serve it directly.
- **STANDING pricing delegation (L828):** honored — brain-set prices/caps/success-metric consumed within the mock boundary; no boundary violation.

### Overall (drift lens): **APPROVE**
The `SessionNoVerifyGuard → AuthGuard` swap introduces **0 new drift** — it aligns the payments surface with the verification-required idiom every other server mutation already uses (consistency, not drift), keeps the owner-check / no-IDOR contract intact, and contradicts no settled prior decision (the only `SessionNoVerifyGuard` mention is a historical append-only log line, not a binding decision). The DS-path correction is a pure reference fix with no placement change. All three spec blocks continue to trace cleanly to their settled prior decisions: the mock-only fence, the exact brain-set tier caps (correct GB→MB conversion), the per-server "Your plan" placement on the wave-67 Overview surface, and the entitlement-flag-only educator enforcement. **0 DRIFTS, 0 contradicted decisions.** The founder's 2026-07-07 mock-only directive, the brain-set tier config, and the M9 success metric are all re-affirmed.

- verdict_complete: true
- phase: 2 (jenny, attempt 2)

---
## P-4 FINAL — GATE PASSED (attempt 2)
- Phase 1 (head-product attempt 2): **APPROVED** (guard fix verified: 0 SessionNoVerifyGuard / 3 AuthGuard matching servers.controller idiom).
- Phase 2 attempt 2: **karen APPROVE** (both attempt-1 defects closed, 0 WRONG) + **jenny APPROVE** (0 drift) + **Gemini UNAVAILABLE** (HTTP 429 → degrades per Action 3, does not block).
- Security-scope tightened gate (payments surface): satisfied — 2 Phase-2 iterations run (attempt 1 BLOCK→fix, attempt 2 APPROVE). rework_attempt_cap_remaining: 1.
- **Verdict: gate-passed. design_gap_flag=false → next block B-0.**
