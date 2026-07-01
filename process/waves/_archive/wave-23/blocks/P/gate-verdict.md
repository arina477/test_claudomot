# Wave 23 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, P-4 Phase-1 gate)
**Reviewed against:** process/waves/wave-23/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
Wave-23 delivers delegated assignment-organizer authz end-to-end: split a dedicated `manage_assignments` permission off the wave-22 `manage_channels` over-grant, plus a session-scoped effective-permissions read that lets a delegated non-owner organizer (a TA / study-group co-lead) both be authorized server-side and see the create CTA. The frame names the root cause (capability conflation in the RBAC permission model — one bit meaning channel-admin AND assignment-posting), not the symptom; problem-framer PROCEED verified every premise against code (rbac.service.ts:29, assignments.service.ts:61, backfill-roles.ts:50), and the SELECTIVE-EXPANSION was reconciled between ceo-reviewer and mvp-thinner with no silent override. It ladders to the live milestone M5 (a5232e16, in_progress) and to the wave-22 product-decisions material trigger (ll.295-298) that explicitly scheduled this flip. The below-floor override-ship is properly recorded, not re-litigated: the mandated decomposition-expansion fired and returned incomplete-scope (M5's sole remaining scope is reminders, cred-blocked on a founder Resend key), the recursion-guard escalated to BOARD, BOARD ratified 6/7 with five conditions carried, and the decision is logged to both the escalation file and product-decisions.md. The spec's acceptance criteria are enumerated and independently verifiable on both spec blocks, every non-happy state on the only user-facing surface (the CTA) is specified — honest 403 error state, permission-revoked state change, non-member 403, absent-column fail-closed — and all five BOARD conditions trace into ACs/edge-cases. The plan reuses the locked capability-based RBAC (RbacService.can() is generic over the Permission union, so adding the value + column suffices — no parallel authz path), maps every AC to a file-level B-stage step with a named in-catalog specialist, introduces no new dependency or SDK, and justifies design_gap_flag=false (additive backend RBAC + a read endpoint + an authz-reactive visibility swap on an existing component). On the security-scope tightened gate: this wave touches authz and a session-scoped endpoint, and the spec hands T-8 testable negative-path targets for all three surfaces — default-deny fail-closed on absent flag, session-scoped IDOR (the `?userId` ignore is both an AC and an edge-case), and the no-silent-privilege-loss migration backfill. No unfalsifiable AC, no AC unmapped in the plan, and no security surface left unspecified. → proceed to Phase 2 (Karen + jenny + Gemini); design_gap_flag=false routes the block exit to B-0.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

## Phase 2 — Karen + jenny + Gemini (appended)

**Verdict: PASS** (Karen APPROVE + jenny APPROVE; Gemini UNAVAILABLE → degraded, non-blocking per gate rule).

| Reviewer | Verdict | Notes |
|---|---|---|
| karen (a9b043b7d298ac31c) | APPROVE | All 7 load-bearing premises VERIFIED in code (Permission union 4@:29, owner short-circuit :58, can() generic :84, roles cols servers.ts:35-39, assertOrganizer single can() :61, backfill owner-only, /me net-new). No premature-abstraction, no gold-plating. |
| jenny (ab3dbd6fbdda05e7c) | APPROVE | All 5 drift checks MATCH: BOARD scope, wave-22 trigger coherence, 5 conditions in ACs, RBAC-model consistency (boolean flags on roles, no parallel path), journey-map no-over-claim. |
| Gemini | UNAVAILABLE | helper exit=3 "no text in response (attempt 2)"; degraded, gate proceeds on Karen+jenny. |

### Non-blocking B-stage carries (from Phase-2 reviewers — fold into B-2/B-3/T-8, NOT rework)
1. **karen:** the role DTO contract is `packages/shared/src/rbac.ts` (RolePermissionsSchema :7-12, RoleSchema :19-28, Create/UpdateRoleSchema :46-68), NOT rbac.service.ts:550 (that's the roleToDto mapper). B-2 touches the shared Zod schemas AND B-3 the mapper — the plan's file-level steps already name both; only the Approach annotation was mislabeled.
2. **karen:** the nested `RolePermissionsSchema` + the `permissions:{}` block in roleToDto (rbac.service.ts:562-567) must ALSO gain manage_assignments so role reads reflect it (AC "roleToDto returns it") — the flat EffectivePermissionsDto does not cover the nested role-read path.
3. **jenny:** BOARD condition #4 (owner-lockout/self-demotion guardrails extend) is a no-op invariant (owner superuser passes before flag lookup) but T-8 must ASSERT it explicitly rather than assume.

### Gate result
Phase 1 APPROVED + Phase 2 PASS → **P-block gate-passed**. design_gap_flag=false → next block **B** (D skipped).
