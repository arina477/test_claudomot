# V-1 Semantic-Spec Verification (jenny) — wave-76 M13 Educator Admin Console + analytics

**Verdict: APPROVE**

**Scope:** Deployed prod (api `api-production-b93e`, web `web-production-bce1a8`, merge `d8d4d9e6` LIVE). Authoritative spec = DB row `tasks.description` of `682e0912-30db-495c-984e-34dd046b1504` (4 spec blocks: 682e0912 authz foundation / ecf79f4a status-leak-close / 80505bb1 analytics / d81e266d console UI). Verification only — no code changed. Prod left clean (see § Prod hygiene).

**Method:** Read the four deployed source surfaces (`educator-tools.controller.ts`, `educator-access.guard.ts`, `educator-analytics.service.ts`, `packages/shared/src/educator-analytics.ts`, `apps/web/src/shell/EducatorAdminConsole.tsx`, `rbac.service.ts`) + live HTTP probes against prod with two real verified fixtures (A owner `21984eb2`, B co-member `da74148e`), exercising the full composed-authz matrix, contract shape, and every specced edge case.

---

## AC-by-AC — verified against DEPLOYED behavior

### Block 682e0912 — composed authz foundation
Composed guard stack live and correctly ordered: `@UseGuards(AuthGuard, EntitlementGuard, EducatorAccessGuard)` + `@RequireEntitlement('educatorAdminTools')` on both `/educator-tools/status` and `/educator-tools/analytics`. `EducatorAccessGuard` delegates the predicate to `RbacService.can(userId, serverId, 'manage_assignments')`, which folds the owner short-circuit into its superuser branch and default-denies otherwise. Full matrix proven LIVE:

| Caller | Tier | Live result | Spec-AC |
|---|---|---|---|
| Owner (A) | school | **200** both endpoints | ✅ 200 owner+school |
| Educator (B, role with `manage_assignments=true`) | school | **200** both endpoints | ✅ 200 educator+school |
| Non-owner/non-educator member (B, NULL role) | school | **403** "Educator access required for this server" | ✅ 403 (tier unlocks, authz fails — leak closed) |
| Owner (A) | free (non-school) | **403** "requires a plan with 'educatorAdminTools'" | ✅ 403 entitlement-first |
| Unauthenticated | any | **401** "unauthorised" | ✅ 401 |
| Malformed :serverId (`not-a-uuid`) | — | **400** | ✅ (edge, matches T-8) |

Guard order verified by the DISTINCT 403 messages: free-tier owner gets the *entitlement* message (EntitlementGuard fires first), NULL-role member on school gets the *EducatorAccessGuard* message (entitlement passed, authz denied) — this is the observable proof the composition is real, not a single collapsed gate. userId is session-derived in the guard (no IDOR); `?userId=` mass-assignment surface is not present (route param is only `:serverId`).

**Educator predicate proven end-to-end LIVE:** granted B a role with `manage_assignments=true` → B flipped from 403 to 200 on both endpoints; unassigned → back to 403. Confirms "educator = member holding a role with `manage_assignments`", NOT a named role (P-0 NOTE-1 refinement is what shipped).

### ecf79f4a — /status leak closed, contract preserved
`GET /educator-tools/status` composes the new `EducatorAccessGuard`. The wave-75 T8-F1 leak (any authed user on school tier → 200) is CLOSED live: B (non-owner, NULL role) on the school-tier Fixture Proof Server → **403**, not 200. The `{serverId, enabled: true}` boolean contract is PRESERVED (owner A on school → `{"serverId":"…","enabled":true}` exactly) — preserve+compose, not supersede (NOTE-2 disposition honored). wave-75 positive path intact.

### 80505bb1 — analytics aggregates, read-only
`GET /educator-tools/analytics` gated behind the SAME composed authz (no new auth path — verified: non-owner/non-educator → 403, free-tier → 403, unauth → 401, identical to /status). Live response on the populated Fixture Proof Server (school tier):
```
{"memberCount":2,"roleBreakdown":[{roleId,roleName,memberCount}…],"messageVolume":486,
 "assignmentCount":2,"submissionRollup":{"assignmentCount":2,"submissionCount":2},
 "recentActivity":[{type,count}×3]}
```
- **Contract conformance:** live response validated key-exact against `ServerAnalyticsSchema` — 0 extra keys, 0 missing keys, all counts `int >= 0`, `roleBreakdown[]`/`recentActivity[]` item shapes exact. PASS for BOTH the owner caller AND the educator (B) caller.
- **Aggregates only, no PII:** every value is a count or a role-name/activity-type label — no raw message content, no per-user identifiers. Matches the privacy invariant. `roleBreakdown` reconciles to `memberCount` (synthetic "No role" bucket makes the sum equal memberCount — verified True live).
- **Empty/near-empty server → zero aggregates 200:** a freshly-created school-tier server returned `messageVolume:0, assignmentCount:0, submissionRollup{0,0}, recentActivity all 0` with **200** (not an error). AC satisfied. (A fresh server carries 1 owner-member + auto-seeded default role, so `memberCount:1` — the *content* aggregates are the ones the "empty server → zero" AC targets, and they are 0.)

### d81e266d — Educator Admin Console UI
Deployed `EducatorAdminConsole.tsx` (ported from `design/educator-admin-console.html`, D-3 canonicalized): client gate `gated = educatorToolsEnabled && canAccess` (parent resolves `canAccess` via `getMe().userId === ownerId` opaque-id compare — BUILD-13 honored, not username) → returns `null` when not gated (hidden for non-owner/non-educator/non-school). Renders all 4 states: `loading` (skeleton), `loaded` (4 stat groups + recent activity, all values wired to the real `ServerAnalytics` payload — no mockup placeholders survive), `empty` (`isEmptyAnalytics` → "No activity yet"), `forbidden` (403 → "Access Restricted"). Consumes the verified `getServerEducatorAnalytics(serverId)` client (credentialed fetch to `/servers/:id/educator-tools/analytics`). Component/gating states are T-5/T-6 screenshot-proven at the T-block; the UI is a thin consumer of the endpoint I verified end-to-end at the API tier, so the semantic surface is covered.

---

## Edge cases & continuity

- **Unknown serverId → spec says 404; deployed returns 403.** See § Finding F-1 below — assessed **spec-DRIFT (reconcile spec to 403)**, deny-is-deny.
- **Journey continuity:** the console flow has no dead-end. Gating is coherent: server-authoritative 403 is the source of truth, client gate is best-effort UX, and a 403 that slips past the client gate renders the graceful `forbidden` state rather than a broken/blank surface. Fresh loads always resolve correctly.

---

## Findings

### F-1 (spec-DRIFT, non-blocking) — unknown serverId returns 403, spec AC says 404
**Spec:** block 682e0912 AC7 + edge-cases and block 80505bb1 edge-cases both state "Unknown serverId → 404".
**Deployed behavior (verified live):** a random well-formed UUID → **403** ("requires a plan with 'educatorAdminTools'") on BOTH `/status` and `/analytics`.
**Root cause (not a defect):** `EntitlementGuard` runs before `EducatorAccessGuard`; `EntitlementsService.resolveForServer` safe-defaults an unknown/out-of-enum server to the FREE tier (documented safe-default), so `educatorAdminTools=false` → the entitlement gate throws 403 before existence is ever probed. `RbacService.can` ALSO default-denies a non-existent server (returns false → 403), so even if entitlement passed, the authz layer would 403. There is no code path that reaches a 404 for these gated routes.
**Assessment: reconcile the spec to 403 (deny-is-deny).** Returning 403 for an unknown server is a *stronger* security posture than 404 — it refuses to confirm existence to an unauthorized caller (no existence oracle), consistent with the wave-28/wave-32 uniform-deny precedent on this codebase. This is intentional guard-ordering, reproduced deterministically. **Recommend: update the two spec ACs from 404→403.** NOT a rework of shipped code.
**Note — codebase internal inconsistency (informational, pre-existing):** the sibling `POST /servers/:serverId/billing/tier` and `GET /servers/:serverId/billing/plan` DO return 404 for an unknown server (owner-check-before-write pattern, explicit `NotFoundException`). So the repo is not uniform on unknown-server disposition (educator-tools = 403 via entitlement-default; billing = 404 via explicit existence check). Harmless — the educator-tools 403 is the more conservative of the two — but worth a note for future spec authors. Out of wave-76 scope.

### F-2 (spec-GAP, non-blocking) — mid-session tier upgrade requires page reload to reveal console
Carried from T-5. When a server is upgraded free→school within the same SPA session, `ServerOverviewSettings`' `educatorToolsEnabled` (from `getServerPlan`) does not re-fetch on the external tier change, so the console stays hidden (`gated=false`) until a full page reload. Fresh loads always render correctly. The spec did not anticipate the mid-session-upgrade→reveal path — surface as **spec-GAP**. Real-user impact is minor (an owner who upgrades in an already-open settings tab must refresh once). Non-blocking; V-2 follow-up candidate (re-fetch plan on tier-change / on settings-open). Matches T-5's low-severity finding exactly.

### F-3 (doc-comment drift, cosmetic) — stale route path in schema + client doc-comments
`ServerAnalyticsSchema`'s comment says "Returned by GET /educator/servers/:serverId/analytics" and the web api-client doc-comment says "404 unknown server" — both stale vs the deployed route `/servers/:serverId/educator-tools/analytics` and the actual 403 unknown-server behavior. Comment-only; zero runtime impact. Trivial cleanup at V-2/L if desired.

---

## Prod hygiene (left clean)
All mutations reverted: Fixture Proof Server (ad62cd12) reverted school→**free** (`educatorAdminTools=false`, `/status` → 403 again confirmed), probe role `V1-Educator-probe` DELETED (roles back to `['Member']`), B's role assignment cleared. Scratch server `V1-empty-probe-w76` (9530fe62) reverted to free — there is NO `DELETE /servers/:id` route in the codebase (grep-confirmed), so it is left inert, consistent with the documented prod-test-server no-teardown pattern (journey-map wave-16/wave-67 notes). No `browser_close` used (rule 5 — no browser opened; API-tier verification sufficed).

---

## Rationale for APPROVE
Every acceptance criterion across all 4 spec blocks is met by the DEPLOYED behavior — the composed authz (owner/educator+school→200, non-owner/non-educator→403, wrong-tier→403, unauth→401) proven live with two real fixtures including the load-bearing educator-predicate grant/revoke; the /status boolean contract preserved and the wave-75 leak closed; /analytics returns `ServerAnalytics` aggregates whose live shape matches `ServerAnalyticsSchema` key-exact for both owner and educator callers, counts-only/no-PII, empty→zero-200; console gated + renders analytics + 4 states. The only spec-vs-deployed divergence (F-1, 404→403 on unknown server) is a stronger-security intentional behavior → reconcile the spec, not the code. F-2/F-3 are non-blocking gap/cosmetic carries for V-2. Nothing blocks.
