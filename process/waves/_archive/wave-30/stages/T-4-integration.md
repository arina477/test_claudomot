# T-4 — Integration (wave-30 M5 reminders) — LOAD-BEARING

**Pattern A — Verified-via-CI.** The real-Postgres integration tier is the load-bearing proof of cron correctness (per CI rule 5). head-tester independently verified the CI log AND audited the test source for honesty (not just the deliverable claim).

## Action 1 — Pattern
CI `test` job runs `vitest run` (units) AND `vitest run --config vitest.integration.config.ts` (real-Postgres). Pattern A confirmed — CI provisions a Postgres 16 service; `reminder-scan.spec.ts` imports `./pg-harness` first (CF-2) and drives the real SUT against real PG.

## Action 2 — CI evidence (CI rule 5: EXECUTED, not skipped)
C-1 run 28543197997 `test` job: **`Test Files 8 passed (8)`, `Tests 29 passed (29)` — nonzero.** The reminder-scan cases fired against Postgres 16 with live `[ReminderScanService]` NestJS log lines proving the real code path ran. NOT a `describe.skipIf(!DATABASE_URL_TEST)` skip — DATABASE_URL_TEST was set in CI (the wave-17 turbo.json env-passthrough fix that defeated the earlier false-green remains in effect). This is the decisive proof: the 5 correctness cases actually executed against real PG, not coverage theater.

## Action 3 — Coverage audit of the 5 cases (head-tester source audit)
Audited `apps/api/test/integration/reminder-scan.spec.ts` line-by-line for whether each case genuinely proves its correctness-critical behavior:

- **(a) no-status member reminded — LEFT JOIN linchpin (`:160-178`).** Seeds a member with NO `assignment_status` row, runs the real scan, asserts BOTH `reminderExistsForUser(ASSIGNMENT_ID, MEMBER_NO_STATUS_ID) === true` (real DB row) AND the email capture contains `reminder-nostatus@test.local`. This is the case that catches the #1 latent bug (an INNER JOIN silently dropping the majority). Source confirms the shipped query is a genuine `.leftJoin(assignment_status, …)` with `IS DISTINCT FROM 'done'` (NULL-safe: no-row → true → reminded). Mutation-genuine: would FAIL if the join were inner. STRONG.
- **(b) done member NOT reminded (`:183-195`).** Inserts `state='done'`, asserts reminder row absent AND email capture does NOT contain the done member. Asserts the exclusion, not just presence. STRONG.
- **(c) send-once (`:200-221`).** Runs the scan TWICE; asserts first scan produced >0 rows AND >0 email calls, then second scan leaves row-count AND call-count UNCHANGED. This proves the `INSERT ON CONFLICT DO NOTHING RETURNING`-gated at-most-once send against the real UNIQUE(assignment_id,user_id) constraint. Both the ledger-row count and the side-effect count are load-bearing. STRONG.
- **(d) past-due excluded — E2 guard (`:226-240`).** `hoursAgo(1)` assignment; asserts 0 reminder rows AND 0 email calls. Proves `gt(due_date, now())`. STRONG.
- **(e) 48h-out excluded — window upper bound (`:245-259`).** `hoursFromNow(48)`; asserts 0 rows AND 0 calls. Proves `lte(due_date, now()+24h)`. STRONG.

Collaborator stub honesty: only `emailService.sendAssignmentReminder` is replaced with a capture array (`:146-154`) — a legitimate network-boundary stub. The DB (the system under test for the send-decision) is REAL. This is NOT mock-the-SUT. Per-test isolation via `truncateTables()` in `beforeEach` — no order-dependence, no shared mutable fixture bleed.

## Action 4 — Boundary coverage trace
- Migration 0013 `assignment_reminder` (B-0) → exercised by every case (INSERT + count + FK to assignments/users). ✓
- ReminderScanService cron (B-2) → all 3 real queries (window filter, LEFT-JOIN recipient resolution, INSERT-RETURNING send-once) execute against real PG. ✓
- The one gap: the email HTML render leaf is stubbed out → F30-T4-a (LOW, documented; unit-covered at T-2).

```yaml
test_pattern: ci-verified
skipped: false
boundaries_audited: [assignment_reminder-migration-0013, reminder-window-filter, left-join-recipient-resolution, insert-returning-send-once]
ci_evidence:
  - "C-1 run 28543197997 test job: Test Files 8 passed, Tests 29 passed (nonzero) real-Postgres-16"
  - "reminder-scan.spec.ts 5 cases (a/b/c/d/e) EXECUTED — CI rule 5 satisfied, NOT skipped"
  - "head-tester source audit: all 5 cases mutation-genuine (assert real DB rows + email-capture, DB unmocked, per-test truncate isolation)"
active_run_output: ""
infrastructure_gap_recorded: false
findings:
  - {severity: LOW, boundary: email-render, description: "sendAssignmentReminder HTML assembly stubbed in integration tier (F30-T4-a) — legitimate network-boundary stub; render unit-covered at T-2; non-blocking"}
