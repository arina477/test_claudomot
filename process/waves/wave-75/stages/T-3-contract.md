# Wave 75 — T-3 Contract

## Action 1 — Pattern decision
B-1 `contracts_authored`: `packages/shared/src/{entitlements.ts,index.ts}` — project-internal Zod schemas (`TierChangeRequestSchema`, `ServerPlanSchema`, `TierChangeResponse` alias). `sdk_regenerated: false` — NO external SDK (Stripe fenced). → **Pattern A** (CI contract coverage via type + unit tests) **+ a live shape probe** (mixed) since the wave shipped LIVE and the endpoints are reachable in prod.

## Action 2 — Pattern A (CI evidence)
The shared DTOs are consumed at both ends and validated by the C-1-green suites:
- Server emits: `billing.controller.ts` returns `ServerPlan` (typed) from both POST tier and GET plan; `TierChangeRequestSchema.safeParse(body)` validates the request boundary (400 on parse fail).
- Client consumes: `apps/web/src/auth/api.ts` `changeServerTier` calls `TierSchema.parse` at the boundary; `getServerPlan` returns `ServerPlan`.
- CI `typecheck` + `test` jobs green on merge commit → the shared types are satisfied at both call sites (compile-time contract parity). billing.controller.spec (10) + ServerPlanPanel.test (4) exercise the shapes at runtime.

## Action 3 — Pattern B / live shape probe (against LIVE prod, Fixture A)
Authenticated as Fixture A (userId 21984eb2…), probed the live endpoints on a server Fixture A owns:

**GET /servers/:serverId/billing/plan → 200:**
```json
{"serverId":"ad62cd12-...","tier":"free","entitlements":{"storageMb":2048,"callCapacity":10,"educatorAdminTools":false}}
```
Matches `ServerPlanSchema` EXACTLY: {serverId:string, tier:enum, entitlements:{storageMb:number, callCapacity:number, educatorAdminTools:boolean}}. Values match canonical free TIER_CAPS.

**POST /servers/:serverId/billing/tier {targetTier:"server_pro"} → 200:**
```json
{"serverId":"0c8192da-...","tier":"server_pro","entitlements":{"storageMb":51200,"callCapacity":50,"educatorAdminTools":false}}
```
Response is a `ServerPlan` (TierChangeResponse alias holds — POST tier + GET plan share the shape). server_pro entitlements match canonical caps.

**POST {targetTier:"school"} → 200:** entitlements `{storageMb:512000,callCapacity:100,educatorAdminTools:true}` — school caps match, educatorAdminTools flips true.

Negative contract shapes: invalid targetTier ("enterprise_lol") → 400 (Zod flatten envelope); unknown serverId → 404; unauth → 401. All error envelopes well-formed (`{message,error,statusCode}`).

## Action 4 — Coverage audit
| Contract (B-1) | Covered by | Live probe |
|---|---|---|
| TierChangeRequestSchema {targetTier} | billing.controller.spec (valid/invalid/missing → 200/400/400) | invalid→400, valid→200 ✓ |
| ServerPlanSchema {serverId,tier,entitlements} | GET plan tests + type parity | GET 200 shape exact ✓ |
| TierChangeResponse (= ServerPlan alias) | POST tier 200 tests | POST 200 shape exact ✓ |
| TierSchema enum (free/server_pro/school) | service caps tests + Zod | free/server_pro/school all round-tripped live ✓ |
| EntitlementsSchema {storageMb,callCapacity,educatorAdminTools} | service caps tests | all 3 tiers' values match canonical caps live ✓ |

Every B-1 contract surface traced to a passing test AND a live 200 shape probe. New fields (entitlements sub-object) covered, not just the top-level. Negative cases (invalid input rejected) covered.

## Findings
- none (contract layer clean; live shapes match DTOs exactly).

```yaml
test_pattern: mixed
skipped: false
contracts_audited: [TierChangeRequestSchema, ServerPlanSchema, TierChangeResponse, TierSchema, EntitlementsSchema]
ci_evidence:
  - "C-1 typecheck + test jobs green on 3b94e276; billing.controller.spec (10) + ServerPlanPanel.test (4) exercise the DTOs at runtime"
active_probe_results:
  - "GET /billing/plan → 200 {serverId,tier:free,entitlements:{2048,10,false}} — matches ServerPlanSchema exactly"
  - "POST /billing/tier server_pro → 200 {tier:server_pro,entitlements:{51200,50,false}} — TierChangeResponse alias holds"
  - "POST /billing/tier school → 200 {entitlements:{512000,100,true}} — school caps + educatorAdminTools=true"
  - "invalid targetTier → 400 Zod envelope; unknown → 404; unauth → 401"
infrastructure_gap_recorded: false
findings: []
```
