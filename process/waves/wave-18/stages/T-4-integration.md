# T-4 — Integration (wave-18 M3 threads)

**Pattern:** A — Verified-via-CI (integration job exists; wave-17 real-PG harness present). Wave-18 added NO new integration spec.

## Action 1 — Pattern
CI runs an integration job: `pnpm test:ci` = `vitest run` + `vitest run --config vitest.integration.config.ts`. The wave-17 reusable real-Postgres harness (`apps/api/test/integration/pg-harness.ts` + `vitest.integration.config.ts`) exists and ran in C-1 (3 cases, `create-server-rollback.spec.ts`). → Pattern A.

## Action 2 — CI evidence
C-1 `verdict_evidence`: **api integration: 3 passed (3)** against a real Postgres 16 service — `create-server-rollback.spec.ts` (wave-17 carry-forward). The integration tier RAN (not skipped — the wave-17 false-green Turbo-strip lesson was applied at C-1).

## Action 4 — Boundary coverage trace + findings
Wave-18 boundaries (schema 0008 + service methods):

| Boundary | Integration coverage status |
|---|---|
| Migration 0008 (thread_parent_id self-FK + reply_count + last_reply_at + index) applied | Verified at C-2 by direct pg query (ledger 8→9, all columns + index + FK present) — deploy-time, not a test-suite integration spec |
| `createReply` txn (insert + reply_count++ + last_reply_at in ONE txn) | UNIT-covered (mocked db.transaction); NO real-PG integration spec |
| `deleteMessage` reply branch (decrement + tail recompute) | UNIT-covered (mocked); NO real-PG integration spec |
| `listThreadReplies` keyset pagination + tombstone exclusion | UNIT-covered (mocked); NO real-PG integration spec |
| Thread IDOR (parent-derived `canViewChannelById`) | UNIT-covered with mocked RbacService; NO real-PG integration spec |

**Finding F-4 (MEDIUM — integration coverage gap, consistent with the carried real-PG-tier debt):** Wave-18 added no real-Postgres integration spec for the thread data plane. The createReply transactional `reply_count`/`last_reply_at` increment, the tail-recompute on delete, the keyset pagination, and the IDOR authz are all unit-tested against a MOCKED `db.transaction` / mocked RbacService — never against a real Postgres. The most valuable missing case is a **thread-rollback integration test** (createReply fails mid-txn → 0 reply_count drift, 0 orphan reply rows) and an **IDOR integration test** (real channel-membership row absent → real 403 from the real rbac query path). The wave-17 reusable harness (`pg-harness.ts`) now EXISTS and is a thin consumer point, so this is cheap to add. This continues the 2-wave-recurring real-PG-tier gap (prior `02fa8011`); it does NOT block — the unit layer covers the logic and C-2 verified the migration against real PG. Carry to V-2 / backlog: author `apps/api/test/integration/thread-reply.spec.ts` reusing the harness (rollback + IDOR cases).

```yaml
test_pattern: ci-verified
skipped: false
boundaries_audited: [migration-0008, createReply-txn, deleteMessage-reply-branch, listThreadReplies-keyset, thread-IDOR-authz]
ci_evidence:
  - "C-1 test job 84316325489: api integration 3 passed (real Postgres 16) — create-server-rollback.spec.ts ran, not skipped"
  - "C-2: migration 0008 verified against prod PG by direct query (ledger 8->9, columns+index+FK present)"
active_run_output: ""
infrastructure_gap_recorded: false
findings:
  - {severity: medium, boundary: "thread data plane (createReply txn / delete / pagination / IDOR)", description: "F-4: no real-PG integration spec for the thread data plane; all unit-mocked. wave-17 pg-harness exists → cheap to add thread-rollback + IDOR integration cases. Continues 2-wave real-PG-tier gap (02fa8011). → V-2 / backlog."}
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-4
  reviewers: {}
  failed_checks: []
  rationale: >
    The integration tier ran green against a real Postgres 16 (3 cases, confirmed-executed not skipped per
    the C-1 false-green guard) and migration 0008 was independently verified against prod PG at C-2. The
    thread data-plane logic is unit-covered; APPROVED-WITH-CARRY on F-4: no real-PG integration spec exists
    for the new thread txn/delete/pagination/IDOR boundaries — they run only against a mocked db.transaction.
    The wave-17 reusable harness makes a thread-rollback + IDOR integration test cheap; carried to V-2 /
    backlog (continues the recurring real-PG-tier debt 02fa8011), not blocking the wave.
  next_action: PROCEED_TO_T-5
```
