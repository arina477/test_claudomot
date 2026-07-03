# V-1 Karen — Source-Claim Verification (wave-41: educator role + light moderation)

**Reviewer:** karen (V-1 source-claim lane) · **Scope:** verify load-bearing CLAIMS are real in the merge tree (`5a5f79a`) + deployed state. Does NOT evaluate spec conformance (jenny's lane).
**Merge commit:** `5a5f79a` · **Main HEAD:** `6c47c81` (T-only commits ⊇ merge) · **Deployed:** api `c9e34766` + web `856562ad`, both git-sourced (`cliCaller:null`), built `c032720` (⊇ `5a5f79a`).
**Verdict: APPROVE** — 7/7 claim groups verified real; 0 contradictions; 1 disclosed-deferred gap confirmed genuinely disclosed.

---

## Claim 1 — Migration 0018 exists + reflects both columns · VERIFIED
- Claimed: P-3-plan.md:15-16 (`roles.moderate_members boolean NOT NULL DEFAULT false`, `server_members.muted_until timestamptz NULL`); C-2:5,17-22.
- Evidence — `git show 5a5f79a:apps/api/drizzle/migrations/0018_daffy_miracleman.sql`:
  - `ALTER TABLE "roles" ADD COLUMN "moderate_members" boolean DEFAULT false NOT NULL;`
  - `ALTER TABLE "server_members" ADD COLUMN "muted_until" timestamp with time zone;`
  - Journal `meta/_journal.json` carries `tag: 0018_daffy_miracleman`. Both columns exact-match the claim.
- Deployed-DB reflection: proven indirectly by the live smoke (Claim 5) — `POST …/timeout` returns 401 (auth guard reached) not 500 (missing-column schema error); C-2:19-22 also records explicit `information_schema` verification post-`drizzle-kit migrate`. PASS.

## Claim 2 — Backend files + exports + route registration · VERIFIED
- `apps/api/src/rbac/moderation.service.ts` (B-2:3): `export class ModerationService` (:29) with `setMemberTimeout` (:40), `clearMemberTimeout` (:84), `assertRankGuard` (:131). All three present.
- `apps/api/src/rbac/moderation.controller.ts` (B-2:4): `@Controller('servers/:serverId/members/:userId/timeout')` (:43), `@Post()` (:55), `@Delete()` (:84) — matches claimed `POST`/`DELETE …/timeout`.
- `rbac.module.ts`: imports + registers `ModerationController` (:23) and `ModerationService` (:30). Registered, not orphaned.
- `messages.service.ts`: `assertNotMuted` defined (:1744) AND called in BOTH `createMessage` (:461, "before any DB write") AND `createReply` (:1062). `assertDeleteRankGuard` defined (:1774) AND called in `deleteMessage` (:847). Body inspected — `assertNotMuted` throws `ForbiddenException` on `muted_until > new Date()`, NULL/past → allowed (real gate, not a stub). PASS. Matches B-2:4-6.

## Claim 3 — Shared contract · VERIFIED
- `packages/shared/src/rbac.ts`: `moderate_members: z.boolean()` in RolePermissionsSchema (:13) + create/update variants (:56,:72,:107). `MemberTimeoutSchema` (:115) with `durationMinutes: z.number().int().min(1).max(10080)` (:116) — exact 1–10080 bound claimed in P-3-plan.md:22.
- `packages/shared/src/servers.ts`: `ServerMemberSchema` (:58) has `mutedUntil: z.string().nullable()` (:69). PASS.

## Claim 4 — Frontend files + symbols · VERIFIED
- `apps/web/src/shell/MemberListPanel.tsx`: `MutedIndicator` (:80, rendered :502) + `ModerationPopover` (:110, rendered :534).
- `apps/web/src/shell/ServerRolesPage.tsx`: `{ key: 'moderate_members', label: 'Moderate Members' }` (:93-94) + default `moderate_members: false` (:691).
- `apps/web/src/auth/api.ts`: `timeoutMember` (:515) + `removeTimeout` (:530). PASS.

## Claim 5 — Route registration LIVE · VERIFIED
- `POST https://api-production-b93e.up.railway.app/servers/…/members/…/timeout` (unauth) → **401** (not 404) — route registered, auth guard reached.
- `DELETE …/timeout` (unauth) → **401**. Control probe of a nonexistent sibling route → **404** (proves 401 is meaningful, not a blanket catch-all). `GET /health` → **200**. PASS.

## Claim 6 — Deploy-hash match (web serves the merge) · VERIFIED
- Live web root serves bundle `/assets/index-DAuJKUJG.js` (matches C-2:43,87; supersedes pre-deploy `index-QN5fEltz.js`).
- Fetched the 1.7MB served bundle and grepped: `Member moderation` ×1, `Moderate Members` ×1, plus 130 `Mute` refs. New moderation UI is genuinely the served artifact — not a stale snapshot. api serves the moderation routes per Claim 5. PASS.

## Claim 7 — Antipattern sweep · CLEAN
- **Claimed-but-fake:** none. Every export/route/column claimed by P-3/B-2/C-2 exists on disk at `5a5f79a` and the deployed surface responds; the two send-gate helpers throw real exceptions (bodies inspected), not `return true` stubs.
- **Decorative tests:** out-of-lane (T-block), but the deferral is honestly severity-tagged (below).
- **Deferred-but-undocumented:** none found. The delete-any UI E2E gap is **DISCLOSED-deferred**, confirmed genuinely disclosed at 3 independent artifacts: T-5-e2e.md:9,14,22 (`{severity: low, id: delete-any-ui-coverage}`), T-5-tester.md:17,49, T-9-journey.md:3,12 (`coverage_gaps: ["delete-any UI E2E (V-2 follow-up)"]`). Backend delete-any + rank guard proven at T-8; UI affordance code present (`MessageList.tsx` RowActions, aria-label "Delete message (moderator)"). Documented, NOT hidden. PASS.

---

## Findings summary
| # | Claim | Verdict |
|---|---|---|
| 1 | Migration 0018 (both columns) | VERIFIED |
| 2 | Backend files/exports/registration + send-gate + delete-rank-guard call sites | VERIFIED |
| 3 | Shared contract (moderate_members, MemberTimeoutSchema 1–10080, mutedUntil) | VERIFIED |
| 4 | Frontend files/symbols | VERIFIED |
| 5 | Live route registration (401 not 404) + /health 200 | VERIFIED |
| 6 | Web bundle serves merge ("Moderate Members"/"Member moderation") | VERIFIED |
| 7 | Antipattern sweep; delete-any E2E disclosed-deferred | CLEAN |

**Contradictions found: 0.** No claimed-but-fake, no hidden deferral, no false-green deploy (git-sourced `cliCaller:null` + real commitHash + serving-revision flip 404→401 and QN5fEltz→DAuJKUJG).

## VERDICT: APPROVE
All 7 load-bearing claim groups are real in the merge tree and the deployed state; the single coverage gap (delete-any UI E2E) is genuinely disclosed as a LOW/V-2 follow-up, not a masked incompletion.
