# V-1 Karen — wave-77 (M13 leg-2: portable academic identity + cross-server profile view)

**Axis:** source-claim verification against the LIVE deployed state (merge tree + prod). NOT spec conformance (jenny's axis).
**Merge commit:** `633f362e0fe8c916d9e9a52e7d225008af81b8a9` (confirmed ancestor of HEAD `52ddaa7`; PR #96).
**Deployed prod:** api `https://api-production-b93e.up.railway.app` (/health 200) · web `https://web-production-bce1a8.up.railway.app`.

## VERDICT: **APPROVE**

Every load-bearing claim is TRUE in the merge tree and confirmed on deployed prod. No claimed-but-fake, no decorative tests, no undocumented deferrals found. The privacy-critical visibility resolver is a real fail-closed implementation, not a stub. Migration applied to prod (directly re-verified via psql). Both services deployed SUCCESS at the exact merge commit.

---

## Findings (each: APPROVE/REJECT + file:line + evidence)

### 1. Files exist on the merge tree — **APPROVE**
All 9 claimed files present at `633f362e` (`git cat-file -e 633f362e:<path>` all pass):
- `apps/api/src/profile/profile-visibility.service.ts` (170 lines)
- `apps/api/src/profile/profile.controller.ts` (144 lines)
- `apps/api/src/profile/profile.module.ts` (16 lines)
- `apps/api/drizzle/migrations/0030_funny_tarantula.sql` (5 lines / 6 ADD COLUMN stmts)
- `apps/api/src/db/schema/users.ts` (31 lines)
- `packages/shared/src/profile.ts` (68 lines)
- `apps/web/src/shell/MemberProfileCard.tsx` (462 lines)
- `apps/web/src/pages/ProfilePage.tsx` (1060 lines)
- `apps/api/test/integration/profile-visibility.integration.spec.ts` (218 lines)

### 2. Exports — **APPROVE**
- `ProfileVisibilityService` exported with all three methods present and non-trivial: `resolve` (profile-visibility.service.ts:52), `sharesServer` (:130), `toPublicProfile` (:151). Note: the private co-membership method is named `sharesServer` (prompt said "sharesServer") — confirmed present.
- `PublicProfileSchema` + `PublicProfile` type (packages/shared/src/profile.ts:57, :68) + `ACADEMIC_ROLES` (:4) — all re-exported from `packages/shared/src/index.ts` (grep confirms `ACADEMIC_ROLES`, `PublicProfileSchema`, `PublicProfile`, plus `PROFILE_VISIBILITY`/`ProfileVisibility`).
- `GraduationCapIcon` + `UserIcon` both exported from `apps/web/src/shell/icons.tsx` (grep: `export function GraduationCapIcon` / `export function UserIcon`).
- Service imports the literal `PROFILE_VISIBILITY` const from `@studyhall/shared` (profile-visibility.service.ts:3) — used for the enum branch, not a hardcoded string.

### 3. Routes registered + live — **APPROVE**
- Controller declares `@Controller('profile')` with `@Get()` (self), `@Patch()` (self), and `@Get(':userId')` (cross-server), each `@UseGuards(SessionNoVerifyGuard)` (profile.controller.ts:27, :39, :47, :91).
- `ProfileModule` registers `ProfileController` + `ProfileVisibilityService`, imports `BlocksModule` for the `BlocksService` injection (profile.module.ts:12-15). Registered in `apps/api/src/app.module.ts` (`import { ProfileModule }` + listed in imports).
- **LIVE prod probe (decisive):**
  - `GET /profile/11111111-1111-1111-1111-111111111111` unauth → **401** `{"message":"unauthorised"}` — route exists + guard active.
  - `GET /profile` unauth → **401**.
  - Baseline control: `GET /zzz-nonexistent-route` → **404**. This proves the 401 above is a genuine guard rejection on a registered route, NOT a catch-all fallback. Claim "unauth → 401 not 404" holds.

### 4. Migration applied to prod — **APPROVE** (directly re-verified, not trusted)
Method: fetched `DATABASE_PUBLIC_URL` from the Railway Postgres service (8d177be8, env production bfdcc42f) via GraphQL `Project-Access-Token`, then ran `psql` against host `yamanote.proxy.rlwy.net:40008/railway` (matches C-2's documented host).
Result — `information_schema.columns` on `users`:
```
academic_role  | text | YES
academic_year  | text | YES
bio            | text | YES
institution    | text | YES
program        | text | YES
pronouns       | text | YES
count = 6
```
All 6 columns present, all `text`, all nullable — exactly matching migration `0030_funny_tarantula.sql`. C-2's claim ("6 academic columns added, nullable, verified; before 0, after 6") is independently confirmed against live prod.

### 5. Deploy hash match — **APPROVE**
Railway GraphQL (`deployments(first:1)`, `Project-Access-Token`, `backboard.railway.com/graphql/v2` — no CLI, no Bearer):
- **api** (7358a103): `status: SUCCESS`, `commitHash: 633f362e0fe8c916d9e9a52e7d225008af81b8a9`, imageDigest sha256:1ab9216…, createdAt 2026-07-07T21:46:37Z.
- **web** (107d4255): `status: SUCCESS`, `commitHash: 633f362e0fe8c916d9e9a52e7d225008af81b8a9`, imageDigest sha256:e840426…, createdAt 2026-07-07T21:46:38Z.
Both live deployments are SUCCESS at the exact merge commit.

### 6. Antipattern catalog — **APPROVE (no antipatterns found)**

- **Claimed-but-fake / stubbed resolver → NOT FOUND (real).** `ProfileVisibilityService.resolve` (profile-visibility.service.ts:52-118) genuinely branches on the imported `PROFILE_VISIBILITY` const: `everyone` (`PROFILE_VISIBILITY[0]`, :101) → VISIBLE; `server-members` (`PROFILE_VISIBILITY[1]`, :107) → VISIBLE iff `sharesServer` true; and the final `return { visible: false }` (:117) is an explicit **fail-closed default** covering `nobody`, unknown, empty, and missing values. Gates 1-4 (missing / soft-deleted / bidirectional-block / self) short-circuit before the branch (:69-98). `sharesServer` (:130) is a real EXISTS subquery on `server_members`, deliberately NOT `listServerMembers` (avoids ambient-membership over-disclosure). `toPublicProfile` (:151) allowlists fields and structurally omits email. Not a stub.

- **Decorative / skipped tests → NOT FOUND (real).** `profile-visibility.integration.spec.ts` asserts **13 cases** against real Postgres via `pg-harness` (fixtures inserted, `truncateTables` per test): everyone→VISIBLE (asserts field passthrough incl. institution/academicRole), server-members shared→VISIBLE, server-members-not-shared→HIDDEN (stranger-not-leaked), nobody→HIDDEN, block both directions→HIDDEN, soft-deleted→HIDDEN, unknown value `'friends-of-friends-lol'`→HIDDEN (fail-closed, garbage written directly to DB), empty-string→HIDDEN, self→self→VISIBLE, self-soft-deleted→HIDDEN, missing target→HIDDEN, and PublicProfile-never-has-email (asserts `not.toHaveProperty('email')` + email value absent from `Object.values`). The `describe.skipIf(SKIP)` gate only skips when `DATABASE_URL_TEST` is unset (local convenience) with an explicit skip message — assertions are substantive, not empty. B-6 deliverable claims the matrix was CI-run; the assertions are genuine.

- **Deferred-but-undocumented work → NOT FOUND.** `academic_role` stored as plain `text` (not pgEnum) is documented in-code (profile.controller.ts toProfileResponse comment + users.ts) and enforced at the write boundary by `UpdateProfileSchema` `z.enum(ACADEMIC_ROLES)`. No silent TODOs or stubbed branches observed in the reviewed surface.

---

## Notes for the V-block
- Self PATCH validation caps are present in `UpdateProfileSchema` (bio ≤500, institution/program ≤120, pronouns ≤40, academicYear ≤40, academicRole z.enum) — jenny owns spec-conformance of these bounds.
- Uniform 404 for all hidden cases (controller :112) is a deliberate leak-avoidance choice (does not disclose which gate hid the profile) — noted, not a defect on this axis.
