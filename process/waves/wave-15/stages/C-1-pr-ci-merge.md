# C-1 — PR, CI & merge (wave-15 M3 @mentions)

Branch `wave-15-m3-mentions` → main. Repo `arina477/test_claudomot`.

## Push
- Branch already pushed (B-6 APPROVE); origin in sync at `878f0569652ed0028bec02f6a5b73c229479a1f7` (no force-push needed — clean fix-up history).

## PR
- PR #27: https://github.com/arina477/test_claudomot/pull/27
- Title: `feat(mentions): M3 @mentions — parse/resolve/persist + autocomplete + pills + unread (#wave-15)`
- Body: 3 specs (primary task 3d238446; claimed cd585f04, c3f3f62a), 471 tests, schema 0007 message_mentions, H-1 realtime-badge + H-2 + username-resolution-chain fixes noted.
- Base main, head wave-15-m3-mentions (feature→main; no direct-to-main bypass).

## CI (workflow run 28431946584, HEAD 878f0569)
All required checks PASS — none skipped/cancelled/no-op:

| Check | Result | Duration |
|---|---|---|
| lint | pass | 18s |
| typecheck | pass | 28s |
| test (Postgres 16 service; units + integration, 471 tests) | pass | 56s |
| build | pass | 29s |
| secret-scan (gitleaks, blocking) | pass | 5s |
| **boot-probe** | **pass** | **59s** |
| e2e (informational) | pass | 51s |

- **boot-probe SUCCESS** — compiled API boots cleanly with the `message_mentions` (0007) schema present and `MentionsController` wired; `/health` returned ok (no DI/import crash on boot).
- **secret-scan SUCCESS** — no secret reached the diff (gitleaks-action@v3).
- CI permissions least-privilege: workflow declares `permissions: contents: read`; no job has broader scope.
- test job runs against `postgres:16` service container (pg_isready health-gated) and `pnpm test:ci` (units + integration), not units-only.

## Mergeable + merge
- `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`.
- Squash-merged + branch deleted (`gh pr merge --squash --delete-branch`). Auto-merge not needed (state already CLEAN; merge fired immediately).
- Mode `automatic` (BOARD owns approval; `--auto` authorized but unneeded).
- Local main synced + rebased; `0007_massive_chamber.sql` present on main.

```yaml
ci_stage_verdict: PASS
verdict_source: gh
verdict_evidence:
  - "gh pr view 27 state MERGED; mergeStateStatus CLEAN"
  - "gh pr checks 27: all 7 checks pass (lint, typecheck, test, build, secret-scan, boot-probe, e2e)"
  - "boot-probe pass 59s — message_mentions schema + MentionsController boot clean"
  - "secret-scan pass — gitleaks, no secret in diff"
  - "merge commit: fd86540400d3ab9a44b076c49106aaa6ee38e6b6"
pr_number: 27
pr_url: https://github.com/arina477/test_claudomot/pull/27
branch: wave-15-m3-mentions
required_checks: [lint, typecheck, test, build, secret-scan, boot-probe]
optional_checks: [e2e (PASS)]
fix_up_cycles: 0
final_commit_sha: 878f0569652ed0028bec02f6a5b73c229479a1f7
merge_strategy: squash
merge_commit_sha: fd86540400d3ab9a44b076c49106aaa6ee38e6b6
rebase_cycles: 0
note: "CI permissions contents:read (least-privilege). Branch feature->main; no direct-to-main bypass. Migration 0007 SQL + snapshot committed."
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-1
  reviewers: {}
  failed_checks: []
  rationale: >
    All seven CI checks ran and passed on the PR HEAD commit — the four core jobs (lint, typecheck,
    test, build) plus the blocking gitleaks secret-scan and the boot-probe; none skipped, cancelled,
    or no-op. The test job executed against the Postgres 16 service container with the integration
    suite, not units alone. boot-probe is the load-bearing gate this wave: it proves the compiled API
    boots with the message_mentions (0007) schema present and MentionsController wired, no DI/import
    crash. CI permissions are least-privilege (contents: read). The PR branches feature->main with no
    direct-to-main bypass, and migration 0007 ships as a committed SQL file plus snapshot. Mergeable
    state was CLEAN; squash-merged to main at fd86540 and local main synced. Proceed to C-2.
  next_action: PROCEED_TO_C-2
```
