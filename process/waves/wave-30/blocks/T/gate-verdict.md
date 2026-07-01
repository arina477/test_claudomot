# Wave 30 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, agentId arina-89ejyn)
**Reviewed against:** process/waves/wave-30/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale
The load-bearing layer holds under adversarial audit. T-4's five real-Postgres cases actually EXECUTED (CI rule 5 satisfied — C-1 run 28543197997 test job: `Test Files 8 passed (8), Tests 29 passed (29)` nonzero on the Postgres 16 service with live `[ReminderScanService]` log lines, not a `describe.skipIf(SKIP)` no-op — DATABASE_URL_TEST was set in CI). Coverage is genuine, not theater: case (a) at `reminder-scan.spec.ts:160-178` seeds a member with NO `assignment_status` row and asserts BOTH the committed `assignment_reminder` DB row AND the email-capture recipient — this is mutation-genuine against the shipped `.leftJoin(assignment_status, …) … IS DISTINCT FROM 'done'` at `reminder-scan.service.ts:162-174`; an INNER JOIN would silently drop the no-status majority and this exact assertion would fail. Case (c) send-once (`:200-221`) runs the scan twice and asserts both ledger-row-count and email-call-count unchanged on the second tick, backed by the real `onConflictDoNothing().returning()` against the UNIQUE(assignment_id,user_id) constraint (`:240-247`). The mock-the-SUT check passes: only the network leaf `emailService.sendAssignmentReminder` is stubbed with a capture array (`:146-154`); the DB — the system under test for the send-decision — is real, with per-test `truncateTables()` isolation and no order-dependence. T-2's four `sendAssignmentReminder` units assert composed email output (subject string, body interpolation, null-key no-op), not mock-call counts. T-1's wave-diff bypass grep is a solid zero. T-8's judged-run is the right call — not a lazy skip (there is genuinely no HTTP route to probe, so IDOR/CSRF/rate-limit are structurally N/A per F30-T8-a) and not scope-creep; all four properties are confirmed at source (cross-server scoping bound to the assignment row's server_id at `:169-174` with no request-derived input, send-once, minimal-disclosure email body, Resend key read server-side via `process.env`), plus a clean always-on secret grep. The four skips (T-3 no shared contract/Zod/API surface; T-5 no UI/browser flow with empty apps/web diff; T-6 email HTML is not a layout-diff surface; T-7 hourly cron over a window-filtered tiny dataset, N+1 resolved at B-6) are each honest for a backend cron+email arc. Where coverage is thin it is thin honestly and non-blocking: the email HTML render leaf is stubbed in the integration tier (F30-T4-a, LOW) but unit-covered at T-2 and is deterministic string interpolation with no branching beyond the null-key no-op; and the `MEMBER_TODO_ID` fixture (explicit `state='todo'`) rides along in case (a)'s scan without a dedicated assertion — a minor completeness gap, not a defect, since `IS DISTINCT FROM 'done'` treats NULL and 'todo' identically and (a) proves the harder NULL path. Both findings are correctly non-blocking; B-6 follow-up 4905dc3a (at-least-once delivery) is correctly NOT re-filed as a wave-30 T-block finding — the at-most-once row-as-ledger design is a documented, deliberate tradeoff for the single-instance Railway api. No evidence appears fabricated: every cited CI count, source line, and query predicate was independently confirmed against the merged commit.

## Cascade

T-block cascade rules (no rework — informational):

| Trigger stage | Stages that must re-run downstream |
|---|---|
| T-1 static | (terminal — only itself) |
| T-2 unit | (terminal) |
| T-3 contract | T-4 (n/a — T-3 skipped) |
| T-4 integration | (terminal) |
| T-5 e2e | T-9 (n/a — T-5 skipped) |
| T-6 layout | T-9 (n/a — T-6 skipped) |
| T-7 perf | (terminal) |
| T-8 security | T-9 (n/a — no auth-flow render change) |

- **Stages that must re-run after the above:** none
- **Stages that stay untouched:** all (verdict is APPROVED — no rework)

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2
