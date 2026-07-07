# Wave 77 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, gate reviewer)
**Reviewed against:** process/waves/wave-77/blocks/P/review-artifacts.md
**Attempt:** 1  (first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
This is a coherent, irreducible first slice of M13 leg-2 (cross-server portable academic identity) that ladders to the in_progress M13 milestone; the four tasks form one self-edit → cross-server-view loop with no orphan work and no scope drift into the fenced boundaries (B2B2C go-to-market, the TBD success metric, and identity verification are all untouched — academic_role stays a plain self-declared z.enum with no badge and no authorization semantics). Every acceptance criterion is independently verifiable (migration shape, HTTP 200/409/400 codes, the visibility × block × soft-delete matrix, and the profile-hidden UI state), and the plan reuses the locked architecture (users nullable-column precedent, dm.service shared-server idiom, isBlockedBetween bidirectional predicate, SessionNoVerifyGuard self/public carve-out, packages/shared contract, no pgEnum, ESM named exports) rather than inventing a parallel path. The security-scope tightened gate is satisfied: I verified against real code that the cross-server privacy leak is genuinely specified out. The spec (block bf0ad2a8) pins the resolver to (1) an EXPLICIT viewer↔target shared-server EXISTS check mirroring dm.service.ts:171-193 and explicitly FORBIDS the servers.service.listServerMembers co-member shortcut — and that leak is real, because listServerMembers (servers.service.ts:250+) gates only on the caller's own membership of one server and then treats 'server-members' as visible on the assumption the viewer is an ambient co-member, an assumption the open GET /profile/:userId endpoint does not have, so copying it would expose profiles to any authenticated stranger; (2) branches on the literal shipped enum ['everyone','server-members','nobody'] (confirmed against users.profile_visibility text default 'everyone'); (3) FAILS CLOSED to HIDDEN on unknown/missing visibility; (4) honors user_blocks BIDIRECTIONALLY (confirmed the existing isBlockedBetween A-blocks-B OR B-blocks-A predicate is the cited reuse) plus deleted_at suppression; and (5) PublicProfileSchema excludes email by construction with visibility enforced server-side, not by field omission alone. SessionNoVerifyGuard is correct here — unlike the wave-75 payments case that needed AuthGuard, these are pre-verification-reachable profile reads and self-writes on the documented /me,/profile carve-out, not a privileged mutation. The migration is additive (nullable text columns, no backfill, no pgEnum, no index change). design_gap_flag is correctly TRUE (the cross-server member profile card is a genuinely new composed surface) → D-block next. Load-bearing claims spot-checked against live code: dm.service.ts:171-193, servers.service.ts:250+, users.ts, user-blocks.ts, blocks.service.isBlockedBetween, session-no-verify.guard.ts, ProfilePage.tsx + MemberListPanel.tsx — all VERIFIED.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

## Phase 2 — karen

Spot-check of load-bearing / privacy-critical claims in the spec (task 10a68f9e + siblings) and P-3-plan against ACTUAL code. Method: read each cited path/line/idiom in the working tree; classify VERIFIED / UNVERIFIED / WRONG.

### Per-claim verdicts

1. **profile_visibility enum literals ['everyone','server-members','nobody']** — VERIFIED.
   `apps/api/src/db/schema/users.ts:15` — `profile_visibility: text(...).notNull().default('everyone')` (text, no pgEnum — matches spec). The three literals are a SHIPPED shared const: `packages/shared/src/privacy.ts:3` `PROFILE_VISIBILITY = ['everyone','server-members','nobody'] as const`, consumed at `privacy.service.ts:38` and exercised in `privacy.controller.spec.ts:166-176`. Reuse note (non-blocking): the resolver should branch on the exported `PROFILE_VISIBILITY` const, not hand-roll string literals — B-2 detail for backend-developer.

2. **dm.service shared-server EXISTS idiom to MIRROR** — VERIFIED, with a corrected line reference.
   The idiom exists in `apps/api/src/dm/dm.service.ts` inside `enforceWhoCanDm`, at **lines 171-193** (self-JOIN: `server_members WHERE user_id = creatorId AND server_id IN (SELECT server_id FROM server_members WHERE user_id = targetId)`). It is the correct pattern to mirror — an EXPLICIT viewer↔target shared-server proof requiring BOTH users' membership. **The spec's cited range "lines 144-190" is WRONG (off by ~27 lines; 144 lands in the doc-comment, the SQL is 171-193). The Phase-1 head-product verdict already cites the corrected 171-193.** Cosmetic; the idiom is unambiguous. Recommend B-2 spec pointer be corrected to 171-193 to avoid a copy-the-wrong-block error.

3. **listServerMembers co-member shortcut to FORBID (leak risk is real)** — VERIFIED.
   `apps/api/src/servers/servers.service.ts:250` — `listServerMembers` gates ONLY on the caller's own membership of the server (`callerMembership` check, 252-260), then at 278-283 treats both 'everyone' and 'server-members' as visible with the explicit comment "the viewer is already a verified co-member." That ambient-membership assumption does NOT hold for the open `GET /profile/:userId`, so copying it WOULD leak 'server-members' profiles to any authenticated stranger. The spec's REJECT is correct and load-bearing.

4. **isBlockedBetween checks BOTH directions** — VERIFIED.
   `apps/api/src/blocks/blocks.service.ts` `isBlockedBetween(userA, userB)` — `or( and(blocker=A, blocked=B), and(blocker=B, blocked=A) )`. True bidirectional predicate. Schema `db/schema/user-blocks.ts` confirms the directional `(blocker_id, blocked_id)` model this reads over. Correct reuse target.

5. **deleted_at (soft-delete) + email columns on users** — VERIFIED.
   `users.ts:19` `deleted_at timestamp` (nullable soft-delete) present; `users.ts:9` `email text notNull unique` present. PublicProfileSchema must exclude email — confirmed the existing `ProfileResponseSchema` (`packages/shared/src/profile.ts:3-9`) already omits email, so the new schema has a clean precedent to mirror.

6. **Self-surface reuse: updateProfile + GET/PATCH /profile under SessionNoVerifyGuard; web files** — VERIFIED.
   `apps/api/src/users/users.service.ts:59` `updateProfile`; `apps/api/src/profile/profile.controller.ts` `@Controller('profile')` with `@Get()` + `@Patch()` both `@UseGuards(SessionNoVerifyGuard)`, 409-on-username-conflict preserved via `usersService.updateProfile` (comment at :60). Guard (`auth/session-no-verify.guard.ts`) still FULLY verifies the access token — only strips the EmailVerification claim — so the open cross-user read is authenticated-only; worst-case attacker is an authenticated stranger, not an anonymous caller (this is exactly why claim 3's leak matters). Web: `apps/web/src/pages/ProfilePage.tsx` + `apps/web/src/shell/MemberListPanel.tsx` both exist.

### Antipattern sweep (PRODUCT-PRINCIPLES.md)
- Rule 1 (verify seed claims of exists/absent): the academic columns are correctly claimed ABSENT — `users.ts` has none yet; migration is a real addition, not a rebuild. VERIFIED.
- Rule 2 (named entity is the real boundary): the cross-server read IS the real exposure boundary; enforcement is server-side, not field-omission. No wrong-target drift.
- No copy-the-wrong-pattern antipattern in the spec itself — the spec explicitly forbids the leaky shortcut and pins the correct idiom. The only defect is the stale line number (claim 2).

### Findings summary
- 6/6 load-bearing claims VERIFIED. 0 WRONG idioms/paths. 0 UNVERIFIED.
- 1 cosmetic defect: spec's dm.service line ref "144-190" is stale; actual SQL is 171-193 (Phase-1 verdict already uses the correct range). NON-BLOCKING; recommend B-2 pointer correction.
- 1 reuse nit: resolver should import `PROFILE_VISIBILITY` from shared rather than re-declare literals. NON-BLOCKING; B-2 implementation detail.

### Verdict: **APPROVE**
Privacy enforcement is correctly and completely specified against real code: explicit shared-server EXISTS (not the leaky shortcut), literal-enum branch, fail-closed-to-HIDDEN, bidirectional block, deleted_at suppression, email excluded by construction with server-side enforcement. No blocking issue. The two nits are B-2 hygiene items for the backend-developer, carried forward, not gate-blockers.

## Phase 2 — jenny

**Reviewer:** jenny (spec-compliance drift auditor, fresh spawn — Phase-2)
**Reviewed against:** spec `10a68f9e` (4 blocks) + `process/waves/wave-77/stages/P-3-plan.md`
**Cross-referenced:** `command-center/product/product-decisions.md` (2026-07-07: M13 promotion+fencing L836-847, M13 leg-2 decomposition L858-865, M13 milestone `## Approach`/`## Fenced` prose; M10 privacy posture L790-813; M14 block L774-784) + `command-center/artifacts/user-journey-map.md` (wave-35 profile-visibility posture, wave-70 block, page-9 member-list panel, page-15 /settings/profile, page-16 /settings/privacy, wave-39 Shell user-menu)

Scope: DRIFT check (spec+plan vs journey-map + product-decisions), complementary to karen's code-claim spot-check above. Per-spec-item MATCHES/DRIFTS + APPROVE/BLOCK.

### Per-spec-item MATCHES / DRIFTS

**Block 1 — `10a68f9e` Academic-identity profile fields + self API — MATCHES**
- NULLABLE self-declared academic columns on `users`, no backfill, mirroring the shipped `accent_color`/`profile_visibility` nullable-column precedent (leg-2 decomposition L862). GET/PATCH /profile under SessionNoVerifyGuard, 409-on-username-conflict preserved. AC4: fields SELF-DECLARED only, no verification, nothing gates capability on academic_role.
- **Fence honored:** M13 `## Fenced` + leg-2 decomposition L864 defer identity VERIFICATION ("self-declared fields only this leg"). AC4 is that fence made executable — no trust/authority claim. NOT DRIFT.

**Block 2 — `a51e281d` Shared profile contract + PublicProfileSchema — MATCHES**
- OPTIONAL bounded academic fields; `academic_role` = TEXT `z.enum(['student','educator','staff'])`, NO pgEnum (matches the project-wide text+Zod convention across M14 block / M10 privacy-events / M9 tier). PublicProfileSchema NEVER exposes email; visibility enforced server-side not by omission alone. ESM named re-export (wave-72 lesson). NOT DRIFT.

**Block 3 — `bf0ad2a8` Cross-server public profile-view honoring profile_visibility — MATCHES (privacy-consistent, NOT a contradiction)**
- **Operationalizes, does NOT reverse, the shipped M10 privacy posture.** `profile_visibility` shipped at wave-35 as a real server-side-ENFORCED control (T-8-proven roster hiding: nobody→absent / server-members→co-member-visible / everyone→visible; the 3-valued enum is locked server-side, the wave-35 UI merely collapsed the *picker* to 2 values). This block extends the SAME enforced control from the members-roster read to a per-user profile read using the identical enum + server-side-enforcement principle. Leg-2 decomposition L861 states it exactly: "operationalizes the shipped-but-unenforced visibility column" — accurate for the profile-view surface (the column was enforced on the roster at wave-35 but never on a per-user profile-view endpoint, which did not exist). Consistent forward-extension, not a reversal.
- **Consistent with shipped block + soft-delete.** Cross-server academic-identity exposure respects `user_blocks` BIDIRECTIONALLY (wave-70 shipped user_blocks as cross-server / no server_id column / bidirectional; spec cites the same isBlockedBetween A↔B predicate karen verified) + `deleted_at` soft-delete suppression (shipped soft-delete/content-scrub convention). Cross-server exposure is ALREADY the established posture — wave-70 block itself is explicitly cross-server — so a cross-server profile view that honors block+visibility+soft-delete is congruent, not novel.
- **No prior decision forbids cross-server profile viewing.** Product-decisions + journey map searched: profiles were never declared server-scoped-only; the resolved-architecture decision (L73 #2 "single `users` table holds profile + privacy fields") makes profile a user-level (cross-server) record BY DESIGN. The only profile privacy constraint is `profile_visibility`, which this block enforces. No contradicting decision exists.
- **Fail-closed + explicit-shared-server check honored** (spec mirrors dm.service EXISTS idiom, FORBIDS listServerMembers shortcut, literal-enum branch, fail-closed→HIDDEN). NOT DRIFT — reinforces the M10 posture.

**Block 4 — `a98286cb` Editor + cross-server member profile card (web) — MATCHES**
- **Placement consistent with shipped surfaces.** Self-edit academic form extends ProfilePage.tsx / `/settings/profile` (page-15, shipped editor reached via wave-39 Shell user-menu → Profile). Read-only card opens from MemberListPanel (page-9 member-list panel — shipped surface already rendering member rows with isSelf guards, wave-69/70). Both extend existing profile/member DS surfaces, not orphan pages; the new card LAYOUT correctly routes through D-block (design_gap_flag true). ProfileContext refresh idiom reused. Graceful profile-hidden state on 404/hidden (consistent with wave-70 block-hide + wave-35 visibility-hide precedents).
- **Fence honored:** AC4 renders educator/staff as PLAIN TEXT, NO verification badge / no trust affordance — identity-VERIFICATION fence made executable at the UI. NOT DRIFT.

### Fence audit (M13 `## Fenced` + leg-2 decomposition L864)
- **B2B2C go-to-market** — UNTOUCHED. No sales/contracts/pilot/partnership surface in any block; no business-motion item.
- **Success metric (_TBD_)** — UNTOUCHED. No metric asserted/set/hand-edited; ships engineering capability only.
- **Identity VERIFICATION / trust-authority / badge** — UNTOUCHED, fenced independently by Blocks 1 (AC4), 2 (plain z.enum), 4 (AC4 plain-text, no badge). `academic_role` carries zero authorization semantics.
- All 4 blocks credential-independent (matches L864).

### Conflicting decisions
**NONE.** No product-decision or journey-map entry contradicts any spec block. The cross-server profile view is a consistent operationalization of the wave-35 (M10) enforced `profile_visibility` posture and the wave-70 (M14) bidirectional cross-server block — honoring visibility + user_blocks + soft-delete as the shipped privacy trio.

### Verdict: **APPROVE**
- drift_found: false — 4/4 spec blocks MATCH the M13 leg-2 Approach/Fenced boundary, the shipped M10 privacy posture, and the shipped profile/settings/member surfaces.
- 0 fenced-boundary crossings (no verification/trust-authority, no B2B2C, no success-metric touch).
- 0 conflicting prior decisions.
- verdict_complete: true

---
## P-4 FINAL — GATE PASSED
- Phase 1 (head-product): **APPROVED** (5 privacy-enforcement terms verified vs code; SessionNoVerifyGuard correct; migration additive; fenced boundary clean).
- Phase 2: **karen APPROVE** (6/6 verified, 0 WRONG; privacy crown-jewel completely specified) + **jenny APPROVE** (0 drift; operationalizes M10 privacy, fences untouched) + **Gemini UNAVAILABLE** (429 → degrades per Action 3).
- **Carry to B-2 (karen nits, non-blocking):** (1) the dm.service shared-server EXISTS idiom is at lines **171-193** (spec said 144-190 — stale ref, that's the doc-comment); (2) the resolver MUST import `PROFILE_VISIBILITY` from `packages/shared/src/privacy.ts:3` (the literals ['everyone','server-members','nobody']), do NOT re-declare them. head-builder enforces at B-2.
- Security-scope tightened gate (cross-user data-exposing profile-view): satisfied — fail-closed visibility enforcement pinned. design_gap_flag=true → next block **D** (member profile card).
- **Verdict: gate-passed.**
