# C-1 — PR, CI & merge (wave-88)

Server-side senderKeyRef validation on the encrypted-DM send path. head-ci-cd owned C-1 (PR + CI + merge) in `automatic` mode.

## Branch push

- `git push -u origin wave-88-dm-senderkey-validation` — new branch created on origin.
- One C-1 fix-up commit added before push: `2c7c701a style(dm): biome import-order fix on dm.service` — the working tree already carried the biome import-organizer output (user_encryption_keys re-ordered after userBlocks); the prior B-block commit left the import mis-ordered, which fails the CI `lint` (biome ci) gate. Verified: committed order fails `pnpm lint`; working-tree order passes. No logic change (CI-PRINCIPLES rule 4).

## PR

- **PR #109** — https://github.com/arina477/test_claudomot/pull/109
- Title: `feat(dm): server-side senderKeyRef validation on encrypted DM send`
- Base: `main` ← head: `wave-88-dm-senderkey-validation`

## Required checks (branch protection: lint, typecheck, test, build, secret-scan, boot-probe)

Run 29051887913. Gated on per-job conclusions (`gh run view --json jobs`), not watch exit alone (CI-PRINCIPLES rule 3):

| Check | Required | Conclusion |
|---|---|---|
| lint | yes | success |
| typecheck | yes | success |
| test | yes | **success** |
| build | yes | success |
| secret-scan | yes | success |
| boot-probe | yes | success |
| e2e | no | failure (known flake — non-blocking) |

**All 6 required checks green.**

### `test` job (the integration-critical one)

Ran `pnpm test:ci` against provisioned postgres:16 + `DATABASE_URL_TEST`. Integration tier executed 30 test files (nonzero — no false-green; CI-PRINCIPLES rule 5). All 4 wave-88 DM senderKeyRef integration specs in `dm-encryption.integration.spec.ts` passed against real Postgres:

- registered key MATCHING senderKeyRef → row stored ✓
- registered key MISMATCHING senderKeyRef → rejected, no row stored ✓
- sender with NO registered key → send SUCCEEDS (fail-open) ✓
- **post-rotation (T-8): send with the CURRENT (rotated) key ref is ACCEPTED, not rejected ✓ (154ms)** — the critical case

Unit tier (test:ci projects): 3 + 59 + 48 test files passed; 833 unit specs green (matches local B-5).

### e2e failure (non-required, non-blocking)

Single failing test: `apps/web/e2e/delete-any-message.spec.ts:83` (moderator delete / fan-out tombstone) — `toBeVisible` timeout on a message marker, the documented sign-in/message-fan-out flake (CI-PRINCIPLES rule 11 class). Web/realtime test, unrelated to the server-side DM validation change (which is exercised by the api `test` job). NOT re-run: e2e is non-required and does not gate merge; wave-88 documented no flakes so no ledgered re-run grant applies.

## Mergeable state

- `gh pr view 109 --json mergeable,mergeStateStatus` → `MERGEABLE` / `UNSTABLE` (UNSTABLE = the non-required e2e failed; all required contexts green). Not BEHIND — no rebase needed.

## Merge

- `gh pr merge 109 --squash --delete-branch --auto` (automatic mode authorizes `--auto`).
- PR state: **MERGED**. Remote branch deleted.
- Local main sync: aborted a stale rebase (local main carried 6 unpushed wave-87/88 process/docs commits — pre-existing hygiene debt, fully superseded on origin), then `git reset --hard origin/main`. Verified origin/main contains all wave-88 code + P/B process files + wave-87 archive; nothing lost.

## Merge commit

**`d06460582438a6145f906f1031461ea1accbb7e1`** (squash merge of PR #109 on origin/main; local main synced to it).

```yaml
ci_stage_verdict: PASS
verdict_source: gh
verdict_evidence:
  - "gh pr view 109 state MERGED"
  - "gh api branches/main/protection required contexts [lint,typecheck,test,build,secret-scan,boot-probe] all success (per-job conclusions, run 29051887913)"
  - "test job: 4 wave-88 DM senderKeyRef integration specs incl. post-rotation T-8 case passed vs real Postgres"
  - "merge commit: d06460582438a6145f906f1031461ea1accbb7e1"
pr_number: 109
pr_url: https://github.com/arina477/test_claudomot/pull/109
branch: wave-88-dm-senderkey-validation
required_checks: [lint, typecheck, test, build, secret-scan, boot-probe]
optional_checks:
  - "e2e: FAIL (known non-required flake — delete-any-message.spec.ts sign-in/fan-out; unrelated to DM change)"
fix_up_cycles: 0
final_commit_sha: 2c7c701a2  # green branch HEAD pre-merge (biome import-order fix-up)
merge_strategy: squash
merge_commit_sha: d06460582438a6145f906f1031461ea1accbb7e1
rebase_cycles: 0
note: "One pre-push biome import-order fix-up commit (2c7c701a) to clear the CI lint gate; not counted as a CI fix-up cycle (no red required check was ever hit). Local main had stale unpushed process commits from prior waves — reset --hard to origin/main after verifying no content loss."
```
