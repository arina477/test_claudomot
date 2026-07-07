# Wave 77 — P-3 Plan

## Approach section

### Architecture deltas
- **Changed — users profile model:** add nullable academic columns (pronouns, bio, institution, program, academic_role, academic_year) to `apps/api/src/db/schema/users.ts` + a Drizzle migration. **Alt:** a parallel academic_identity table (1:1) — rejected: fragments the "one record travels with the user" invariant + needless JOIN; the shipped model already hangs identity on `users` (accent_color/profile_visibility). No backfill (mirrors shipped nullable-column precedent).
- **Changed — self profile API:** `UsersService.updateProfile` + GET/PATCH `/profile` extended for the academic fields (SessionNoVerifyGuard — the self /me,/profile surface; CORRECT here, it is the documented carve-out, unlike a mutation on others).
- **New — cross-server public profile-view:** GET `/profile/:userId` + a **ProfileVisibilityResolver**. This is the PRIVACY-CRITICAL piece. **Alt:** copy `servers.service.listServerMembers`'s co-member shortcut — REJECTED (assumes ambient membership this open endpoint lacks → leaks to any authed stranger). **Chosen:** mirror the `dm.service.ts:144-190` shared-server EXISTS idiom for 'server-members'; branch on the literal enum `['everyone','server-members','nobody']`; **fail-closed → HIDDEN** on unknown; honor `user_blocks` bidirectionally + `deleted_at` suppression.
- **New — web:** ProfilePage academic-field editor (reuse ProfileContext + settings-form patterns) + a cross-server member profile card opened from MemberListPanel (new surface → D-block layout).
- **Failure-domain impact:** the self API is a self-scoped write (existing surface). The cross-server view is a READ that EXPOSES one user's data to another — the one privacy-sensitive boundary; enforcement is server-side (resolver), fail-closed. No transaction-scope change. Migration is additive (nullable, no backfill).

### Data model
- **Migration (additive):** nullable academic columns on `users` (all text/nullable, NO pgEnum; academic_role validated by shared Zod z.enum at the boundary). No backfill, no index change. postgres-pro authors at B-0.

### API contracts (concrete)
- **GET/PATCH `/profile`** (self, modified) — SessionNoVerifyGuard; academic fields added; 200 | 409 username | 400 invalid.
- **GET `/profile/:userId`** (new, cross-server) — SessionNoVerifyGuard → 200 `PublicProfile` when visible; hidden/404 shape for nobody / blocked-either-direction / soft-deleted / **fail-closed-unknown**. 'server-members' → explicit viewer↔target shared-server check (dm.service idiom); 'everyone' → any authed; self → always.

### New deps
- **None.** No new SDK.

## Plan section
### File-level steps by B-stage
**B-0 Branch & schema** — branch `wave-77-portable-identity`; **migration: nullable academic columns on users** + schema model. | **postgres-pro** | first.
**B-1 Contracts** — `packages/shared/src/profile.ts` (extend UpdateProfileSchema/ProfileResponseSchema + new `PublicProfileSchema` — safe fields, NEVER email; academic_role z.enum) + index.ts `.js` ESM re-export. | **typescript-pro** | after B-0.
**B-2 Backend** — | **backend-developer** | after B-1:
- `users.service.ts` (modify) — updateProfile persists academic fields.
- profile controller (modify) — GET/PATCH /profile return/accept academic fields.
- `ProfileVisibilityResolver` (create) + GET `/profile/:userId` controller — **mirror dm.service shared-server EXISTS for 'server-members'; literal-enum branch; FAIL-CLOSED HIDDEN; user_blocks bidirectional; deleted_at**. PublicProfile output.
- specs: self GET/PATCH academic round-trip + 409 preserved; **cross-server view integration matrix (visibility × block × soft-delete) incl. the fail-closed-unknown + stranger-not-leaked cases** (the security crown jewel).
**B-3 Frontend** — | **react-specialist** | after B-2 + **after D-3** (card layout):
- `apps/web/src/auth/api.ts` (modify) — `getPublicProfile(userId)` + academic fields in the profile update fn.
- `ProfilePage.tsx` (modify) — academic-field editor (client validation mirrors Zod; ProfileContext refresh).
- member profile card component (create, per D-3 adopted layout) + `MemberListPanel` entry — renders PublicProfile + "profile hidden" state; **no verification badge (educator/staff = plain text)**.
- tests: editor round-trip; card visible/hidden through real parent.
**B-4 Wiring / B-5 Verify / B-6 Review** — standard.

### Specialist routing (validated against AGENTS.md)
postgres-pro (migration) · typescript-pro (contract) · backend-developer (services/endpoints/resolver) · react-specialist (editor+card). All present. D-block: head-designer + aidesigner.

### Parallelization map
- B-0 → B-1 → B-2 serial. B-3 waits on B-2 (endpoints) AND D-3 (card layout). Within B-2: the visibility resolver + cross-server endpoint is the critical path (author + test the matrix carefully); the self-API extension is independent.

### Self-consistency sweep
1. Every P-2 AC → ≥1 step: migration+fields (B-0/B-2); shared contract+PublicProfile (B-1); cross-server view + visibility enforcement (B-2 resolver/endpoint); editor+card (B-3+D). ✓
2. Every step has a specialist. ✓ 3. No file in two parallel batches. ✓ 4. design_gap true → D-block before B-3. ✓ 5. Architecture deltas + alternatives (parallel-store rejected; listServerMembers-shortcut rejected). ✓ 6. Contracts concrete (visibility enforcement pinned; no TBD). ✓ 7. No new deps. ✓ 8. No new SDK. ✓

**Binding refinements carried:** the block-3 privacy enforcement (explicit shared-server check mirroring dm.service, literal enum, FAIL-CLOSED HIDDEN, bidirectional block, deleted_at) — the load-bearing security item; PublicProfile never leaks email; self-declared/no-verification fence (no badge); ESM named exports (wave-72); cross-user data-exposing endpoint → P-4 security-scope gate + T-8.
