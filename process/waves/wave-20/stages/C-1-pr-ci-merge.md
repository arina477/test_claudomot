# C-1 — PR, CI & merge (wave-20 M4 offline spine)

## Branch push
- Branch `wave-20-m4-offline-spine` already pushed; remote HEAD == local HEAD `d67c92fd872ed938b072ddb6224c620f6e0ee37f` (B-6 APPROVE commit). No force-push.

## PR
- **PR #32** — https://github.com/arina477/test_claudomot/pull/32
- Base `main`, head `wave-20-m4-offline-spine`.
- Title: `feat: M4 offline-first spine — Dexie outbox + exactly-once/in-order reconnect + forward catch-up cursor (#wave-20)`
- Body: client IndexedDB store + durable outbox (offline-enabled composer); reconnect drains exactly-once + in-order (the wedge); NEW GET ?after= forward catch-up; server idempotency reused (no rebuild); /review caught + fixed in-order gaps; no server migration.

## CI — required checks (7 jobs, one workflow run 28471334846 @ headSha d67c92f)
Gated on PER-JOB CONCLUSIONS via `gh run view --json jobs` (CI-PRINCIPLES rule 3 — NOT on `gh run watch --exit-status` alone). Result: 7/7 success, 0 non-success, 0 skipped/cancelled.

| Job | status | conclusion |
|---|---|---|
| lint | completed | success |
| typecheck | completed | success |
| test | completed | success |
| build | completed | success |
| secret-scan (gitleaks) | completed | success |
| boot-probe | completed | success |
| e2e | completed | success |

- Run-level: `run_status=completed`, `run_conclusion=success`.
- CI permissions least-privilege: `permissions: contents: read` (workflow-level).
- Test job ran against Postgres v16 service + executed integration suite (`pnpm test:ci`, turbo `4 successful, 4 total`, `0 cached` — real execution, not no-op cache).

## Offline-spine tests EXECUTED (read from test-job log 84384478865 — not skipped)
- **API (@studyhall/api): 346 passed (346).** Incl:
  - `messages.service.spec.ts > wave-20 idempotency-contract LOCK (task 92d85e0e)` — repeat (channelId, idempotencyKey) → same message id, identical DTO (2 tests ✓).
  - `messages.service.spec.ts > listMessagesAfter — wave-20 M4 forward catch-up cursor (task 92d85e0e)` — ASC order, HEAD empty, no-cursor first page, malformed→400, tombstones excluded, nextCursor (6 tests ✓).
  - `test/integration/create-server-rollback.spec.ts` — real-Postgres rollback/commit (3 ✓).
- **Web (@studyhall/web): 176 passed (176).** Incl:
  - `outbox.test.ts > outbox drain — exactly-once + in-order (gating proof)` — drains in createdAt order each POSTed exactly once; stop-on-failure blocks later items; sequential POST[i+1] after POST[i]; two concurrent drain() each item exactly once in order; idempotencyKey replay same id no dup; ascending-id tiebreak (10 tests ✓).
  - `db.test.ts > StudyHallDB` — messages cache, channels cache, outbox enqueue+state ([state+createdAt] oldest-first, idempotencyKey index) ✓.

## Merge
- Mergeable state pre-merge: `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`.
- Strategy: `--squash --delete-branch` (project.yaml merge_strategy=squash).
- PR state: **MERGED** at 2026-06-30T19:47:29Z. Branch deleted on origin.
- Merge commit SHA: **bff9f120536655e1e539ecfad164005bc5047b84**.
- Local main synced (fast-forward 65b9700..bff9f12).

## Drizzle ledger
- `git diff --stat origin/main...HEAD -- apps/api/drizzle/` empty → ledger UNCHANGED this wave (no new 00NN file). Highest migration remains `0009_narrow_carnage.sql`. Matches spec (Dexie client-side; forward cursor is a query; no server schema migration).

## L-2 NOTE (CI lesson — do NOT write to CI-PRINCIPLES.md per obs-4 5th-recurrence directive)
- CI-PRINCIPLES rule 3 (gate on per-job conclusions, not `gh run watch` alone) held: `gh run watch` exited 0 AND per-job `--json jobs` independently confirmed 7/7 success with empty non-success set — the two agreed this wave, but the authoritative gate remained the per-job read. No new lesson surfaced; existing rules 1/2/3 cover this block's verification. Flag for L-2 only if a future wave shows watch/per-job divergence.

```yaml
ci_stage_verdict: PASS
verdict_source: gh
verdict_evidence:
  - "gh pr view 32 state MERGED (mergeCommit bff9f12)"
  - "gh run view 28471334846 --json jobs: 7/7 conclusion=success, non_success empty (CI-PRINCIPLES rule 3 per-job gate)"
  - "test-job log: api 346 passed incl idempotency-lock + listMessagesAfter forward-cursor; web 176 passed incl outbox exactly-once+in-order drain + db unit"
  - "drizzle ledger unchanged (git diff origin/main...HEAD -- apps/api/drizzle/ empty)"
  - "merge commit: bff9f120536655e1e539ecfad164005bc5047b84"
pr_number: 32
pr_url: https://github.com/arina477/test_claudomot/pull/32
branch: wave-20-m4-offline-spine
required_checks: [lint, typecheck, test, build, secret-scan, boot-probe, e2e]
optional_checks: []
fix_up_cycles: 0
final_commit_sha: d67c92fd872ed938b072ddb6224c620f6e0ee37f
merge_strategy: squash
merge_commit_sha: bff9f120536655e1e539ecfad164005bc5047b84
rebase_cycles: 0
note: "7/7 CI jobs success on per-job conclusions; offline-spine tests confirmed executed (api 346 + web 176); no migration; drizzle ledger unchanged."
```

head_signoff:
  verdict: APPROVED
  stage: C-1
  reviewers: {}
  failed_checks: []
  rationale: PR #32 opened base main / head wave-20-m4-offline-spine; all 7 required CI jobs (lint, typecheck, test, build, secret-scan/gitleaks, boot-probe, e2e) concluded success per authoritative per-job `gh run view --json jobs` read (CI-PRINCIPLES rule 3), not watch alone; offline-spine suites verified executed in the test-job log (api 346 incl idempotency-lock + forward-cursor; web 176 incl outbox exactly-once+in-order + Dexie db unit), test job ran against Postgres v16 with the integration suite, gitleaks passed, CI permissions least-privilege (contents:read), branch off main targeting main, no migration and drizzle ledger unchanged; squash-merged to bff9f12, branch deleted, local main synced.
  next_action: PROCEED_TO_C-2
