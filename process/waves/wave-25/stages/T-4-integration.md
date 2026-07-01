# Wave 25 — T-4 Integration (Pattern A: CI-verified)

## Action 1 — Pattern decision
CI (`.github/workflows/ci.yml`) runs an integration tier inside the `test` job: `vitest run --config vitest.integration.config.ts` against a provisioned `postgres:16` service with `DATABASE_URL_TEST` set. → **Pattern A** (CI-verified). Not skipped (B-2 changed the editMessage service boundary; no B-0 schema change — message_mentions is pre-existing, migration 0007).

## Action 2 — CI evidence + boundary coverage
- C-1 run **28512345221** `test` job SUCCESS ran the integration tier: **5 spec files / 15 tests**, all pass (false-green guard confirmed non-zero executed count per CI-PRINCIPLES rule 5).
- The wave's NEW integration spec **`edit-message-mentions-rollback.spec.ts`** executed and PASSED (rollback test 53ms; commit test 67ms) — this is the first real execution (CI-gated; a prior CI cycle caught it hanging at 5000ms → fixed in a730caf).

## Action 4 — Boundary coverage audit
| Boundary (wave) | Integration test | Real-DB honesty |
|---|---|---|
| `editMessage` service → UPDATE messages + DELETE + INSERT message_mentions inside one `db.transaction` | edit-message-mentions-rollback.spec.ts "rolls back UPDATE + DELETE when message_mentions INSERT fails mid-txn" | fault-injected a REAL mid-txn INSERT failure → asserts full ROLLBACK (message content + mention rows unchanged, 0 partial rows) via a SEPARATE `harnessPool` connection — genuine cross-connection proof, no SUT mock |
| editMessage happy path (commit all three writes) | edit-message-mentions-rollback.spec.ts "commits UPDATE + DELETE + INSERT on successful edit" | real postgres commit verified via harnessPool |

Follows `test-writing-principles` "don't mock the database" — hits real postgres:16, no schema mock. Every wave service boundary (editMessage txn) traced to a passing real-PG integration test.

```yaml
test_pattern: ci-verified
skipped: false
boundaries_audited: [editMessage-txn-rollback, editMessage-txn-commit]
ci_evidence:
  - "C-1 run 28512345221 test job SUCCESS — integration tier 5 spec files / 15 tests; rollback spec PASSED 53ms"
active_run_output: ""
infrastructure_gap_recorded: false
findings: []
```

## Exit
editMessage atomicity boundary proven live in CI against real postgres (rollback + commit). → T-5.
