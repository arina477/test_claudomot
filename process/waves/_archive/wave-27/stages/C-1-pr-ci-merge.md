# Wave 27 — C-1 PR, CI & merge
**PR #40.** All 7 required checks GREEN first pass (run 28526765627, per-job verified — CI rule 3), 0 fix-up cycles. Squash-merged → **87b6ef7**, main synced, branch deleted.
**CI-rule-5:** integration tier ran (6 spec files / 17 tests); NEW `presence-index-scan.spec.ts` EXECUTED + PASSED (both: EXPLAIN Index Scan on server_members_user_id_idx via enable_seqscan=off, NOT skipped; getServerIdsForUser behavior-preserving). Migration 0012 applied by the harness migrate() (the index-scan-by-name assertion is impossible otherwise). No false-green.
```yaml
ci_stage_verdict: PASS
verdict_source: gh
pr_number: 40
pr_url: https://github.com/arina477/test_claudomot/pull/40
required_checks: [test, boot-probe, build, typecheck, lint, secret-scan, e2e]
fix_up_cycles: 0
final_commit_sha: d48fc32e74b5d6d37b8fd26b1c6b22330984b2a3
merge_strategy: squash
merge_commit_sha: 87b6ef7b6b98a4a4a72e9d382d07339b12aa2d55
note: "7/7 green first pass; presence-index-scan EXPLAIN proof passed in CI (migration 0012 applied)."
```
