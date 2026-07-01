# C-1 — PR, CI & Merge (wave-29)

Stage: C-1 (PR & CI gates → squash-merge → sync main)
Block: C (CI/CD)
Owner: head-ci-cd
Mode: automatic

## Summary

Presence/members code-debt cleanup (seed `d23a0740`) merged to `main` via squash.
Single spec, no schema/migration. All 7 required CI checks green on the first
cycle — zero fix-up cycles. Local main fast-forwarded to the squash commit;
uncommitted brain-vendored files preserved via autostash (not committed).

## PR

- pr_number: **42**
- pr_url: **https://github.com/arina477/test_claudomot/pull/42**
- title: `refactor: presence/members code-debt cleanup (displayName guard + dead schema)`
- base: `main`  ←  head: `wave-29-presence-members-debt`
- branch HEAD at PR open: `a56542a`
- merge_strategy: squash (`--squash --delete-branch --auto`)

### Diff scope (verified before open)
- part1 — displayName empty-fallback guard, `??`→`||`, 2 sites:
  - `apps/api/src/presence/presence.gateway.ts`
  - `apps/api/src/servers/servers.service.ts`
- part2 — delete dead `ServerMembersResponseSchema`:
  - `packages/shared/src/servers.ts`, `packages/shared/src/index.ts`
- test specs: `presence.gateway.spec.ts` (+65), `servers.service.spec.ts` (+82)
- process/ deliverables (B-block transcripts)
- No migration / schema file present — confirmed.

## Required checks (all pass — run 28536835436)

| check       | result | duration |
|-------------|--------|----------|
| lint        | pass   | 23s      |
| typecheck   | pass   | 38s      |
| test        | pass   | 1m3s     |
| build       | pass   | 35s      |
| boot-probe  | pass   | 54s      |
| secret-scan | pass   | 9s       |
| e2e         | pass   | 47s (4 passed) |

- secret-scan (gitleaks) passed — `.gitleaks.toml` `process/**` allowlist held; no
  secret reached the diff. Token used inline on every `gh` call, never committed/echoed.
- mergeable: `MERGEABLE`, mergeStateStatus: `CLEAN` before merge.
- CI bypass check: all four core jobs (lint/typecheck/test/build) actually ran + reported
  success — not skipped/cancelled/no-op. No direct push to main.

## Merge

- merge_commit_sha: **fd03d27d0b12f5d78f84105bdabbed8cbd565945**
- mergedAt: 2026-07-01T17:49:11Z
- state: MERGED
- remote branch `wave-29-presence-members-debt`: deleted (confirmed empty ls-remote)

## Local main sync

- `git checkout main` → `git -c rebase.autostash=true pull --rebase origin main`
- local HEAD: `fd03d27d0b12f5d78f84105bdabbed8cbd565945` == `origin/main` (parity confirmed)
- autostash restored uncommitted brain-vendored files — NOT committed:
  - `claudomat-brain/VERSION` (M)
  - `claudomat-brain/onboarding/stages/stage-v13-handoff.md` (M)

## Verdict

- fix_up_cycles: **0**
- ci_stage_verdict: **PASS**

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-1
  reviewers: {}
  failed_checks: []
  rationale: >
    PR #42 opened against main from wave-29-presence-members-debt. All seven required
    CI jobs (lint, typecheck, test, build, boot-probe, secret-scan, e2e) actually ran and
    reported success on the first cycle — no skips/cancels/no-ops. gitleaks secret-scan
    passed; no secret in the diff and the token stayed inline. Diff scope matched the spec
    (2-site displayName guard + dead-schema deletion), no migration present. Squash-merged
    with delete-branch; merge commit fd03d27 on main, remote branch deleted, local main
    synced to parity with origin/main and brain-vendored files preserved uncommitted.
  next_action: PROCEED_TO_C-2
```
