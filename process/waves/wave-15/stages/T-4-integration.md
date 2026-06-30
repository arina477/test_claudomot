# T-4 — Integration (wave-15 M3 @mentions)

**Pattern:** A — Verified-via-CI (for the boundaries CI covers) + **deferred** for the message_mentions real-PG tier. **Merge SHA:** fd86540.

## Action 1 — Pattern determination

CI `.github/workflows/ci.yml` DOES spin a `postgres:16` service container (lines 39-46, 80-97; `DATABASE_URL_TEST`, pg_isready health-gated) and runs `pnpm test:ci`. So a real-PG integration tier EXISTS in CI — but **which tests actually hit it matters.**

Audit of what hits real Postgres vs what is mocked:
- **Real-PG:** `apps/api/src/db/index.spec.ts`, `apps/api/src/presence/presence.gateway.spec.ts`.
- **DB-MOCKED (unit):** `apps/api/src/messaging/messages.service.spec.ts` does `vi.mock('../db/index')` (line 92) — `db.select`/`insert`/`update`/`delete` are all mock chains (`makeSelectChain`). **Every wave-15 message_mentions assertion (resolve, persist, edit-diff, my-mentions query) runs against the MOCK, not the real Postgres-16 service.**

So the wave's PRIMARY new boundary — the `message_mentions` association table — is unit-mocked, boot-probed (C-1 boot-probe confirmed the schema present + MentionsController wired), and live-probed (C-2 + T-8), but has **no real-PG per-test-rollback integration test.** → Pattern A for the boundaries CI covers; the message_mentions integration tier is **deferred** (carry 02fa8011).

## Action 2 — CI evidence (covered boundaries)

CI test job 28431946584: 471 tests green against Postgres 16. C-1 boot-probe (59s, pass) proved the compiled API boots with the 0007 `message_mentions` schema present and MentionsController wired — no DI/import/SQL-compile crash. C-2 verified the migration applied to prod with the UNIQUE constraint, the (mentioned_user_id, created_at) index, and both FKs (message_id → messages ON DELETE CASCADE, mentioned_user_id → users) present via direct pg query (count 7→8).

## Action 4 — Boundary coverage audit

| Boundary (B-0 schema / B-2 service) | Real-PG integration test? | How covered |
|---|---|---|
| `message_mentions` INSERT + UNIQUE(message_id, mentioned_user_id) idempotency (ON CONFLICT DO NOTHING) | NO (mocked) | unit-mock asserts ON CONFLICT path; UNIQUE constraint live-verified at C-2 against prod DB; not exercised by an integration test |
| message_mentions FK message_id → messages ON DELETE CASCADE | NO | live-verified present at C-2; CASCADE behavior not integration-tested |
| resolveMentions — member-only resolution (innerJoin server_members) | NO (mocked) | unit-mock; **live two-client T-8 probe is the load-bearing verification** |
| my-mentions query — session-derived authz + membership re-join + soft-delete exclusion + cursor + (mentioned_user_id, created_at) index | NO (mocked) | unit-mock asserts the where-clause shape; **live T-8 my-mentions authz probe is load-bearing** |
| edit-diff — delete-removed + insert-added mention rows | NO (mocked) | unit-mock asserts delete+insert calls; non-transactional (M-4 carry) |
| GET /me/mentions controller → service → DTO | NO (real-PG) | controller spec + service unit-mock; live 401 at C-2 |

## Action 4 (cont.) — Discipline check

`command-center/testing/test-writing-principles.md` § 7 + § 8 declare "Unit tests mock; integration tests don't — if a test needs a real DB it's an integration test (T-4)." The wave's message_mentions tests are correctly LABELLED unit (they mock) — the issue is the ABSENCE of a sibling integration test, not mislabelling. This is NOT the mock-the-system-under-test anti-pattern (the unit tier is allowed to mock); it is a missing-integration-tier coverage gap, exactly as carried in 02fa8011.

## Findings

**T4-F1 (MEDIUM/coverage-gap, → V-2; = carry 02fa8011 now mention-specific):** The `message_mentions` schema boundary has no real-Postgres per-test-rollback integration test. The wave-15 messaging service tests mock drizzle. Consequences NOT caught by the current suite: a malformed ON-CONFLICT clause, an FK-cascade misfire on message delete, an index that doesn't serve the my-mentions order-by, or a SQL-level type mismatch would pass unit + boot-probe + typecheck and only surface in prod. The live T-8 two-client probe (resolve + realtime) and the C-2 direct-pg schema verification are the load-bearing substitutes this wave. Recommend a `messages.integration.spec.ts` hitting the CI Postgres-16 service for message_mentions persist/resolve/edit-diff/my-mentions. Reaffirms wave-14 carry 02fa8011 — now 2 waves running on the messaging-integration gap → **T-4 principles candidate at L-2.**

```yaml
test_pattern: mixed   # ci-verified for db/presence; deferred for message_mentions integration tier
skipped: false
boundaries_audited:
  - "message_mentions INSERT + UNIQUE idempotency (mocked; live-verified at C-2)"
  - "message_mentions FK CASCADE (live-verified present at C-2; not integration-tested)"
  - "resolveMentions member-only (mocked; live two-client T-8)"
  - "my-mentions authz + membership re-join + soft-delete + cursor + index (mocked; live T-8)"
  - "edit-diff delete+insert (mocked; M-4 non-transactional carry)"
  - "GET /me/mentions controller→service→DTO (unit; live 401 C-2)"
ci_evidence:
  - "C-1 test job 28431946584 green, 471 tests, Postgres 16 service container"
  - "C-1 boot-probe pass 59s — API boots with 0007 message_mentions schema + MentionsController, no SQL-compile/DI crash"
  - "C-2 direct-pg: message_mentions table + UNIQUE(message_id,mentioned_user_id) + (mentioned_user_id,created_at) idx + both FKs verified in prod; count 7->8"
active_run_output: ""
infrastructure_gap_recorded: true
findings:
  - {severity: medium, boundary: "message_mentions real-PG integration tier", description: "T4-F1 (= carry 02fa8011, now mention-specific) — message_mentions persist/resolve/edit-diff/my-mentions are unit-mocked; no real-Postgres per-test-rollback integration test. Live T-8 two-client probe + C-2 direct-pg schema verify are the load-bearing substitutes. 2 waves running on the messaging-integration gap; T-4 principles candidate."}
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-4
  reviewers: {}
  failed_checks: []
  rationale: >
    I APPROVE T-4 while recording a MEDIUM coverage gap (T4-F1) rather than rejecting, because the
    gap is a missing integration TIER, not a dishonest test. The wave's message_mentions logic is
    correctly unit-tested with the DB mocked at the boundary (allowed for the unit layer — this is not
    mock-the-system-under-test), the compiled API was boot-probed against the real 0007 schema with no
    SQL-compile or DI crash, and the prod migration was verified by direct pg query (UNIQUE constraint,
    my-mentions index, and both FKs present, count 7->8). What is absent is a real-Postgres
    per-test-rollback integration test exercising the association table's constraints, cascade, and
    index-backed my-mentions query — the load-bearing substitutes this wave are the C-2 schema
    verification and, critically, the live two-client T-8 probe of resolve + realtime. This is the
    wave-14-carried 02fa8011 gap, now mention-specific and running across 2 waves; I am promoting it to
    a T-4 principles candidate and forwarding it to V-2 at MEDIUM. No false-green: the integration
    claim is honestly scoped to what CI actually exercises.
  next_action: PROCEED_TO_T-5
```
