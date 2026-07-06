# V-1 Karen — wave-67 (M11 server discovery)

**Agent:** karen (Reality assessment / claim verification)
**Stage:** V-1 Review
**Deploy state verified against:** merge `43d20b2` on `main` (both api + web serve `43d20b2`; migration 0024 applied to prod). Local HEAD `dfe35a1` = T-9 docs commit on top of `43d20b2`; no code delta.
**Verdict:** **APPROVE** — the load-bearing claims (schema / endpoints / security-gate / frontend) are real and live. ONE claimed-but-broken computation confirmed: `discoverServers.memberCount` returns 0 in deployed reality (WRONG claim), correctly caught live at T-5, routed to V-2, non-blocking to the wave's shipped promise.

---

## Reality assessment (functional state)

Public server discovery is genuinely shipped end-to-end: the schema columns are real and indexed, the migration is real and applied, both endpoints exist and are AuthGuard-gated, the private-join security gate is real and reads-before-insert, and the frontend page/route/api-client/rail entry all exist and render live. This is legitimate shipped work. The single live-caught defect is the `memberCount` social-proof metric, which always displays 0 — cosmetic-but-user-visible, not a functional break.

---

## Claim-by-claim verification

### Claim 1 — Schema live — TRUE
- `apps/api/src/db/schema/servers.ts:30` — `is_public: boolean('is_public').default(false).notNull()` ✓ (NOT NULL default false)
- `servers.ts:31` — `description: text('description')` ✓ (nullable)
- `servers.ts:32` — `topic: text('topic')` ✓ (nullable)
- `servers.ts:34` — `index('servers_is_public_idx').on(table.is_public)` ✓
- `apps/api/drizzle/migrations/0024_cold_baron_zemo.sql:1-4` — exactly ADD COLUMN x3 (`is_public` NOT NULL default false, `description` text, `topic` text) + `CREATE INDEX "servers_is_public_idx"` ✓
- Applied-in-prod evidence accepted: head-ci-cd verified via information_schema; deployed `GET /servers/discover` returns 401 (AuthGuard) not 500 (missing-column), confirming columns exist. Consistent with T-2/T-3/T-4 green on the deployed merge. **Verified.**

### Claim 2 — Endpoints exist — TRUE
- `servers.service.ts:537` — `async discoverServers(...)` ✓
- `servers.service.ts:613` — `async joinPublicServer(serverId, userId)` ✓
- `servers.controller.ts:73-74` — `@Get('discover') @UseGuards(AuthGuard)` ✓ (declared BEFORE `@Get(':id')` at :86 so "discover" is not swallowed as an id param — correct route ordering)
- `servers.controller.ts:122-123` — `@Post(':id/join-public') @UseGuards(AuthGuard)` ✓
- `servers.service.ts:123` `findMyServers` (via `@Get()` listServers `controller:60`) UNCHANGED ✓
- `servers.service.ts:637` `joinViaInvite` UNCHANGED (invite path intact, atomic use-consume logic untouched) ✓ **Verified.**

### Claim 3 — Security gate — TRUE
- `servers.service.ts:614-631` — inside `db.transaction`: SELECT server row (:616) → **404 if missing** (:618-620) → **403 if `!server.is_public`** (:623-625) → INSERT `onConflictDoNothing()` (:628-631) LAST. Read-and-gate strictly precedes insert. ✓
- Test asserting private-reject with insert-never-reached: `servers.service.spec.ts:1557-1566` — `'SECURITY: private server join is rejected — no membership insert attempted'` asserts `expect(txMock.insert).not.toHaveBeenCalled()` after a 403. ✓ (This is a real behavioral assertion, not a mocked count.)
- T-8 LIVE 403 confirmed in T/gate-verdict.md:11 (authenticated private join-public → 403 on both a private fixture A is a member of AND the private Proof Server; unauth → 401). **Verified — the gate is not a backdoor into invite-only servers.**

### Claim 4 — Frontend — TRUE (one path nuance)
- `apps/web/src/shell/ServerDiscoverPage.tsx` ✓ (imports `DiscoverServer`:23, calls `api.getDiscoverServers`:320 + `api.joinPublicServer`:401)
- `apps/web/src/pages/DiscoverShell.tsx` ✓ — **NOTE:** DiscoverShell lives under `src/pages/`, not `src/shell/` (claim said "DiscoverShell.tsx exists" without a path — file is real, minor location nuance only). Imported at `router.tsx:29`.
- `apps/web/src/shell/RailShell.tsx` ✓
- `/discover` route: `router.tsx:88-91` renders `<DiscoverShell />` (auth-required) ✓
- api client: `apps/web/src/auth/api.ts:876` `getDiscoverServers` + `:897` `joinPublicServer` ✓
- ServerRail Discover entry: `ServerRail.tsx:255-302` (rail button, `aria-label="Discover Public Servers"`, `data-testid="discover-rail-button"`, `navigate('/discover')`) ✓
- Deployed `/discover` renders live: T/gate-verdict.md:11 — route rendered with rail + Discover entry + search + h1 "Discover Communities" + honest empty-state. **Verified.**

### Claim 5 — Shared DTO/Zod — TRUE
- `packages/shared/src/servers.ts:78-83` `DiscoverServersQuerySchema` (q optional, limit max 50 default 20, offset nonnegative default 0) ✓
- `servers.ts:85-92` `DiscoverServerSchema` (id, name, description nullable, topic nullable, memberCount int nonnegative) ✓
- `servers.ts:94-97` `DiscoverServersResponseSchema` ✓
- Re-exported `packages/shared/src/index.ts:23-38`. **Verified.**

---

## Claim 6 — memberCount defect — CONFIRMED WRONG (claimed-correct-but-returns-0)

**Finding F67-V1-KAREN-1 (SIGNIFICANT, non-blocking): `discoverServers.memberCount` returns 0 for every server in deployed reality. The claim "memberCount = COUNT(server_members)" is NOT met.**

**The SQL as read (servers.service.ts:550-554):**
```
(SELECT count(*)::int FROM server_members sm WHERE sm.server_id = ${servers.id})
```
Referenced in projection (`:576`) and `orderBy(desc(memberCountExpr), ...)` (`:582`).

**Static read of the SQL text is NOT self-evidently broken** — Drizzle 0.45.2 does not alias the base `.from(servers)` table, so `${servers.id}` renders as `"servers"."id"` and the correlated subquery `WHERE sm.server_id = "servers"."id"` is textually well-formed correlated SQL that *should* return the real count. So this is not a "wrong-looking query" — it is a **query that looks correct but returns 0 in production**, which is exactly Karen's lane: a claimed-but-broken computation that a code read alone would wave through.

**Deployed reality contradicts the claim — DB-cross-checked, not a mock artifact (T-5-e2e.md:33, T/gate-verdict.md:14):**
- `GET /servers/discover` returned `memberCount: 0` for the fixture server **when it had 1 member** (owner B, properly roled) **AND when it had 2 members** (B+A).
- Raw `SELECT count(*) FROM server_members` at the same instants returned the correct **1**, then **2**.
- The card renders "0 members" in both cases.
- Ruled out as a role-null artifact by T-5 (0 was read even for a properly-roled sole member).

This is a genuine defect: the shipped code path yields 0, the DB holds the real count, so the two disagree in prod. Whether the exact root cause is a Drizzle emission quirk (e.g., the `sql` fragment's `${servers.id}` not correlating to the outer scope as intended once wrapped in the scalar-subquery position with the CSE-shared expression object referenced in both SELECT and ORDER BY), a param-binding issue, or a projection mapping mismatch, the observable outcome is fixed and reproducible: **memberCount is always 0.** The precise root-cause fix belongs to V-2 triage → V-3 fast-fix (or a follow-up), not to Karen.

**Why this shipped green — coverage gap (contributing, for L-2 awareness):** the `discoverServers` unit test (`servers.service.spec.ts:1402-1492`) feeds *mocked* rows carrying pre-baked `memberCount: 5`/`2`/`0` values and only asserts pass-through mapping. It never exercises the real correlated subquery against a database — so the defect was invisible to CI and only surfaced under T-5's live DB-compared probe. The test `'returns servers with zero members (correlated subquery handles no-membership case)'` (:1467-1479) is actively misleading: it asserts the mapping of a mocked `memberCount: 0`, giving false confidence that the subquery's zero-path is validated when the real query's zero-for-everyone bug is what's live.

**Disposition:** SIGNIFICANT, **non-blocking** — the wave's load-bearing promise (browse public directory + is_public-gated one-click join) works end-to-end and was proven live at T-5/T-8. memberCount is a cosmetic-but-user-visible social-proof metric that understates every server. Correctly routed to V-2 (already tracked as F67-T5-1). Confirmed here as a **WRONG claim**, not merely UNVERIFIED — it was measured false against the DB.

---

## Verdict block

```yaml
stage: V-1
agent: karen
wave: 67
deploy_hash: 43d20b2
verdict: APPROVE
load_bearing_claims_hold: true
claims:
  schema_live: TRUE            # servers.ts:30-34, 0024_*.sql:1-4, applied-in-prod (401 not 500)
  endpoints_exist: TRUE        # controller:73,122 (AuthGuard); service:537,613; findMyServers+joinViaInvite unchanged
  security_gate: TRUE          # service:614-631 read→404/403→insert; spec:1557-1566 insert-never-reached; T-8 live 403
  frontend: TRUE               # ServerDiscoverPage, pages/DiscoverShell, RailShell, router:88, api:876/897, ServerRail:255-302; live render
  shared_dto: TRUE             # shared/servers.ts:78-97
findings:
  - id: F67-V1-KAREN-1
    severity: significant
    blocking: false
    claim: "memberCount = COUNT(server_members)"
    status: WRONG               # returns 0 for every server in prod; DB count correct (1,2)
    evidence: "servers.service.ts:550-554 subquery; T-5-e2e.md:33 DB-cross-checked; T/gate-verdict.md:14"
    coverage_gap: "servers.service.spec.ts:1402-1492 mocks memberCount — never runs the real subquery"
    route_to: V-2               # dup of F67-T5-1
```
