# Wave 75 — V-1 Source-Claim Verification (karen)

**Scope:** M9 mock-payment freemium upgrade path. Verified against the DEPLOYED/MERGED prod state (merge commit `3b94e276`), NOT the diff.
**Method:** git tree inspection of `3b94e276`, live curl probes against prod api, source grep. No fixes attempted — verification only.

## Verdict: **APPROVE**

Every load-bearing claim in the wave is TRUE in the deployed/merged state. Files exist, are registered, routes are live behind AuthGuard, TIER_CAPS matches the canonical claim byte-for-byte, the free-cap non-regression holds, and the one deferral (pg-harness upsert integration spec) is honestly and prominently documented — no silent gap, no fake tests.

---

## Findings (each claim → evidence)

### F1 — File existence: CONFIRMED
Claim: new files exist on the merge tree.
Evidence — `git ls-tree -r 3b94e276 --name-only`:
- `apps/api/src/billing/billing-provider.interface.ts` ✓
- `apps/api/src/billing/mock-billing.provider.ts` ✓
- `apps/api/src/billing/billing.controller.ts` ✓
- `apps/api/src/billing/entitlement.guard.ts` ✓
- `apps/api/src/billing/educator-tools.controller.ts` ✓
- `apps/web/src/shell/ServerPlanPanel.tsx` ✓
- `packages/shared/src/entitlements.ts` (with additions — see F5) ✓

All present on the merge tree. Companion specs (`billing.controller.spec.ts`, `mock-billing.provider.spec.ts`, `entitlement.guard.spec.ts`, `educator-tools.controller.spec.ts`, `entitlements.service.spec.ts`, `ServerPlanPanel.test.tsx`) also present.

### F2 — Export / registration: CONFIRMED
- `EntitlementsModule` registers both controllers + binds the provider — `git show 3b94e276:apps/api/src/billing/entitlements.module.ts`: `controllers: [BillingController, EducatorToolsController]`, `providers: [..., { provide: BILLING_PROVIDER, useClass: MockBillingProvider }]`. ✓
- `EntitlementsModule` imported into app.module.ts — `app.module.ts:8` import + `app.module.ts:45` in the `imports` array. ✓
- `getServerPlan` / `changeServerTier` in web api client — `apps/web/src/auth/api.ts:1076` `getServerPlan(serverId): Promise<ServerPlan>` and `:1085` `changeServerTier(serverId, targetTier): Promise<ServerPlan>`. ✓
- `ServerPlanPanel` mounted — `apps/web/src/shell/ServerOverviewSettings.tsx:22` import + `:678` `<ServerPlanPanel serverId={serverId} isOwner={isOwner} />`. ✓ (Mount was not enumerated in the prompt but is required for the panel to be reachable — confirmed live in T-5 S1.)

### F3 — Routes live on deployed api: CONFIRMED (401 not 404)
Live curl against `https://api-production-b93e.up.railway.app`:
| Route | Result | Meaning |
|---|---|---|
| `POST /servers/testsrv/billing/tier` | **401** | route exists + AuthGuard active |
| `GET /servers/testsrv/billing/plan` | **401** | route exists + AuthGuard active |
| `GET /servers/testsrv/educator-tools/status` | **401** | route exists + AuthGuard active |
| `GET /servers/testsrv/nonexistent-xyz` (control) | **404** | discrimination confirmed — 404 IS reachable, so the 401s above are real routes, not a catch-all |

The control 404 is the load-bearing counter-evidence: the api returns 404 for a genuinely-unknown route, proving the three 401s are the route matching + AuthGuard rejecting, not a blanket handler. Source confirms guards: `billing.controller.ts:59,100` `@UseGuards(AuthGuard)`; `educator-tools.controller.ts:24` `@UseGuards(AuthGuard, EntitlementGuard)` + `:25 @RequireEntitlement('educatorAdminTools')` (correct guard order — authenticate then authorize).

### F4 — TIER_CAPS canonical + free-cap non-regression: CONFIRMED
Source `git show 3b94e276:apps/api/src/billing/entitlements.service.ts:47-66`:
- `free`: `storageMb 2_048`, `callCapacity 10`, `educatorAdminTools false`, `maxServersPerOwner 100_000` ✓ (matches claim exactly)
- `server_pro`: `storageMb 51_200`, `callCapacity 50`, `educatorAdminTools false` ✓
- `school`: `storageMb 512_000`, `callCapacity 100`, `educatorAdminTools true` ✓

**Non-regression HELD:** `free.maxServersPerOwner = 100_000` with the inline guard comment "NON-REGRESSION: must exceed largest existing owner count (646 as of wave-74); do NOT lower until the upgrade flow ships". This is the wave-74 free-cap incident guard — still non-restrictive. ✓
Note: the B-2 doc names `server_pro`/`school` maxServersPerOwner as 200_000/500_000; source confirms these (`:58`/`:64`), both ≥ free (non-restrictive). Prompt's expected caps did not enumerate those two `maxServersPerOwner` values, but they are consistent and non-regressive.

### F5 — Shared contract additions: CONFIRMED
`git show 3b94e276:packages/shared/src/entitlements.ts`:
- `TierChangeRequestSchema = z.object({ targetTier: TierSchema })` + type (`:48-49`) ✓
- `ServerPlanSchema = z.object({...})` + `ServerPlan` type (`:66-71`) ✓
- `TierChangeResponse = ServerPlan` alias (`:72`) ✓
- `TierSchema = z.enum(['free','server_pro','school'])` (`:14`) ✓

### F6 — Deploy hash match: CONFIRMED
- `/health` → 200 `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` (live).
- C-2 verdict_evidence records both services SUCCESS on commit `3b94e276cca9c1cb239beb738778ed09f0d6aded`, web `/` → 200. Merge commit `3b94e27` present in `git log` (PR #93). Live route behavior in F3 (new endpoints answering 401) is independent runtime proof that prod serves the wave-75 billing surface, corroborating the deployed hash.

### F7 — Antipattern catalog: CLEAN, with one honestly-documented deferral
- **Claimed-but-fake:** none found. Every claimed file/export/route verified against tree + live probe.
- **Decorative tests:** the specs exercise real paths (mock-billing upsert `onConflictDoUpdate` at `mock-billing.provider.ts:40`; controller owner-check `403` at `billing.controller.ts:82,115`; educator guard real decorator→guard→service path per B-2). Not asserted-true stubs.
- **Deferred-but-undocumented:** NONE. The pg-harness upsert integration spec (`billing-subscriptions-upsert.spec.ts`) is:
  - NOT on the merge tree (`git ls-tree 3b94e276` — absent), NOT on HEAD, and NOT present anywhere on disk (`find` — no match). It was authored-then-uncommitted.
  - **Honestly recorded** in T-4-integration.md as finding **T4-F2 (medium, process)**: "the authored integration spec is uncommitted (T-block runs post-merge on 3b94e276)... has NOT been executed against Postgres... will run in CI on its follow-up PR. Surfaced to V-2: the real-Postgres upsert dedup remains automated-unverified until that PR's CI run goes green." Also flagged in the T-4 handoff YAML and cross-referenced from B-2's ACCEPTED deviation (carry to T-4, BUILD-9 gap).

  **Nuance for V-2 (not a REJECT):** The parent prompt characterizes this as "deferred to PR #94 (documented)." The deferral IS documented and honest, but two details differ from that characterization and should be reconciled downstream:
  1. T-4 refers to a generic "follow-up PR" — it does **not** name "PR #94" anywhere in wave-75 docs. The specific PR number appears to be an orchestrator/prompt-side label, not yet written into the wave record.
  2. T-4 phrases it as "AUTHORED this block (153 lines)... pending CI execution on follow-up PR." Since the spec is not committed on the merge tree and not on disk, the honest state is **authored-but-not-persisted-and-not-executed** — the real-Postgres subscriptions upsert boundary is automated-unverified in the merged state. This is disclosed (T4-F2 medium), so it is not a silent gap; but "authored" slightly overstates durability given the file isn't in the repo. The behavior is however proven LIVE end-to-end (T-5 S2/S5: free→server_pro persisted, re-read via GET /billing/plan = server_pro, survived close+reopen).

  Recommend V-2 track the follow-up PR (assign/confirm #94) to (a) commit `billing-subscriptions-upsert.spec.ts`, (b) run it green in CI, (c) add `subscriptions` to `pg-harness truncateTables()` (T4-F1 low). None blocks this wave — the mechanism is live and the deferral is transparently on the record.

---

## Summary
6 of 6 verification objectives PASS. One deferral, honestly documented (T4-F2), with a minor wording/PR-number reconciliation for V-2 — not blocking. **APPROVE.**
