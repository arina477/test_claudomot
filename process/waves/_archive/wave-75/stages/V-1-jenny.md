# V-1 — jenny semantic-spec verification (wave-75, M9 mock-payment freemium upgrade path)

**Verdict: APPROVE**

Scope: independent semantic verification of the DEPLOYED prod state (api `api-production-b93e`, web `web-production-bce1a8`, merge commit `3b94e276` LIVE) against the authoritative spec contract in `tasks.description` of `4bc40741-146a-4f05-8970-1614eb6b2b43` (3 self-contained spec blocks). Verification only — no code changed. Every finding below cites a spec section AND observed deployed behavior.

Method: (1) read the DB-row spec (source of truth); (2) reviewed deployed source (`billing.controller.ts`, `mock-billing.provider.ts`, `billing-provider.interface.ts`, `educator-tools.controller.ts`, `entitlement.guard.ts`, `entitlements.service.ts`, `packages/shared/src/entitlements.ts`, `apps/web/src/shell/ServerPlanPanel.tsx`, `apps/web/src/auth/api.ts`); (3) exercised the LIVE endpoints via SuperTokens header-mode Bearer auth as Fixture A (owner, userId `21984eb2…`); (4) independently confirmed the live web bundle carries the mock-mode copy. Prod left clean (probe server reverted to `free`).

---

## Spec block 1 — 4bc40741 BillingProvider seam + mock tier endpoint

Each AC verified against live behavior on throwaway server `ba9e5414…` (owned by Fixture A):

| Spec AC | Live behavior | Result |
|---|---|---|
| Owner POSTs valid targetTier → 200 `{serverId,tier,entitlements}`, persisted | `free→server_pro` → **200** `{tier:"server_pro", ent:{51200,50,false}}`; `server_pro→school` → **200** `{512000,100,true}`; re-GET confirms persistence | MATCH |
| Non-owner → 403, tier unchanged | T-8 Probe 1 (Fixture B on A's server) → **403** `"Not authorized to change this server plan"`, tier read-back **STILL school (UNMODIFIED)**. Source: owner-check `server.owner_id !== userId` runs 404→403→mutate, before any write | MATCH |
| Unauth → 401 | POST with no token → **401** `{"message":"unauthorised"}` (AuthGuard, verification-REQUIRED) | MATCH |
| Invalid tier → 400, unchanged | POST `{targetTier:"platinum"}` → **400** Zod fieldError; POST `{}` → **400** "Required"; tier read-back after both = **still school (unmutated)** | MATCH |
| Unknown serverId → 404 | POST to nil-UUID → **404** `"Server not found"` | MATCH |
| resolveForServer returns new tier's entitlements next call | GET plan after each change returns the just-set caps exactly | MATCH |
| Upsert: one row per server (UNIQUE(server_id)) | `onConflictDoUpdate` on `subscriptions.server_id` (mock-billing.provider.ts). Two sequential changes on one server never produced a duplicate; GET always resolves a single tier | MATCH |
| Mock path: no real payment; response marks test/mock | `checkoutUrl: null` marker in every `TierChangeResult` (mock-billing.provider.ts:53); interface carries `status:'ok'` + optional `checkoutUrl:string\|null` shaped for a future async Stripe provider (billing-provider.interface.ts) | MATCH |

**Edge cases (block 1):** same-tier `school→school` → **200** idempotent no-op (MATCH); concurrent/last-write-wins guaranteed by the single UNIQUE(server_id) row (MATCH, structural).

Contract conformance: live responses conform to `ServerPlanSchema {serverId, tier, entitlements{storageMb, callCapacity, educatorAdminTools}}`; error envelopes are Nest standard `{message,error,statusCode}` / Zod `{fieldErrors}` as specced. GET plan `auth AuthGuard → owner or member may read`: unknown server → **404**; non-member (T-8) → **403**. MATCH.

## Spec block 2 — 69765cee real TIER_CAPS + educator-tools enforcement

| Spec AC | Live behavior | Result |
|---|---|---|
| Caps free `{2048,10,false}` / server_pro `{51200,50,false}` / school `{512000,100,true}` | LIVE GET/POST returned all three canonical tuples EXACTLY | MATCH |
| Educator-tools 403 when flag false (free/server_pro), allowed on school | `GET /educator-tools/status`: free → **403**, server_pro → **403**, school → **200** `{enabled:true}` | MATCH |
| free→school upgrade flips 403→allowed for that server | Observed end-to-end on one server: free(403) → upgrade → school(200) | MATCH |
| **Non-regression (hard AC):** high-count free owner still creates | Fixture A (owns hundreds of servers) created probe server `ba9e5414…` → success; `free.maxServersPerOwner=100_000 >> 646`. T-8 Probe 4 corroborates. Wave-74 free-cap regression NOT recurring | MATCH |

**Edge cases (block 2):** no-subscription-row server resolves `free` default → educator 403 (verified live on fresh server); out-of-enum DB tier safe-defaults to free without throwing (source: `TierSchema.safeParse` → warn + `free`, entitlements.service.ts:91-100). MATCH.

## Spec block 3 — 77665ee5 "Your plan" panel + mock upgrade UI

Verified via source review (`ServerPlanPanel.tsx`, `api.ts`) + live bundle confirmation + T-5 live-journey evidence (T-block APPROVED):

| Spec AC | Deployed behavior | Result |
|---|---|---|
| Owner sees current tier + limits (storage, concurrent voice, educator on/off) | Panel renders `server-plan-current-tier` + `dl` limits; T-5 S1 live: "Free / 2 GB / voice / educator" | MATCH |
| Owner-only upgrade/downgrade affordance; non-owner read-only | `isOwner` prop gates the entire `server-plan-change` radiogroup; parent resolves owner via opaque `getMe().userId === ownerId` (BUILD-13). Non-owner → limits only, no affordance | MATCH |
| Confirm → mock change → tier+limits refresh WITHOUT reload | `handleConfirm` → `changeServerTier` → `setPlan(updated)` in-place (no reload). T-5 S2 (M9 success metric) live: free→server_pro flipped 2GB→50GB/voice→50 in-place, 0 console errors | MATCH |
| Mock-checkout label always visible; plain Claudomat/StudyHall copy | Live bundle carries button "Switch plan (test mode — no charge)" + disclosure "This is a test checkout — StudyHall does not charge your card and no payment is taken." (independently confirmed present in the shipped JS bundle) | MATCH |
| Failed change (403/400/network) → inline error, plan unchanged | `.catch` sets `changeError` (403 → "Only the server owner can change this plan.", else generic), `setPlan` NOT called → displayed plan unchanged | MATCH |

**Edge cases (block 3):** non-owner read-only (MATCH); loading/error states present (`server-plan-loading`, `server-plan-load-error` + retry); failed change leaves plan unchanged (MATCH); mock label always visible on the affordance (MATCH).

---

## Journey continuity (item 4)

The upgrade flow has no dead-end / broken-back / unhandled-error path: load → (loading spinner / load-error+retry) → loaded plan → owner selects tier → confirm (disabled unless dirty) → success refreshes in-place OR failure shows inline error with plan intact. The mock-checkout is UNMISTAKABLY test-mode in production — both the button label ("test mode — no charge") and the standalone disclosure ("does not charge your card and no payment is taken; prices shown for reference only") ship live. The founder's mock directive (no impression of a real charge) is semantically satisfied. MATCH.

---

## Findings

No spec-DRIFT (code wrong) found. No blocking issues. Two non-blocking spec-GAP notes for a future P-2:

- **V1-jenny-G1 (spec-GAP, low/medium — already tracked as T8-F1):** `GET /servers/:serverId/educator-tools/status` composes only `AuthGuard + EntitlementGuard` with NO owner/member check (entitlement.guard.ts explicitly "does NOT perform an owner/member check"). Independently confirmed live: any authenticated user can read the boolean status of any server whose tier unlocks the flag (unknown/other server → resolves `free` → 403; a school server → 200 to any authed caller). Spec block 2's AC only required the flag-gate (which is correct and passes), so this is a spec-GAP, not drift: the spec did not anticipate the authz SCOPE of the status stub. NOT a mutation IDOR / no PII (boolean-only stub). **Follow-up requirement for the fenced real educator tools:** they MUST add an owner/member gate before exposing any server-scoped data — the guard's own comment ("compose with an owner/member check separately when the endpoint requires one") must be honored. Already surfaced at T-8 (T8-F1 medium) and carried to V-2; re-affirmed here.

- **V1-jenny-G2 (spec-GAP, low):** the informational prices ($0 / $8/mo / $99/mo) shown in `ServerPlanPanel.tsx` are hard-coded frontend presentation metadata, not part of any spec block's contract (spec is capability-caps-only, prices explicitly deferred to the founder's pricing slice). The panel correctly frames them "for reference only" and the mock disclosure neutralizes any charge impression, so this is acceptable for the mock wave — but the spec should note, for the real-Stripe P-2, that price display currently has no server-authoritative source. Non-blocking; informational for the pricing slice.

## Verdict

**APPROVE.** All 17 acceptance criteria across the 3 spec blocks match deployed intent live in prod, verified independently beyond the ACs the T-block tested. Canonical caps exact, error/authz envelopes correct, upsert one-row-per-server, educator gate flips 403→200 on school, non-regression (high-count free owner still creates) holds, and the mock upgrade UI is unmistakably test-mode with in-place refresh and error-preserves-plan. The two spec-GAPs are non-blocking and already routed (G1 = T8-F1 to V-2; G2 informational for the future pricing P-2).

_Prod left clean: probe server `ba9e5414…` reverted to `free`. No mutations left on any pre-existing server._
