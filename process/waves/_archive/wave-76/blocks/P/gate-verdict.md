# Wave 76 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-wave76-p4)
**Reviewed against:** process/waves/wave-76/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
This wave ships M13's correct first autonomous leg — turning the wave-75 educator-tools stub into a real, access-controlled admin API plus read-only analytics and a gated console — and every gate concern clears against real code. The four acceptance criteria per spec block are falsifiable and observable (HTTP 200/401/403/404 by role×tier, a concrete `ServerAnalytics` aggregate shape, empty-server→zero-200, and UI visible/hidden states). The security-scope tightened concern is satisfied: the composed guard order is correct (AuthGuard → EntitlementGuard(educatorAdminTools) → EducatorAccessGuard), which I verified is the only sound ordering — `entitlement.guard.ts`'s own comment states it does no owner/member check and must be composed with one, and `resolveForServer` safe-defaults an out-of-enum tier to `free`→403, so entitlement-before-authz cannot leak. The wave genuinely closes the wave-75 T8-F1 leak: `educator-tools.controller.ts` today gates `/status` on only AuthGuard+EntitlementGuard and returns `{serverId, enabled:true}` to any authed user on a school-tier server; ecf79f4a composes `EducatorAccessGuard` onto that same endpoint while explicitly PRESERVING the `{serverId, enabled}` boolean contract (NOTE-2 resolved: preserve+compose, wave-75 tests still pass). The educator predicate is CONCRETE and correct (NOTE-1 resolved): I confirmed `apps/api/src/db/schema/servers.ts` has a capability-boolean `roles` table (`manage_assignments` at line 52) and NO named "Educator/Facilitator" role, so the predicate `owner OR member-with-role.manage_assignments` is the right one, reusing the shipped `server.owner_id !== userId` idiom (servers.service line 482) and the opaque `req.session.getUserId()` per BUILD-13. Analytics data-safety is constrained in-spec to counts/rollups only with an explicit "no raw content/PII beyond what an owner/educator already sees" AC. The plan respects the locked architecture — no migration, no new deps, read-time Drizzle count/group over existing indexed FKs (materialized-table alternative correctly rejected as premature), console reuses ServerPlanPanel/ServerRolesPage DS and defers layout to the D-block (design_gap_flag TRUE correctly routes there). Scope holds the fenced boundary: nothing touches B2B2C go-to-market or the TBD metric, analytics is load-bearing leg-1 value (not gold-plating), and the 4-task bundle is one coherent vertical slice — backend-only would ship an invisible feature; the console makes it demonstrable for small marginal cost.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---

## Phase 2 — jenny

**Reviewer:** jenny (spec-compliance / drift auditor, fresh spawn)
**Check:** P-4 Phase-2 drift — spec + P-3 plan vs `user-journey-map.md` + `product-decisions.md` (prior-decision drift)
**Attempt:** 1

### Overall verdict: APPROVE — 0 DRIFTS across all 7 spec items

Every spec block matches a documented prior decision; nothing crosses a fenced boundary or contradicts a shipped decision. Per-item findings below.

### Per-spec-item drift table

| Spec item | Verdict | Evidence / conflicting decision (if any) |
|---|---|---|
| **682e0912** — Educator admin API foundation (composed authz over educator-tools) | **MATCHES** | Directly realizes M13 promotion/fencing decision (product-decisions [2026-07-07] M13 fencing, L839) — "the AUTONOMOUS engineering core proceeds first (educator admin console + analytics)... buildable without founder credentials, like M9's substrate." Bundle-authoring L841-843 names this as leg (1)/seed. Builds ON the shipped M9 substrate (EntitlementsService.resolveForServer + educatorAdminTools + EntitlementGuard, wave-74/75) — reuse, not reinvention. Educator predicate (owner OR manage_assignments-member) honors the P-0 binding refinement + the shipped capability-role model (wave-23 manage_assignments split, L561). NO business/partnership/pricing/metric content. |
| **ecf79f4a** — Owner/educator gate on `/educator-tools/status` (close wave-75 leak) | **MATCHES** | This is the PROMISED follow-up to wave-75 V-2 T8-F1, NOT a contradiction. Journey map wave-75 entry (L463) records the exact finding verbatim: "`GET /educator-tools/status` has no owner/member check — any authed user reads the boolean tier-status of any tier-unlocked server... the FENCED real educator tools MUST add a member gate." product-decisions L837 confirms ecf79f4a was the recoverable M9 residual (educator-tools owner-gate) moved to the queue on M9 good-enough-close; L844 confirms it was RECONCILED into this M13 bundle (reparented, NOT duplicated — "the recoverable M9 follow-up is exactly this work"). Spec preserves the `{serverId, enabled}` contract (NOTE-2 preserve+compose) so wave-75 passing tests survive. Fully aligned. |
| **80505bb1** — Server analytics aggregates API (read-only) | **MATCHES** | Second half of M13 leg (1) per L841-842 ("educator admin console + analytics"). Data-safety posture is CONSISTENT with the shipped M10 privacy stance: M10 closed good-enough-for-now (L812-813) with an enforced profile-visibility + data-view/export + erasure + privacy-events audit-log posture. Spec constrains analytics to "counts/rollups ONLY — no raw message content and no PII beyond what an owner/educator already sees in-product," read-only over EXISTING tables, NO schema change / NO new telemetry. This does not widen data exposure beyond the shipped privacy boundary — an owner/educator already sees this membership/message/assignment data in-product; aggregates expose strictly less. No contradiction with M10. |
| **d81e266d** — Educator Admin Console web UI (gated) | **MATCHES** | UI leg of M13 bundle (L846). Placement + gating are CONSISTENT with the shipped server-settings surfaces and contradict no prior UX decision: the wave-68 Server Settings — Overview surface is owner-gated via the ChannelSidebar gear (journey L404-407, `isOwner` gate), and wave-75's "Your plan" panel already lives on that Settings→Overview surface using the ServerPlanPanel chrome (journey L443-447). Spec explicitly mirrors "the ServerPlanPanel gating idiom" + reuses ServerPlanPanel/ServerOverviewSettings/ServerRolesPage DS. design_gap_flag TRUE correctly routes console LAYOUT to the D-block (consistent with the wave-68 Roles-matrix D-3 precedent). Opaque userId per BUILD-13. No prior owner/educator-gating UX decision is violated. |
| AC-item: composed guard ORDER (auth → entitlement → owner/educator) | **MATCHES** | No prior decision conflicts; extends the shipped EntitlementGuard composition idiom (wave-74/75). Consistent with the security-scope tightened gate obligation on data-exposing authz surfaces (matches the wave-23/wave-28 authz-re-derivation precedents — serverId from route, userId from session, IDOR-safe). |
| AC-item: analytics empty-server → zero-aggregates 200 (not error) | **MATCHES** | Pure engineering AC; no prior-decision surface. Mirrors the shipped honest-empty-state convention (wave-67 /discover cold-start empty-state, journey L21). |
| AC-item: NO schema change / NO new deps / read-time aggregates | **MATCHES** | Consistent with the locked architecture (no migration) and the M13 "cheapest, highest-reuse autonomous slice" framing (L842). Materialized-rollup-table alternative correctly rejected in P-3 as premature. |

### Fenced-boundary check (the load-bearing scope test)

**PASS — no spec item implies business / partnership / pricing / metric work.** M13's fenced set (product-decisions L839, L847) is: (a) the B2B2C institution-partnerships go-to-market motion (sales, contracts, pilot agreements) and (b) the M13 `## Success metric` (still `_TBD by founder_`, a strategic product metric outside the pricing-only standing delegation). I traced all 4 spec blocks + every acceptance criterion + the P-3 plan: 100% is access-controlled READ engineering over already-shipped tables (servers/roles/memberships/messages/assignments/submissions/scheduling) + a gated settings-panel UI. Zero pricing, zero partnership/GTM, zero success-metric authoring. The bundle is explicitly credential-independent (L847). Fenced boundary intact.

### Cross-reference conclusion
No conflicting prior decision found. The wave is a faithful realization of the M13 leg-(1) decision and the promised wave-75 T8-F1 remediation, placed consistently with shipped server-settings/privacy surfaces. **Phase-2 verdict: APPROVE.**

### Footer (Phase 2)
- phase2_drift_verdict: APPROVE
- drifts_found: 0
- items_checked: 7
- fenced_boundary_intact: true

---

## Phase 2 — karen

**Reviewer:** karen (P-4 Phase-2 reality verification, fresh spawn)
**Method:** spot-checked the load-bearing / security-critical claims in the spec + P-3 plan against ACTUAL code via Read/Grep. 7 claims checked.

### Per-claim verdicts

1. **Educator predicate concreteness (NOTE-1) — VERIFIED.**
   `apps/api/src/db/schema/servers.ts:41-56` — `roles` table exists; `manage_assignments boolean(...).default(false).notNull()` at line 52. NO named 'Educator'/'Facilitator' role anywhere (the table is a fixed capability-flag set: manage_server/roles/channels/members/assignments + moderate_members + is_default). Membership relation `server_members` (line 58) carries `role_id uuid → roles.id` (line 68), so the member→role→capability resolution path is real. Predicate `owner OR member-with-role.manage_assignments` is concrete and correct.

2. **Leak reality + close (NOTE-2) — VERIFIED.**
   `apps/api/src/billing/educator-tools.controller.ts:23-30` — GET `/status` today composes ONLY `@UseGuards(AuthGuard, EntitlementGuard)` + `@RequireEntitlement('educatorAdminTools')` and returns `{serverId, enabled:true}` to ANY authed user on a school-tier server. No owner/member check. The wave-75 T8-F1 leak is REAL. Plan (P-3 line 7, 16) adds `EducatorAccessGuard` to this SAME endpoint and explicitly preserves the `{serverId, enabled}` contract. Close is correctly scoped.

3. **Owner idiom reuse — VERIFIED.**
   `apps/api/src/servers/servers.service.ts:482` — `if (server.owner_id !== userId) { throw new ForbiddenException(...) }`. The idiom exists exactly as claimed (P-4 Phase-1 cited line 482; confirmed).

4. **EntitlementGuard composability — VERIFIED.**
   `apps/api/src/billing/entitlement.guard.ts:40-43` doc comment: "It does NOT perform an owner/member check — it gates purely on the server's resolved tier entitlements. Compose with an owner/member check separately when the endpoint requires one." Verbatim match to the claim. Fail-closed on declared flag (line 75), pass-through only when no flag declared (line 63) — composition ordering is sound.

5. **Analytics source tables — VERIFIED.**
   `apps/api/src/db/schema/` contains servers.ts (servers/roles/server_members), messages.ts, assignments.ts (assignments + assignment_submissions at line 137, UNIQUE(assignment_id,user_id) + INDEX(assignment_id)), scheduling.ts. All aggregate source tables exist with indexed FKs. No schema change needed for count/group reads. Claim holds.

6. **Console DS reuse — VERIFIED.**
   `apps/web/src/shell/` contains ServerPlanPanel.tsx (+ .test.tsx), ServerRolesPage.tsx, ServerOverviewSettings.tsx. ServerPlanPanel.tsx implements the tier-gated owner-affordance idiom (owner-only upgrade UI, tier read from `plan.entitlements`) — a real gating pattern the console can mirror. Claim holds.

7. **Guard-order security reasoning (auth→entitlement→authz) — VERIFIED.**
   Cross-checked against claims 2+4: EntitlementGuard fails-closed on the declared flag before EducatorAccessGuard runs, so a non-school tier 403s on entitlement first; auth precedes both. Ordering is the only leak-free one. Consistent with Phase-1's `resolveForServer` safe-default reasoning.

### Antipattern findings (PRODUCT-PRINCIPLES catalog)

**[HIGH] Reinvention of an existing, tested primitive — reuse-not-reinvent gap (Rule 1: verify what exists).**
The spec (contracts.types) and P-3 plan (line 6, 28) describe `EducatorAccessGuard` as re-deriving the predicate from "the servers.service owner idiom + the roles capability model" — i.e. hand-rolling: load server → owner_id check → load server_members → load role → read `.manage_assignments`. But `apps/api/src/rbac/rbac.service.ts:53` already ships `RbacService.can(userId, serverId, permission)` which implements EXACTLY this predicate: owner short-circuit (line 65) OR member→role.manage_assignments (line 91), with full default-deny (missing server / non-member / null role_id / missing role row → false, lines 61-89) and IDOR-safe userId-from-session. It is unit-tested (`rbac.service.spec.ts` covers owner-superuser, null-role default-deny, manage_assignments true/false). Neither spec nor plan mentions it. The billing module already references RbacService in test wiring (`entitlements.service.spec.ts:198`), so it is reachable.
- **Impact if unaddressed:** B-2 re-implements ~30 lines of security-critical owner/role resolution by hand, duplicating an audited primitive and creating a second place where the educator predicate can drift from RBAC (e.g. if a future capability rename touches one but not the other). This is exactly the "false-absent premise rebuilds existing work" failure PRODUCT-PRINCIPLES Rule 1 warns against.
- **Required fix (B-2):** `EducatorAccessGuard.canActivate` should resolve owner/educator via `RbacService.can(userId, serverId, 'manage_assignments')` (owner is already folded into `can`'s superuser short-circuit — no separate owner branch needed) rather than re-querying servers/server_members/roles inline. Register RbacModule/RbacService into the billing module's guard providers.
- **Not a BLOCK on its own:** the predicate the plan describes is functionally CORRECT and would pass T-8; this is a build-quality/DRY steer, not a wrong predicate. Downgraded from Critical accordingly.

No other antipatterns: no premature abstraction (materialized analytics table correctly rejected P-3 line 8), no gold-plating (read-only aggregates, no charting infra), no claimed-but-absent role (predicate is capability-based and real), no over-scoping (4-task slice is one coherent vertical).

### Overall

**APPROVE.**
All 7 load-bearing claims VERIFIED against real code — the security-critical ones (leak reality, predicate concreteness, guard composability, owner idiom) are exactly as the spec + Phase-1 verdict assert. The one finding (HIGH: reuse `RbacService.can` instead of hand-rolling the owner/role resolution) is a build-time DRY/security-consolidation steer for B-2, not a spec/plan defect that requires REWORK: the predicate is correct as specified, no AC changes, no architecture change. Recommend the head-builder carry the RbacService.can reuse directive into B-2 (guard implementation) as a named acceptance note so it is not silently re-derived.

- verdict_complete: true
- phase: 2 (karen)
- blocking_findings: 0
- non_blocking_findings: 1 (HIGH — RbacService.can reuse for EducatorAccessGuard)

---
## P-4 FINAL — GATE PASSED
- Phase 1 (head-product): **APPROVED** (guard order, leak-close, concrete educator predicate, analytics data-safety, fenced boundary — all verified vs code).
- Phase 2: **karen APPROVE** (7/7 claims verified; 1 non-blocking HIGH) + **jenny APPROVE** (0 drift, all M13 fencing/leak-close/placement/privacy consistent) + **Gemini UNAVAILABLE** (429 → degrades per Action 3).
- **Carry to B-2 (karen HIGH, build-quality):** EducatorAccessGuard MUST resolve via the shipped `RbacService.can(userId, serverId, 'manage_assignments')` (apps/api/src/rbac/rbac.service.ts:53 — owner short-circuit + member→role.manage_assignments, default-deny, IDOR-safe, unit-tested). Do NOT hand-roll the owner/role predicate. head-builder enforces at B-2.
- Security-scope tightened gate (authz on data-exposing endpoint): satisfied. design_gap_flag=true → next block **D** (D-1 Brief).
- **Verdict: gate-passed.**
