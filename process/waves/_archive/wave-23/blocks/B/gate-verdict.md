# Wave 23 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, agentId head-builder-B6-wave23-attempt1)
**Reviewed against:** process/waves/wave-23/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate)

## Verdict
REWORK

## Rationale
The implementation is contract-faithful and the authz doors are correctly built and guarded in code — but one of the two new authz boundaries ships out of the B-block with no test proving its 403, which is a rule-4 miss on a wave whose entire point is authz. Spec 1 (8aa67564) is fully met: the Permission union goes 4→5 in both the shared Zod source (`packages/shared/src/rbac.ts` RolePermissionsSchema/Create/Update) and the service type (`rbac.service.ts:29`); migration 0011 is additive (`ADD COLUMN ... DEFAULT false NOT NULL`) and backfills `manage_assignments=true WHERE manage_channels=true` (BOARD cond 1 — no silent privilege loss); `roleToDto` carries the flag in the nested `permissions` block (`rbac.service.ts:652` — the P-4 karen role-read carry, not just the flat DTO); the create/update paths persist it; `backfill-roles.ts` enumerates it on forward-create (BUILD rule 3 parity); `assertOrganizer` swaps at the single call site (`assignments.service.ts:61`) and gates all four organizer routes (create :231, update :343, delete :411, presign :477); `can()` is fail-closed — `role[permission] === true` returns false for an absent/undefined flag, with default-deny at every no-server / no-member / null-role / missing-role branch; and `ServerRolesPage` PERM_FLAGS gained the `manage_assignments` checkbox so the permission is grantable end-to-end. Spec 2 (edbdea8f) is met at the code level: `GET /servers/:serverId/me/permissions` derives identity from `req.session.getUserId()` with no client userId param (BOARD cond 2, IDOR-safe), returns 403 for non-members, all-true for owner; the AssignmentsPanel CTA is gated on `owner || manage_assignments` (not owner-only) with an honest inline-alert 403 path (BOARD cond 3). Commit discipline is clean and per-spec (`Refs: 8aa67564` vs `Refs: edbdea8f`, no cross-spec commits), and the test edits are legitimate swap-assertion updates plus one NEW positive test (non-owner-with-manage_assignments sees the CTA) — no assertion weakening. The single blocking defect: BUILD rule 4 requires negative-path coverage on BOTH authz boundaries, and the `/me/permissions` boundary has none. `getEffectivePermissions` (`rbac.service.ts:278`) — the entire session-scoped effective-permissions surface — has zero unit test references (grep hits only source + dist); its non-member→403, owner→all-true, and member-with-flag paths are unasserted, and the B-2 deliverable explicitly punts the assertion to T-8 ("T-8 asserts", 3×). The integration tier that would exercise the live endpoint is ECONNREFUSED-deferred to CI. So one of the wave's two whole-point authz doors leaves the B-block with its 403 boundary and its owner/all-true shape unproven by any test that runs in-block. The assignment-write boundary is fine (`assignments.service.spec.ts:217` non-organizer→403 + permission-agnostic false mocks). Fix is a bounded unit-test add against a sound implementation — REWORK, not ESCALATE.

## Rework instructions

### Stages requiring rework
- B-2: add unit coverage for `getEffectivePermissions` (the `/me/permissions` authz boundary) so BUILD rule 4 holds on BOTH new authz surfaces before this door leaves the B-block.

### Per stage

#### B-2
- **What's wrong:** `RbacService.getEffectivePermissions` (rbac.service.ts:278) — the service method behind `GET /servers/:serverId/me/permissions` — has no unit test. The non-member→403 negative path (BOARD cond 2, spec edbdea8f AC "a non-member of the server calling the endpoint receives 403"), the owner→all-true path, and the member-with-role path are all unasserted. The B-2 deliverable defers assertion to T-8; that leaves one of the two new authz boundaries with zero in-block coverage, violating BUILD rule 4 as scoped for this wave (negative path on BOTH authz boundaries).
- **Heuristic fired:** Missing negative-path coverage on an authz boundary — the `/me/permissions` door is built and guarded in code but its 403 boundary is unproven by any test that runs in the B-block (companion to the assignment-write boundary, which IS covered at assignments.service.spec.ts:217).
- **What "good" looks like:** Unit tests in `apps/api/src/rbac/rbac.service.spec.ts` covering `getEffectivePermissions(userId, serverId)`: (1) non-member caller → `rejects.toThrow(ForbiddenException)` (the 403 boundary — REQUIRED); (2) server-not-found → `ForbiddenException` (no enumeration); (3) owner caller → returns `owner:true` + all 5 flags true; (4) member with a role → `owner:false` + the role's 5 booleans passed through, including `manage_assignments`; (5) member with null role_id / missing role row → `owner:false` + all-false (default-deny). Mirror the existing `can()` spec's mock-select pattern in the same file. Suite re-runs green at the raised count (api ≥ 393 after ~5 added cases).
- **Re-do instructions:** (1) Route to **backend-developer** to author the `getEffectivePermissions` describe-block in `apps/api/src/rbac/rbac.service.spec.ts`, reusing the existing `mockSelect`/`makeSelectChain` harness already used for the `can()` tests — no production-code change expected (the impl is correct; this closes the coverage gap only). (2) Run `pnpm --filter @studyhall/api test` to confirm green at the new count. (3) Commit as a single `Refs: edbdea8f` commit (this coverage belongs to spec 2's boundary), keeping per-spec commit discipline intact. (4) Update the B-5 verify deliverable's unit count and the B-2 deliverable's coverage note (drop the "T-8 asserts" deferral for the 403 boundary — T-8 may still add integration-tier IDOR assertion on top, but the unit boundary must exist in-block).

### Cascade

B-block cascade rules (trigger stage = B-2 backend):

| Trigger stage | Stages that must re-run downstream |
|---|---|
| B-2 backend | B-3 (only if frontend integration changed — it did not), B-4 (typecheck), B-5 (full verify) |

- **Stages that must re-run after the above:** B-4 (repo-wide typecheck — new spec file), B-5 (full unit + build verify at raised count).
- **Stages that stay untouched:** B-0 (schema unchanged), B-1 (contracts unchanged), B-3 (no frontend change — the CTA gate and getMyPermissions client already ship and are tested).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

# Wave 23 — B-6 Verdict (Attempt 2, post-rework)

**Reviewer:** head-builder (fresh spawn, agentId head-builder-B6-wave23-attempt2)
**Reviewed against:** the Attempt-1 REWORK finding (single defect: `getEffectivePermissions` had zero in-block unit coverage — BUILD rule 4 miss on the `/me/permissions` authz boundary)
**Attempt:** 2  (post-rework re-gate)

## Verdict
APPROVED

## Rationale
The single blocking defect from Attempt 1 is genuinely resolved and nothing regressed. The rework added a `getEffectivePermissions` describe block (rbac.service.spec.ts:601-763) whose 7 cases map exactly onto the method's 6 code branches (rbac.service.ts:278-342): server-not-found→ForbiddenException (branch 1, spec:638), owner→all-true+owner:true asserting the full object including manage_assignments (branch 2, spec:646), **non-member→ForbiddenException — the key negative path — as a real `rejects.toThrow(ForbiddenException)` against a live mock chain (server found on call 1, empty membership on call 2, forcing the `!member` path at rbac.service.ts:306 specifically, distinct from the server-not-found 403)** (branch 3, spec:662), member null-role_id→all-false+owner:false (branch 4, spec:676), member missing-role-row→all-false (branch 5, spec:697), member manage_assignments:true→exact flags with manage_assignments asserted true (branch 6, spec:719), and member all-false-role→all-false (branch 6, spec:742). No assertion is stubbed, weakened, or `.skip`ped; the harness reuses the same `mockSelect`/`makeSelectChain` pattern as the existing `can()` suite. BUILD rule 4 now holds on BOTH new authz surfaces: (a) assignment-write non-organizer→403 is covered at assignments.service.spec.ts:217/583/428/625 (+ non-member list 340, toggleStatus 816), and (b) /me/permissions non-member→403 is covered at rbac.service.spec.ts:662. The rest of the B-block is untouched by the rework (only rbac.service.spec.ts + a biome-format auto-fix changed), so the Attempt-1 PASSED items stand: Permission union 4→5 in shared Zod + service type, migration 0011 additive backfill (no silent privilege loss), roleToDto nested flag, single assertOrganizer call-site swap gating all four organizer routes, can() fail-closed default-deny at every branch, /me session-scoped IDOR-safe identity, CTA gated on owner||manage_assignments with honest 403, PERM_FLAGS grantable end-to-end, per-spec commit discipline. Commit hygiene on the fix is clean: `c8cbc08 test(rbac): ... Refs: edbdea8f` (spec-2 boundary, no production change) with the biome format landing as a separate `eaf7453 chore(lint)`. Reported suite counts (api unit 395 passed, web 216, repo typecheck clean, lint exit 0) are consistent with ~7 added cases over the prior 388. This unblocks Phase 2 /review.

## Attempt-2 checks
- [x] getEffectivePermissions describe block exists with 7 cases mapping to all 6 method branches
- [x] non-member→403 is a real ForbiddenException assertion (not stubbed/weakened), distinct from server-not-found 403
- [x] BOTH authz boundaries carry in-block negative-path coverage (BUILD rule 4 satisfied)
- [x] No production-code change in the rework (coverage-only, as scoped)
- [x] No regression: rework touched only rbac.service.spec.ts + a chore(lint) format fix; Attempt-1 PASSED items intact
- [x] Per-spec commit discipline preserved (Refs: edbdea8f on the coverage commit)

## L-block observation candidate (process note, NOT a gate blocker)
Biome format-drift from specialist commits recurred TWICE this wave (B-2 rbac files caught at B-4; this B-6 spec file caught at B-5, landing as `eaf7453 chore(lint)`). This is the 3rd and 4th instances of the same pattern after waves 19 and 22. Flag for L-2 distill consideration: B-block specialists should run `biome format` before reporting done — candidate to reinforce CI-PRINCIPLES rule 4 or seed a BUILD-PRINCIPLES rule (subject to the ≤1-rule-per-wave promotion bar and Karen verification at L-2). Recording here only; no rework triggered.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2
- unblocks: Phase 2 /review
