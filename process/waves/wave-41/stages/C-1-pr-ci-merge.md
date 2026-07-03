# Wave 41 — C-1 PR, CI & merge

**Block:** C (CI/CD) · **Stage:** C-1 · **Mode:** automatic · **Owner:** head-ci-cd

## Branch push

- Branch: `wave-41-educator-moderation`
- Initial push: `Everything up-to-date` (branch already at remote HEAD `1266f90`, the B-6 review-APPROVE merge commit; prompt cited `03e1102`, an intermediate B-6 fix — tip had advanced to `1266f90`).
- Fix-up push (cycle 1): `1266f90..3f46532` after the CI test fix.

## PR creation

- PR **#55** — https://github.com/arina477/test_claudomot/pull/55
- Title: `feat: educator role + light moderation (member timeout, delete-any)`
- Base `main` ← head `wave-41-educator-moderation`. Multi-spec body (6cf06f99 role/perm + 6ddddc2d moderation), test plan, spec contract, wave artifacts (P-3, P-2, design/member-moderation.html), AI-attribution footer.

## CI — run 1 (commit 1266f90): FAIL, one required check

| Check | Result | Duration |
|---|---|---|
| secret-scan | pass | 8s |
| lint | pass | 24s |
| typecheck | pass | 40s |
| build | pass | 35s |
| e2e | pass | 53s |
| boot-probe | pass | 1m3s |
| **test** | **FAIL** | 1m19s |

**Failure:** `apps/api/test/integration/moderation.integration.spec.ts:302` — `setMemberTimeout: target not a member → NotFoundException` — `expected NotFoundException to be an instance of ForbiddenException`.

**Flake determination:** NOT a documented flake (`flakes_documented` empty; prior-wave suspect `server-roles.test.tsx` ran green). No rerun taken — went straight to classify-and-route (Action 8 Step B). Silently re-running an undocumented failure would mask a regression.

## Fix-up cycle 1 — /investigate → route → fix (Iron Law honored)

- Routed via `/investigate` (triage tag `testing`). Orchestrator did NOT fix directly; investigation confirmed root cause and produced the fix.
- **Root cause: test-author defect (T-3 integration), copy-paste artifact.** The assertion `.rejects.toBeInstanceOf(ForbiddenException)` was pasted from the rank-guard cases above (all ForbiddenException) and never updated to match this case's own documented contract — section header "9. timeout target not a member → 404" + test name `NotFoundException`. The SUT (`apps/api/src/rbac/moderation.service.ts`) is correct: for a non-member target, `can()` passes → `assertRankGuard` passes-through unknown members (`if (!targetMember?.role_id) return;`) → membership-existence check throws `NotFoundException`. 404 is the right REST semantic (a non-member doesn't exist here, isn't "forbidden"). **Implementation NOT changed.**
- **Fix (test-only):** `apps/api/test/integration/moderation.integration.spec.ts`
  - added `NotFoundException` to the `@nestjs/common` import;
  - assertion → `.rejects.toBeInstanceOf(NotFoundException)`;
  - replaced the misleading comment with the correct control-flow explanation.
- Local pre-push checks: api typecheck pass, biome check clean. Real-PG reproduction unavailable locally (test DB port 5433 closed; integration specs are CI-only) — authoritative verification deferred to the CI re-run.
- Commit `3f46532`, pushed.

## CI — run 2 (commit 3f46532): all green (run 28669503685)

| Check | Result | Duration |
|---|---|---|
| secret-scan | pass | 8s |
| lint | pass | 24s |
| typecheck | pass | 39s |
| build | pass | 34s |
| e2e | pass | 50s |
| boot-probe | pass | 1m10s |
| **test** | **pass** | 1m12s |

The `test` job (moderation real-PG integration suite) now passes — confirms the assertion matches real-Postgres runtime behavior.

## Merge

- `gh pr view 55`: `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`.
- `gh pr merge 55 --squash --delete-branch --auto` (automatic mode authorizes `--auto`).
- **State: MERGED** at 2026-07-03T15:22:48Z. Merge commit **`5a5f79af25c28c4a5a679da9d3d44999baa11027`**.
- Remote branch `wave-41-educator-moderation` deleted (0 refs).

## Local main sync

- `git checkout main && git pull --rebase` → main HEAD = `5a5f79af25c28c4a5a679da9d3d44999baa11027`.
- Migration `0018_daffy_miracleman.sql` present on main (C-2 applies it explicitly, in order, before serving).

## Stage verdict

```yaml
ci_stage_verdict: PASS
verdict_source: gh
verdict_evidence:
  - "gh pr view 55 state MERGED (mergedAt 2026-07-03T15:22:48Z)"
  - "gh pr checks 55 run 28669503685: all 7 required checks passed (incl. test = moderation real-PG integration)"
  - "merge commit: 5a5f79af25c28c4a5a679da9d3d44999baa11027"
  - "local main HEAD == merge commit; remote branch deleted (0 refs)"
pr_number: 55
pr_url: https://github.com/arina477/test_claudomot/pull/55
branch: wave-41-educator-moderation
required_checks: [secret-scan(pass), lint(pass), typecheck(pass), build(pass), e2e(pass), boot-probe(pass), test(pass)]
optional_checks: []
fix_up_cycles: 1
final_commit_sha: 3f46532c829cb70d26d7c0002743268927813409   # green pre-merge commit
merge_strategy: squash
merge_commit_sha: 5a5f79af25c28c4a5a679da9d3d44999baa11027
rebase_cycles: 0
note: "Cycle 1 = test-author assertion fix (404 vs 403), test-only, Iron Law honored (routed via /investigate, no direct-fix). server-roles.test.tsx passed clean — failure was unrelated real defect, not a flake, no rerun."
```

---

head_signoff:
  verdict: APPROVED
  stage: C-1
  reviewers: {}
  failed_checks: []
  rationale: >
    PR #55 opened and merged clean. On the first run one required check (test) failed on a real
    defect surfaced by the moderation real-Postgres integration suite — a test-author assertion bug
    (asserted ForbiddenException where the test's own 404 contract and the correctly-behaving
    implementation both say NotFoundException). It was not a documented flake, so no rerun was taken;
    per the Iron Law the fix was routed via /investigate rather than patched in-place, and the
    correction was test-only (implementation untouched). CI re-ran fully green against real Postgres,
    confirming the fix matches runtime behavior. All four core gates plus e2e, boot-probe, and a
    clean gitleaks secret-scan passed. Squash-merged with --auto (authorized under automatic mode),
    remote branch deleted, local main synced to the merge commit, and migration 0018 is present on
    main for C-2 to apply explicitly. Fix-up cycles 1 of 5 — within cap.
  next_action: PROCEED_TO_C-2
```

## Exit criteria — all met
- [x] Branch pushed to origin
- [x] PR created + OPEN, then MERGED (#55)
- [x] All required checks green on PR HEAD (run 28669503685)
- [x] Fix-up cycles ≤ 5 (was 1)
- [x] Local main synced to merge commit 5a5f79a
- [x] Remote branch deleted
- [x] Deliverable carries ci_stage_verdict: PASS
```

## Next
→ C-2 Deploy & verify: `railway up` for api + web (Railway is CLI-push, NOT git-triggered), apply migration 0018 explicitly in order before serving, verify via the authoritative Railway deployment-state endpoint (not /healthz). C-1 ends at MERGED + synced main; C-1 does NOT deploy.
