# Wave 30 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, B-6 Phase 1)
**Reviewed against:** process/waves/wave-30/blocks/B/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

The M5 assignment-reminder arc is correct and faithful to the embedded 3-spec contract. I verified the actual code against the seven correctness-critical gates, not the deliverable claims:

1. **LEFT-JOIN done-exclusion (the linchpin) — PASS.** `reminder-scan.service.ts:132-152` resolves recipients via `.from(server_members).innerJoin(users…).leftJoin(assignment_status, …).where(… sql\`${assignment_status.state} IS DISTINCT FROM 'done'\`)`. The join to `assignment_status` is a genuine `leftJoin`, and the predicate is `IS DISTINCT FROM 'done'`, which is NULL-safe: a member with no status row (NULL) evaluates `true` and IS reminded; a `'todo'` row is `true`; only a `'done'` row is `false`/excluded. This mirrors the `?? 'todo'` default. An inner join would have silently dropped the majority — the actual code does not make that mistake. Integration test (a) proves the no-status member is reminded against real PG.

2. **Send-once / TOCTOU — PASS.** `sendReminderIfNew` at `:210-232` does `db.insert(assignment_reminder).values(…).onConflictDoNothing().returning({id})`, then sends the email ONLY when `inserted.length !== 0`. This is INSERT-RETURNING-gated, not SELECT-then-insert; the DB `UNIQUE(assignment_id, user_id)` (schema `:31`, migration `:6`) is the arbiter, so concurrent ticks/instances/crashes cannot double-send. Test (c) proves a second tick inserts 0 rows and sends 0 emails.

3. **Window correctness — PASS.** `:64-66` filters `gt(due_date, sql\`now()\`)` (E2 past-due excluded) AND `lte(due_date, sql\`now() + interval '24 hours'\`)` (in-window). `due_date` is `timestamptz` (assignments schema `:36`) and all math runs through DB `now()` → UTC-correct (E1). The 24h window is a hard-coded literal, not configurable. Tests (d) past-due and (e) 48h-out both prove exclusion. `is_deleted=false` guard is present at `:68`.

4. **Resilience — PASS.** Top-level query in try/catch that returns (non-throwing) `:71-74`; per-assignment try/catch `:79-88`; per-member try/catch `:162-171`; null/empty-email skip-with-log `:188-193`. One failure never aborts the scan.

5. **Integration-test honesty — PASS.** `reminder-scan.spec.ts` imports `./pg-harness` first (CF-2), uses `describe.skipIf(!DATABASE_URL_TEST)`, and drives the real SUT against real Postgres — the LEFT-JOIN query, INSERT-RETURNING, and window math all execute for real. Only the EmailService I/O leaf (`sendAssignmentReminder`) is replaced with a capture array; this is a legitimate collaborator stub at the network boundary, NOT mock-the-SUT. All 5 mandated cases are proven with real DB row assertions plus email-capture assertions.

6. **Scope discipline — PASS.** No opt-out/preferences/configurable-window/digest/SMS/in-app-center/history-UI/multi-reminder crept in. NotificationsModule (`notifications.module.ts`) is a pure cron host — providers + EmailModule import only, no controller/UI. `ScheduleModule.forRoot()` is registered once at AppModule root (`app.module.ts:33`), NotificationsModule at `:43`. Commit history is clean per-spec: `9527fb8`/`6088e6a` (schema+dep, Refs c5c30363/4a4c2715) → `5f8e78a` (email, spec 0ba853e2) → `1e7960d` (cron+module+integration test, spec 4a4c2715). No commit bleeds files across spec blocks.

7. **Email safety — PASS.** `email.service.ts:43-93` is fully inline-styled, table-based, light-background, client-safe HTML with no external assets. It leaks only the assignment title, due date, and server name — no cross-server data or PII beyond the contract. Due date rendered UTC-labeled (`toLocaleString` with `timeZone:'UTC'`, `timeZoneName:'short'`) tying E1. `sendAssignmentReminder` inherits the non-throwing / safe-no-op-when-key-unset contract from `sendEmail` (`:98-115`).

Cross-cutting: schema migration `0013_smooth_tattoo.sql` is generated + committed (forward-only, with `_journal.json` + snapshot); no startup auto-migrate exists (grep of main.ts/app.module.ts/db/index.ts is clean — migrations run out-of-band at C-2). `user_id text` matches `users.id`. `ON DELETE cascade` on the assignment FK prevents orphan reminder rows. B-1 correctly skipped (internal cron, inline email param, no shared Zod surface — this is not logic-before-contract; there is no client contract to drift). B-5 reports 411 unit pass, typecheck 4/4, build 3/3.

No firing-grade failure is present: no contract drift breaking a client (no client), no unguarded auth door (internal in-process cron, no HTTP surface, RBAC not applicable — recipients are scoped to the assignment's own server members), no migration gap, no scale gold-plating (single-instance in-process @Cron, DB UNIQUE as the send-once guard — exactly right for the single-instance Railway api; no Redis/queue introduced).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2
