# Wave 77 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, Phase-1 gate)
**Reviewed against:** process/waves/wave-77/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale

M13 leg-2 (portable academic identity, first slice) clears the B-block gate on all
seven crown-jewel checks, with the privacy-critical visibility resolver
(bf0ad2a8) verified adversarially against every negative path. The
`ProfileVisibilityService.resolve()` decision order is provably fail-closed: it
loads the target once, short-circuits to HIDDEN on missing → soft-deleted →
bidirectional-block (in that order, all before the self gate), branches only on
the imported `PROFILE_VISIBILITY` literals (`everyone` visible / `server-members`
via shared-server check / `nobody` hidden), and its final `return { visible:
false }` catches every unknown/empty/unrecognized value — there is no fall-through
to visible anywhere in the function. The `server-members` branch mirrors
dm.service.ts's shared-server EXISTS idiom byte-for-byte (same
`server_members.server_id IN (SELECT server_id FROM server_members WHERE user_id
= $target)` self-subquery, both ids from explicit args, single round-trip) and
deliberately does NOT use `servers.listServerMembers`'s ambient-membership
shortcut — so a stranger sharing no server is not leaked. The controller returns a
UNIFORM 404 for every hidden case (no existence/gate oracle to a probing
stranger) and derives the viewer id from `req.session.getUserId()` with the
`:userId` param used only as the target (no IDOR). `PublicProfileSchema` has no
email field by construction and `toPublicProfile` reads only the allowlisted
columns; migration 0030 is additive-nullable text (six columns), no backfill, no
pgEnum, no index change; `SessionNoVerifyGuard` still fully verifies session
validity and only strips the EmailVerification claim (correct for the /me,/profile
self-surface + the public read — NOT a wave-75-style AuthGuard bypass). The
frontend never renders email, portals to document.body with viewport clamp
(BUILD-14), unmounts + restores trigger focus on Esc, renders academicRole as
plain text with no verification badge, maps uniform-404 to a calm "hidden" state,
and is tested through its real parent MemberListPanel (BUILD-12). Commit
discipline is clean per Action 6: every claimed task has a single-task-id feat
commit and no commit bleeds across spec blocks.

## Negative-path reproduction result (BUILD-4)

Reproduced by reading the resolver + its integration matrix against the spec's
forbidden cases; the matrix asserts BOTH the permit and the deny direction.

| Negative path | Resolver behavior | Matrix case | Result |
|---|---|---|---|
| **stranger-not-leaked** (`server-members`, viewer shares NO server) | `sharesServer()` returns false → `{ visible: false }` | case 3 (VIEWER in no server, TARGET in a target-only server) | HIDDEN — PASS |
| **fail-closed-unknown** (`friends-of-friends-lol`) | no literal matches → final `return { visible: false }` | case 8 | HIDDEN — PASS |
| **fail-closed-empty** (`''`) | same final fail-closed default | case 8b | HIDDEN — PASS |
| `nobody` | PROFILE_VISIBILITY[2] falls to the fail-closed default | case 4 | HIDDEN — PASS |
| block viewer→target | isBlockedBetween OR-branch true | case 5 | HIDDEN — PASS |
| block target→viewer (bidirectional) | isBlockedBetween OR-branch true | case 6 | HIDDEN — PASS |
| soft-deleted (deleted_at) even if `everyone` | gate 2 short-circuits before visibility branch | case 7 | HIDDEN — PASS |
| soft-deleted self-view | gate 2 runs before the self gate | case 9b | HIDDEN — PASS |
| missing target | `!target` → HIDDEN | case 10 | HIDDEN — PASS |
| PublicProfile carries email | structural allowlist; no email field | case 11 (asserts no `email` prop + target email not in values) | NO-LEAK — PASS |

The stranger-not-leaked and fail-closed-unknown cases — the two named load-bearing
risks — both deny correctly, and the matrix proves it in both directions.

## Integration-matrix authenticity + CI-run confirmation

The matrix at `apps/api/test/integration/profile-visibility.integration.spec.ts`
is REAL, not decorative: 13 `it()` cases exercising the genuine
visibility×block×soft-delete grid against real Postgres via pg-harness
(truncate-between isolation, CF-2 first-import guard), asserting both permit and
deny. It runs in CI (NOT skipped-forever): the `test` job in `.github/workflows/ci.yml`
provisions `postgres:16` + sets `DATABASE_URL_TEST` and runs `pnpm test:ci`, whose
API leg is `vitest run && vitest run --config vitest.integration.config.ts`; the
integration config's `include: ['test/integration/**/*.spec.ts']` collects this
spec, and with `DATABASE_URL_TEST` present the `describe.skipIf(SKIP)` executes
rather than skips. This is the authoritative security validation gate at C-1.

## Observations (non-blocking, carry to /review + C-1)

- `dfd2a87` (task 10a68f9e) and `a01253d` (task bf0ad2a8) both touch
  `apps/api/src/profile/profile.controller.ts`, but on DIFFERENT methods (self
  GET/PATCH vs public GET/:userId). Both blocks' spec contracts legitimately
  declare that file. Same-file/different-endpoint split across two single-task
  commits is correct multi-spec discipline, NOT cross-spec bleed — no rework.
- academic_role is stored as plain text and narrowed to `AcademicRole | null` at
  both DTO boundaries; the only writer is PATCH /profile validated by
  `UpdateProfileSchema` (z.enum), so any stored value is a legal role. Sound.
- Escalations to carry forward unchanged: C-1 executes the integration matrix as
  the merge-blocking security check; C-2 applies migration 0030 to prod before
  the api deploy (Railway CLI-push, not git-trigger).

## Phase 2 handoff

APPROVED → proceed to Phase 2 (`/review` skill) on the wave-77-portable-identity
diff for the production-bug pass (contract mismatch / null access / missing error
handling), then the Action 6 commit-discipline check already spot-verified above.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
