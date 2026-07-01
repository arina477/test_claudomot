# Wave 25 — C-1 PR, CI & merge

**Owner:** head-ci-cd (spawn pattern). **PR:** #37. **Mode:** automatic (--auto squash authorized; BOARD owns approval).

## Sequence
1. PR #37 opened off wave-25-mention-parity → main. Title `feat: mention parser parity + editMessage atomicity (wave-25)`.
2. First CI run (HEAD 04a0906): 6/7 required green; **`test` job RED** — the NEW integration spec `edit-message-mentions-rollback.spec.ts` rollback test **timed out at 5000ms**. CI-rule-5 guard confirmed the integration tier genuinely executed (5 spec files, 15 tests — a TRUE red, not a false-green). Not the documented flake, not infra (sibling real-PG specs passed ~40ms).
3. **Iron-Law routing (fix-up cycle 1):** integration-tier defect → B-2 (backend-developer). Root cause = **test-harness bug (NOT production)**: `editMessage` runs 4 SELECTs OUTSIDE the transaction that route through pg-pool's callback-style `pool.query()→connect(cb)`; the fault-injection wrapper only handled the Promise-style `connect()` path → hung on the first pre-flight SELECT before the txn opened. editMessage itself has NO prod hang-on-error risk. Fix `a730caf`: dual-convention support in the fault injection; no production code changed.
4. Second CI run (HEAD a730caf, run 28512345221): **all 7 required checks green.** Rollback spec now PASSES in 53ms (was 5000ms timeout).
5. Merged via `gh pr merge 37 --squash --delete-branch --auto` → merged immediately (all green). PR state MERGED. Local main fast-forwarded to `dbe55a2`. Brain-vendored files (VERSION, stage-v13-handoff) stashed/popped cleanly across the pull — not wave work.

## CI-PRINCIPLES rule 5 evidence (integration-executed, no false-green)
- Job `test` → `vitest run --config vitest.integration.config.ts`.
- 5 integration spec files ran: edit-message-mentions-rollback, create-server-rollback, rbac-assignments-authz, presence-comembers, servers-member-gate. 15 integration tests passed.
- The NEW rollback test "rolls back UPDATE + DELETE when message_mentions INSERT fails mid-txn" PASSED (53ms) — executed, not skipped. `false_green_ruled_out: true` (5 files / 15 tests ran, not 0). DATABASE_URL_TEST + postgres:16 service wired in ci.yml.

## L-block observation candidates
- CI-gated integration specs get their FIRST real execution in CI — a spec that "passes typecheck + is green in unit tier" can still hang/fail on first real-PG run. The false-green guard (CI rule 5) is what surfaced it; keep asserting execution AND per-spec pass, not just tier-green.
- Copying a fault-injection harness pattern (`wrapPoolConnect`) across specs is unsafe when the SUT's query shape differs (createServer: all-in-txn via Promise-style connect; editMessage: pre-txn SELECTs via callback-style pool.query). A fault injector must handle both pg-pool connection conventions, OR use a real Postgres-level failure (constraint/trigger) instead of a connect wrapper.

```yaml
ci_stage_verdict: PASS
verdict_source: gh
verdict_evidence:
  - "gh pr view 37 state MERGED"
  - "run 28512345221 (a730caf) all 7 required checks success"
  - "CI-rule-5: integration tier executed, 5 spec files / 15 tests, rollback spec PASSED (53ms)"
  - "merge commit dbe55a2"
pr_number: 37
pr_url: https://github.com/arina477/test_claudomot/pull/37
branch: wave-25-mention-parity
required_checks: [test, boot-probe, build, typecheck, lint, secret-scan, e2e]
optional_checks: []
fix_up_cycles: 1                  # B-2 rollback-spec fault-injection fix (a730caf)
final_commit_sha: a730caf80c30d59feed13804d1482ffdfed2af88
merge_strategy: squash
merge_commit_sha: dbe55a293ceea291b2eef56bf887ee0c6c55164f
rebase_cycles: 0
note: "Fix-up cycle 1 (test-harness bug, no prod change) cleared the test-job timeout; merged clean."
```

## Exit
PR merged, main synced to dbe55a2, branch deleted on origin, CI-rule-5 satisfied. → C-2 Deploy & verify.
