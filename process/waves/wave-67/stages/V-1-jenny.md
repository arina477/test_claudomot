# Wave 67 — V-1 jenny (spec-compliance verification, deployed behavior)

**Reviewer:** jenny (independent spec-vs-implementation auditor)
**Scope:** wave-67 M11 server discovery — 3 spec blocks (seed `609c9bdd` schema+discover-API, `37b78777` browse-UI, `e363dac2` public-join) vs DEPLOYED behavior.
**Deployed under test:** web `https://web-production-bce1a8.up.railway.app`, api `https://api-production-b93e.up.railway.app`, merge `43d20b2` (PR #82).
**Spec source of truth:** `tasks` row `609c9bdd` YAML head (read live from `$CLAUDOMAT_DB_URL`).
**Method:** read the spec-contract from the DB; read the deployed source (`servers.service.ts`, `servers.controller.ts`, `packages/shared/src/servers.ts`, migration 0024); independently probed the live api + web; corroborated (not substituted) T-5/T-8/T-9 live findings.

---

## VERDICT: APPROVE

Deployed behavior matches the 3 spec blocks' acceptance-criteria INTENT, modulo exactly two known non-blocking findings already routed to V-2 — one confirmed spec-DRIFT (`memberCount` always 0) and one spec-GAP/pre-existing-parity item (`role_id=NULL` on join). Neither breaks the core discovery→join user value, which is proven live end-to-end. The empty prod directory is a deliberate, documented scope boundary with an honest empty-state — not drift, and acceptable as a first bundle (see §Assessment).

---

## Block A — schema + `GET /servers/discover` (609c9bdd)

| Spec AC | Deployed evidence | Verdict |
|---|---|---|
| `servers` gains `is_public bool NOT NULL DEFAULT false` + `description`/`topic` nullable; Drizzle-generated migration | Migration `0024_cold_baron_zemo.sql` present + committed; live in prod (discover returns 200 not 500 — T-8 note; independently reconfirmed: my unauth GET returned 401 from AuthGuard, i.e. the route resolves, not a 500) | MATCH |
| `GET /servers/discover` returns ONLY `is_public=true` | T-5 live: with 566 total servers + 1 published public fixture, discover returned EXACTLY that 1 server; source `discoverServers()` WHERE `eq(servers.is_public,true)` (servers.service.ts:557,568) | MATCH |
| Row shape `{id,name,description,topic,memberCount}`; **memberCount = COUNT of server_members** | Shape correct; DTO `DiscoverServerSchema` (shared/servers.ts:85-91) locks `memberCount: z.number().int().nonnegative()`. **BUT deployed runtime returns `memberCount:0` for every server** (T-5: 0 with 1 member AND 2 members; app-DB `count(*)` correct). Source: correlated subquery `servers.service.ts:550-554` — written to derive the count but does NOT correlate correctly at runtime → always 0 | **DRIFT (confirmed)** |
| `GET /servers` (findMyServers) UNCHANGED | Not touched; discover is a new method + new route `@Get('discover')` declared before `:id` (controller:73) | MATCH |
| Pagination limit (cap ≤50) + offset; ILIKE search on name/description/topic; beyond-end → empty | Source: `safeLimit=Math.min(limit,50)` (svc:542-543), `.limit/.offset` (svc:583-584), ILIKE `or(name,description,topic)` (svc:560-566); query DTO caps limit at 50 (shared:80). Empty result → `{servers:[]}` (T-8 case 5) | MATCH |
| Authed (AuthGuard) for v1 | `@UseGuards(AuthGuard)` on `@Get('discover')` (controller:74). Independently probed: **unauth GET `/servers/discover` → 401 `{"message":"unauthorised"}`** | MATCH |
| Private servers NEVER appear regardless of search | is_public filter is the base WHERE, ANDed with search (svc:568) — search cannot widen past public. T-5 proved only the 1 public surfaced from 566 | MATCH |

**Block A confirmed drift — F67-T5-1 (SIGNIFICANT):** Spec AC states "memberCount is DERIVED via COUNT of server_members rows per server". Deployed returns `0` universally. This is code-returns-0 vs spec-wants-real-count → **spec-DRIFT**, not spec-gap (the intent is implemented in code but produces the wrong value). Root cause is in the deployed query, not the data (app-DB `count(*)` is correct per T-5) and not the contract (Zod DTO is correct). Non-blocking: the browse+join path works; only the social-proof number is understated. Correctly routed to V-2.

---

## Block B — `/discover` browse UI (37b78777)

| Spec AC | Deployed evidence | Verdict |
|---|---|---|
| New React Router v7 `/discover` route, reachable by a logged-in student from the app shell near ServerRail | Independently probed: web `/discover` → 200, serves SPA (`<title>StudyHall</title>` + `#root`). T-5 live: rail entry `aria-label="Discover Public Servers"` present, B-6 regression intact | MATCH |
| Fetches discover via new api client fn; cards show name/description/topic/memberCount | T-5 live: card rendered name + topic chip + description + Join; memberCount rendered (shows "0" per the A-block drift) | MATCH (card wiring); memberCount value inherits the A-block drift |
| Search box wired to text-search param; pagination load-more | T-5: search box `input[aria-label="Search servers"]` present + role/label-queryable (not a test-id) | MATCH |
| HONEST empty-state (cold-start), reads intentional not broken + loading + error | T-5 live: **"No public communities yet"** empty-state VISIBLE, `errorStateVisible:null` — the honest cold-start `#emptyColdStart`, NOT an error. Dark-only theme (T-6) | MATCH |
| Browse-and-view only; does not reimplement ServerContext member list | Separate surface; rail (member-scoped) coexists unchanged | MATCH |

---

## Block C — one-click public join (e363dac2)

| Spec AC | Deployed evidence | Verdict |
|---|---|---|
| `joinPublicServer` reuses joinViaInvite idempotent core, gated on `is_public=true`; non-public → 404/403; invite path not weakened | Source svc:613-635: txn loads server, `is_public` check → `ForbiddenException` (403) if false, else `onConflictDoNothing()` insert — same core as `joinViaInvite` (svc:669-675). **T-8 live: 403 on BOTH a member-private server AND the private proof server; CI: private join throws Forbidden, insert never reached** | MATCH (load-bearing, proven) |
| `POST /servers/:id/join-public` (AuthGuard) → JoinResult shape; idempotent re-join → success | `@Post(':id/join-public')` + `@UseGuards(AuthGuard)` (controller:122-123); returns `{serverId}` JoinResult; `onConflictDoNothing` idempotent. Independently probed: unauth POST → 401 | MATCH |
| Client Join → api.joinPublicServer → ServerContext.refetch() + auto-select | T-5 live E2E: A (not a member) clicked real Join → A actually added (`GET /servers` returns it), button flipped to "Open", server appeared in rail | MATCH (proven end-to-end, non-echo) |
| Non-public join → 404/403 (private not a backdoor) | T-8: 403 ×2 live | MATCH |

**Block C finding — F67-T5-2 (LOW/MED):** join-public inserts `{server_id,user_id}` with no `role_id` → NULL role (svc:628-631). **Independently verified this is NOT a join-public-specific divergence:** the shipped-and-live `joinViaInvite` core inserts the identical `{server_id,user_id}` with no `role_id` (svc:671-675). The spec AC explicitly requires "reuses the joinViaInvite idempotent core" — the NULL-role behavior is a faithful property of the reused core, i.e. **pre-existing parity, a spec-GAP in the reused substrate (RBAC default-role on non-owner join), not a wave-67 regression or drift**. Correctly routed to V-2 to confirm role-less-member RBAC intent.

---

## Assessment of the deliberate empty-directory scope (the question posed)

**Is shipping a discovery entry point to an empty directory acceptable, or a spec-gap to flag?** — **Acceptable; not a gap against THIS bundle's spec.**

- The spec-contract for `609c9bdd` explicitly fences the publish/opt-in write path OUT of scope: "Later M11 bundles … build ON this substrate — do NOT scope them here." The bundle's job is the substrate + first browse→join path, and `is_public DEFAULT false` (no backfill) is a spec edge-case, not an omission.
- The deferral is DOCUMENTED and tracked: product-decisions [2026-07-06] names the publish-to-directory write path as deferred M11 bundle `2bd37c4c`; user-journey-map page-17 + F12 record the prod directory as genuinely empty until it ships.
- The empty-state is HONEST (T-5: "No public communities yet", not an error/blank) and is a Block-B spec AC in its own right — so the cold-start reality is spec-required behavior, faithfully shipped.
- The populated-grid path is not vaporware: T-5 proved it code+DB-live by publishing a fixture and driving a real non-member join end-to-end, then tearing down. Reachability is proven; only organic population awaits the next bundle.

**One strategic note (non-blocking, already carried at P-1, restated for the record):** a discovery directory that is organically empty in prod delivers zero end-user value until BOTH (a) the publish-to-directory write path (`2bd37c4c`) and (b) a moderation/safety gate ship — product-decisions L737-739 already flags "moderation bundle required before public LAUNCH; directory needs GTM seeding." This is correct sequencing for a substrate-first bundle and not a defect of wave-67; I flag it only so N-1 keeps `2bd37c4c` + moderation ahead of any public-launch claim.

---

## Findings summary

| ID | Type | Severity | Block | Status |
|---|---|---|---|---|
| F67-T5-1 | spec-DRIFT (code returns 0; spec wants real COUNT) | SIGNIFICANT (non-blocking) | A | → V-2 (confirmed) |
| F67-T5-2 | spec-GAP / pre-existing-core parity (NULL role_id, same as live joinViaInvite) | LOW/MED (non-blocking) | C | → V-2 |
| Empty prod directory | deliberate documented scope (deferred `2bd37c4c`) | not a defect | B | acceptable |

No NEW blocking findings surfaced beyond T-5/T-8. No spec-DRIFT found in auth posture, is_public filtering, private-join rejection, search, pagination, or the browse→join wiring — all match live.

```yaml
stage: V-1
reviewer: jenny
verdict: APPROVE
blocks_verified: [A-schema-discover-api, B-browse-ui, C-public-join]
confirmed_drift:
  - {id: F67-T5-1, block: A, kind: spec-drift, desc: "discover memberCount returns 0 for every server; spec AC = COUNT of server_members. Root cause deployed correlated subquery servers.service.ts:550-554; DTO + data both correct", severity: significant, blocking: false, route: V-2}
confirmed_gap:
  - {id: F67-T5-2, block: C, kind: spec-gap-preexisting-parity, desc: "join-public inserts role_id NULL — identical to the live joinViaInvite core the spec mandates reusing; not a wave-67 regression", severity: low-medium, blocking: false, route: V-2}
empty_directory: {status: deliberate-documented-scope, deferred_bundle: 2bd37c4c, empty_state: honest, acceptable: true}
independent_live_checks:
  - "unauth GET /servers/discover -> 401 (AuthGuard enforced)"
  - "unauth POST /servers/:id/join-public -> 401"
  - "web /discover -> 200 SPA shell"
  - "migration 0024 committed; discover route resolves (not 500)"
  - "source read: is_public WHERE filter, join-public 403 gate, join-public+joinViaInvite both insert no role_id"
new_blocking_findings: 0
head_signoff_requested: V-block head-verifier
```
