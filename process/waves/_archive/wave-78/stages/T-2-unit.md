# T-2 — Unit (wave-78)

**Pattern:** A — Verified-via-CI.

## Action 1 — CI evidence
C-1 `test` job GREEN on merge commit (run 28905313490, headSha 8fe9bd6, 2m3s). Postgres:16 job covers unit + integration suites. Per B-3/B-6: **web 703/703** (includes the +1 403→hidden fail-closed guard added at B-6 hardening commit 1fca71a), **shared 41/41**. Non-required e2e job also passed (55s).

## Action 2 — Coverage audit (per modified module)
Modules touched (from B-2/B-3 `files_implemented`):
- **`packages/shared/src/profile.ts`** (write schema) → covered by shared suite (41/41). Runtime parse verified at B-1 vs built dist: `''`→null, null→null, `'student'`→`'student'`, absent→undefined, `'teacher'`→Zod error. Behavior-changed surface has direct coverage.
- **`apps/web/src/shell/MemberProfileCard.tsx`** → `member-profile-card.test.tsx` +5 tests through the REAL parent `MemberListPanel` (BUILD rule 12, no mock-the-SUT): 404→hidden NO retry (anti-oracle guard); network TypeError→retryable WITH button; 5xx→retryable; retry-after-transient→renders; retry-then-repeated-404→byte-identical hidden. Plus the B-6 fail-closed **403→hidden** guard (+1). This is the load-bearing anti-oracle unit coverage.
- **`apps/web/src/pages/ProfilePage.tsx`** → `profile-academic.test.tsx` +4 tests: load 'student' → select empty → save asserts PATCH `academicRole: null` + select reflects '' post round-trip.
- **`apps/api/src/users/users.service.ts`** → unit-adjacent; the three-way undefined/null/string behavior is proven at the integration tier (T-4), which is the correct layer for a DB-write path (unit would mock the DB and mask the NULL write).

Every behavior-changed surface has at least one happy + one error/negative test. New error-path (retryable state) and new happy-path (cleared role) both covered.

## Action 3 — Flake observation
C-1: `flake_rerun_succeeded: n/a` — no flakes fired. The known `server-roles.test.tsx` Save-enable flake did NOT trigger. No new flakes. Head-tester independently re-ran suites at prior gates historically; this wave had zero flake events.

## Action 4 — Discipline note
The card tests exercise the real parent (`MemberListPanel`) rather than mounting the card in isolation — correct per anti-pattern "never mock the SUT" and BUILD rule 12. Retry is a counter-bump re-running the single fetch effect (simplify-applied). No new canonical pattern to promote.

```yaml
test_pattern: ci-verified
skipped: false
evidence:
  - "C-1 test job: run 28905313490 green (2m3s) on postgres:16, headSha 8fe9bd6"
  - "web 703/703 (incl. +1 403->hidden fail-closed guard, commit 1fca71a); shared 41/41"
modules_audited: [packages/shared/src/profile.ts, apps/web/src/shell/MemberProfileCard.tsx, apps/web/src/pages/ProfilePage.tsx, apps/api/src/users/users.service.ts]
new_flakes: []
findings: []
```
