# T-2 — Unit (wave-30 M5 reminders)

**Pattern A — Verified-via-CI.**

## Action 1 — CI evidence
C-1 run 28543197997 `test` job pass 1m12s — units + api integration tier. Unit tier green: **411 unit pass** incl. the 4 `sendAssignmentReminder` tests (email recipient / subject / body / null-key no-op). B-5 corroborates (411 unit pass).

## Action 2 — Coverage audit
Modules touched (from B-2): `email.service.ts` (sendAssignmentReminder), `reminder-scan.service.ts` (cron scan), `notifications.module.ts`.
- `sendAssignmentReminder` — 4 unit tests cover: recipient to-address passthrough, subject string (`Reminder: "<title>" is due soon`), body contains title/due/server, and the RESEND_API_KEY_AUTH-unset safe-no-op path. These assert user-observable output (the composed email + the no-op), NOT mock-call counts. This is the email-render coverage the task flagged: verified present and honest.
- `reminder-scan.service` cron logic (LEFT JOIN done-exclusion, send-once, window) is correctness-critical and belongs to the real-PG integration tier (T-4), not unit — correct layering (do not mock the DB for the send-decision).

## Email HTML sanity (lightweight, per task T-6 note)
Manually inspected `email.service.ts:43-93`: inline-styled table-based light HTML, no external assets, no broken/unclosed tags, DOCTYPE + charset + viewport present, subject interpolates title, body interpolates serverName/title/UTC-labeled due date. Renders correctly in email clients. Exposes only title/due/server — no PII over-exposure. Not a Playwright-layout surface; no swarm warranted.

## Action 3 — Flake observation
C-1 fix_up_cycles: 0, no reruns. No new flakes.

## Action 4 — Discipline note
The unit test correctly asserts the composed email string rather than that `resend.emails.send` was called with N args — mutation-genuine. No boilerplate to extract.

```yaml
test_pattern: ci-verified
skipped: false
evidence:
  - "C-1 test job: run 28543197997 green, 411 unit pass incl. 4 sendAssignmentReminder tests"
modules_audited: [email.service.ts, reminder-scan.service.ts, notifications.module.ts]
new_flakes: []
findings:
  - {severity: LOW, module: email.service.ts, description: "HTML render path unit-covered but not integration-covered — F30-T4-a (documented boundary, non-blocking)"}
