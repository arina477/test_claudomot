# V-1 jenny — wave-77 semantic spec-conformance verification

**Wave:** 77 — M13 leg-2 (cross-server portable academic identity, first slice)
**Axis:** SEMANTIC spec conformance (intent, not literal AC wording; not source-claim truth — that is Karen's independent axis)
**Deployed:** api `https://api-production-b93e.up.railway.app` · web `https://web-production-bce1a8.up.railway.app` · merge `633f362e` LIVE
**Spec contract source of truth:** task `10a68f9e` `description` (DB row), captured at `/tmp/wave77-spec-contract.txt`
**Fixtures:** A `studyhall-e2e-fixture` (`21984eb2-…`) + B `studyhall-e2e-fixture-b` (`da74148e-…`), co-members of proof server `ad62cd12`
**Method:** live HTTP probes (SuperTokens header-auth, `Authorization: Bearer <st-access-token>`) + Playwright UI drive @1440 + integration-matrix source confirmation for the cases two co-members cannot exercise (stranger-not-shared / soft-deleted / fail-closed-unknown).

## VERDICT: **APPROVE**

Every acceptance-criterion INTENT is met by deployed behavior. The crown-jewel privacy enforcement (fail-closed visibility, bidirectional block, uniform-404 anti-oracle, no-email) is proven live. The no-verification fence is honored (academicRole renders as plain text, no badge). 3 findings, all **LOW/INFO spec-GAPs** (already documented at T-9), 0 DRIFT, 0 blocking.

---

## 1. Acceptance-criteria semantics (per spec block)

### Spec 1 (10a68f9e) — academic-identity fields + self API — **CONFORMS**
- **AC "GET /profile returns academic fields for self":** live `GET /profile` (Bearer A) → 200 with all 6 new fields present (`pronouns/bio/institution/program/academicRole/academicYear`) alongside identity fields. Keys exactly `[academicRole, academicYear, accentColor, avatarUrl, bio, displayName, institution, program, pronouns, userId, username]`. Intent met.
- **AC "PATCH validates + persists under SessionNoVerifyGuard; preserves 409-on-username":** live PATCH of full academic identity → 200, values round-trip on subsequent GET. Attempting to take B's username `studyhallfixtureb` → **409 `username_taken`**, and A's username **unchanged** (`studyhallfixturea`) after the 409 — the collision-preserved behavior is intact. SessionNoVerifyGuard confirmed: unauth GET/PATCH → 401.
- **AC "self-declared only, nothing gates on academic_role":** no capability surface reads academic_role; it is a free text column narrowed at the DTO boundary. Intent met.

### Spec 2 (a51e281d) — shared contract — **CONFORMS**
- **AC "UpdateProfileSchema gains optional bounded academic fields":** live bounds enforced server-side — invalid enum `professor` → 400; `pronouns` 41ch → 400; `bio` 501 → 400; `institution` 121 → 400; `program` 121 → 400; `academicYear` 41 → 400. Exact-max (40/500/120/120/40) all → 200. Bounds match the spec (pronouns≤40, bio≤500, institution·program≤120, academicYear≤40, academicRole z.enum student|educator|staff).
- **AC "PublicProfileSchema exposes safe fields, NEVER email":** live `GET /profile/:userId` (visible) returns identity + academic fields, **no email field** — confirmed live (`HAS_EMAIL: False`) and by the integration case "11. visible PublicProfile NEVER contains an email field". Note (not a defect): `PublicProfileSchema` includes `accentColor` — cosmetic identity, within "identity + academic fields", not sensitive.
- **AC "visibility enforced server-side not by field omission":** the resolver returns the WHOLE profile or a 404; hiding is a gate decision, not field-stripping. Intent met.

### Spec 3 (bf0ad2a8) — cross-server view endpoint (PRIVACY-CRITICAL) — **CONFORMS** (crown jewel proven live)
Live matrix (A = target, B = viewer, co-members of `ad62cd12`), using the correct `PUT /profile/privacy` (full-object {profileVisibility, whoCanDm} — head-tester's noted endpoint, NOT PATCH /profile):
- **everyone → B views A → 200 visible.** ✓
- **nobody → B views A → 404 hidden;** nobody → A views self → 200 (self always visible). ✓
- **server-members + co-member B → 200 visible.** ✓
- **A blocks B → B views A → 404;** unblock → 200. **B blocks A → B views A → 404 AND A views B → 404** (bidirectional either-direction hide proven both ways); unblock → 200. ✓
- **self → self always visible** even at nobody (200). ✓
- Cases not exercisable with two co-members are proven by the **13-case real-Postgres integration matrix** `apps/api/test/integration/profile-visibility.integration.spec.ts`, which calls the real `ProfileVisibilityService.resolve()` against a live PG with real block-service + real server_members rows:
  - **case 3 server-members + NOT shared → HIDDEN** (the exact stranger-not-leaked seam the spec flagged) — target placed in a target-only server, viewer in none → `visible:false`.
  - **case 7 soft-deleted (deleted_at) → HIDDEN** even when 'everyone'; case 9b self+soft-deleted → HIDDEN.
  - **case 8/8b unknown / empty-string visibility → HIDDEN** (fail-closed; raw value written directly to DB bypassing the Zod write-path, testing the resolver's own default branch).
- **Resolver uses the correct shared-server EXISTS idiom** (self-referential subquery on `server_members`, mirrors dm.service — NOT `listServerMembers`'s ambient-membership shortcut). The exact leak the P-0 problem-framer flagged is absent by construction. Decision order (missing → soft-deleted → block → self → everyone/server-members/nobody → fail-closed HIDDEN) matches spec intent; every non-visible path short-circuits to the same hidden shape.

### Spec 4 (a98286cb) — editor + member card (web) — **CONFORMS**
- **AC "ProfilePage editor with client validation mirroring Zod; save round-trips PATCH /profile; reflects immediately":** `/settings/profile` renders all 6 academic fields with client `maxLength` matching Zod (pronouns 40, bio 500, institution 120, program 120, year 40; display 50, username 20); academicRole is a `<select>` [student|educator|staff]. Edited bio+year via UI → "Save academic identity" → server truth updated (`GET /profile` reflects) → values persist across full reload (ProfileContext refresh). ✓
- **AC "MemberListPanel → read-only card (GET /profile/:userId), graceful hidden state on 404":** clicking "View …'s profile" opens a portaled dialog "Member profile: <username>" rendering academic identity; when target = nobody the SAME card shows "Profile Unavailable — This member's academic identity is hidden due to visibility settings" with **no academic data leaked** and only the expected 404 in console. No dead-end; Esc dismisses and restores focus to the trigger in both states. ✓
- **AC "NO verification badge — educator/staff = plain text":** with B set academicRole=educator, the card renders "Academic Role: Educator" as plain label text — **no badge/checkmark/trust/verification affordance** (DOM scan `hasBadgeWord:false`). Fence honored. ✓

## 2. Edge cases (each exercised)
- nobody→hidden ✓ · everyone→visible ✓ · server-members shared→visible ✓ · server-members not-shared→hidden (integration) ✓ · block either direction→hidden ✓ · soft-deleted→hidden (integration) ✓ · self→self visible ✓ · fail-closed unknown/empty→hidden (integration) ✓
- academic bounds pronouns≤40 / bio≤500 / institution·program≤120 / academicYear≤40 / academicRole enum — all enforced live ✓ · 409-on-username collision preserved (username unchanged) ✓ · PublicProfile never contains email (live + integration) ✓

## 3. Contract conformance (observable shapes)
- **PublicProfileSchema fields** live-match the shared schema (userId, username, displayName, avatarUrl, accentColor, pronouns, bio, institution, program, academicRole, academicYear); no email.
- **Error envelope** uniform: `{"message":"Profile not found","error":"Not Found","statusCode":404}`.
- **Uniform-404 anti-oracle PROVEN LIVE:** the hidden shape is **byte-identical** across nobody / nonexistent-uuid / malformed-non-uuid / blocked — no info-leak oracle on existence, reason, or which gate fired. Malformed `:userId` returns the same 404 (no 500 — stronger than the wave-23/32 non-UUID→500 class).
- **Auth boundary:** unauth GET /profile, PATCH /profile, GET /profile/:userId all → 401.

## 4. User-journey continuity
Editor journey (edit → save → reload-persist) and member-card journey (open → render → Esc-restore-focus; hidden→graceful) both walk cleanly — no dead-end, broken back, or unhandled error state. Console clean except the expected 404 on the hidden fetch and a pre-existing manifest-icon warning (unrelated to this wave).

## 5. Findings (all LOW/INFO spec-GAPs; 0 DRIFT; 0 blocking) → V-2

- **F-J1 (LOW, spec-GAP) — academicRole cannot be cleared back to NULL once set.** DRIFT vs intent? No — the spec never defined an "unset" path, so this is a GAP. Deployed: the editor's academic-role `<select>` offers an empty `""` option, but selecting it + Save does NOT clear the field; server rejects `academicRole:""` with 400 (Zod `z.enum(...).optional()` accepts absent, not empty/null), and the client omits the empty value so the prior role persists silently. The empty `<select>` option is a dead affordance and the UI gives no feedback that the clear was a no-op. Spec-improvement candidate: either a nullable clear semantic (`academicRole: z.enum(...).nullable().optional()` + `SET NULL`) or remove the empty option. (Matches T-9 documented LOW.)
- **F-J2 (LOW, spec-GAP) — member card shows identical "Profile Unavailable … hidden due to visibility settings" copy for a genuinely-hidden profile AND for a transient network/non-404 error.** For the hidden case the copy is accurate and NON-LEAKING (verified: no academic data rendered). The gap is only that a real fetch failure would mislabel as "hidden" with no retry affordance. Carried from B-3; non-blocking. (Matches T-9 documented LOW.)
- **F-J3 (INFO, spec-GAP, positive) — malformed non-UUID `:userId` → uniform 404, not 400.** Spec did not enumerate malformed-id behavior. Returning the same uniform 404 is a STRONGER anti-oracle posture (no distinction leaked between malformed / nonexistent / hidden) and avoids the wave-23/32 non-UUID→500 defect class. Surfaced as a spec-improvement note (document the intended malformed-id response), not a defect.

## Discipline notes
- Did NOT fix anything (report only).
- **Prod left CLEAN:** Fixture A and B both restored to `profile_visibility='everyone'` / `whoCanDm='everyone'` (A's original), all A↔B blocks removed (both block lists empty), all academic TEXT fields cleared to empty. `academicRole='educator'` residual remains on both fixtures — harmless self-declared test data, un-clearable via the enum schema (F-J1); A already carried 'educator' at my baseline. No new prod rows/servers created.
