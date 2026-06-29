# C-1 — PR, CI & merge (wave-10, M2 RBAC capstone)

## Branch & push
- Branch: `wave-10-m2-rbac` @ `a22ed5d` (already pushed; `git push` reported up-to-date).

## PR
- PR #20: https://github.com/arina477/test_claudomot/pull/20
- Title: `feat(rbac): M2 roles + channel permissions + owner-lockout (#wave-10)`
- Base `main` ← head `wave-10-m2-rbac`. Tasks cited: 35f191f4 / 2c927c44 / 7a10f13d / 0b9bcf35.

## Required CI checks (branch protection: lint, typecheck, test, build, secret-scan, boot-probe)
Run `28407445198`, all green:
- lint — pass (21s)
- typecheck — pass (31s)
- test — pass (51s) — Postgres 16 service, `pnpm test:ci` (unit + integration; 270 tests incl. 6 security conditions)
- build — pass (28s)
- secret-scan — pass (5s) — gitleaks-action@v3, no secret in diff
- boot-probe — pass (49s) — compiled api boot against Postgres 16 + /health poll returned `"status":"ok"`
- e2e — pass (42s) — optional (not required), Playwright vs live web URL

## Migration-numbering finding (surfaced, NOT a blocker)
- Branch adds `0004_green_madripoor.sql` (drizzle journal idx 4). A PRIOR wave's migration is tagged `0004_gigantic_saracen` (idx 3) — so TWO files share the `0004` filename prefix.
- Drizzle orders/tracks by journal `idx` + content hash, NOT the filename prefix. The two `0004_*` files have distinct idx (3, 4) and distinct tags/hashes. Journal is internally consistent. The duplicate prefix is COSMETIC — no collision, no skipped migration.
- Confirmed against prod `drizzle.__drizzle_migrations` at C-2: prod was at idx 4 hashes (last = `0004_gigantic_saracen`), `0004_green_madripoor` genuinely pending. Wave-9 added no schema migration (backfill-only), as anticipated.

## Mergeable & merge
- `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`.
- `gh pr merge 20 --squash --delete-branch`. State `MERGED`.
- Squash merge commit: `3cf63bf0a8049a16b19deb989a2721e2e6e4c719`
- Local `main` synced to `3cf63bf`; branch deleted on origin.

```yaml
ci_stage_verdict: PASS
verdict_source: gh
verdict_evidence:
  - "gh pr view 20 state MERGED"
  - "gh pr checks 20 — all 6 required checks (lint/typecheck/test/build/secret-scan/boot-probe) + e2e passed on run 28407445198"
  - "merge commit: 3cf63bf0a8049a16b19deb989a2721e2e6e4c719"
pr_number: 20
pr_url: https://github.com/arina477/test_claudomot/pull/20
branch: wave-10-m2-rbac
required_checks: [lint, typecheck, test, build, secret-scan, boot-probe]
optional_checks: [e2e (PASS)]
fix_up_cycles: 0
final_commit_sha: a22ed5d184268743487f8181c4bbaf0164f258c4
merge_strategy: squash
merge_commit_sha: 3cf63bf0a8049a16b19deb989a2721e2e6e4c719
rebase_cycles: 0
note: "Migration-numbering: cosmetic duplicate 0004 prefix (0004_gigantic_saracen idx3 + 0004_green_madripoor idx4); drizzle tracks by idx+hash, no real conflict. Confirmed pending in prod."

head_signoff:
  verdict: APPROVED
  stage: C-1
  reviewers: {}
  failed_checks: []
  rationale: "All four CI jobs (lint/typecheck/test/build) plus boot-probe and gitleaks secret-scan ran and reported success on run 28407445198 — none skipped/cancelled. The test job ran against the Postgres v16 service via test:ci (integration suites, 270 tests incl. 6 security conditions). CI permissions are least-privilege (contents: read). PR branches off main and targets main; no direct-to-main push. The new migration has a committed SQL file (0004_green_madripoor.sql). The duplicate 0004 filename prefix is cosmetic (drizzle orders by journal idx + hash); confirmed against prod's __drizzle_migrations that the migration is genuinely pending and applies cleanly on top. Merged squash, branch deleted."
  next_action: PROCEED_TO_C-2
```
